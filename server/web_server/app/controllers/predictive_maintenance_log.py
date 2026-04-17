from sqlalchemy.orm import Session
from app.schemas.streetlight import PredictiveMaintenanceCreate, PredictiveMaintenanceRead, PredictiveMaintenanceUpdate
from app.services.predictive_maintenance_log import PredictiveMaintenanceService
from typing import List

class PredictiveMaintenanceController:
    def __init__(self, db: Session):
        self.log_service = PredictiveMaintenanceService(db)

    def analyze_all_nodes(self):
        return self.log_service.analyze_all_nodes()

    def create_log(self, log: PredictiveMaintenanceCreate) -> PredictiveMaintenanceRead:
        """
        Create a new predictive maintenance log.
        
        Args:
            log: The predictive maintenance log data to create
            
        Returns:
            The created predictive maintenance log
        """
        new_log = self.log_service.create_log(log)
        return PredictiveMaintenanceRead.model_validate(new_log, from_attributes=True)

    def get_log_by_id(self, log_id: int) -> PredictiveMaintenanceRead:
        """
        Get a predictive maintenance log by its ID.
        
        Args:
            log_id: The ID of the predictive maintenance log to retrieve
            
        Returns:
            The predictive maintenance log with the given ID
        """
        log = self.log_service.get_log_by_id(log_id=log_id)
        return PredictiveMaintenanceRead.model_validate(log, from_attributes=True)

    def get_all_logs(self) -> List[PredictiveMaintenanceRead]:
        """
        Get all predictive maintenance logs.
        
        Returns:
            A list of all predictive maintenance logs
        """
        logs = self.log_service.get_all_logs()
        return [PredictiveMaintenanceRead.model_validate(l, from_attributes=True) for l in logs]

    def update_log(self, log_id: int, log: PredictiveMaintenanceUpdate) -> PredictiveMaintenanceRead:
        """
        Update a predictive maintenance log.
        
        Args:
            log_id: The ID of the predictive maintenance log to update
            log: The predictive maintenance log data to update
            
        Returns:
            The updated predictive maintenance log
        """
        updated_log = self.log_service.update_log(log_id=log_id, log=log)
        return PredictiveMaintenanceRead.model_validate(updated_log, from_attributes=True)

    def delete_log(self, log_id: int) -> str:
        """
        Delete a predictive maintenance log.
        
        Args:
            log_id: The ID of the predictive maintenance log to delete
            
        Returns:
            A success message
        """
        return self.log_service.delete_log(log_id=log_id)