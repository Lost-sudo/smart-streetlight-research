from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class RepairTaskStatusEnum(str, Enum):
    pending = "pending"
    assigned = "assigned"
    in_progress = "in_progress"
    completed = "completed"


class RepairTaskSourceTypeEnum(str, Enum):
    FAULT = "FAULT"
    PREDICTIVE = "PREDICTIVE"


class RepairTaskPriorityEnum(str, Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class TechnicianAvailabilityEnum(str, Enum):
    available = "available"
    busy = "busy"
    offline = "offline"


class AssignedByTypeEnum(str, Enum):
    admin = "admin"
    operator = "operator"
    self_assigned = "self_assigned"


# --- Repair Task Schemas ---

class RepairTaskCreate(BaseModel):
    alert_id: int
    description: Optional[str] = None
    source_type: RepairTaskSourceTypeEnum = RepairTaskSourceTypeEnum.FAULT
    priority: RepairTaskPriorityEnum = RepairTaskPriorityEnum.high
    scheduled_at: Optional[datetime] = None


class RepairTaskRead(BaseModel):
    id: int
    alert_id: int
    technician_id: Optional[int] = None
    assigned_by_user_id: Optional[int] = None
    assigned_by_type: Optional[AssignedByTypeEnum] = None
    status: RepairTaskStatusEnum
    source_type: RepairTaskSourceTypeEnum
    priority: RepairTaskPriorityEnum
    description: Optional[str] = None
    created_at: datetime
    assigned_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    scheduled_at: Optional[datetime] = None
    version: int

    class Config:
        from_attributes = True


class RepairTaskSchedule(BaseModel):
    """Used by admin to create a predictive maintenance repair task."""
    alert_id: int
    description: Optional[str] = None
    priority: RepairTaskPriorityEnum = RepairTaskPriorityEnum.medium
    scheduled_at: Optional[datetime] = None


class RepairTaskAssign(BaseModel):
    """Used by admin/operator to assign a technician to a task."""
    technician_id: int


class RepairTaskUpdateStatus(BaseModel):
    """Used by technician to update their task status."""
    status: RepairTaskStatusEnum
    description: Optional[str] = None


# --- Technician Schemas ---

class TechnicianStatusUpdate(BaseModel):
    availability: TechnicianAvailabilityEnum


class TechnicianRead(BaseModel):
    id: int
    username: str
    availability: Optional[TechnicianAvailabilityEnum] = None

    class Config:
        from_attributes = True
