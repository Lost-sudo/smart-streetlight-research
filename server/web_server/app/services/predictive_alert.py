from sqlalchemy.orm import Session
from app.repositories.predictive_alert import PredictiveAlertRepository
from app.schemas.predictive_alert import PredictiveAlertCreate, PredictiveAlertUpdate
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
            # ESCALATION LOGIC: If alert is still unresolved, upgrade urgency over time
            from datetime import datetime, timedelta
            time_elapsed = datetime.utcnow() - existing_alert.created_at
            current_urgency = str(existing_alert.urgency.value) if hasattr(existing_alert.urgency, "value") else str(existing_alert.urgency)
            
            new_urgency = alert_in.urgency
            
            # Escalate Medium -> High after 24 hours
            if current_urgency == "medium" and time_elapsed > timedelta(hours=24):
                new_urgency = "high"
            # Escalate High -> Critical after 3 days
            elif current_urgency == "high" and time_elapsed > timedelta(days=3):
                new_urgency = "critical"
            
            # NOISE REDUCTION: Only update if urgency changed OR if enough time has passed (e.g. 1 hour)
            urgency_changed = new_urgency != current_urgency
            time_to_refresh = (datetime.utcnow() - existing_alert.created_at) > timedelta(hours=1)
            
            if urgency_changed or time_to_refresh:
                update_data = PredictiveAlertUpdate(
                    urgency=new_urgency,
                    message=alert_in.message
                )
                return self.alert_repo.update(existing_alert.id, update_data)
            
            return existing_alert
            
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
