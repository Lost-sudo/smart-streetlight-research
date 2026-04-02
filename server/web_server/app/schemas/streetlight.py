from pydantic import BaseModel
from typing import Optional, List
from enum import Enum
from datetime import datetime


class StreetlightCreate(BaseModel):
    name: str
    device_id: Optional[str] = None
    latitude: float
    longitude: float
    model_info: str
    installation_date: datetime
    status: str
    is_on: bool
    dimming_level: int


class StreetlightUpdate(BaseModel):
    name: Optional[str] = None
    device_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    model_info: Optional[str] = None
    installation_date: Optional[datetime] = None
    status: Optional[str] = None
    is_on: Optional[bool] = None
    dimming_level: Optional[int] = None


class StreetlightRead(BaseModel):
    id: int
    name: str
    device_id: Optional[str] = None
    latitude: float
    longitude: float
    model_info: str
    installation_date: datetime
    status: str
    is_on: bool
    dimming_level: int
    created_at: datetime

    class Config:
        from_attributes = True

class IoTNodeLogCreate(BaseModel):
    device_id: str
    voltage: float
    current: float
    power_consumption: float
    light_intensity: float
    timestamp: datetime

class StreetlightLogRead(BaseModel):
    id: int
    streetlight_id: int
    voltage: float
    current: float
    power_consumption: float
    light_intensity: float
    timestamp: datetime

    class Config:
        from_attributes = True

class AlertCreate(BaseModel):
    streetlight_id: int
    type: str
    severity: str
    message: str
    is_resolved: bool
    created_at: datetime

class AlertRead(BaseModel):
    id: int
    streetlight_id: int
    type: str
    severity: str
    message: str
    is_resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AlertUpdate(BaseModel):
    is_resolved: bool