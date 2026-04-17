from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
from enum import Enum as PyEnum

class UrgencyLevel(str,  PyEnum):
    low = "low"
    medium = "medium"
    high = "high"

class PredictiveMaintenanceAlert(Base):
    __tablename__ = "predictive_alerts"
    id = Column(Integer, primary_key=True, index=True)
    streetlight_id = Column(Integer, ForeignKey("streetlights.id"))
    urgency = Column(Enum(UrgencyLevel, name="urgency_level_enum"))
    message = Column(String)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    streetlight = relationship("Streetlight", back_populates="predictive_alerts")
    repair_task = relationship("RepairTask", back_populates="predictive_alert", uselist=False)