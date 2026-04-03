from sqlalchemy.orm import Session
from app.repositories.maintenance_log import MaintenanceLogRepository
from app.schemas.streetlight import MaintenanceLogCreate, MaintenanceLogUpdate

class MaintenanceLogService:
    def __init__(self, db: Session):
        self.log_repo = MaintenanceLogRepository(db)

    def create_log(self, log: MaintenanceLogCreate):
        """
        Create a new maintenance log.
        
        Args:
            log: The maintenance log data to create
            
        Returns:
            The created maintenance log
        """
        return self.log_repo.create(log)

    def get_log_by_id(self, log_id: int):
        """
        Get a maintenance log by its ID.
        
        Args:
            log_id: The ID of the maintenance log to retrieve
            
        Returns:
            The maintenance log with the given ID
        """
        return self.log_repo.get_by_id(log_id)

    def get_all_logs(self):
        """
        Get all maintenance logs.
        
        Returns:
            A list of all maintenance logs
        """
        return self.log_repo.get_all()

    def update_log(self, log_id: int, log: MaintenanceLogUpdate):
        """
        Update a maintenance log.
        
        Args:
            log_id: The ID of the maintenance log to update
            log: The maintenance log data to update
            
        Returns:
            The updated maintenance log
        """
        return self.log_repo.update(log_id, log)

    def delete_log(self, log_id: int):
        """
        Delete a maintenance log.
        
        Args:
            log_id: The ID of the maintenance log to delete
            
        Returns:
            True if the maintenance log was deleted successfully, False otherwise
        """
        return self.log_repo.delete(log_id)
