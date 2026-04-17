from sqlalchemy.orm import Session
from app.models.streetlight import Alert
from app.schemas.streetlight import AlertCreate, AlertUpdate
from typing import Optional, List

class AlertRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, alert: AlertCreate) -> Alert:
        """
        Create a new alert.
        
        Args:
            alert: The alert data to create
            
        Returns:
            The created alert
        """
        db_alert = Alert(**alert.model_dump())
        self.db.add(db_alert)
        self.db.commit()
        self.db.refresh(db_alert)
        return db_alert

    def get_by_id(self, alert_id: int) -> Optional[Alert]:
        """
        Get an alert by its ID.
        
        Args:
            alert_id: The ID of the alert to retrieve
            
        Returns:
            The alert with the given ID
        """
        return self.db.query(Alert).filter(Alert.id == alert_id).first()

    def get_all(self) -> List[Alert]:
        """
        Get all alerts.
        
        Returns:
            A list of all alerts
        """
        return self.db.query(Alert).all()

    def get_unresolved_by_streetlight_id(self, streetlight_id: int, alert_type: str = None):
        """
        Get the first unresolved alert for a streetlight, optionally filtered by type.
        """
        query = self.db.query(Alert).filter(
            Alert.streetlight_id == streetlight_id,
            Alert.is_resolved == False
        )
        if alert_type:
            query = query.filter(Alert.type == alert_type)
        return query.first()

    def get_by_alert_type(self, alert_type: str) -> List[Alert]:
        """
        Get all alerts filtered by alert_type.
        """
        return self.db.query(Alert).filter(Alert.alert_type == alert_type).all()



    def update(self, alert_id: int, alert: AlertUpdate) -> Optional[Alert]:
        """
        Update an alert.
        
        Args:
            alert_id: The ID of the alert to update
            alert: The alert data to update
            
        Returns:
            The updated alert
        """
        db_alert = self.get_by_id(alert_id)
        if not db_alert:
            return None
        db_alert.is_resolved = alert.is_resolved
        self.db.commit()
        self.db.refresh(db_alert)
        return db_alert

    def delete(self, alert_id: int) -> Optional[Alert]:
        """
        Delete an alert.
        
        Args:
            alert_id: The ID of the alert to delete
            
        Returns:
            True if the alert was deleted successfully, False otherwise
        """
        db_alert = self.get_by_id(alert_id)
        if not db_alert:
            return None
        self.db.delete(db_alert)
        self.db.commit()
        return db_alert