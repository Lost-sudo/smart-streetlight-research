from sqlalchemy.orm import Session
from app.repositories.predictive_maintenance_log import PredictiveMaintenanceRepository
from app.schemas.streetlight import PredictiveMaintenanceCreate, PredictiveMaintenanceRead, PredictiveMaintenanceUpdate

class PredictiveMaintenanceService:
    def __init__(self, db: Session):
        self.log_repo = PredictiveMaintenanceRepository(db)

    def create_log(self, log: PredictiveMaintenanceCreate):
        """
        Create a new predictive maintenance log.
        
        Args:
            log: The predictive maintenance log data to create
            
        Returns:
            The created predictive maintenance log
        """
        return self.log_repo.create(log)

    def get_log_by_id(self, log_id: int):
        """
        Get a predictive maintenance log by its ID.
        
        Args:
            log_id: The ID of the predictive maintenance log to retrieve
            
        Returns:
            The predictive maintenance log with the given ID
        """
        return self.log_repo.get_by_id(log_id)

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
        return self.log_repo.update(log_id, log)

    def delete_log(self, log_id: int):
        """
        Delete a predictive maintenance log.
        
        Args:
            log_id: The ID of the predictive maintenance log to delete
            
        Returns:
            True if the predictive maintenance log was deleted successfully, False otherwise
        """
        return self.log_repo.delete(log_id)