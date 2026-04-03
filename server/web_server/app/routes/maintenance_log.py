from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.controllers.maintenance_log import MaintenanceLogController
from app.core.database import get_db
from app.schemas.streetlight import MaintenanceLogCreate, MaintenanceLogRead, MaintenanceLogUpdate
from app.dependencies.rbac import require_roles
from app.models.user import UserRole
from typing import List

router = APIRouter(
    prefix="/maintenance",
    tags=["Maintenance Log"]
)

def get_maintenance_log_controller(db: Session = Depends(get_db)):
    return MaintenanceLogController(db)

@router.post("/", dependencies=[Depends(require_roles([UserRole.admin, UserRole.operator, UserRole.technician]))], response_model=MaintenanceLogRead)
def create_log(log: MaintenanceLogCreate, controller: MaintenanceLogController = Depends(get_maintenance_log_controller)):
    return controller.create_log(log)

@router.get("/{log_id}", dependencies=[Depends(require_roles([UserRole.admin, UserRole.operator, UserRole.technician]))], response_model=MaintenanceLogRead)
def get_log(log_id: int, controller: MaintenanceLogController = Depends(get_maintenance_log_controller)):
    return controller.get_log_by_id(log_id)

@router.get("/", dependencies=[Depends(require_roles([UserRole.admin, UserRole.operator, UserRole.technician]))], response_model=List[MaintenanceLogRead])
def get_all_logs(controller: MaintenanceLogController = Depends(get_maintenance_log_controller)):
    return controller.get_all_logs()

@router.patch("/{log_id}", dependencies=[Depends(require_roles([UserRole.admin, UserRole.operator, UserRole.technician]))], response_model=MaintenanceLogRead)
def update_log(log_id: int, log: MaintenanceLogUpdate, controller: MaintenanceLogController = Depends(get_maintenance_log_controller)):
    return controller.update_log(log_id, log)

@router.delete("/{log_id}", dependencies=[Depends(require_roles([UserRole.admin]))])
def delete_log(log_id: int, controller: MaintenanceLogController = Depends(get_maintenance_log_controller)):
    return controller.delete_log(log_id)
