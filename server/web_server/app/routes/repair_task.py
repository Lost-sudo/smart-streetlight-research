from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.controllers.repair_task import RepairTaskController
from app.core.database import get_db
from app.schemas.repair_task import (
    RepairTaskCreate,
    RepairTaskRead,
    RepairTaskAssign,
    RepairTaskUpdateStatus,
    TechnicianStatusUpdate,
    TechnicianRead,
)
from app.dependencies.rbac import require_roles
from app.dependencies.auth import get_current_user

router = APIRouter(
    prefix="/repair-tasks",
    tags=["Repair Tasks"],
)


def get_repair_task_controller(db: Session = Depends(get_db)):
    return RepairTaskController(db)


# ──────────────────────────────────────────────
# Admin / Operator endpoints
# ──────────────────────────────────────────────

@router.post("/", response_model=RepairTaskRead, dependencies=[Depends(require_roles(["admin", "operator"]))])
def create_repair_task(
    task: RepairTaskCreate,
    controller: RepairTaskController = Depends(get_repair_task_controller),
):
    """Create a new repair task from an alert (admin/operator only)."""
    return controller.create_repair_task(task)


@router.get("/active", response_model=List[RepairTaskRead], dependencies=[Depends(require_roles(["admin", "operator"]))])
def get_active_tasks(
    controller: RepairTaskController = Depends(get_repair_task_controller),
):
    """Get all active repair tasks linked to unresolved alerts."""
    return controller.get_active_tasks()


@router.post("/{task_id}/assign", response_model=RepairTaskRead, dependencies=[Depends(require_roles(["admin", "operator"]))])
def assign_task(
    task_id: int,
    assignment: RepairTaskAssign,
    current_user=Depends(get_current_user),
    controller: RepairTaskController = Depends(get_repair_task_controller),
):
    """Assign an available technician to a pending repair task."""
    return controller.assign_task(
        task_id=task_id,
        assignment=assignment,
        assigner_id=current_user.id,
        assigner_role=current_user.role.value,
    )


@router.get("/technicians/available", response_model=List[TechnicianRead], dependencies=[Depends(require_roles(["admin", "operator"]))])
def get_available_technicians(
    controller: RepairTaskController = Depends(get_repair_task_controller),
):
    """Get all technicians with AVAILABLE status."""
    return controller.get_available_technicians()


@router.patch("/technicians/{technician_id}/availability", response_model=TechnicianRead, dependencies=[Depends(require_roles(["admin", "operator"]))])
def update_technician_availability(
    technician_id: int,
    update: TechnicianStatusUpdate,
    controller: RepairTaskController = Depends(get_repair_task_controller),
):
    """Manually update a technician's availability status."""
    return controller.update_technician_availability(technician_id, update)


@router.delete("/{task_id}", dependencies=[Depends(require_roles(["admin", "operator"]))])
def delete_repair_task(
    task_id: int,
    controller: RepairTaskController = Depends(get_repair_task_controller),
):
    """Delete a repair task (admin/operator only)."""
    return controller.delete_repair_task(task_id)


# ──────────────────────────────────────────────
# Technician endpoints
# ──────────────────────────────────────────────

@router.get("/unassigned", response_model=List[RepairTaskRead], dependencies=[Depends(require_roles(["technician"]))])
def get_unassigned_tasks(
    controller: RepairTaskController = Depends(get_repair_task_controller),
):
    """Get all unassigned repair tasks (for technician self-claim)."""
    return controller.get_unassigned_tasks()


@router.post("/{task_id}/claim", response_model=RepairTaskRead, dependencies=[Depends(require_roles(["technician"]))])
def self_assign_task(
    task_id: int,
    current_user=Depends(get_current_user),
    controller: RepairTaskController = Depends(get_repair_task_controller),
):
    """Allow a technician to self-claim a pending repair task."""
    return controller.self_assign_task(
        task_id=task_id,
        technician_id=current_user.id,
    )


@router.patch("/{task_id}/status", response_model=RepairTaskRead, dependencies=[Depends(require_roles(["technician"]))])
def update_task_status(
    task_id: int,
    status_update: RepairTaskUpdateStatus,
    current_user=Depends(get_current_user),
    controller: RepairTaskController = Depends(get_repair_task_controller),
):
    """Update the status of a repair task (assigned technician only)."""
    return controller.update_task_status(
        task_id=task_id,
        status_update=status_update,
        technician_id=current_user.id,
    )


@router.get("/my-tasks", response_model=List[RepairTaskRead], dependencies=[Depends(require_roles(["technician"]))])
def get_my_tasks(
    current_user=Depends(get_current_user),
    controller: RepairTaskController = Depends(get_repair_task_controller),
):
    """Get all repair tasks assigned to the current technician."""
    return controller.get_tasks_by_technician(current_user.id)


# ──────────────────────────────────────────────
# Shared endpoints (any authenticated role)
# ──────────────────────────────────────────────

@router.get("/", response_model=List[RepairTaskRead], dependencies=[Depends(require_roles(["admin", "operator", "technician"]))])
def get_all_repair_tasks(
    controller: RepairTaskController = Depends(get_repair_task_controller),
):
    """Get all repair tasks."""
    return controller.get_all_repair_tasks()


@router.get("/{task_id}", response_model=RepairTaskRead, dependencies=[Depends(require_roles(["admin", "operator", "technician"]))])
def get_repair_task(
    task_id: int,
    controller: RepairTaskController = Depends(get_repair_task_controller),
):
    """Get a specific repair task by ID."""
    return controller.get_repair_task_by_id(task_id)
