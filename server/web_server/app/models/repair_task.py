from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
from enum import Enum as PyEnum


class RepairTaskSourceType(str, PyEnum):
    FAULT = "FAULT"
    PREDICTIVE = "PREDICTIVE"

class RepairTaskPriority(str, PyEnum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class RepairTaskStatus(str, PyEnum):
    pending = "pending"
    assigned = "assigned"
    in_progress = "in_progress"
    completed = "completed"

class AssignedByType(str, PyEnum):
    admin = "admin"
    operator = "operator"
    self_assigned = "self_assigned"


class RepairTask(Base):
    __tablename__ = "repair_tasks"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True, unique=True)
    predictive_alert_id = Column(Integer, ForeignKey("predictive_alerts.id"), nullable=True, unique=True)
    streetlight_id = Column(Integer, ForeignKey("streetlights.id"), nullable=False)
    technician_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_by_type = Column(
        Enum(AssignedByType, name="assigned_by_type_enum"), nullable=True
    )
    status = Column(
        Enum(RepairTaskStatus, name="repair_task_status_enum"),
        nullable=False,
        default=RepairTaskStatus.pending,
        server_default=RepairTaskStatus.pending.value,
    )
    source_type = Column(
        Enum(RepairTaskSourceType, name="repair_task_source_type_enum"),
        nullable=False,
        default=RepairTaskSourceType.FAULT,
        server_default=RepairTaskSourceType.FAULT.value,
    )
    priority = Column(
        Enum(RepairTaskPriority, name="repair_task_priority_enum"),
        nullable=False,
        default=RepairTaskPriority.high,
        server_default=RepairTaskPriority.high.value,
    )
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    assigned_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    scheduled_at = Column(DateTime, nullable=True)
    version = Column(Integer, nullable=False, default=1, server_default="1")

    # Relationships
    alert = relationship("Alert", back_populates="repair_task")
    predictive_alert = relationship("PredictiveMaintenanceAlert", back_populates="repair_task")
    streetlight = relationship("Streetlight", backref="repair_tasks")
    technician = relationship(
        "User",
        foreign_keys=[technician_id],
        back_populates="assigned_repair_tasks",
    )
    assigner = relationship(
        "User",
        foreign_keys=[assigned_by_user_id],
        back_populates="created_repair_assignments",
    )
    repair_log = relationship("RepairLog", back_populates="repair_task", uselist=False)
