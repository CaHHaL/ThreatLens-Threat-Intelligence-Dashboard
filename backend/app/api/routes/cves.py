from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, or_
from typing import Optional
from app.core.database import get_db
from app.models.cve import CVE
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()

@router.get("")
async def list_cves(
    severity: Optional[str] = None,
    is_kev: Optional[bool] = None,
    min_cvss: Optional[float] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100)
):
    query = select(CVE)
    if severity:
        query = query.where(CVE.cvss_severity == severity.upper())
    if is_kev is not None:
        query = query.where(CVE.is_kev == is_kev)
    if min_cvss is not None:
        query = query.where(CVE.cvss_v3_score >= min_cvss)
    if search:
        query = query.where(
            or_(
                CVE.cve_id.ilike(f"%{search}%"),
                CVE.description.ilike(f"%{search}%")
            )
        )
        
    query = query.order_by(desc(CVE.published_date))
    count_res = await db.execute(select(CVE))
    total = len(count_res.scalars().all())
    
    result = await db.execute(query.offset(skip).limit(limit))
    cves = result.scalars().all()
    
    return {"items": cves, "total": total}

@router.get("/{cve_id}")
async def get_cve(cve_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(CVE).where(CVE.cve_id == cve_id))
    cve = result.scalar_one_or_none()
    if not cve:
        raise HTTPException(status_code=404, detail="CVE not found")
    return cve
