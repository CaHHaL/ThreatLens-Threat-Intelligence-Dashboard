from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from typing import Optional, List
from app.core.database import get_db
from app.models.ioc import IOC, IOCType
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()

@router.get("")
async def list_iocs(
    type: Optional[IOCType] = None,
    min_score: Optional[float] = None,
    source: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100)
):
    query = select(IOC)
    if type:
        query = query.where(IOC.type == type)
    if min_score is not None:
        query = query.where(IOC.threat_score >= min_score)
    if source:
        query = query.where(IOC.source == source)
        
    query = query.order_by(desc(IOC.last_seen))
    
    # Get total count before applying paging
    count_res = await db.execute(select(IOC))
    total = len(count_res.scalars().all()) # Simple count for now, optimization possible for large datasets
    
    result = await db.execute(query.offset(skip).limit(limit))
    iocs = result.scalars().all()
    
    return {"items": iocs, "total": total}

@router.get("/{id}")
async def get_ioc(id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(IOC).where(IOC.id == id))
    ioc = result.scalar_one_or_none()
    if not ioc:
        raise HTTPException(status_code=404, detail="IOC not found")
    return ioc
