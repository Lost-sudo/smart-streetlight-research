from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
from enum import Enum as PyEnum

class UrgencyLevel(str,  PyEnum):
    low = "low"
    medium = "medium"
    high = "high"


class PredictiveMaintenanceLog(Base):
    __tablename__ = "predictive_maintenance"
    id = Column(Integer, primary_key=True, index=True)
    streetlight_id = Column(Integer, ForeignKey("streetlights.id"), unique=True)
    failure_probability = Column(Float)
    predicted_failure_date = Column(DateTime)
    urgency_level = Column(Enum(UrgencyLevel, name="urgency_level_enum"))
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    streetlight = relationship("Streetlight", back_populates="predictive_maintenance")