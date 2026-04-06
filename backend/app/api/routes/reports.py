from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import Response
from app.services.report_generator import generate_pdf_report
from app.api.deps import RoleChecker, get_current_active_user
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit_log import AuditLog
from app.models.user import User

router = APIRouter()

@router.post("/generate")
async def trigger_report(
    data: dict = Body(...), 
    current_user: User = Depends(RoleChecker(["ADMIN", "ANALYST"])),
    db: AsyncSession = Depends(get_db)
):
    period = data.get("period", "7d")
    days = 7
    if period == "30d": days = 30
    elif period == "24h": days = 1
    
    try:
        pdf_bytes = await generate_pdf_report(period_days=days)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF Generation Failed: {e}")
        
    db.add(AuditLog(user_id=current_user.id, action="GENERATE_REPORT", details={"period": period}))
    await db.commit()
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="ThreatLens_Report_{period}.pdf"'}
    )
