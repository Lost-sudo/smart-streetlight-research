from sqlalchemy.orm import Session
from app.models.streetlight import Streetlight
from app.schemas.streetlight import StreetlightCreate, StreetlightUpdate
from fastapi import HTTPException, status

class StreetlightRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, streetlight: StreetlightCreate):
        db_streetlight = Streetlight(**streetlight.dict())
        self.db.add(db_streetlight)
        self.db.commit()
        self.db.refresh(db_streetlight)
        return db_streetlight

    def get_by_id(self, streetlight_id: int):
        return self.db.query(Streetlight).filter(Streetlight.id == streetlight_id).first()

    def get_all(self):
        return self.db.query(Streetlight).all()

    def get_by_name(self, streetlight_name: str):
        return self.db.query(Streetlight).filter(Streetlight.name == streetlight_name).first()

    def update(self, streetlight_id: int, streetlight: StreetlightUpdate):
        self.db.query(Streetlight).filter(Streetlight.id == streetlight_id).update(streetlight.dict(exclude_unset=True))
        self.db.commit()
        updated_streetlight = self.get_by_id(streetlight.id)
        return updated_streetlight

    def delete(self, streetlight_id: int):
        streetlight = self.get_by_id(streetlight_id)
        if not streetlight:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Streetlight not found")
        self.db.delete(streetlight)
        self.db.commit()
        return streetlight