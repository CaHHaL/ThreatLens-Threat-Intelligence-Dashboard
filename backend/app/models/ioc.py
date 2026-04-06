import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import enum

class IOCType(str, enum.Enum):
    IP = "IP"
    DOMAIN = "DOMAIN"
    URL = "URL"
    HASH_MD5 = "HASH_MD5"
    HASH_SHA256 = "HASH_SHA256"
    CVE = "CVE"

class IOC(Base):
    __tablename__ = "iocs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    type = Column(Enum(IOCType), nullable=False, index=True)
    value = Column(String, nullable=False, unique=True, index=True)
    threat_score = Column(Float, default=0.0) # 0-100
    confidence = Column(String, nullable=True)
    source = Column(String, nullable=False)
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
    tags = Column(JSON, default=list) # JSON array
    raw_data = Column(JSON, default=dict) # JSON raw payload
    is_active = Column(Boolean, default=True)
