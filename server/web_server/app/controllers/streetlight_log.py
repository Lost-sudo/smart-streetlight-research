from sqlalchemy.orm import Session
from app.schemas.streetlight import StreetlightLogRead, IoTNodeLogCreate
from app.services.streetlight_log import StreetlightLogService

class StreetlightLogController:
    def __init__(self, db: Session):
        self.service = StreetlightLogService(db)

    def add_log_from_iot(self, iot_log: IoTNodeLogCreate):
        """
        Add a new streetlight log from IoT data.
        
        Args:
            iot_log: The IoT data to create a streetlight log from
            
        Returns:
            The created streetlight log
        """
        return self.service.add_log_from_iot(iot_log)


    def get_streetlight_log_by_id(self, streetlight_log_id: int):
        """
        Get a streetlight log by its ID.
        
        Args:
            streetlight_log_id: The ID of the streetlight log to retrieve
            
        Returns:
            The streetlight log with the given ID
        """
        return self.service.get_streetlight_log_by_id(streetlight_log_id)

    def get_all_streetlight_logs(self):
        """
        Get all streetlight logs.
        
        Returns:
            A list of all streetlight logs
        """
        return self.service.get_all_streetlight_logs()

    def get_streetlight_logs_by_streetlight_id(self, streetlight_id: int, limit: int = 100):
        """
        Get streetlight logs by streetlight ID.
        
        Args:
            streetlight_id: The ID of the streetlight
            limit: The maximum number of logs to retrieve
            
        Returns:
            A list of streetlight logs for the given streetlight ID
        """
        return self.service.get_streetlight_logs_by_streetlight_id(streetlight_id, limit=limit)