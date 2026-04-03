from sqlalchemy.orm import Session
from app.models.streetlight import Alert
from fastapi import HTTPException, status
from app.schemas.streetlight import AlertCreate, AlertRead, AlertUpdate

class AlertRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, alert: AlertCreate):
        db_alert = Alert(**alert.dict())
        self.db.add(db_alert)
        self.db.commit()
        self.db.refresh(db_alert)
        return db_alert

    def get_by_id(self, alert_id: int):
        return self.db.query(Alert).filter(Alert.id == alert_id).first()

    def get_all(self):
        return self.db.query(Alert).all()

    def update(self, alert_id: int, alert: AlertUpdate):
        db_alert = self.get_by_id(alert_id)
        if not db_alert:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
        db_alert.is_resolved = alert.is_resolved
        self.db.commit()
        self.db.refresh(db_alert)
        return db_alert

    def delete(self, alert_id: int):
        db_alert = self.get_by_id(alert_id)
        if not db_alert:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
        self.db.delete(db_alert)
        self.db.commit()
        return {"message": "Alert deleted successfully"}