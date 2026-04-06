from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from app.core.database import get_db
from app.api.deps import get_current_active_user, RoleChecker
from app.models.alert import AlertRule, AlertEvent, AlertStatus
from app.models.user import User

router = APIRouter()

@router.get("/rules")
async def list_rules(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    query = select(AlertRule).options(selectinload(AlertRule.events))
    if current_user.role != "ADMIN":
        query = query.where(AlertRule.owner_id == current_user.id)
    res = await db.execute(query.order_by(AlertRule.created_at.desc()))
    rules = res.scalars().all()
    # Serialize cleanly
    return [
        {
            "id": r.id, 
            "name": r.name, 
            "rule_type": r.rule_type, 
            "conditions": r.conditions,
            "is_active": r.is_active,
            "cooldown_minutes": r.cooldown_minutes,
            "notify_telegram": r.notify_telegram,
            "notify_email": r.notify_email,
            "owner_id": str(r.owner_id),
            "event_count": len(r.events)
        } for r in rules
    ]

@router.post("/rules")
async def create_rule(data: dict, db: AsyncSession = Depends(get_db), current_user: User = Depends(RoleChecker(["ADMIN", "ANALYST"]))):
    rule = AlertRule(
        name=data["name"],
        owner_id=current_user.id,
        rule_type=data["rule_type"],
        conditions=data.get("conditions", {}),
        cooldown_minutes=data.get("cooldown_minutes", 60),
        notify_telegram=data.get("notify_telegram", False),
        notify_email=data.get("notify_email", False),
        is_active=data.get("is_active", True)
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    
    from app.models.audit_log import AuditLog
    db.add(AuditLog(user_id=current_user.id, action="CREATE_ALERT_RULE", details={"rule_id": rule.id}))
    await db.commit()
    
    return {"id": rule.id, "name": rule.name}

@router.put("/rules/{rule_id}")
async def update_rule(rule_id: str, data: dict, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    res = await db.execute(select(AlertRule).where(AlertRule.id == rule_id))
    rule = res.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    if current_user.role != "ADMIN" and str(rule.owner_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to edit this rule")
        
    for k, v in data.items():
        if hasattr(rule, k) and k != "id" and k != "owner_id":
            setattr(rule, k, v)
    
    await db.commit()
    from app.models.audit_log import AuditLog
    db.add(AuditLog(user_id=current_user.id, action="UPDATE_ALERT_RULE", details={"rule_id": rule.id}))
    await db.commit()
    
    return {"id": rule.id, "name": rule.name, "is_active": rule.is_active}

@router.delete("/rules/{rule_id}")
async def delete_rule(rule_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    res = await db.execute(select(AlertRule).where(AlertRule.id == rule_id))
    rule = res.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    if current_user.role != "ADMIN" and str(rule.owner_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this rule")
        
    await db.delete(rule)
    
    from app.models.audit_log import AuditLog
    db.add(AuditLog(user_id=current_user.id, action="DELETE_ALERT_RULE", details={"rule_id": rule_id}))
    
    await db.commit()
    return {"status": "deleted"}

@router.get("/events")
async def list_events(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    query = select(AlertEvent).options(selectinload(AlertEvent.rule)).order_by(AlertEvent.triggered_at.desc()).limit(100)
    res = await db.execute(query)
    events = res.scalars().all()
    
    if current_user.role != "ADMIN":
        events = [e for e in events if str(getattr(e.rule, 'owner_id', None)) == str(current_user.id)]
        
    items = [
        {
            "id": e.id,
            "rule_name": getattr(e.rule, "name", "Deleted Rule"),
            "message": e.message,
            "triggered_at": e.triggered_at,
            "status": e.status,
            "ioc_id": e.ioc_id,
            "cve_id": e.cve_id
        } for e in events
    ]
    
    return {"items": items, "total": len(items)}

@router.patch("/events/{event_id}/{action}")
async def act_on_event(event_id: str, action: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(RoleChecker(["ADMIN", "ANALYST"]))):
    res = await db.execute(select(AlertEvent).options(selectinload(AlertEvent.rule)).where(AlertEvent.id == event_id))
    ev = res.scalar_one_or_none()
    if not ev: 
        raise HTTPException(404, detail="Event not found")
        
    if current_user.role != "ADMIN" and str(ev.rule.owner_id) != str(current_user.id):
        raise HTTPException(403, detail="Not authorized to modify this event")
        
    if action == "acknowledge": ev.status = AlertStatus.ACKNOWLEDGED
    elif action == "dismiss": ev.status = AlertStatus.DISMISSED
    else: raise HTTPException(400, detail="Invalid action. Use acknowledge or dismiss")
    
    await db.commit()
    return {"id": ev.id, "status": ev.status}
