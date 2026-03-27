from sqlalchemy.orm import Session
from app.schemas.streetlight import StreetlightLogCreate, StreetlightLogRead
from app.services.streetlight_log import StreetlightLogService

class StreetlightLogController:
    def __init__(self, db: Session):
        self.service = StreetlightLogService(db)

    def create_streetlight_log(self, streetlight_log: StreetlightLogCreate):
        return self.service.create_streetlight_log(streetlight_log)

    def get_streetlight_log_by_id(self, streetlight_log_id: int):
        return self.service.get_streetlight_log_by_id(streetlight_log_id)

    def get_all_streetlight_logs(self):
        return self.service.get_all_streetlight_logs()

    def get_streetlight_logs_by_streetlight_id(self, streetlight_id: int, limit: int = 100):
        return self.service.get_streetlight_logs_by_streetlight_id(streetlight_id, limit=limit)