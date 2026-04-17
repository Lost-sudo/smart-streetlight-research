from app.repositories.streetlight_log import StreetlightLogRepository
from app.repositories.streetlight import StreetlightRepository
from app.repositories.predictive_maintenance_log import PredictiveMaintenanceRepository
from app.repositories.alert import AlertRepository
from app.schemas.streetlight import StreetlightLogRead, IoTNodeLogCreate, PredictiveMaintenanceCreate, PredictiveMaintenanceUpdate, AlertCreate, StreetlightUpdate
from app.schemas.repair_task import RepairTaskCreate
from app.repositories.repair_task import RepairTaskRepository
from app.services.ml_prediction import MLPredictionService
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class StreetlightLogService:
    def __init__(self, db: Session):
        self.streetlight_log_repo = StreetlightLogRepository(db)
        self.streetlight_repo = StreetlightRepository(db)
        self.predictive_maintenance_repo = PredictiveMaintenanceRepository(db)
        self.alert_repo = AlertRepository(db)
        self.repair_task_repo = RepairTaskRepository(db)
        self.ml_service = MLPredictionService()

    def add_log_from_iot(self, iot_log: IoTNodeLogCreate):
        """
        Add a new streetlight log from an IoT node.
        
        Args:
            iot_log: The IoT node log to add
            
        Returns:
            The created streetlight log
            
        Raises:
            HTTPException: If the streetlight with the given device_id is not found
        """

        # Get the streetlight to ensure it exists
        streetlight = self.streetlight_repo.get_by_device_id(iot_log.device_id)
        if not streetlight:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Streetlight with device_id {iot_log.device_id} not found")
        
        # 1. Create the standard streetlight log
        created_log = self.streetlight_log_repo.create(streetlight.id, iot_log)

        # 2. FAULT DETECTION (Random Forest)
        try:
            fault_result = self.ml_service.detect_fault(iot_log)
            if fault_result.get("is_faulty", False):
                if streetlight.status != "maintenance":
                    self.streetlight_repo.update(streetlight.id, StreetlightUpdate(status="faulty"))
                
                confidence = fault_result.get("confidence", 0.0)
                if confidence >= 0.8:
                    fault_priority = "critical"
                elif confidence >= 0.7:
                    fault_priority = "high"
                else:
                    fault_priority = "medium"

                # Filter alerts: only store high and critical priority faults as alerts
                if fault_priority in ["high", "critical"]:
                    # Avoid spamming duplicate hardware fault alerts, BUT allow if previous was resolved
                    existing_active_fault = self.alert_repo.get_unresolved_by_streetlight_id(
                        streetlight.id, alert_type="hardware_fault_alert"
                    )
                    
                    if not existing_active_fault:
                        alert_create = AlertCreate(
                            streetlight_id=streetlight.id,
                            alert_type="FAULT",
                            type="hardware_fault_alert",
                            severity=fault_priority,
                            message=f"Immediate hardware fault detected ({confidence*100:.1f}% confidence).",
                            is_resolved=False,
                            created_at=datetime.utcnow()
                        )
                        db_alert = self.alert_repo.create(alert_create)

                        self.repair_task_repo.create(RepairTaskCreate(
                            streetlight_id=streetlight.id,
                            alert_id=db_alert.id, 
                            description="Hardware fault auto-detected. Requires emergency field intervention.",
                            source_type="FAULT",
                            priority=fault_priority
                        ))
        except Exception as e:
            logger.exception("Error during Fault Detection flow")

        return created_log


    def get_streetlight_log_by_id(self, streetlight_log_id: int):
        """
        Get a streetlight log by its ID.
        
        Args:
            streetlight_log_id: The ID of the streetlight log to retrieve
            
        Returns:
            The streetlight log with the given ID
            
        Raises:
            HTTPException: If the streetlight log with the given ID is not found
        """
        streetlight_log = self.streetlight_log_repo.get_by_id(streetlight_log_id)
        if not streetlight_log:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Streetlight log not found")
        return streetlight_log

    def get_all_streetlight_logs(self):
        """
        Get all streetlight logs.
        
        Returns:
            A list of all streetlight logs
        """
        return self.streetlight_log_repo.get_all()

    def get_streetlight_logs_by_streetlight_id(self, streetlight_id: int, limit: int = 100):
        """
        Get streetlight logs by streetlight ID.
        
        Args:
            streetlight_id: The ID of the streetlight
            limit: The maximum number of logs to retrieve
            
        Returns:
            A list of streetlight logs for the given streetlight ID
        """
        return self.streetlight_log_repo.get_by_streetlight_id(streetlight_id, limit=limit)