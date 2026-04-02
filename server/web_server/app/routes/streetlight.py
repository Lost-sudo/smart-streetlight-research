from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.streetlight import StreetlightCreate, StreetlightRead, StreetlightUpdate
from app.controllers.streetlight import StreetlightController
from app.dependencies.rbac import require_roles
from app.models.user import UserRole

router = APIRouter(
    prefix="/streetlight",
    tags=["Streetlight"]
)

@router.post("/create", dependencies=[Depends(require_roles([UserRole.admin, UserRole.operator]))], response_model=StreetlightRead)
def create_streetlight(streetlight: StreetlightCreate, db: Session = Depends(get_db)):
    return StreetlightController(db).create_streetlight(streetlight=streetlight)

@router.get("/{streetlight_id}", dependencies=[Depends(require_roles([UserRole.admin, UserRole.operator, UserRole.technician]))], response_model=StreetlightRead)
def get_streetlight_by_id(streetlight_id: int, db: Session = Depends(get_db)):
    return StreetlightController(db).get_streetlight_by_id(streetlight_id=streetlight_id)

from typing import List

@router.get("/", dependencies=[Depends(require_roles([UserRole.admin, UserRole.operator, UserRole.technician]))], response_model=List[StreetlightRead])
def get_all_streetlight(db: Session = Depends(get_db)):
    return StreetlightController(db).get_all_streetlight()

@router.put("/{streetlight_id}", dependencies=[Depends(require_roles([UserRole.admin]))], response_model=StreetlightRead)
def update_streetlight(streetlight_id: int, streetlight_data: StreetlightUpdate, db: Session = Depends(get_db)):
    return StreetlightController(db).update_streetlight(streetlight_id=streetlight_id, streetlight_data=streetlight_data)

@router.delete("/{streetlight_id}", dependencies=[Depends(require_roles([UserRole.admin]))])
def delete_streetlight(streetlight_id: int, db: Session = Depends(get_db)):
    return StreetlightController(db).delete_streetlight(streetlight_id=streetlight_id)
