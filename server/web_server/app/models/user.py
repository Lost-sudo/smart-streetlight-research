from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from enum import Enum as PyEnum
from datetime import datetime

class UserRole(str, PyEnum):
    admin = "admin"
    operator = "operator"
    technician = "technician"
    viewer = "viewer"

class TechnicianAvailability(str, PyEnum):
    available = "available"
    busy = "busy"
    offline = "offline"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.viewer)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    availability = Column(
        Enum(TechnicianAvailability, name="technician_availability_enum"),
        nullable=True,
        default=None,
    )
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    maintenance_logs = relationship("MaintenanceLog", back_populates="technician")
    assigned_repair_tasks = relationship(
        "RepairTask",
        foreign_keys="[RepairTask.technician_id]",
        back_populates="technician",
    )
    created_repair_assignments = relationship(
        "RepairTask",
        foreign_keys="[RepairTask.assigned_by_user_id]",
        back_populates="assigner",
    )
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    