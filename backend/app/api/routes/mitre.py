from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.mitre import Tactic, Technique, ThreatGroup, Software
from sqlalchemy import desc

router = APIRouter()

@router.get("/matrix")
async def get_attack_matrix(db: AsyncSession = Depends(get_db)):
    """Returns tactics and sub-techniques populated with scores"""
    res = await db.execute(select(Tactic).options(selectinload(Tactic.techniques)))
    tactics = res.scalars().all()
    matrix = []
    for t in tactics:
        matrix.append({
            "id": t.id,
            "name": t.name,
            "shortname": t.shortname,
            "techniques": [
                {
                    "id": tech.id,
                    "name": tech.name,
                    "frequency_score": tech.frequency_score,
                    "linked_cve_count": tech.linked_cve_count,
                    "is_subtechnique": tech.is_subtechnique
                } for tech in t.techniques if not tech.is_subtechnique
            ]
        })
    return matrix

@router.get("/techniques/{technique_id}")
async def get_technique_detail(technique_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Technique)
        .options(selectinload(Technique.groups), selectinload(Technique.software), selectinload(Technique.tactics))
        .where(Technique.id == technique_id)
    )
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Technique not found")
        
    return {
        "id": t.id,
        "name": t.name,
        "description": t.description,
        "detection": t.detection,
        "mitigation": t.mitigation,
        "frequency_score": t.frequency_score,
        "linked_cve_count": t.linked_cve_count,
        "tactics": [{"id": tac.id, "name": tac.name} for tac in t.tactics],
        "groups": [{"id": g.id, "name": g.name, "country_of_origin": g.country_of_origin} for g in t.groups]
    }

@router.get("/groups")
async def get_threat_groups(limit: int = 50, skip: int = 0, name: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(ThreatGroup).options(selectinload(ThreatGroup.techniques))
    if name:
        query = query.where(ThreatGroup.name.ilike(f"%{name}%"))
    query = query.order_by(ThreatGroup.name).offset(skip).limit(limit)
    res = await db.execute(query)
    groups = res.scalars().all()
    
    return [
        {
            "id": g.id,
            "name": g.name,
            "aliases": g.aliases,
            "country_of_origin": g.country_of_origin,
            "target_sectors": g.target_sectors,
            "technique_count": len(g.techniques)
        } for g in groups
    ]

@router.get("/groups/{group_id}")
async def get_threat_group_detail(group_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(ThreatGroup)
        .options(selectinload(ThreatGroup.techniques), selectinload(ThreatGroup.software))
        .where(ThreatGroup.id == group_id)
    )
    g = res.scalar_one_or_none()
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
        
    return {
        "id": g.id,
        "name": g.name,
        "aliases": g.aliases,
        "description": g.description,
        "country_of_origin": g.country_of_origin,
        "target_sectors": g.target_sectors,
        "techniques": [
            {
                "id": t.id,
                "name": t.name,
                "frequency_score": t.frequency_score
            } for t in g.techniques
        ],
        "software": [
            {
                "id": s.id,
                "name": s.name,
                "type": s.type
            } for s in g.software
        ]
    }
