from sqlalchemy.orm import Session
from app.services.predictive_alert import PredictiveAlertService
from app.schemas.predictive_alert import PredictiveAlertCreate, PredictiveAlertUpdate

class PredictiveAlertController:
    def __init__(self, db: Session):
        self.service = PredictiveAlertService(db)

    def create_alert(self, alert_in: PredictiveAlertCreate):
        return self.service.create_alert(alert_in)

    def get_alert_by_id(self, alert_id: int):
        return self.service.get_alert(alert_id)

    def get_all_alerts(self, skip: int = 0, limit: int = 100):
        return self.service.get_all_alerts(skip, limit)

    def resolve_alert(self, alert_id: int):
        return self.service.resolve_alert(alert_id)
