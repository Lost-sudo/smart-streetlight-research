from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.streetlight import StreetlightLogCreate, StreetlightLogRead, IoTNodeLogCreate
from app.controllers.streetlight_log import StreetlightLogController
from app.dependencies.rbac import require_roles
from app.models.user import UserRole
from typing import List

router = APIRouter(
    prefix="/streetlight_log",
    tags=["Streetlight Log"]
)

@router.post("/telemetry", response_model=StreetlightLogRead)
def add_log_from_iot(iot_log: IoTNodeLogCreate, db: Session = Depends(get_db)):
    return StreetlightLogController(db).add_log_from_iot(iot_log=iot_log)


@router.get("/{streetlight_log_id}", dependencies=[Depends(require_roles([UserRole.admin, UserRole.operator, UserRole.technician]))], response_model=StreetlightLogRead)
def get_streetlight_log_by_id(streetlight_log_id: int, db: Session = Depends(get_db)):
    return StreetlightLogController(db).get_streetlight_log_by_id(streetlight_log_id=streetlight_log_id)

@router.get("/", dependencies=[Depends(require_roles([UserRole.admin, UserRole.operator, UserRole.technician]))], response_model=List[StreetlightLogRead])
def get_all_streetlight_logs(db: Session = Depends(get_db)):
    return StreetlightLogController(db).get_all_streetlight_logs()

@router.get("/by-streetlight/{streetlight_id}", dependencies=[Depends(require_roles([UserRole.admin, UserRole.operator, UserRole.technician]))], response_model=List[StreetlightLogRead])
def get_streetlight_logs_by_streetlight_id(streetlight_id: int, limit: int = Query(100, ge=1, le=1000), db: Session = Depends(get_db)):
    return StreetlightLogController(db).get_streetlight_logs_by_streetlight_id(streetlight_id=streetlight_id, limit=limit)