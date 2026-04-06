from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.models.threat_feed import ThreatFeed
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/status")
async def list_feed_status(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(ThreatFeed))
    feeds = result.scalars().all()
    return feeds
