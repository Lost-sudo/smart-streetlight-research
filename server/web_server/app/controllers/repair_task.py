from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.schemas.repair_task import (
    RepairTaskCreate,
    RepairTaskRead,
    RepairTaskAssign,
    RepairTaskUpdateStatus,
    RepairTaskSchedule,
    TechnicianStatusUpdate,
    TechnicianRead,
)
from app.services.repair_task import RepairTaskService


class RepairTaskController:
    def __init__(self, db: Session):
        self.repair_task_service = RepairTaskService(db)

    def create_repair_task(self, task: RepairTaskCreate) -> RepairTaskRead:
        """
        Create a new repair task from an alert.

        Args:
            task: The repair task data to create

        Returns:
            The created repair task
        """
        new_task = self.repair_task_service.create_repair_task(task)
        return RepairTaskRead.model_validate(new_task, from_attributes=True)

    def get_repair_task_by_id(self, task_id: int) -> RepairTaskRead:
        """
        Get a repair task by its ID.

        Args:
            task_id: The ID of the repair task

        Returns:
            The repair task
        """
        task = self.repair_task_service.get_repair_task_by_id(task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repair task not found",
            )
        return RepairTaskRead.model_validate(task, from_attributes=True)

    def get_all_repair_tasks(self) -> List[RepairTaskRead]:
        """
        Get all repair tasks.

        Returns:
            A list of all repair tasks
        """
        tasks = self.repair_task_service.get_all_repair_tasks()
        return [RepairTaskRead.model_validate(t, from_attributes=True) for t in tasks]

    def get_tasks_by_source_type(self, source_type: str) -> List[RepairTaskRead]:
        """
        Get all repair tasks filtered by source_type (FAULT or PREDICTIVE).
        """
        tasks = self.repair_task_service.get_tasks_by_source_type(source_type)
        return [RepairTaskRead.model_validate(t, from_attributes=True) for t in tasks]

    def schedule_predictive_task(self, schedule: RepairTaskSchedule) -> RepairTaskRead:
        """
        Create a repair task for predictive maintenance (admin action).
        """
        new_task = self.repair_task_service.schedule_predictive_task(schedule)
        return RepairTaskRead.model_validate(new_task, from_attributes=True)

    def get_unassigned_tasks(self) -> List[RepairTaskRead]:
        """
        Get all unassigned repair tasks (for technician self-claim view).

        Returns:
            A list of unassigned repair tasks
        """
        tasks = self.repair_task_service.get_unassigned_tasks()
        return [RepairTaskRead.model_validate(t, from_attributes=True) for t in tasks]

    def get_active_tasks(self) -> List[RepairTaskRead]:
        """
        Get all active repair tasks linked to unresolved alerts.

        Returns:
            A list of active repair tasks
        """
        tasks = self.repair_task_service.get_active_tasks()
        return [RepairTaskRead.model_validate(t, from_attributes=True) for t in tasks]

    def get_tasks_by_technician(self, technician_id: int) -> List[RepairTaskRead]:
        """
        Get all tasks assigned to a specific technician.

        Args:
            technician_id: The technician's user ID

        Returns:
            A list of repair tasks
        """
        tasks = self.repair_task_service.get_tasks_by_technician(technician_id)
        return [RepairTaskRead.model_validate(t, from_attributes=True) for t in tasks]

    def assign_task(self, task_id: int, assignment: RepairTaskAssign, assigner_id: int, assigner_role: str) -> RepairTaskRead:
        """
        Assign a technician to a repair task (admin/operator action).

        Args:
            task_id: The repair task ID
            assignment: Contains the technician_id to assign
            assigner_id: The admin/operator's user ID
            assigner_role: The role of the assigner

        Returns:
            The updated repair task
        """
        updated = self.repair_task_service.assign_task(
            task_id=task_id,
            technician_id=assignment.technician_id,
            assigner_id=assigner_id,
            assigner_role=assigner_role,
        )
        return RepairTaskRead.model_validate(updated, from_attributes=True)

    def self_assign_task(self, task_id: int, technician_id: int) -> RepairTaskRead:
        """
        Allow a technician to self-claim a pending repair task.

        Args:
            task_id: The repair task ID
            technician_id: The technician's user ID

        Returns:
            The updated repair task
        """
        updated = self.repair_task_service.self_assign_task(
            task_id=task_id,
            technician_id=technician_id,
        )
        return RepairTaskRead.model_validate(updated, from_attributes=True)

    def update_task_status(self, task_id: int, status_update: RepairTaskUpdateStatus, technician_id: int) -> RepairTaskRead:
        """
        Update the status of a repair task (technician action).

        Args:
            task_id: The repair task ID
            status_update: Contains the new status
            technician_id: The requesting technician's user ID

        Returns:
            The updated repair task
        """
        updated = self.repair_task_service.update_task_status(
            task_id=task_id,
            new_status=status_update.status.value,
            technician_id=technician_id,
        )
        return RepairTaskRead.model_validate(updated, from_attributes=True)

    def get_available_technicians(self) -> List[TechnicianRead]:
        """
        Get all technicians with AVAILABLE status.

        Returns:
            A list of available technicians
        """
        technicians = self.repair_task_service.get_available_technicians()
        return [TechnicianRead.model_validate(t, from_attributes=True) for t in technicians]

    def update_technician_availability(self, technician_id: int, update: TechnicianStatusUpdate) -> TechnicianRead:
        """
        Manually update a technician's availability status.

        Args:
            technician_id: The technician's user ID
            update: Contains the new availability status

        Returns:
            The updated technician
        """
        updated = self.repair_task_service.update_technician_availability(
            technician_id=technician_id,
            availability=update.availability.value,
        )
        return TechnicianRead.model_validate(updated, from_attributes=True)

    def delete_repair_task(self, task_id: int) -> str:
        """
        Delete a repair task.

        Args:
            task_id: The ID of the repair task to delete

        Returns:
            A success message
        """
        self.repair_task_service.delete_repair_task(task_id)
        return "Repair task has been successfully deleted."
