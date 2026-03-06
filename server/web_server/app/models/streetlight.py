from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class Streetlight(Base):
    __tablename__ = "streetlights"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    model_info = Column(String)
    installation_date = Column(DateTime)
    status = Column(Enum("active", "inactive", "faulty", "maintenance"))
    is_on = Column(Boolean, default=False)
    dimming_level = Column(Integer, default=100)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    logs = relationship("StreetlightLog", back_populates="streetlight")
    maintenance_logs = relationship("MaintenanceLog", back_populates="streetlight")
    alerts = relationship("Alert", back_populates="streetlight")
    predictive_maintenance = relationship("PredictiveMaintenance", back_populates="streetlight", uselist=False)

class StreetlightLog(Base):
    __tablename__ = "streetlight_logs"
    id = Column(Integer, primary_key=True, index=True)
    streetlight_id = Column(Integer, ForeignKey("streetlights.id"))
    voltage = Column(Float)
    current = Column(Float)
    power_consumption = Column(Float)
    light_intensity = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    streetlight = relationship("Streetlight", back_populates="logs")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    streetlight_id = Column(Integer, ForeignKey("streetlights.id"))
    type = Column(String)
    severity = Column(Enum("low", "medium", "high", "critical"))
    message = Column(String)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    streetlight = relationship("Streetlight", back_populates="alerts")

class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"
    id = Column(Integer, primary_key=True, index=True)
    streetlight_id = Column(Integer, ForeignKey("streetlights.id"))
    technician_id = Column(Integer, ForeignKey("users.id"))
    description = Column(String)
    parts_replaced = Column(String)
    scheduled_date = Column(DateTime)
    completion_date = Column(DateTime)
    status = Column(Enum("pending", "in_progress", "completed"))
    
    streetlight = relationship("Streetlight", back_populates="maintenance_logs")
    technician = relationship("User", back_populates="maintenance_logs")

class PredictiveMaintenance(Base):
    __tablename__ = "predictive_maintenance"
    id = Column(Integer, primary_key=True, index=True)
    streetlight_id = Column(Integer, ForeignKey("streetlights.id"), unique=True)
    failure_probability = Column(Float)
    predicted_failure_date = Column(DateTime)
    urgency_level = Column(Enum("low", "medium", "high"))
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    streetlight = relationship("Streetlight", back_populates="predictive_maintenance")