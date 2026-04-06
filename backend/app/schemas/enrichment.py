from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class EnrichmentRequest(BaseModel):
    value: str

class EnrichmentResult(BaseModel):
    ioc_value: str
    ioc_type: str
    enriched_at: datetime
    abuse_data: Optional[Dict[str, Any]] = None
    vt_data: Optional[Dict[str, Any]] = None
    shodan_data: Optional[Dict[str, Any]] = None
    geo_data: Optional[Dict[str, Any]] = None
    overall_verdict: str
    threat_summary: str
