from sqlalchemy.orm import Session
from app.repositories.predictive_maintenance_log import PredictiveMaintenanceRepository
from app.schemas.streetlight import PredictiveMaintenanceCreate, PredictiveMaintenanceRead, PredictiveMaintenanceUpdate
from fastapi import HTTPException, status

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