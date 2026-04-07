from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
from enum import Enum as PyEnum


class RepairTaskStatus(str, PyEnum):
    pending = "pending"
    assigned = "assigned"
    in_progress = "in_progress"
    completed = "completed"


class TechnicianAvailability(str, PyEnum):
    available = "available"
    busy = "busy"
    offline = "offline"


class AssignedByType(str, PyEnum):
    admin = "admin"
    operator = "operator"
    self_assigned = "self_assigned"


class RepairTask(Base):
    __tablename__ = "repair_tasks"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=False, unique=True)
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
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    assigned_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    version = Column(Integer, nullable=False, default=1, server_default="1")

    # Relationships
    alert = relationship("Alert", back_populates="repair_task")
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
