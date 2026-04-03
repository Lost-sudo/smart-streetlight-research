from sqlalchemy.orm import Session
from app.models.streetlight import MaintenanceLog
from fastapi import HTTPException, status
from app.schemas.streetlight import MaintenanceLogCreate, MaintenanceLogUpdate

class MaintenanceLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, log: MaintenanceLogCreate):
        """
        Create a new maintenance log.
        
        Args:
            log: The maintenance log data to create
            
        Returns:
            The created maintenance log
        """
        db_log = MaintenanceLog(**log.dict())
        self.db.add(db_log)
        self.db.commit()
        self.db.refresh(db_log)
        return db_log

    def get_by_id(self, log_id: int):
        """
        Get a maintenance log by its ID.
        
        Args:
            log_id: The ID of the maintenance log to retrieve
            
        Returns:
            The maintenance log with the given ID
        """
        return self.db.query(MaintenanceLog).filter(MaintenanceLog.id == log_id).first()

    def get_all(self):
        """
        Get all maintenance logs.
        
        Returns:
            A list of all maintenance logs
        """
        return self.db.query(MaintenanceLog).all()

    def update(self, log_id: int, log: MaintenanceLogUpdate):
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
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance log not found")
        
        update_data = log.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_log, key, value)
            
        self.db.commit()
        self.db.refresh(db_log)
        return db_log

    def delete(self, log_id: int):
        """
        Delete a maintenance log.
        
        Args:
            log_id: The ID of the maintenance log to delete
            
        Returns:
            True if the maintenance log was deleted successfully, False otherwise
        """
        db_log = self.get_by_id(log_id)
        if not db_log:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance log not found")
        self.db.delete(db_log)
        self.db.commit()
        return {"message": "Maintenance log deleted successfully"}
