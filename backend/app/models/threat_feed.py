import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class ThreatFeed(Base):
    __tablename__ = "threat_feeds"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    last_fetched = Column(DateTime, nullable=True)
    total_iocs = Column(Integer, default=0)
    status = Column(String, default="PENDING") # PENDING, SUCCESS, FAILED
    error_message = Column(String, nullable=True)
