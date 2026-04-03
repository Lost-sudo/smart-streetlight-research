from app.repositories.streetlight_log import StreetlightLogRepository
from app.repositories.streetlight import StreetlightRepository
from app.schemas.streetlight import StreetlightLogRead, IoTNodeLogCreate
from app.models.streetlight import StreetlightLog
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import List

class StreetlightLogService:
    def __init__(self, db: Session):
        self.streetlight_log_repo = StreetlightLogRepository(db)
        self.streetlight_repo = StreetlightRepository(db)

    def add_log_from_iot(self, iot_log: IoTNodeLogCreate) -> StreetlightLogRead:
        """
        Add a new streetlight log from an IoT node.
        
        Args:
            iot_log: The IoT node log to add
            
        Returns:
            The created streetlight log
            
        Raises:
            HTTPException: If the streetlight with the given device_id is not found
        """
        streetlight = self.streetlight_repo.get_by_device_id(iot_log.device_id)
        if not streetlight:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Streetlight with device_id {iot_log.device_id} not found")
        
        return self.streetlight_log_repo.create(streetlight.id, iot_log)


    def get_streetlight_log_by_id(self, streetlight_log_id: int) -> StreetlightLogRead:
        """
        Get a streetlight log by its ID.
        
        Args:
            streetlight_log_id: The ID of the streetlight log to retrieve
            
        Returns:
            The streetlight log with the given ID
            
        Raises:
            HTTPException: If the streetlight log with the given ID is not found
        """
        streetlight_log = self.streetlight_log_repo.get_by_id(streetlight_log_id)
        if not streetlight_log:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Streetlight log not found")
        return streetlight_log

    def get_all_streetlight_logs(self) -> List[StreetlightLogRead]:
        """
        Get all streetlight logs.
        
        Returns:
            A list of all streetlight logs
        """
        return self.streetlight_log_repo.get_all()

    def get_streetlight_logs_by_streetlight_id(self, streetlight_id: int, limit: int = 100) -> List[StreetlightLogRead]:
        """
        Get streetlight logs by streetlight ID.
        
        Args:
            streetlight_id: The ID of the streetlight
            limit: The maximum number of logs to retrieve
            
        Returns:
            A list of streetlight logs for the given streetlight ID
        """
        return self.streetlight_log_repo.get_by_streetlight_id(streetlight_id, limit=limit)