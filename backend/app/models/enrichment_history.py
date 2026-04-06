import uuid
from datetime import datetime
from sqlalchemy import Column, String, JSON, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from sqlalchemy.orm import relationship

class EnrichmentHistory(Base):
    __tablename__ = "enrichment_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    ioc_value = Column(String, nullable=False, index=True)
    ioc_type = Column(String, nullable=False)
    overall_verdict = Column(String, nullable=False) # CLEAN, SUSPICIOUS, MALICIOUS
    threat_summary = Column(String, nullable=True)
    full_result = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", backref="enrichment_history")
