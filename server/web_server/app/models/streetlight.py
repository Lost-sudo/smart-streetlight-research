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

class AlertType(str, PyEnum):
    FAULT = "FAULT"

class AlertSeverity(str, PyEnum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class MaintenanceStatus(str, PyEnum):
    pending = "pending"
    in_progress = "in_progess"
    completed = "completed"

class UrgencyLevel(str,  PyEnum):
    low = "low"
    medium = "medium"
    high = "high"

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
    predictive_alerts = relationship("PredictiveAlert", back_populates="streetlight")
    predictive_maintenance = relationship("PredictiveMaintenance", back_populates="streetlight", uselist=False)

class StreetlightLog(Base):
    __tablename__ = "streetlight_logs"
    id = Column(Integer, primary_key=True, index=True)
    streetlight_id = Column(Integer, ForeignKey("streetlights.id"))
    voltage = Column(Float)
    current = Column(Float)
    power_consumption = Column(Float)
    light_intensity = Column(Float)
    is_on = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    streetlight = relationship("Streetlight", back_populates="logs")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    streetlight_id = Column(Integer, ForeignKey("streetlights.id"))
    alert_type = Column(Enum(AlertType, name="alert_type_enum"), nullable=False, default=AlertType.FAULT, server_default=AlertType.FAULT.value)
    type = Column(String)  # descriptive sub-type, e.g. "hardware_fault_alert", "predicted_failure"
    severity = Column(Enum(AlertSeverity, name="alert_severity_enum"))
    message = Column(String)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    streetlight = relationship("Streetlight", back_populates="alerts")
    repair_task = relationship("RepairTask", back_populates="alert", uselist=False)

class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"
    id = Column(Integer, primary_key=True, index=True)
    streetlight_id = Column(Integer, ForeignKey("streetlights.id"))
    technician_id = Column(Integer, ForeignKey("users.id"))
    description = Column(String)
    parts_replaced = Column(String)
    scheduled_date = Column(DateTime)
    completion_date = Column(DateTime)
    status = Column(Enum(MaintenanceStatus, name="maintenance_status_enum"))
    
    streetlight = relationship("Streetlight", back_populates="maintenance_logs")
    technician = relationship("User", back_populates="maintenance_logs")

class PredictiveMaintenance(Base):
    __tablename__ = "predictive_maintenance"
    id = Column(Integer, primary_key=True, index=True)
    streetlight_id = Column(Integer, ForeignKey("streetlights.id"), unique=True)
    failure_probability = Column(Float)
    predicted_failure_date = Column(DateTime)
    urgency_level = Column(Enum(UrgencyLevel, name="urgency_level_enum"))
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    streetlight = relationship("Streetlight", back_populates="predictive_maintenance")

class PredictiveAlert(Base):
    __tablename__ = "predictive_alerts"
    id = Column(Integer, primary_key=True, index=True)
    streetlight_id = Column(Integer, ForeignKey("streetlights.id"))
    urgency = Column(Enum(UrgencyLevel, name="urgency_level_enum"))
    message = Column(String)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    streetlight = relationship("Streetlight", back_populates="predictive_alerts")
    repair_task = relationship("RepairTask", back_populates="predictive_alert", uselist=False)