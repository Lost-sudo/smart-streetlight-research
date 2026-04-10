from typing import List
from sqlalchemy.orm import Session
from app.schemas.streetlight import MaintenanceLogCreate, MaintenanceLogRead, MaintenanceLogUpdate
from app.services.maintenance_log import MaintenanceLogService

class MaintenanceLogController:
    def __init__(self, db: Session):
        self.log_service = MaintenanceLogService(db)

    def create_log(self, log: MaintenanceLogCreate) -> MaintenanceLogRead:
        """
        Create a new maintenance log.
        
        Args:
            log: The maintenance log data to create
            
        Returns:
            The created maintenance log
        """
        new_log = self.log_service.create_log(log)
        return MaintenanceLogRead.model_validate(new_log, from_attributes=True)

    def get_log_by_id(self, log_id: int) -> MaintenanceLogRead:
        """
        Get a maintenance log by its ID.
        
        Args:
            log_id: The ID of the maintenance log to retrieve
            
        Returns:
            The maintenance log with the given ID
        """
        log = self.log_service.get_log_by_id(log_id=log_id)
        return MaintenanceLogRead.model_validate(log, from_attributes=True)

    def get_all_logs(self) -> List[MaintenanceLogRead]:
        """
        Get all maintenance logs.
        
        Returns:
            A list of all maintenance logs
        """
        logs = self.log_service.get_all_logs()
        return [MaintenanceLogRead.model_validate(l, from_attributes=True) for l in logs]

    def update_log(self, log_id: int, log: MaintenanceLogUpdate) -> MaintenanceLogRead:
        """
        Update a maintenance log.
        
        Args:
            log_id: The ID of the maintenance log to update
            log: The maintenance log data to update
            
        Returns:
            The updated maintenance log
        """
        updated_log = self.log_service.update_log(log_id=log_id, log=log)
        return MaintenanceLogRead.model_validate(updated_log, from_attributes=True)

    def delete_log(self, log_id: int) -> str:
        """
        Delete a maintenance log.
        
        Args:
            log_id: The ID of the maintenance log to delete
            
        Returns:
            A success message
        """
        return self.log_service.delete_log(log_id=log_id)
