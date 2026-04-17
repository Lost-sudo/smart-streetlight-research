from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
from enum import Enum as PyEnum

class MaintenanceStatus(str, PyEnum):
    pending = "pending"
    in_progress = "in_progess"
    completed = "completed"

class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"
    id = Column(Integer, primary_key=True, index=True)
    streetlight_id = Column(Integer, ForeignKey("streetlights.id"))
    technician_id = Column(Integer, ForeignKey("users.id"))
    maintenance_task_id = Column(Integer, ForeignKey("maintenance_tasks.id"), nullable=True, unique=True)
    description = Column(String)
    parts_replaced = Column(String)
    scheduled_date = Column(DateTime)
    completion_date = Column(DateTime)
    status = Column(Enum(MaintenanceStatus, name="maintenance_status_enum"))
    
    streetlight = relationship("Streetlight", back_populates="maintenance_logs")
    technician = relationship("User", back_populates="maintenance_logs")
    maintenance_task = relationship("MaintenanceTask", back_populates="maintenance_log")