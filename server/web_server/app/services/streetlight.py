from app.repositories.streetlight import StreetlightRepository
from app.schemas.streetlight import StreetlightCreate, StreetlightRead, StreetlightUpdate
from app.models.streetlight import Streetlight
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import List

class StreetlightService:
    def __init__(self, db: Session):
        self.streetlight_repo = StreetlightRepository(db)
    
    def get_streetlight_by_id(self, streetlight_id: int) -> StreetlightRead:
        return self.streetlight_repo.get_by_id(streetlight_id=streetlight_id)

    def get_all_streetlight(self) -> List[StreetlightRead]:
        return self.streetlight_repo.get_all()

    def create_streetlight(self, streetlight_data: StreetlightCreate) -> StreetlightRead:
        is_existing = self.streetlight_repo.get_by_name(streetlight_name=streetlight_data.name)

        if is_existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Streetlight name already exists.")

        return self.streetlight_repo.create(streetlight=streetlight_data)

    def update_streetlight(self, streetlight_id: int, streetlight_data: StreetlightUpdate) -> StreetlightRead:
        is_existing = self.get_streetlight_by_id(streetlight_id=streetlight_id)

        if not is_existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Streetlight with the given id does not exist.")

        return self.streetlight_repo.update(streetlight_id=streetlight_id, streetlight=streetlight_data)

    def delete_streetlight(self, streetlight_id: int) -> bool:
        is_existing = self.get_streetlight_by_id(streetlight_id=streetlight_id)

        if not is_existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Streetlight with the given ID does not exist. Deletion terminated.")

        self.streetlight_repo.delete(streetlight_id=streetlight_id)
        return True