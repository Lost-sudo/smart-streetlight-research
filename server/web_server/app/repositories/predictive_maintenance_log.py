from sqlalchemy.orm import Session
from app.models.streetlight import PredictiveMaintenance
from fastapi import HTTPException
from app.schemas.streetlight import PredictiveMaintenanceCreate, PredictiveMaintenanceRead, PredictiveMaintenanceUpdate

class PredictiveMaintenanceRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, log: PredictiveMaintenanceCreate):
        db_log = PredictiveMaintenance(**log.dict())
        self.db.add(db_log)
        self.db.commit()
        self.db.refresh(db_log)
        return db_log

    def get_by_id(self, log_id: int):
        return self.db.query(PredictiveMaintenance).filter(PredictiveMaintenance.id == log_id).first()

    def get_all(self):
        return self.db.query(PredictiveMaintenance).all()

    def update(self, log_id: int, log: PredictiveMaintenanceUpdate):
        db_log = self.get_by_id(log_id)
        if not db_log:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Predictive maintenance log not found")
        
        update_data = log.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_log, key, value)
            
        self.db.commit()
        self.db.refresh(db_log)
        return db_log

    def delete(self, log_id: int):
        db_log = self.get_by_id(log_id)
        if not db_log:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Predictive maintenance log not found")
        self.db.delete(db_log)
        self.db.commit()
        return {"message": "Predictive maintenance log deleted successfully"}