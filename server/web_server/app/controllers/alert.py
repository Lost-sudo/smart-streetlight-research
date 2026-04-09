from typing import List
from sqlalchemy.orm import Session
from app.schemas.streetlight import AlertCreate, AlertRead, AlertUpdate
from app.services.alert import AlertService

class AlertController:
    def __init__(self, db: Session):
        self.alert_service = AlertService(db)

    def create_alert(self, alert: AlertCreate) -> AlertRead:
        """
        Create a new alert.
        
        Args:
            alert: The alert data to create
            
        Returns:
            The created alert
        """
        new_alert = self.alert_service.create_alert(alert)
        return AlertRead.model_validate(new_alert, from_attributes=True)

    def get_alert_by_id(self, alert_id: int) -> AlertRead:
        """
        Get an alert by its ID.
        
        Args:
            alert_id: The ID of the alert to retrieve
            
        Returns:
            The alert with the given ID
        """
        alert = self.alert_service.get_alert_by_id(alert_id=alert_id)
        return AlertRead.model_validate(alert, from_attributes=True)

    def get_all_alerts(self) -> List[AlertRead]:
        """
        Get all alerts.
        
        Returns:
            A list of all alerts
        """
        alerts = self.alert_service.get_all_alerts()
        return [AlertRead.model_validate(a, from_attributes=True) for a in alerts]

    def get_alerts_by_type(self, alert_type: str) -> List[AlertRead]:
        """
        Get all alerts filtered by alert_type.
        
        Args:
            alert_type: FAULT or PREDICTIVE
            
        Returns:
            A list of filtered alerts
        """
        alerts = self.alert_service.get_alerts_by_type(alert_type)
        return [AlertRead.model_validate(a, from_attributes=True) for a in alerts]

    def update_alert(self, alert_id: int, alert: AlertUpdate) -> AlertRead:
        """
        Update an alert.
        
        Args:
            alert_id: The ID of the alert to update
            alert: The alert data to update
            
        Returns:
            The updated alert
        """
        updated_alert = self.alert_service.update_alert(alert_id=alert_id, alert=alert)
        return AlertRead.model_validate(updated_alert, from_attributes=True)

    def delete_alert(self, alert_id: int) -> str:
        """
        Delete an alert.
        
        Args:
            alert_id: The ID of the alert to delete
            
        Returns:
            A success message
        """
        self.alert_service.delete_alert(alert_id=alert_id)
        return "Alert has been successfully deleted."
