from app.repositories.streetlight_log import StreetlightLogRepository
from app.schemas.streetlight import StreetlightLogCreate, StreetlightLogRead
from app.models.streetlight import StreetlightLog
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import List

class StreetlightLogService:
    def __init__(self, db: Session):
        self.streetlight_log_repo = StreetlightLogRepository(db)

    def create_streetlight_log(self, streetlight_log: StreetlightLogCreate) -> StreetlightLogRead:
        return self.streetlight_log_repo.create(streetlight_log)

    def get_streetlight_log_by_id(self, streetlight_log_id: int) -> StreetlightLogRead:
        streetlight_log = self.streetlight_log_repo.get_by_id(streetlight_log_id)
        if not streetlight_log:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Streetlight log not found")
        return streetlight_log

    def get_all_streetlight_logs(self) -> List[StreetlightLogRead]:
        return self.streetlight_log_repo.get_all()

    def get_streetlight_logs_by_streetlight_id(self, streetlight_id: int, limit: int = 100) -> List[StreetlightLogRead]:
        return self.streetlight_log_repo.get_by_streetlight_id(streetlight_id, limit=limit)