from typing import List
from sqlalchemy.orm import Session
from app.schemas.streetlight import StreetlightCreate, StreetlightRead, StreetlightUpdate
from app.services.streetlight import StreetlightService
from fastapi import HTTPException, status

class StreetlightController:
    def __init__(self, db: Session):
        """
        Initialize the StreetlightController.
        
        Args:
            db: The database session
        """
        self.streetlight_service = StreetlightService(db)

    def create_streetlight(self, streetlight: StreetlightCreate) -> StreetlightRead:
        """
        Create a new streetlight.
        
        Args:
            streetlight: The streetlight data to create
            
        Returns:
            The created streetlight
        """
        new_streetlight = self.streetlight_service.create_streetlight(streetlight_data=streetlight)
        return StreetlightRead.model_validate(new_streetlight, from_attributes=True)

    def get_streetlight_by_id(self, streetlight_id: int) -> StreetlightRead:
        """
        Get a streetlight by its ID.
        
        Args:
            streetlight_id: The ID of the streetlight to retrieve
            
        Returns:
            The streetlight with the given ID
        """
        streetlight = self.streetlight_service.get_streetlight_by_id(streetlight_id=streetlight_id)
        if not streetlight:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Streetlight not found")
        sl_data = StreetlightRead.model_validate(streetlight, from_attributes=True)
        sl_data.has_telemetry = len(streetlight.logs) > 0
        return sl_data

    def get_all_streetlight(self) -> List[StreetlightRead]:
        """
        Get all streetlights.
        
        Returns:
            A list of all streetlights
        """
        streetlights = self.streetlight_service.get_all_streetlight()
        results = []
        for sl in streetlights:
            sl_data = StreetlightRead.model_validate(sl, from_attributes=True)
            sl_data.has_telemetry = len(sl.logs) > 0
            results.append(sl_data)
        return results

    def update_streetlight(self, streetlight_id: int, streetlight_data: StreetlightUpdate) -> StreetlightRead:
        """
        Update a streetlight.
        
        Args:
            streetlight_id: The ID of the streetlight to update
            streetlight_data: The streetlight data to update
            
        Returns:
            The updated streetlight
        """
        updated_streetlight = self.streetlight_service.update_streetlight(streetlight_id=streetlight_id, streetlight_data=streetlight_data)
        return StreetlightRead.model_validate(updated_streetlight, from_attributes=True)

    def delete_streetlight(self, streetlight_id: int) -> str:
        """
        Delete a streetlight.
        
        Args:
            streetlight_id: The ID of the streetlight to delete
            
        Returns:
            A success message
        """
        self.streetlight_service.delete_streetlight(streetlight_id=streetlight_id)
        return {"message": "Streetlight has been successfully deleted."}
