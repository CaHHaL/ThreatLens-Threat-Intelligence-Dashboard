from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import asyncio
import json
import logging
from app.core.security import verify_access_token
from app.core.config import settings
import redis.asyncio as aioredis

logger = logging.getLogger(__name__)
router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        self.pubsub = self.redis.pubsub()
        self.listen_task = None
        
    async def connect(self, websocket: WebSocket, token: str):
        try:
            payload = verify_access_token(token)
            if not payload:
                await websocket.close(code=1008)
                return False
        except Exception:
            await websocket.close(code=1008)
            return False
            
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if not self.listen_task or self.listen_task.done():
            self.listen_task = asyncio.create_task(self.listen_to_redis())
            
        asyncio.create_task(self.heartbeat(websocket))
        return True

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                dead_connections.append(connection)
                
        for dead in dead_connections:
            self.disconnect(dead)
                
    async def listen_to_redis(self):
        try:
            await self.pubsub.subscribe("threat_feed")
            async for message in self.pubsub.listen():
                if message["type"] == "message":
                    data = message["data"]
                    await self.broadcast(data)
        except Exception as e:
            logger.error(f"Redis WS listen error: {e}")

    async def heartbeat(self, websocket: WebSocket):
        try:
            while websocket in self.active_connections:
                await asyncio.sleep(30)
                await websocket.send_json({"type": "ping", "timestamp": "hearbeat"})
        except Exception:
             self.disconnect(websocket)

manager = ConnectionManager()

@router.websocket("/feed")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    if not token:
        await websocket.close(code=1008)
        return
        
    connected = await manager.connect(websocket, token)
    if not connected:
        return
        
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
