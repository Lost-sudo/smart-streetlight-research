from sqlalchemy.orm import Session
from app.schemas.streetlight import StreetlightCreate, StreetlightRead, StreetlightUpdate
from app.services.streetlight import StreetlightService

class StreetlightController:
    def __init__(self, db: Session):
        self.streetlight_service = StreetlightService(db)

    def create_streetlight(self, streetlight: StreetlightCreate) -> StreetlightRead:
        new_streetlight = self.streetlight_service.create_streetlight(streetlight_data=streetlight)
        return StreetlightRead.model_validate(new_streetlight, from_attributes=True)

    def get_streetlight_by_id(self, streetlight_id) -> StreetlightRead:
        streetlight = self.streetlight_service.get_streetlight_by_id(streetlight_id=streetlight_id)
        return StreetlightRead.model_validate(streetlight, from_attributes=True)

    def get_all_streetlight(self) -> StreetlightRead:
        streetlights = self.streetlight_service.get_all_streetlight()
        return [
            StreetlightRead.model_validate(streetlight, from_attributes=True)
            for streetlight in streetlights
        ]

    def update_streetlight(self, streetlight_id: int, streetlight_data: StreetlightUpdate) -> StreetlightRead:
        updated_streetlight = self.streetlight_service.update_streetlight(streetlight_id=streetlight_id, streetlight_data=streetlight_data)
        return StreetlightRead.model_validate(updated_streetlight, from_attributes=True)

    def delete_streetlight(self, streetlight_id: int) -> str:
        is_deleted = self.streetlight_service.delete_streetlight(streetlight_id=streetlight_id)
        return "Streetlight has been successfully deleted."
