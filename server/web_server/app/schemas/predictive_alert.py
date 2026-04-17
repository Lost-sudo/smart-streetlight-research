from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.streetlight import UrgencyLevel

class PredictiveAlertBase(BaseModel):
    streetlight_id: int
    urgency: UrgencyLevel
    message: str
    is_resolved: bool = False

class PredictiveAlertCreate(PredictiveAlertBase):
    pass

class PredictiveAlertUpdate(BaseModel):
    is_resolved: Optional[bool] = None
    urgency: Optional[UrgencyLevel] = None
    message: Optional[str] = None

class PredictiveAlertRead(PredictiveAlertBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
