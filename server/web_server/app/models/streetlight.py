from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
from enum import Enum as PyEnum

class StreetlightStatus(str, PyEnum):
    active = "active"
    inactive = "inactive"
    faulty = "faulty"
    maintenance = "maintenance"

class Streetlight(Base):
    __tablename__ = "streetlights"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, index=True, nullable=True)
    name = Column(String, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    model_info = Column(String)
    installation_date = Column(DateTime)
    status = Column(Enum(StreetlightStatus, name="streetlight_status_enum"), nullable=False, default=StreetlightStatus.inactive, server_default=StreetlightStatus.inactive.value)
    is_on = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    logs = relationship("StreetlightLog", back_populates="streetlight")
    maintenance_logs = relationship("MaintenanceLog", back_populates="streetlight")
    alerts = relationship("Alert", back_populates="streetlight")
    predictive_alerts = relationship("PredictiveMaintenanceAlert", back_populates="streetlight")
    predictive_maintenance = relationship("PredictiveMaintenanceLog", back_populates="streetlight", uselist=False)