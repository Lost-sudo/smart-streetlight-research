from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_
from app.models.streetlight_log import StreetlightLog
from app.models.alert import Alert
from app.models.repair_task import RepairTask, RepairTaskStatus
from app.models.maintenance_task import MaintenanceTask, MaintenanceTaskStatus
from datetime import datetime, timedelta
from typing import List, Dict, Any

class ReportRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_monthly_energy_usage(self, month: int, year: int) -> List[Dict[str, Any]]:
        # Get data for the specific month and the previous 5 months for the trend chart
        target_date = datetime(year, month, 1)
        start_date = target_date - timedelta(days=150) # Approx 6 months
        
        results = self.db.query(
            func.to_char(StreetlightLog.timestamp, 'Mon').label('month_name'),
            func.sum(StreetlightLog.power_consumption).label('consumption')
        ).filter(
            StreetlightLog.timestamp >= start_date,
            StreetlightLog.timestamp < (target_date + timedelta(days=31))
        ).group_by('month_name')\
         .order_by(func.min(StreetlightLog.timestamp))\
         .all()
        
        return [{"month": r.month_name, "consumption": float(r.consumption or 0)} for r in results]

    def get_fault_frequency(self, month: int, year: int) -> List[Dict[str, Any]]:
        results = self.db.query(
            Alert.type.label('name'),
            func.count(Alert.id).label('value')
        ).filter(
            extract('month', Alert.created_at) == month,
            extract('year', Alert.created_at) == year
        ).group_by(Alert.type).all()
        
        return [{"name": r.name.replace('_', ' ').title() if r.name else "Unknown", "value": r.value} for r in results]

    def get_mttr_data(self, month: int, year: int) -> float:
        results = self.db.query(
            func.avg(RepairTask.completed_at - RepairTask.created_at)
        ).filter(
            RepairTask.status == RepairTaskStatus.completed,
            extract('month', RepairTask.completed_at) == month,
            extract('year', RepairTask.completed_at) == year
        ).scalar()
        
        if results:
            return results.total_seconds() / 3600.0
        return 0.0

    def get_maintenance_stats(self, month: int, year: int) -> Dict[str, Any]:
        # Filter by month/year
        base_filter = and_(
            extract('month', RepairTask.completed_at) == month,
            extract('year', RepairTask.completed_at) == year
        )
        
        total_completed = self.db.query(func.count(RepairTask.id))\
            .filter(RepairTask.status == RepairTaskStatus.completed, base_filter).scalar() or 0
        
        compliant_tasks = self.db.query(func.count(RepairTask.id))\
            .filter(
                RepairTask.status == RepairTaskStatus.completed,
                base_filter,
                RepairTask.completed_at - RepairTask.created_at <= timedelta(hours=24)
            ).scalar() or 0
        
        compliance_rate = (compliant_tasks / total_completed * 100) if total_completed > 0 else 0
        
        # PM completion
        pm_filter = and_(
            extract('month', MaintenanceTask.created_at) == month,
            extract('year', MaintenanceTask.created_at) == year
        )
        total_pm = self.db.query(func.count(MaintenanceTask.id)).filter(pm_filter).scalar() or 0
        completed_pm = self.db.query(func.count(MaintenanceTask.id))\
            .filter(MaintenanceTask.status == MaintenanceTaskStatus.completed, pm_filter).scalar() or 0
        
        pm_rate = (completed_pm / total_pm * 100) if total_pm > 0 else 0
        
        return {
            "compliance_rate": int(compliance_rate),
            "pm_rate": int(pm_rate)
        }

    def get_total_energy_for_month(self, month: int, year: int) -> float:
        result = self.db.query(func.sum(StreetlightLog.power_consumption))\
            .filter(
                extract('month', StreetlightLog.timestamp) == month,
                extract('year', StreetlightLog.timestamp) == year
            ).scalar()
        return float(result or 0)
