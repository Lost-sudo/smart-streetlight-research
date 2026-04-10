from app.repositories.streetlight import StreetlightRepository
from app.schemas.streetlight import StreetlightCreate, StreetlightRead, StreetlightUpdate
from app.models.streetlight import Streetlight
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

class StreetlightService:
    def __init__(self, db: Session):
        self.streetlight_repo = StreetlightRepository(db)
    
    def get_streetlight_by_id(self, streetlight_id: int) -> Optional[Streetlight]:
        """
        Get a streetlight by its ID.
        
        Args:
            streetlight_id: The ID of the streetlight to retrieve
            
        Returns:
            The streetlight with the given ID
            
        Raises:
            HTTPException: If the streetlight with the given ID is not found
        """
        return self.streetlight_repo.get_by_id(streetlight_id=streetlight_id)

    def get_all_streetlight(self) -> List[Streetlight]:
        """
        Get all streetlights.
        
        Returns:
            A list of all streetlights
        """
        return self.streetlight_repo.get_all()

    def create_streetlight(self, streetlight_data: StreetlightCreate) -> Streetlight:
        """
        Create a new streetlight.
        
        Args:
            streetlight_data: The streetlight data to create
            
        Returns:
            The created streetlight
            
        Raises:
            HTTPException: If the streetlight with the given name already exists
        """
        is_existing = self.streetlight_repo.get_by_name(streetlight_name=streetlight_data.name)

        if is_existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Streetlight name already exists.")

        return self.streetlight_repo.create(streetlight=streetlight_data)

    def update_streetlight(self, streetlight_id: int, streetlight_data: StreetlightUpdate) -> Streetlight:
        """
        Update a streetlight.
        
        Args:
            streetlight_id: The ID of the streetlight to update
            streetlight_data: The streetlight data to update
            
        Returns:
            The updated streetlight
            
        Raises:
            HTTPException: If the streetlight with the given ID is not found
        """
        is_existing = self.get_streetlight_by_id(streetlight_id=streetlight_id)

        if not is_existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Streetlight with the given id does not exist.")

        updated = self.streetlight_repo.update(streetlight_id=streetlight_id, streetlight=streetlight_data)
        if updated is None:
            # In case the record disappeared between existence check and update.
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Streetlight with the given id does not exist.")
        return updated

    def delete_streetlight(self, streetlight_id: int) -> bool:
        """
        Delete a streetlight.
        
        Args:
            streetlight_id: The ID of the streetlight to delete
            
        Returns:
            True if the streetlight was deleted successfully, False otherwise
            
        Raises:
            HTTPException: If the streetlight with the given ID is not found
        """
        is_existing = self.get_streetlight_by_id(streetlight_id=streetlight_id)

        if not is_existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Streetlight with the given ID does not exist. Deletion terminated.")

        deleted = self.streetlight_repo.delete(streetlight_id=streetlight_id)
        if deleted is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Streetlight with the given ID does not exist. Deletion terminated.")
        return True