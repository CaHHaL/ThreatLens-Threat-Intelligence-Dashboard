from sqlalchemy import Column, String, Integer, Text, JSON, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

technique_tactic_assoc = Table(
    "mitre_technique_tactic",
    Base.metadata,
    Column("tactic_id", String, ForeignKey("mitre_tactics.id", ondelete="CASCADE"), primary_key=True),
    Column("technique_id", String, ForeignKey("mitre_techniques.id", ondelete="CASCADE"), primary_key=True)
)

group_technique_assoc = Table(
    "mitre_group_technique",
    Base.metadata,
    Column("group_id", String, ForeignKey("mitre_groups.id", ondelete="CASCADE"), primary_key=True),
    Column("technique_id", String, ForeignKey("mitre_techniques.id", ondelete="CASCADE"), primary_key=True)
)

software_technique_assoc = Table(
    "mitre_software_technique",
    Base.metadata,
    Column("software_id", String, ForeignKey("mitre_software.id", ondelete="CASCADE"), primary_key=True),
    Column("technique_id", String, ForeignKey("mitre_techniques.id", ondelete="CASCADE"), primary_key=True)
)

group_software_assoc = Table(
    "mitre_group_software",
    Base.metadata,
    Column("group_id", String, ForeignKey("mitre_groups.id", ondelete="CASCADE"), primary_key=True),
    Column("software_id", String, ForeignKey("mitre_software.id", ondelete="CASCADE"), primary_key=True)
)

class Tactic(Base):
    __tablename__ = "mitre_tactics"
    
    id = Column(String, primary_key=True, index=True) # TA00XX
    name = Column(String, nullable=False)
    shortname = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    techniques = relationship("Technique", secondary=technique_tactic_assoc, back_populates="tactics", lazy="selectin")

class Technique(Base):
    __tablename__ = "mitre_techniques"
    
    id = Column(String, primary_key=True, index=True) # TXXXX
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    detection = Column(Text, nullable=True)
    mitigation = Column(Text, nullable=True)
    is_subtechnique = Column(Integer, default=0)
    parent_id = Column(String, ForeignKey("mitre_techniques.id", ondelete="CASCADE"), nullable=True)
    
    frequency_score = Column(Integer, default=0)
    linked_cve_count = Column(Integer, default=0)
    
    tactics = relationship("Tactic", secondary=technique_tactic_assoc, back_populates="techniques")
    groups = relationship("ThreatGroup", secondary=group_technique_assoc, back_populates="techniques")
    software = relationship("Software", secondary=software_technique_assoc, back_populates="techniques")

class ThreatGroup(Base):
    __tablename__ = "mitre_groups"
    
    id = Column(String, primary_key=True, index=True) # GXXXX
    name = Column(String, nullable=False)
    aliases = Column(JSON, default=list)
    description = Column(Text, nullable=True)
    target_sectors = Column(JSON, default=list)
    country_of_origin = Column(String, nullable=True)
    
    techniques = relationship("Technique", secondary=group_technique_assoc, back_populates="groups", lazy="selectin")
    software = relationship("Software", secondary=group_software_assoc, back_populates="groups", lazy="selectin")

class Software(Base):
    __tablename__ = "mitre_software"
    
    id = Column(String, primary_key=True, index=True) # SXXXX
    name = Column(String, nullable=False)
    type = Column(String, nullable=False) # malware or tool
    description = Column(Text, nullable=True)
    
    techniques = relationship("Technique", secondary=software_technique_assoc, back_populates="software", lazy="selectin")
    groups = relationship("ThreatGroup", secondary=group_software_assoc, back_populates="software")
