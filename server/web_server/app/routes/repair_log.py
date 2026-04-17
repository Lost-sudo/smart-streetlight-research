from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from app.controllers.repair_log import RepairLogController
from app.core.database import get_db
from app.schemas.repair_log import RepairLogCreate, RepairLogRead, RepairLogUpdate
from app.dependencies.rbac import require_roles
from app.dependencies.auth import get_current_user

router = APIRouter(
    prefix="/repair-logs",
    tags=["Repair Logs"],
)


def get_repair_log_controller(db: Session = Depends(get_db)):
    return RepairLogController(db)


@router.post("/", response_model=RepairLogRead, dependencies=[Depends(require_roles(["admin", "operator", "technician"]))])
def create_repair_log(
    log: RepairLogCreate,
    controller: RepairLogController = Depends(get_repair_log_controller),
):
    """Create a repair log entry after completing a repair."""
    return controller.create_repair_log(log)


@router.get("/", response_model=List[RepairLogRead], dependencies=[Depends(require_roles(["admin", "operator", "technician"]))])
def get_all_repair_logs(
    controller: RepairLogController = Depends(get_repair_log_controller),
):
    """Get all repair logs."""
    return controller.get_all_repair_logs()


@router.get("/by-task/{repair_task_id}", response_model=Optional[RepairLogRead], dependencies=[Depends(require_roles(["admin", "operator", "technician"]))])
def get_by_repair_task(
    repair_task_id: int,
    controller: RepairLogController = Depends(get_repair_log_controller),
):
    """Get repair log for a specific repair task."""
    return controller.get_by_repair_task_id(repair_task_id)


@router.get("/by-streetlight/{streetlight_id}", response_model=List[RepairLogRead], dependencies=[Depends(require_roles(["admin", "operator", "technician"]))])
def get_by_streetlight(
    streetlight_id: int,
    controller: RepairLogController = Depends(get_repair_log_controller),
):
    """Get all repair logs for a specific streetlight."""
    return controller.get_by_streetlight_id(streetlight_id)


@router.get("/my-logs", response_model=List[RepairLogRead], dependencies=[Depends(require_roles(["technician"]))])
def get_my_repair_logs(
    current_user=Depends(get_current_user),
    controller: RepairLogController = Depends(get_repair_log_controller),
):
    """Get all repair logs created by the current technician."""
    return controller.get_by_technician_id(current_user.id)


@router.get("/{log_id}", response_model=RepairLogRead, dependencies=[Depends(require_roles(["admin", "operator", "technician"]))])
def get_repair_log(
    log_id: int,
    controller: RepairLogController = Depends(get_repair_log_controller),
):
    """Get a specific repair log by ID."""
    return controller.get_repair_log_by_id(log_id)


@router.patch("/{log_id}", response_model=RepairLogRead, dependencies=[Depends(require_roles(["admin", "operator", "technician"]))])
def update_repair_log(
    log_id: int,
    update: RepairLogUpdate,
    controller: RepairLogController = Depends(get_repair_log_controller),
):
    """Update a repair log entry."""
    return controller.update_repair_log(log_id, update)


@router.delete("/{log_id}", dependencies=[Depends(require_roles(["admin", "operator"]))])
def delete_repair_log(
    log_id: int,
    controller: RepairLogController = Depends(get_repair_log_controller),
):
    """Delete a repair log (admin/operator only)."""
    return controller.delete_repair_log(log_id)
