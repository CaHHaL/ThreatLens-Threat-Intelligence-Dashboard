from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, JSON
from app.core.database import Base

class CVE(Base):
    __tablename__ = "cves"
    
    cve_id = Column(String, primary_key=True, index=True)
    description = Column(String, nullable=True)
    cvss_v3_score = Column(Float, nullable=True)
    cvss_severity = Column(String, nullable=True)
    published_date = Column(DateTime, nullable=True)
    modified_date = Column(DateTime, nullable=True)
    affected_products = Column(JSON, default=list) # JSON
    cwe_ids = Column(JSON, default=list) # JSON
    is_kev = Column(Boolean, default=False, index=True) # CISA Known Exploited
    references = Column(JSON, default=list) # JSON
