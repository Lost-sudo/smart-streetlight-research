from sqlalchemy.orm import Session
from app.repositories.predictive_maintenance_log import PredictiveMaintenanceRepository
from app.schemas.streetlight import PredictiveMaintenanceCreate, PredictiveMaintenanceRead, PredictiveMaintenanceUpdate
from app.services.predictive_alert import PredictiveAlertService
from app.schemas.predictive_alert import PredictiveAlertCreate
from app.models.streetlight import UrgencyLevel
from app.repositories.streetlight_log import StreetlightLogRepository
from app.services.ml_prediction import MLPredictionService
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)

class PredictiveMaintenanceService:
    def __init__(self, db: Session):
        self.db = db
        self.log_repo = PredictiveMaintenanceRepository(db)
        self.alert_service = PredictiveAlertService(db)
        self.streetlight_log_repo = StreetlightLogRepository(db)
        self.ml_service = MLPredictionService()

    def _check_and_trigger_alert(self, streetlight_id: int, failure_probability: float, urgency_level: str):
        """Helper to trigger an alert if the urgency is HIGH or MEDIUM."""
        if urgency_level in [UrgencyLevel.high, UrgencyLevel.medium] or failure_probability >= 0.7:
            # We trigger an alert
            message = f"AI Prediction: High risk of hardware failure detected. Probability: {failure_probability*100:.0f}%."
            alert_in = PredictiveAlertCreate(
                streetlight_id=streetlight_id,
                urgency=urgency_level,
                message=message,
                is_resolved=False
            )
            self.alert_service.create_alert(alert_in)

    def analyze_node(self, streetlight_id: int):
        """
        Pull historical data from DB and run predictive maintenance ML logic asynchronously.
        """
        try:
            recent_logs = self.streetlight_log_repo.get_by_streetlight_id(streetlight_id, limit=10)
            if not recent_logs or len(recent_logs) < 1:
                return

            # The most recent log acts as the current reading
            iot_log = recent_logs[0]
            
            # The other up-to-9 logs act as sequence history
            historical_logs = recent_logs[1:10]
            historical_logs.reverse() # chronological order for LSTM
            
            prediction_result = self.ml_service.predict_failure(iot_log, historical_logs)
            
            existing_pm = self.log_repo.get_by_streetlight_id(streetlight_id)
            if existing_pm:
                pm_update = PredictiveMaintenanceUpdate(
                    failure_probability=prediction_result["failure_probability"],
                    predicted_failure_date=prediction_result["predicted_failure_date"],
                    urgency_level=prediction_result["urgency_level"]
                )
                self.update_log(existing_pm.id, pm_update)
            else:
                pm_create = PredictiveMaintenanceCreate(
                    streetlight_id=streetlight_id,
                    failure_probability=prediction_result["failure_probability"],
                    predicted_failure_date=prediction_result["predicted_failure_date"],
                    urgency_level=prediction_result["urgency_level"]
                )
                self.create_log(pm_create)
        except Exception as e:
            logger.exception("Error during ML prediction flow from specific service")

    def analyze_all_nodes(self):
        """
        Run decoupled predictive maintenance ML logic across all streetlights.
        """
        from app.repositories.streetlight import StreetlightRepository
        sl_repo = StreetlightRepository(self.db)
        streetlights = sl_repo.get_all()
        
        for sl in streetlights:
            try:
                self.analyze_node(sl.id)
            except Exception as e:
                logger.error(f"Error analyzing node {sl.id}: {e}")
                
        return {"status": "success", "message": f"Analyzed {len(streetlights)} nodes."}

    def create_log(self, log: PredictiveMaintenanceCreate):
        """
        Create a new predictive maintenance log.
        
        Args:
            log: The predictive maintenance log data to create
            
        Returns:
            The created predictive maintenance log
        """
        created = self.log_repo.create(log)
        self._check_and_trigger_alert(created.streetlight_id, created.failure_probability, created.urgency_level)
        return created

    def get_log_by_id(self, log_id: int):
        """
        Get a predictive maintenance log by its ID.
        
        Args:
            log_id: The ID of the predictive maintenance log to retrieve
            
        Returns:
            The predictive maintenance log with the given ID
        """
        log = self.log_repo.get_by_id(log_id)
        if log is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Predictive maintenance log not found")
        return log

    def get_all_logs(self):
        """
        Get all predictive maintenance logs.
        
        Returns:
            A list of all predictive maintenance logs
        """
        return self.log_repo.get_all()

    def update_log(self, log_id: int, log: PredictiveMaintenanceUpdate):
        """
        Update a predictive maintenance log.
        
        Args:
            log_id: The ID of the predictive maintenance log to update
            log: The predictive maintenance log data to update
            
        Returns:
            The updated predictive maintenance log
        """
        updated = self.log_repo.update(log_id, log)
        if updated is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Predictive maintenance log not found")
        
        # After successfully updating the prediction, check if we need an alert
        self._check_and_trigger_alert(updated.streetlight_id, updated.failure_probability, updated.urgency_level)
        
        return updated

    def delete_log(self, log_id: int):
        """
        Delete a predictive maintenance log.
        
        Args:
            log_id: The ID of the predictive maintenance log to delete
            
        Returns:
            True if the predictive maintenance log was deleted successfully, False otherwise
        """
        deleted = self.log_repo.delete(log_id)
        if deleted is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Predictive maintenance log not found")
        return {"message": "Predictive maintenance log deleted successfully"}