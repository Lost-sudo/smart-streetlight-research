from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum


class MaintenanceTaskStatusEnum(str, Enum):
    pending = "pending"
    assigned = "assigned"
    in_progress = "in_progress"
    completed = "completed"


class MaintenanceTaskPriorityEnum(str, Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class MaintenanceTaskCreate(BaseModel):
    streetlight_id: int
    predictive_alert_id: Optional[int] = None
    description: Optional[str] = None
    priority: MaintenanceTaskPriorityEnum = MaintenanceTaskPriorityEnum.medium
    scheduled_date: Optional[datetime] = None


class MaintenanceTaskRead(BaseModel):
    id: int
    predictive_alert_id: Optional[int] = None
    streetlight_id: int
    technician_id: Optional[int] = None
    status: MaintenanceTaskStatusEnum
    priority: MaintenanceTaskPriorityEnum
    description: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    assigned_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MaintenanceTaskAssign(BaseModel):
    technician_id: int
    scheduled_date: Optional[datetime] = None


class MaintenanceTaskComplete(BaseModel):
    """Fields for completing a maintenance task and generating a MaintenanceLog."""
    description: Optional[str] = None
    parts_replaced: Optional[str] = None
    notes: Optional[str] = None
