from sqlalchemy.orm import Session
from app.repositories.alert import AlertRepository
from app.schemas.streetlight import AlertCreate, AlertUpdate

class AlertService:
    def __init__(self, db: Session):
        self.alert_repo = AlertRepository(db)

    def create_alert(self, alert: AlertCreate):
        return self.alert_repo.create(alert)

    def get_alert_by_id(self, alert_id: int):
        return self.alert_repo.get_by_id(alert_id)

    def get_all_alerts(self):
        return self.alert_repo.get_all()

    def update_alert(self, alert_id: int, alert: AlertUpdate):
        return self.alert_repo.update(alert_id, alert)

    def delete_alert(self, alert_id: int):
        return self.alert_repo.delete(alert_id)
