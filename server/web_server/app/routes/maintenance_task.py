from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.controllers.maintenance_task import MaintenanceTaskController
from app.core.database import get_db
from app.schemas.maintenance_task import (
    MaintenanceTaskCreate,
    MaintenanceTaskRead,
    MaintenanceTaskAssign,
    MaintenanceTaskComplete,
    MaintenanceTaskStatusEnum
)
from app.dependencies.rbac import require_roles
from app.dependencies.auth import get_current_user

router = APIRouter(
    prefix="/maintenance-tasks",
    tags=["Maintenance Tasks"],
)


def get_maintenance_task_controller(db: Session = Depends(get_db)):
    return MaintenanceTaskController(db)


@router.post("/", response_model=MaintenanceTaskRead, dependencies=[Depends(require_roles(["admin", "operator"]))])
def create_task(
    task: MaintenanceTaskCreate,
    controller: MaintenanceTaskController = Depends(get_maintenance_task_controller),
):
    """Create a new maintenance task (admin/operator only)."""
    return controller.create_task(task)


@router.get("/", response_model=List[MaintenanceTaskRead], dependencies=[Depends(require_roles(["admin", "operator", "technician"]))])
def get_all_tasks(
    controller: MaintenanceTaskController = Depends(get_maintenance_task_controller),
):
    """Get all maintenance tasks."""
    return controller.get_all_tasks()


@router.get("/active", response_model=List[MaintenanceTaskRead], dependencies=[Depends(require_roles(["admin", "operator", "technician"]))])
def get_active_tasks(
    controller: MaintenanceTaskController = Depends(get_maintenance_task_controller),
):
    """Get all non-completed maintenance tasks."""
    return controller.get_active_tasks()


@router.get("/my-tasks", response_model=List[MaintenanceTaskRead], dependencies=[Depends(require_roles(["technician"]))])
def get_my_tasks(
    current_user=Depends(get_current_user),
    controller: MaintenanceTaskController = Depends(get_maintenance_task_controller),
):
    """Get maintenance tasks assigned to the current technician."""
    return controller.get_tasks_by_technician(current_user.id)


@router.post("/{task_id}/assign", response_model=MaintenanceTaskRead, dependencies=[Depends(require_roles(["admin", "operator"]))])
def assign_technician(
    task_id: int,
    assignment: MaintenanceTaskAssign,
    controller: MaintenanceTaskController = Depends(get_maintenance_task_controller),
):
    """Assign a technician and schedule a date for a maintenance task."""
    return controller.assign_technician(task_id, assignment)


@router.patch("/{task_id}/status", response_model=MaintenanceTaskRead, dependencies=[Depends(require_roles(["admin", "operator", "technician"]))])
def update_status(
    task_id: int,
    status_update: str, # pending, assigned, in_progress, completed
    current_user=Depends(get_current_user),
    controller: MaintenanceTaskController = Depends(get_maintenance_task_controller),
):
    """Update the status of a maintenance task."""
    return controller.update_status(task_id, status_update, current_user.id, current_user.role.value)


@router.post("/{task_id}/complete", response_model=MaintenanceTaskRead, dependencies=[Depends(require_roles(["admin", "operator", "technician"]))])
def complete_with_log(
    task_id: int,
    completion: MaintenanceTaskComplete,
    current_user=Depends(get_current_user),
    controller: MaintenanceTaskController = Depends(get_maintenance_task_controller),
):
    """Complete a maintenance task and automatically generate a MaintenanceLog."""
    return controller.complete_with_log(task_id, completion, current_user.id, current_user.role.value)


@router.get("/{task_id}", response_model=MaintenanceTaskRead, dependencies=[Depends(require_roles(["admin", "operator", "technician"]))])
def get_task(
    task_id: int,
    controller: MaintenanceTaskController = Depends(get_maintenance_task_controller),
):
    """Get a specific maintenance task by ID."""
    return controller.get_task_by_id(task_id)


@router.delete("/{task_id}", dependencies=[Depends(require_roles(["admin", "operator"]))])
def delete_task(
    task_id: int,
    controller: MaintenanceTaskController = Depends(get_maintenance_task_controller),
):
    """Delete a maintenance task."""
    return controller.delete_task(task_id)
