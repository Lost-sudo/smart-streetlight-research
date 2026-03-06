from sqlalchemy.orm import Session
from app.models.streetlight import StreetlightLog
from fastapi import HTTPException, status
from app.schemas.streetlight import StreetlightLogCreate, StreetlightLogRead

class StreetlightLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, streetlight_log: StreetlightLogCreate):
        db_streetlight_log = StreetlightLog(**streetlight_log.dict())
        self.db.add(db_streetlight_log)
        self.db.commit()
        self.db.refresh(db_streetlight_log)
        return db_streetlight_log

    def get_by_id(self, streetlight_log_id: int):
        return self.db.query(StreetlightLog).filter(StreetlightLog.id == streetlight_log_id).first()

    def get_all(self):
        return self.db.query(StreetlightLog).all()
