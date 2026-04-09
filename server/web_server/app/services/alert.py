from sqlalchemy.orm import Session
from app.repositories.alert import AlertRepository
from app.schemas.streetlight import AlertCreate, AlertUpdate

class AlertService:
    def __init__(self, db: Session):
        self.alert_repo = AlertRepository(db)

    def create_alert(self, alert: AlertCreate):
        """
        Create a new alert.
        
        Args:
            alert: The alert data to create
            
        Returns:
            The created alert
        """
        return self.alert_repo.create(alert)

    def get_alert_by_id(self, alert_id: int):
        """
        Get an alert by its ID.
        
        Args:
            alert_id: The ID of the alert to retrieve
            
        Returns:
            The alert with the given ID
        """
        return self.alert_repo.get_by_id(alert_id)

    def get_all_alerts(self):
        """
        Get all alerts.
        
        Returns:
            A list of all alerts
        """
        return self.alert_repo.get_all()

    def get_alerts_by_type(self, alert_type: str):
        """
        Get all alerts filtered by alert_type (FAULT or PREDICTIVE).
        
        Args:
            alert_type: The alert type to filter by
            
        Returns:
            A list of alerts of the specified type
        """
        return self.alert_repo.get_by_alert_type(alert_type)

    def update_alert(self, alert_id: int, alert: AlertUpdate):
        """
        Update an alert.
        
        Args:
            alert_id: The ID of the alert to update
            alert: The alert data to update
            
        Returns:
            The updated alert
        """
        return self.alert_repo.update(alert_id, alert)

    def delete_alert(self, alert_id: int):
        """
        Delete an alert.
        
        Args:
            alert_id: The ID of the alert to delete
            
        Returns:
            True if the alert was deleted successfully, False otherwise
        """
        return self.alert_repo.delete(alert_id)
