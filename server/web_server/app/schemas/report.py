from pydantic import BaseModel
from typing import List, Optional

class EnergyData(BaseModel):
    month: str
    consumption: float

class FaultFrequency(BaseModel):
    name: str
    value: int

class SystemMetrics(BaseModel):
    energy_consumption: str
    energy_savings: str
    uptime_percentage: str
    uptime_status: str
    mttr: str
    mttr_target: str
    reporting_period: str
    reporting_filter: str

class MaintenancePerformance(BaseModel):
    response_time_compliance: int
    pm_completion: int
    status: str

class ReportResponse(BaseModel):
    energy_data: List[EnergyData]
    fault_frequency_data: List[FaultFrequency]
    metrics: SystemMetrics
    maintenance_performance: MaintenancePerformance
