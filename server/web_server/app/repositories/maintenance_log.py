from sqlalchemy.orm import Session
from app.models.streetlight import MaintenanceLog
from fastapi import HTTPException, status
from app.schemas.streetlight import MaintenanceLogCreate, MaintenanceLogUpdate

class MaintenanceLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, log: MaintenanceLogCreate):
        db_log = MaintenanceLog(**log.dict())
        self.db.add(db_log)
        self.db.commit()
        self.db.refresh(db_log)
        return db_log

    def get_by_id(self, log_id: int):
        return self.db.query(MaintenanceLog).filter(MaintenanceLog.id == log_id).first()

    def get_all(self):
        return self.db.query(MaintenanceLog).all()

    def update(self, log_id: int, log: MaintenanceLogUpdate):
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
        db_log = self.get_by_id(log_id)
        if not db_log:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance log not found")
        self.db.delete(db_log)
        self.db.commit()
        return {"message": "Maintenance log deleted successfully"}
