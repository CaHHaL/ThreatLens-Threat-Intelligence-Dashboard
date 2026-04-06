import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class RuleType(str, enum.Enum):
    CVE_SEVERITY = "CVE_SEVERITY"
    IP_ABUSE_SCORE = "IP_ABUSE_SCORE"
    KEYWORD_MATCH = "KEYWORD_MATCH"
    TTP_DETECTED = "TTP_DETECTED"
    KEV_ADDED = "KEV_ADDED"

class AlertStatus(str, enum.Enum):
    NEW = "NEW"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    DISMISSED = "DISMISSED"

class AlertRule(Base):
    __tablename__ = "alert_rules"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String, nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    rule_type = Column(SQLEnum(RuleType), nullable=False)
    conditions = Column(JSON, default=dict) # e.g. {"min_cvss": 9.0}
    cooldown_minutes = Column(Integer, default=60)
    
    notify_telegram = Column(Boolean, default=False)
    notify_email = Column(Boolean, default=False)
    
    owner = relationship("User", backref="alert_rules")
    events = relationship("AlertEvent", back_populates="rule", cascade="all, delete-orphan")

class AlertEvent(Base):
    __tablename__ = "alert_events"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    rule_id = Column(String, ForeignKey("alert_rules.id", ondelete="CASCADE"), nullable=False)
    triggered_at = Column(DateTime, default=datetime.utcnow)
    
    ioc_id = Column(String, nullable=True) # Optional link to IOC
    cve_id = Column(String, nullable=True) # Optional link to CVE
    
    message = Column(String, nullable=False)
    status = Column(SQLEnum(AlertStatus), default=AlertStatus.NEW)
    
    rule = relationship("AlertRule", back_populates="events")
