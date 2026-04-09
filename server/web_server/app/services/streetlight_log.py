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
from typing import List
from datetime import datetime


class StreetlightLogService:
    def __init__(self, db: Session):
        self.streetlight_log_repo = StreetlightLogRepository(db)
        self.streetlight_repo = StreetlightRepository(db)
        self.predictive_maintenance_repo = PredictiveMaintenanceRepository(db)
        self.alert_repo = AlertRepository(db)
        self.repair_task_repo = RepairTaskRepository(db)
        self.ml_service = MLPredictionService()

    def add_log_from_iot(self, iot_log: IoTNodeLogCreate) -> StreetlightLogRead:
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

        # 2. Run ML Prediction
        try:
            prediction_result = self.ml_service.predict_failure(iot_log)
            
            # 3. Upsert Predictive Maintenance Log
            existing_pm = self.predictive_maintenance_repo.get_by_streetlight_id(streetlight.id)
            if existing_pm:
                pm_update = PredictiveMaintenanceUpdate(
                    failure_probability=prediction_result["failure_probability"],
                    predicted_failure_date=prediction_result["predicted_failure_date"],
                    urgency_level=prediction_result["urgency_level"]
                )
                self.predictive_maintenance_repo.update(existing_pm.id, pm_update)
            else:
                pm_create = PredictiveMaintenanceCreate(
                    streetlight_id=streetlight.id,
                    failure_probability=prediction_result["failure_probability"],
                    predicted_failure_date=prediction_result["predicted_failure_date"],
                    urgency_level=prediction_result["urgency_level"]
                )
                self.predictive_maintenance_repo.create(pm_create)

            # 4. Generate Alert if criticality is high/critical
            if prediction_result["urgency_level"] in ["high", "critical"] or prediction_result["failure_probability"] >= 0.8:
                alert_create = AlertCreate(
                    streetlight_id=streetlight.id,
                    type="predictive_maintenance_alert",
                    severity="critical" if prediction_result["failure_probability"] >= 0.9 else "high",
                    message=f"High failure probability detected: {prediction_result['failure_probability']*100:.1f}%. Predicted failure date: {prediction_result['predicted_failure_date'].strftime('%Y-%m-%d')}.",
                    is_resolved=False,
                    created_at=datetime.utcnow()
                )
                db_alert = self.alert_repo.create(alert_create)
                
                # Automatically spawn a RepairTask assigned to this alert 
                self.repair_task_repo.create(RepairTaskCreate(
                    alert_id=db_alert.id, 
                    description="AI-generated maintenance prediction. Requires immediate field inspection."
                ))

                # 5. Automatically mark the physical node state as Faulty (if not under active Maintenance)
                if streetlight.status != "maintenance":
                    self.streetlight_repo.update(streetlight.id, StreetlightUpdate(status="faulty"))

        except Exception as e:
            print(f"Error during ML prediction flow: {e}")

        return created_log


    def get_streetlight_log_by_id(self, streetlight_log_id: int) -> StreetlightLogRead:
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

    def get_all_streetlight_logs(self) -> List[StreetlightLogRead]:
        """
        Get all streetlight logs.
        
        Returns:
            A list of all streetlight logs
        """
        return self.streetlight_log_repo.get_all()

    def get_streetlight_logs_by_streetlight_id(self, streetlight_id: int, limit: int = 100) -> List[StreetlightLogRead]:
        """
        Get streetlight logs by streetlight ID.
        
        Args:
            streetlight_id: The ID of the streetlight
            limit: The maximum number of logs to retrieve
            
        Returns:
            A list of streetlight logs for the given streetlight ID
        """
        return self.streetlight_log_repo.get_by_streetlight_id(streetlight_id, limit=limit)