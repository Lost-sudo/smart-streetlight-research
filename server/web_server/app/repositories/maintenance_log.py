from sqlalchemy.orm import Session
from app.models.streetlight import MaintenanceLog
from app.schemas.streetlight import MaintenanceLogCreate, MaintenanceLogUpdate
from typing import Optional, List

class MaintenanceLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, log: MaintenanceLogCreate) -> MaintenanceLog:
        """
        Create a new maintenance log.
        
        Args:
            log: The maintenance log data to create
            
        Returns:
            The created maintenance log
        """
        db_log = MaintenanceLog(**log.model_dump())
        self.db.add(db_log)
        self.db.commit()
        self.db.refresh(db_log)
        return db_log

    def get_by_id(self, log_id: int) -> Optional[MaintenanceLog]:
        """
        Get a maintenance log by its ID.
        
        Args:
            log_id: The ID of the maintenance log to retrieve
            
        Returns:
            The maintenance log with the given ID
        """
        return self.db.query(MaintenanceLog).filter(MaintenanceLog.id == log_id).first()

    def get_all(self) -> List[MaintenanceLog]:
        """
        Get all maintenance logs.
        
        Returns:
            A list of all maintenance logs
        """
        return self.db.query(MaintenanceLog).all()

    def update(self, log_id: int, log: MaintenanceLogUpdate) -> Optional[MaintenanceLog]:
        """
        Update a maintenance log.
        
        Args:
            log_id: The ID of the maintenance log to update
            log: The maintenance log data to update
            
        Returns:
            The updated maintenance log
        """
        db_log = self.get_by_id(log_id)
        if not db_log:
            return None
        
        update_data = log.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_log, key, value)
            
        self.db.commit()
        self.db.refresh(db_log)
        return db_log

    def delete(self, log_id: int) -> Optional[MaintenanceLog]:
        """
        Delete a maintenance log.
        
        Args:
            log_id: The ID of the maintenance log to delete
            
        Returns:
            True if the maintenance log was deleted successfully, False otherwise
        """
        db_log = self.get_by_id(log_id)
        if not db_log:
            return None
        self.db.delete(db_log)
        self.db.commit()
        return db_log
