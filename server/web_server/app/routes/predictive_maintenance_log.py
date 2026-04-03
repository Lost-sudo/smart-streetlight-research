from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.controllers.predictive_maintenance_log import PredictiveMaintenanceController
from app.core.database import get_db
from app.schemas.streetlight import PredictiveMaintenanceCreate, PredictiveMaintenanceRead, PredictiveMaintenanceUpdate
from app.dependencies.rbac import require_roles
from app.models.user import UserRole
from typing import List

router = APIRouter(
    prefix="/predictive-maintenance",
    tags=["Predictive Maintenance"]
)

def get_predictive_maintenance_controller(db: Session = Depends(get_db)):
    return PredictiveMaintenanceController(db)

@router.post("/", dependencies=[Depends(require_roles([UserRole.admin, UserRole.operator, UserRole.technician]))], response_model=PredictiveMaintenanceRead)
def create_log(log: PredictiveMaintenanceCreate, controller: PredictiveMaintenanceController = Depends(get_predictive_maintenance_controller)):
    return controller.create_log(log)

@router.get("/{log_id}", dependencies=[Depends(require_roles([UserRole.admin, UserRole.operator, UserRole.technician]))], response_model=PredictiveMaintenanceRead)
def get_log(log_id: int, controller: PredictiveMaintenanceController = Depends(get_predictive_maintenance_controller)):
    return controller.get_log_by_id(log_id)

@router.get("/", dependencies=[Depends(require_roles([UserRole.admin, UserRole.operator, UserRole.technician]))], response_model=List[PredictiveMaintenanceRead])
def get_all_logs(controller: PredictiveMaintenanceController = Depends(get_predictive_maintenance_controller)):
    return controller.get_all_logs()

@router.patch("/{log_id}", dependencies=[Depends(require_roles([UserRole.admin, UserRole.operator, UserRole.technician]))], response_model=PredictiveMaintenanceRead)
def update_log(log_id: int, log: PredictiveMaintenanceUpdate, controller: PredictiveMaintenanceController = Depends(get_predictive_maintenance_controller)):
    return controller.update_log(log_id, log)

@router.delete("/{log_id}", dependencies=[Depends(require_roles([UserRole.admin]))])
def delete_log(log_id: int, controller: PredictiveMaintenanceController = Depends(get_predictive_maintenance_controller)):
    return controller.delete_log(log_id)