from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.user import RoleEnum
from app.api.deps import get_current_active_superuser
from app.worker.collectors.nvd_collector import fetch_nvd_cves
from app.worker.collectors.cisa_kev_collector import fetch_cisa_kev
from app.worker.collectors.otx_collector import fetch_otx_pulses

router = APIRouter()

@router.post("/trigger-fetch")
async def trigger_fetch(current_admin=Depends(get_current_active_superuser)):
    """
    Manually triggers Celery tasks via delay execution to run collection.
    """
    fetch_nvd_cves.delay()
    fetch_cisa_kev.delay()
    fetch_otx_pulses.delay()
    
    return {"message": "All collector tasks triggered successfully in Celery"}

@router.get("/audit-logs")
async def get_audit_logs(
    limit: int = 100, 
    skip: int = 0, 
    action: str = None, 
    user_id: str = None, 
    db: AsyncSession = Depends(get_db), 
    current_admin=Depends(get_current_active_superuser)
):
    from sqlalchemy.orm import selectinload
    from app.models.audit_log import AuditLog
    from sqlalchemy.future import select
    from sqlalchemy import desc
    
    query = select(AuditLog).options(selectinload(AuditLog.user)).order_by(desc(AuditLog.timestamp))
    
    if action:
        query = query.where(AuditLog.action == action)
    if user_id:
        query = query.where(AuditLog.user_id == user_id)
        
    query = query.offset(skip).limit(limit)
    res = await db.execute(query)
    logs = res.scalars().all()
    
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "username": getattr(log.user, "username", "Unknown"),
            "action": log.action,
            "details": log.details,
            "timestamp": log.timestamp
        } for log in logs
    ]
