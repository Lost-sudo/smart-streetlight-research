from sqlalchemy.orm import Session
from app.repositories.predictive_alert import PredictiveAlertRepository
from app.schemas.predictive_alert import PredictiveAlertCreate, PredictiveAlertUpdate
from app.models.streetlight import UrgencyLevel
from fastapi import HTTPException, status

class PredictiveAlertService:
    def __init__(self, db: Session):
        self.alert_repo = PredictiveAlertRepository(db)

    def create_alert(self, alert_in: PredictiveAlertCreate):
        """
        Creates a new predictive alert ONLY if there isn't already an unresolved one
        for this streetlight.
        """
        existing_alert = self.alert_repo.get_active_by_streetlight(alert_in.streetlight_id)
        if existing_alert:
            # We already have an active alert. We could return it or update it.
            # For now, we will just update the message/urgency if necessary.
            update_data = PredictiveAlertUpdate(
                urgency=alert_in.urgency,
                message=alert_in.message
            )
            return self.alert_repo.update(existing_alert.id, update_data)
            
        return self.alert_repo.create(alert_in)

    def get_alert(self, alert_id: int):
        alert = self.alert_repo.get_by_id(alert_id)
        if not alert:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Predictive alert not found")
        return alert

    def get_all_alerts(self, skip: int = 0, limit: int = 100):
        return self.alert_repo.get_all(skip=skip, limit=limit)

    def resolve_alert(self, alert_id: int):
        update_data = PredictiveAlertUpdate(is_resolved=True)
        updated = self.alert_repo.update(alert_id, update_data)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Predictive alert not found")
        return updated
