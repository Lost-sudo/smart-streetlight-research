from app.repositories.streetlight_log import StreetlightLogRepository
from app.repositories.streetlight import StreetlightRepository
from app.schemas.streetlight import StreetlightLogCreate, StreetlightLogRead, IoTNodeLogCreate
from app.models.streetlight import StreetlightLog
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import List

class StreetlightLogService:
    def __init__(self, db: Session):
        self.streetlight_log_repo = StreetlightLogRepository(db)
        self.streetlight_repo = StreetlightRepository(db)

    def add_log_from_iot(self, iot_log: IoTNodeLogCreate) -> StreetlightLogRead:
        streetlight = self.streetlight_repo.get_by_device_id(iot_log.device_id)
        if not streetlight:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Streetlight with device_id {iot_log.device_id} not found")
        
        log_create = StreetlightLogCreate(
            streetlight_id=streetlight.id,
            voltage=iot_log.voltage,
            current=iot_log.current,
            power_consumption=iot_log.power_consumption,
            light_intensity=iot_log.light_intensity,
            timestamp=iot_log.timestamp
        )
        return self.streetlight_log_repo.create(log_create)


    def get_streetlight_log_by_id(self, streetlight_log_id: int) -> StreetlightLogRead:
        streetlight_log = self.streetlight_log_repo.get_by_id(streetlight_log_id)
        if not streetlight_log:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Streetlight log not found")
        return streetlight_log

    def get_all_streetlight_logs(self) -> List[StreetlightLogRead]:
        return self.streetlight_log_repo.get_all()

    def get_streetlight_logs_by_streetlight_id(self, streetlight_id: int, limit: int = 100) -> List[StreetlightLogRead]:
        return self.streetlight_log_repo.get_by_streetlight_id(streetlight_id, limit=limit)