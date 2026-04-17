from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class RepairLogCreate(BaseModel):
    """Used when completing a repair task to log the repair details."""
    repair_task_id: int
    diagnosis: Optional[str] = None
    action_taken: Optional[str] = None
    parts_replaced: Optional[str] = None
    repair_duration_minutes: Optional[float] = None
    notes: Optional[str] = None


class RepairLogRead(BaseModel):
    id: int
    repair_task_id: int
    streetlight_id: int
    technician_id: int
    diagnosis: Optional[str] = None
    action_taken: Optional[str] = None
    parts_replaced: Optional[str] = None
    repair_duration_minutes: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RepairLogUpdate(BaseModel):
    diagnosis: Optional[str] = None
    action_taken: Optional[str] = None
    parts_replaced: Optional[str] = None
    repair_duration_minutes: Optional[float] = None
    notes: Optional[str] = None
