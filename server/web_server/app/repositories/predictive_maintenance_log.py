from sqlalchemy.orm import Session
from app.models.streetlight import PredictiveMaintenance
from app.schemas.streetlight import PredictiveMaintenanceCreate, PredictiveMaintenanceUpdate
from datetime import datetime
from typing import Optional, List

class PredictiveMaintenanceRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, log: PredictiveMaintenanceCreate) -> PredictiveMaintenance:
        """
        Create a new predictive maintenance log.
        
        Args:
            log: The predictive maintenance log data to create
            
        Returns:
            The created predictive maintenance log
        """
        db_log = PredictiveMaintenance(**log.model_dump())
        self.db.add(db_log)
        self.db.commit()
        self.db.refresh(db_log)
        return db_log

    def get_by_id(self, log_id: int) -> Optional[PredictiveMaintenance]:
        """
        Get a predictive maintenance log by its ID.
        
        Args:
            log_id: The ID of the predictive maintenance log to retrieve
            
        Returns:
            The predictive maintenance log with the given ID
        """
        return self.db.query(PredictiveMaintenance).filter(PredictiveMaintenance.id == log_id).first()

    def get_by_streetlight_id(self, streetlight_id: int) -> Optional[PredictiveMaintenance]:
        """
        Get a predictive maintenance log by its streetlight ID.
        
        Args:
            streetlight_id: The ID of the streetlight
            
        Returns:
            The predictive maintenance log for the given streetlight
        """
        return self.db.query(PredictiveMaintenance).filter(PredictiveMaintenance.streetlight_id == streetlight_id).first()

    def get_all(self) -> List[PredictiveMaintenance]:
        """
        Get all predictive maintenance logs.
        
        Returns:
            A list of all predictive maintenance logs
        """
        return self.db.query(PredictiveMaintenance).all()

    def update(self, log_id: int, log: PredictiveMaintenanceUpdate) -> Optional[PredictiveMaintenance]:
        """
        Update a predictive maintenance log.
        
        Args:
            log_id: The ID of the predictive maintenance log to update
            log: The predictive maintenance log data to update
            
        Returns:
            The updated predictive maintenance log
        """
        db_log = self.get_by_id(log_id)
        if not db_log:
            return None
        
        update_data = log.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_log, key, value)
            
        db_log.last_updated = datetime.utcnow()
            
        self.db.commit()
        self.db.refresh(db_log)
        return db_log

    def delete(self, log_id: int) -> Optional[PredictiveMaintenance]:
        """
        Delete a predictive maintenance log.
        
        Args:
            log_id: The ID of the predictive maintenance log to delete
            
        Returns:
            True if the predictive maintenance log was deleted successfully, False otherwise
        """
        db_log = self.get_by_id(log_id)
        if not db_log:
            return None
        self.db.delete(db_log)
        self.db.commit()
        return db_log