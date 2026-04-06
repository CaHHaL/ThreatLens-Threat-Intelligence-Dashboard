from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from app.core.database import get_db
from app.models.enrichment_history import EnrichmentHistory
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.enrichment import EnrichmentRequest, EnrichmentResult
from app.worker.enrichment.parallel_enricher import run_parallel_enrichment

router = APIRouter()

@router.post("", response_model=EnrichmentResult)
async def perform_enrichment(
    request: EnrichmentRequest, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    try:
        result_dict = await run_parallel_enrichment(request.value)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    # Save to history
    history = EnrichmentHistory(
        user_id=current_user.id,
        ioc_value=result_dict["ioc_value"],
        ioc_type=result_dict["ioc_type"],
        overall_verdict=result_dict["overall_verdict"],
        threat_summary=result_dict["threat_summary"],
        full_result=result_dict
    )
    db.add(history)
    await db.commit()
    
    return result_dict

@router.get("/history")
async def get_history(
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = select(EnrichmentHistory).where(
        EnrichmentHistory.user_id == current_user.id
    ).order_by(desc(EnrichmentHistory.created_at)).limit(50)
    
    res = await db.execute(query)
    entries = res.scalars().all()
    
    # We can serialize full history easily or just return standard dict format
    return entries
