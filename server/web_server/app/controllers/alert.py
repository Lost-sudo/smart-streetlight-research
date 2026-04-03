from typing import List
from sqlalchemy.orm import Session
from app.schemas.streetlight import AlertCreate, AlertRead, AlertUpdate
from app.services.alert import AlertService

class AlertController:
    def __init__(self, db: Session):
        self.alert_service = AlertService(db)

    def create_alert(self, alert: AlertCreate) -> AlertRead:
        new_alert = self.alert_service.create_alert(alert)
        return AlertRead.model_validate(new_alert, from_attributes=True)

    def get_alert_by_id(self, alert_id: int) -> AlertRead:
        alert = self.alert_service.get_alert_by_id(alert_id=alert_id)
        return AlertRead.model_validate(alert, from_attributes=True)

    def get_all_alerts(self) -> List[AlertRead]:
        alerts = self.alert_service.get_all_alerts()
        return [AlertRead.model_validate(a, from_attributes=True) for a in alerts]

    def update_alert(self, alert_id: int, alert: AlertUpdate) -> AlertRead:
        updated_alert = self.alert_service.update_alert(alert_id=alert_id, alert=alert)
        return AlertRead.model_validate(updated_alert, from_attributes=True)

    def delete_alert(self, alert_id: int) -> str:
        self.alert_service.delete_alert(alert_id=alert_id)
        return "Alert has been successfully deleted."
