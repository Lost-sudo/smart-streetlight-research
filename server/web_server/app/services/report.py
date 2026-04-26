from sqlalchemy.orm import Session
from app.repositories.report import ReportRepository
from app.schemas.report import ReportResponse, EnergyData, FaultFrequency, SystemMetrics, MaintenancePerformance
from typing import List
from datetime import datetime


class ReportService:
    def __init__(self, db: Session):
        self.report_repo = ReportRepository(db)

    def get_system_report(self, month: int, year: int) -> ReportResponse:
        energy_data_raw = self.report_repo.get_monthly_energy_usage(month, year)
        fault_frequency_raw = self.report_repo.get_fault_frequency(month, year)
        mttr_hours = self.report_repo.get_mttr_data(month, year)
        maint_stats = self.report_repo.get_maintenance_stats(month, year)
        total_energy_month = self.report_repo.get_total_energy_for_month(month, year)

        # Target month name
        target_month_name = datetime(year, month, 1).strftime('%B %Y')

        # Handle empty energy data
        if not energy_data_raw:
            energy_data = [
                EnergyData(month=datetime(year, m, 1).strftime('%b'), consumption=0)
                for m in range(max(1, month-5), month+1)
            ]
        else:
            energy_data = [EnergyData(**d) for d in energy_data_raw]

        # Handle empty fault frequency
        if not fault_frequency_raw:
            fault_frequency = [
                FaultFrequency(name="Short Circuit", value=0),
                FaultFrequency(name="Bulb Fault", value=0),
                FaultFrequency(name="Sensor Error", value=0),
                FaultFrequency(name="Connectivity", value=0)
            ]
        else:
            fault_frequency = [FaultFrequency(**d) for d in fault_frequency_raw]
        
        # Format metrics
        metrics = SystemMetrics(
            energy_consumption=f"{total_energy_month:,.0f} kWh",
            energy_savings="Calculated vs Target",
            uptime_percentage="99.9%", # Still placeholder for now
            uptime_status="Availability for Period",
            mttr=f"{mttr_hours:.1f} Hours",
            mttr_target="Target: < 6 Hours",
            reporting_period=target_month_name,
            reporting_filter="Monthly Breakdown"
        )

        maintenance_performance = MaintenancePerformance(
            response_time_compliance=maint_stats["compliance_rate"],
            pm_completion=maint_stats["pm_rate"],
            status="On Track" if maint_stats["compliance_rate"] > 90 else "Review Needed"
        )

        return ReportResponse(
            energy_data=energy_data,
            fault_frequency_data=fault_frequency,
            metrics=metrics,
            maintenance_performance=maintenance_performance
        )
