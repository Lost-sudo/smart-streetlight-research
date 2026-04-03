from sqlalchemy.orm import Session
from app.models.streetlight import Streetlight
from app.schemas.streetlight import StreetlightCreate, StreetlightUpdate
from fastapi import HTTPException, status

class StreetlightRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, streetlight: StreetlightCreate):
        """
        Create a new streetlight.
        
        Args:
            streetlight: The streetlight data to create
            
        Returns:
            The created streetlight
        """
        db_streetlight = Streetlight(**streetlight.dict())
        self.db.add(db_streetlight)
        self.db.commit()
        self.db.refresh(db_streetlight)
        return db_streetlight

    def get_by_id(self, streetlight_id: int):
        """
        Get a streetlight by its ID.
        
        Args:
            streetlight_id: The ID of the streetlight to retrieve
            
        Returns:
            The streetlight with the given ID
        """
        return self.db.query(Streetlight).filter(Streetlight.id == streetlight_id).first()

    def get_all(self):
        """
        Get all streetlights.
        
        Returns:
            A list of all streetlights
        """
        return self.db.query(Streetlight).all()

    def get_by_name(self, streetlight_name: str):
        """
        Get a streetlight by its name.
        
        Args:
            streetlight_name: The name of the streetlight to retrieve
            
        Returns:
            The streetlight with the given name
        """
        return self.db.query(Streetlight).filter(Streetlight.name == streetlight_name).first()

    def get_by_device_id(self, device_id: str):
        """
        Get a streetlight by its device ID.
        
        Args:
            device_id: The device ID of the streetlight to retrieve
            
        Returns:
            The streetlight with the given device ID
        """
        return self.db.query(Streetlight).filter(Streetlight.device_id == device_id).first()

    def update(self, streetlight_id: int, streetlight: StreetlightUpdate):
        """
        Update a streetlight.
        
        Args:
            streetlight_id: The ID of the streetlight to update
            streetlight: The streetlight data to update
            
        Returns:
            The updated streetlight
        """
        self.db.query(Streetlight).filter(Streetlight.id == streetlight_id).update(streetlight.dict(exclude_unset=True))
        self.db.commit()
        updated_streetlight = self.get_by_id(streetlight_id)
        return updated_streetlight

    def delete(self, streetlight_id: int):
        """
        Delete a streetlight.
        
        Args:
            streetlight_id: The ID of the streetlight to delete
            
        Returns:
            True if the streetlight was deleted successfully, False otherwise
        """
        streetlight = self.get_by_id(streetlight_id)
        if not streetlight:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Streetlight not found")
        self.db.delete(streetlight)
        self.db.commit()
        return streetlight