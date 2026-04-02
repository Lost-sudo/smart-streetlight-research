from typing import List
from sqlalchemy.orm import Session
from app.schemas.streetlight import StreetlightCreate, StreetlightRead, StreetlightUpdate
from app.services.streetlight import StreetlightService

class StreetlightController:
    def __init__(self, db: Session):
        self.streetlight_service = StreetlightService(db)

    def _map_to_db_status(self, status: str) -> str:
        if not status:
            return status
        mapping = {"Normal": "active", "Faulty": "faulty"}
        return mapping.get(status, status)
        
    def _map_from_db_status(self, status) -> str:
        if not status:
            return status
        val = status.value if hasattr(status, 'value') else status
        mapping = {"active": "Normal", "faulty": "Faulty"}
        return mapping.get(val, val)

    def create_streetlight(self, streetlight: StreetlightCreate) -> StreetlightRead:
        streetlight.status = self._map_to_db_status(streetlight.status)
        new_streetlight = self.streetlight_service.create_streetlight(streetlight_data=streetlight)
        res = StreetlightRead.model_validate(new_streetlight, from_attributes=True)
        res.status = self._map_from_db_status(new_streetlight.status)
        return res

    def get_streetlight_by_id(self, streetlight_id) -> StreetlightRead:
        streetlight = self.streetlight_service.get_streetlight_by_id(streetlight_id=streetlight_id)
        res = StreetlightRead.model_validate(streetlight, from_attributes=True)
        res.status = self._map_from_db_status(streetlight.status)
        return res

    def get_all_streetlight(self) -> List[StreetlightRead]:
        streetlights = self.streetlight_service.get_all_streetlight()
        results = []
        for sl in streetlights:
            res = StreetlightRead.model_validate(sl, from_attributes=True)
            res.status = self._map_from_db_status(sl.status)
            results.append(res)
        return results

    def update_streetlight(self, streetlight_id: int, streetlight_data: StreetlightUpdate) -> StreetlightRead:
        if streetlight_data.status:
            streetlight_data.status = self._map_to_db_status(streetlight_data.status)
        updated_streetlight = self.streetlight_service.update_streetlight(streetlight_id=streetlight_id, streetlight_data=streetlight_data)
        res = StreetlightRead.model_validate(updated_streetlight, from_attributes=True)
        res.status = self._map_from_db_status(updated_streetlight.status)
        return res

    def delete_streetlight(self, streetlight_id: int) -> str:
        self.streetlight_service.delete_streetlight(streetlight_id=streetlight_id)
        return "Streetlight has been successfully deleted."
