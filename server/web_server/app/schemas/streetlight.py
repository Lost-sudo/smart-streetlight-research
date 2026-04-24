from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from enum import Enum
from datetime import datetime


class StreetlightCreate(BaseModel):
    name: str
    device_id: Optional[str] = None
    latitude: float
    longitude: float
    model_info: Optional[str] = None
    installation_date: Optional[datetime] = None
    status: str
    is_on: bool


class StreetlightUpdate(BaseModel):
    name: Optional[str] = None
    device_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    model_info: Optional[str] = None
    installation_date: Optional[datetime] = None
    status: Optional[str] = None
    is_on: Optional[bool] = None


class StreetlightRead(BaseModel):
    id: int
    name: str
    device_id: Optional[str] = None
    latitude: float
    longitude: float
    model_info: Optional[str] = None
    installation_date: Optional[datetime] = None
    status: str
    is_on: bool
    created_at: datetime
    has_telemetry: bool = False

    model_config = ConfigDict(from_attributes=True)

class IoTNodeLogCreate(BaseModel):
    device_id: str
    voltage: float
    current: float
    power_consumption: float
    light_intensity: float
    timestamp: datetime

    operating_hours: Optional[float] = None
    voltage_fluctuation: Optional[float] = None
    current_deviation: Optional[float] = None
    power_trend: Optional[float] = None
    fault_frequency: Optional[int] = None

class StreetlightLogRead(BaseModel):
    id: int
    streetlight_id: int
    voltage: float
    current: float
    power_consumption: float
    light_intensity: float
    timestamp: datetime
    # Advanced features
    operating_hours: Optional[float] = None
    voltage_fluctuation: Optional[float] = None
    current_deviation: Optional[float] = None
    power_trend: Optional[float] = None
    fault_frequency: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class AlertCreate(BaseModel):
    streetlight_id: int
    alert_type: str = "FAULT"
    type: str
    severity: str
    message: str
    is_resolved: bool
    created_at: datetime

class AlertRead(BaseModel):
    id: int
    streetlight_id: Optional[int] = None
    alert_type: str
    type: str
    severity: str
    message: str
    is_resolved: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AlertUpdate(BaseModel):
    is_resolved: bool

class MaintenanceLogCreate(BaseModel):
    streetlight_id: int
    technician_id: int
    description: str
    parts_replaced: str
    scheduled_date: datetime
    completion_date: Optional[datetime] = None
    status: str

class MaintenanceLogRead(BaseModel):
    id: int
    streetlight_id: int
    technician_id: int
    description: str
    parts_replaced: str
    scheduled_date: datetime
    completion_date: Optional[datetime]
    status: str

    model_config = ConfigDict(from_attributes=True)

class MaintenanceLogUpdate(BaseModel):
    description: Optional[str] = None
    parts_replaced: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    status: Optional[str] = None

class PredictiveMaintenanceCreate(BaseModel):
    streetlight_id: int
    failure_probability: float
    predicted_failure_date: datetime
    urgency_level: str

class PredictiveMaintenanceRead(BaseModel):
    id: int
    streetlight_id: Optional[int] = None
    failure_probability: float
    predicted_failure_date: datetime
    urgency_level: str
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)

class PredictiveMaintenanceUpdate(BaseModel):
    failure_probability: Optional[float] = None
    predicted_failure_date: Optional[datetime] = None
    urgency_level: Optional[str] = None