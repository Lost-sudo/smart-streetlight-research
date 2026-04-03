from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.streetlight import StreetlightCreate, StreetlightRead, StreetlightUpdate
from app.controllers.streetlight import StreetlightController
from app.dependencies.rbac import require_roles
from app.models.user import UserRole
from typing import List

router = APIRouter(
    prefix="/streetlight",
    tags=["Streetlight"]
)

def get_streetlight_controller(db: Session = Depends(get_db)):
    return StreetlightController(db)

@router.post("/create", dependencies=[Depends(require_roles([UserRole.admin, UserRole.operator]))], response_model=StreetlightRead)
def create_streetlight(streetlight: StreetlightCreate, controller: StreetlightController = Depends(get_streetlight_controller)):
    return controller.create_streetlight(streetlight=streetlight)

@router.get("/{streetlight_id}", dependencies=[Depends(require_roles([UserRole.admin, UserRole.operator, UserRole.technician]))], response_model=StreetlightRead)
def get_streetlight_by_id(streetlight_id: int, controller: StreetlightController = Depends(get_streetlight_controller)):
    return controller.get_streetlight_by_id(streetlight_id=streetlight_id)

@router.get("/", dependencies=[Depends(require_roles([UserRole.admin, UserRole.operator, UserRole.technician]))], response_model=List[StreetlightRead])
def get_all_streetlight(controller: StreetlightController = Depends(get_streetlight_controller)):
    return controller.get_all_streetlight()

@router.put("/{streetlight_id}", dependencies=[Depends(require_roles([UserRole.admin]))], response_model=StreetlightRead)
def update_streetlight(streetlight_id: int, streetlight_data: StreetlightUpdate, controller: StreetlightController = Depends(get_streetlight_controller)):
    return controller.update_streetlight(streetlight_id=streetlight_id, streetlight_data=streetlight_data)

@router.delete("/{streetlight_id}", dependencies=[Depends(require_roles([UserRole.admin]))])
def delete_streetlight(streetlight_id: int, controller: StreetlightController = Depends(get_streetlight_controller)):
    return controller.delete_streetlight(streetlight_id=streetlight_id)
