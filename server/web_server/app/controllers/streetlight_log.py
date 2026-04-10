from sqlalchemy.orm import Session
from app.schemas.streetlight import StreetlightLogRead, IoTNodeLogCreate
from app.services.streetlight_log import StreetlightLogService

class StreetlightLogController:
    def __init__(self, db: Session):
        self.service = StreetlightLogService(db)

    def add_log_from_iot(self, iot_log: IoTNodeLogCreate) -> StreetlightLogRead:
        """
        Add a new streetlight log from IoT data.
        
        Args:
            iot_log: The IoT data to create a streetlight log from
            
        Returns:
            The created streetlight log
        """
        created = self.service.add_log_from_iot(iot_log)
        return StreetlightLogRead.model_validate(created, from_attributes=True)


    def get_streetlight_log_by_id(self, streetlight_log_id: int) -> StreetlightLogRead:
        """
        Get a streetlight log by its ID.
        
        Args:
            streetlight_log_id: The ID of the streetlight log to retrieve
            
        Returns:
            The streetlight log with the given ID
        """
        log = self.service.get_streetlight_log_by_id(streetlight_log_id)
        return StreetlightLogRead.model_validate(log, from_attributes=True)

    def get_all_streetlight_logs(self) -> list[StreetlightLogRead]:
        """
        Get all streetlight logs.
        
        Returns:
            A list of all streetlight logs
        """
        logs = self.service.get_all_streetlight_logs()
        return [StreetlightLogRead.model_validate(l, from_attributes=True) for l in logs]

    def get_streetlight_logs_by_streetlight_id(self, streetlight_id: int, limit: int = 100) -> list[StreetlightLogRead]:
        """
        Get streetlight logs by streetlight ID.
        
        Args:
            streetlight_id: The ID of the streetlight
            limit: The maximum number of logs to retrieve
            
        Returns:
            A list of streetlight logs for the given streetlight ID
        """
        logs = self.service.get_streetlight_logs_by_streetlight_id(streetlight_id, limit=limit)
        return [StreetlightLogRead.model_validate(l, from_attributes=True) for l in logs]