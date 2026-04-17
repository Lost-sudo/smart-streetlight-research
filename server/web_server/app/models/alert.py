from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
from enum import Enum as PyEnum

class AlertType(str, PyEnum):
    FAULT = "FAULT"

class AlertSeverity(str, PyEnum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

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