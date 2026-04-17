from sqlalchemy.orm import Session
from app.models.predictive_maintenance_alert import PredictiveMaintenanceAlert
from app.schemas.predictive_alert import PredictiveAlertCreate, PredictiveAlertUpdate
from typing import List, Optional

class PredictiveAlertRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, alert_in: PredictiveAlertCreate) -> PredictiveMaintenanceAlert:
        db_alert = PredictiveMaintenanceAlert(**alert_in.model_dump())
        self.db.add(db_alert)
        self.db.commit()
        self.db.refresh(db_alert)
        return db_alert

    def get_by_id(self, alert_id: int) -> Optional[PredictiveMaintenanceAlert]:
        return self.db.query(PredictiveMaintenanceAlert).filter(PredictiveMaintenanceAlert.id == alert_id).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[PredictiveMaintenanceAlert]:
        return self.db.query(PredictiveMaintenanceAlert).offset(skip).limit(limit).all()

    def get_active_by_streetlight(self, streetlight_id: int) -> Optional[PredictiveMaintenanceAlert]:
        return self.db.query(PredictiveMaintenanceAlert).filter(
            PredictiveMaintenanceAlert.streetlight_id == streetlight_id,
            PredictiveMaintenanceAlert.is_resolved == False
        ).first()

    def update(self, alert_id: int, alert_in: PredictiveAlertUpdate) -> Optional[PredictiveMaintenanceAlert]:
        db_alert = self.get_by_id(alert_id)
        if not db_alert:
            return None
        
        update_data = alert_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_alert, field, value)
            
        self.db.commit()
        self.db.refresh(db_alert)
        return db_alert

    def delete(self, alert_id: int) -> bool:
        db_alert = self.get_by_id(alert_id)
        if not db_alert:
            return False
        self.db.delete(db_alert)
        self.db.commit()
        return True
