from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
from enum import Enum as PyEnum


class MaintenanceTaskStatus(str, PyEnum):
    pending = "pending"
    assigned = "assigned"
    in_progress = "in_progress"
    completed = "completed"


class MaintenanceTaskPriority(str, PyEnum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class MaintenanceTask(Base):
    """
    Scheduled maintenance task created from predictive maintenance alerts.
    When completed, generates a MaintenanceLog entry automatically.
    """
    __tablename__ = "maintenance_tasks"

    id = Column(Integer, primary_key=True, index=True)
    predictive_alert_id = Column(Integer, ForeignKey("predictive_alerts.id"), nullable=True, unique=True)
    streetlight_id = Column(Integer, ForeignKey("streetlights.id"), nullable=False)
    technician_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(
        Enum(MaintenanceTaskStatus, name="maintenance_task_status_enum"),
        nullable=False,
        default=MaintenanceTaskStatus.pending,
        server_default=MaintenanceTaskStatus.pending.value,
    )
    priority = Column(
        Enum(MaintenanceTaskPriority, name="maintenance_task_priority_enum"),
        nullable=False,
        default=MaintenanceTaskPriority.medium,
        server_default=MaintenanceTaskPriority.medium.value,
    )
    description = Column(Text, nullable=True)
    scheduled_date = Column(DateTime, nullable=True)
    assigned_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    predictive_alert = relationship("PredictiveAlert", backref="maintenance_task")
    streetlight = relationship("Streetlight", backref="maintenance_tasks")
    technician = relationship("User", backref="maintenance_tasks")
    maintenance_log = relationship("MaintenanceLog", back_populates="maintenance_task", uselist=False)
