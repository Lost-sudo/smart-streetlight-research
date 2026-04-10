from sqlalchemy.orm import Session
from app.models.streetlight import StreetlightLog
from app.schemas.streetlight import IoTNodeLogCreate
from typing import List, Optional

class StreetlightLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, streetlight_id: int, iot_log: IoTNodeLogCreate) -> StreetlightLog:
        """
        Create a new streetlight log.
        
        Args:
            streetlight_id: The ID of the streetlight
            iot_log: The IoT node log data to create
            
        Returns:
            The created streetlight log
        """
        data = iot_log.model_dump(exclude={"device_id"})
        data["streetlight_id"] = streetlight_id
        db_streetlight_log = StreetlightLog(**data)
        self.db.add(db_streetlight_log)
        self.db.commit()
        self.db.refresh(db_streetlight_log)
        return db_streetlight_log

    def get_by_id(self, streetlight_log_id: int) -> Optional[StreetlightLog]:
        """
        Get a streetlight log by its ID.
        
        Args:
            streetlight_log_id: The ID of the streetlight log to retrieve
            
        Returns:
            The streetlight log with the given ID
        """
        return self.db.query(StreetlightLog).filter(StreetlightLog.id == streetlight_log_id).first()

    def get_all(self) -> List[StreetlightLog]:
        """
        Get all streetlight logs.
        
        Returns:
            A list of all streetlight logs
        """
        return self.db.query(StreetlightLog).all()

    def get_by_streetlight_id(self, streetlight_id: int, limit: int = 100) -> List[StreetlightLog]:
        """
        Get streetlight logs by streetlight ID.
        
        Args:
            streetlight_id: The ID of the streetlight
            limit: The maximum number of logs to retrieve
            
        Returns:
            A list of streetlight logs for the given streetlight ID
        """
        return self.db.query(StreetlightLog).filter(
            StreetlightLog.streetlight_id == streetlight_id
        ).order_by(StreetlightLog.timestamp.desc()).limit(limit).all()