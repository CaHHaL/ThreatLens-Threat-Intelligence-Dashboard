import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class AuditLog(Base):
    """
    Audit Log Model.
    Security purpose: Keep an immutable record of user actions and events within the platform 
    for incident response, compliance, and active threat monitoring inside our system.
    """
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False, index=True) # e.g., "LOGIN_SUCCESS", "VIEWED_THREAT_INTEL"
    ip_address = Column(String, nullable=True)
    details = Column(String, nullable=True) # JSON string or extra text context
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", backref="audit_logs")
