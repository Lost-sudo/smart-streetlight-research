from sqlalchemy.orm import Session
from app.repositories.repair_task import RepairTaskRepository
from app.schemas.repair_task import RepairTaskCreate, RepairTaskSchedule
from app.models.repair_task import AssignedByType, RepairTaskSourceType, RepairTaskPriority


class RepairTaskService:
    def __init__(self, db: Session):
        self.repair_task_repo = RepairTaskRepository(db)

    def create_repair_task(self, task: RepairTaskCreate):
        """
        Create a new repair task from an alert.

        Args:
            task: The repair task data to create

        Returns:
            The created repair task
        """
        return self.repair_task_repo.create(task)

    def get_repair_task_by_id(self, task_id: int):
        """
        Get a repair task by its ID.

        Args:
            task_id: The ID of the repair task to retrieve

        Returns:
            The repair task with the given ID
        """
        return self.repair_task_repo.get_by_id(task_id)

    def get_all_repair_tasks(self):
        """
        Get all repair tasks.

        Returns:
            A list of all repair tasks
        """
        return self.repair_task_repo.get_all()

    def get_tasks_by_source_type(self, source_type: str):
        """
        Get all repair tasks filtered by source_type (FAULT or PREDICTIVE).

        Args:
            source_type: The source type to filter by

        Returns:
            A list of repair tasks of the specified source type
        """
        return self.repair_task_repo.get_by_source_type(source_type)

    def schedule_predictive_task(self, schedule: RepairTaskSchedule):
        """
        Create a repair task for predictive maintenance (admin action).
        Sets source_type to PREDICTIVE.

        Args:
            schedule: The task scheduling data

        Returns:
            The created repair task
        """
        task_create = RepairTaskCreate(
            alert_id=schedule.alert_id,
            description=schedule.description,
            source_type="PREDICTIVE",
            priority=schedule.priority.value if schedule.priority else "medium",
            scheduled_at=schedule.scheduled_at,
        )
        return self.repair_task_repo.create(task_create)

    def get_unassigned_tasks(self):
        """
        Get all unassigned (pending) repair tasks.
        Used by technicians to view claimable tasks.

        Returns:
            A list of unassigned repair tasks
        """
        return self.repair_task_repo.get_unassigned()

    def get_active_tasks(self):
        """
        Get all active repair tasks linked to unresolved alerts.
        Used by admins/operators to view tasks requiring attention.

        Returns:
            A list of active repair tasks
        """
        return self.repair_task_repo.get_active_unresolved()

    def get_tasks_by_technician(self, technician_id: int):
        """
        Get all tasks assigned to a specific technician.

        Args:
            technician_id: The technician's user ID

        Returns:
            A list of repair tasks assigned to the technician
        """
        return self.repair_task_repo.get_by_technician(technician_id)

    def assign_task(self, task_id: int, technician_id: int, assigner_id: int, assigner_role: str):
        """
        Assign a technician to a repair task (admin/operator action).
        Determines the assigned_by_type from the assigner's role.

        Args:
            task_id: The repair task ID
            technician_id: The technician's user ID
            assigner_id: The admin/operator's user ID
            assigner_role: The role of the assigner (admin or operator)

        Returns:
            The updated repair task
        """
        if assigner_role == "admin":
            assigned_by = AssignedByType.admin
        elif assigner_role == "operator":
            assigned_by = AssignedByType.operator
        else:
            assigned_by = AssignedByType.self_assigned

        return self.repair_task_repo.assign_technician(
            task_id=task_id,
            technician_id=technician_id,
            assigner_id=assigner_id,
            assigned_by_type=assigned_by,
        )

    def self_assign_task(self, task_id: int, technician_id: int):
        """
        Allow a technician to claim (self-assign) a pending repair task.
        Uses optimistic locking to prevent race conditions.

        Args:
            task_id: The repair task ID
            technician_id: The technician's user ID

        Returns:
            The updated repair task
        """
        return self.repair_task_repo.assign_technician(
            task_id=task_id,
            technician_id=technician_id,
            assigner_id=technician_id,
            assigned_by_type=AssignedByType.self_assigned,
        )

    def update_task_status(self, task_id: int, new_status: str, technician_id: int):
        """
        Update the status of a repair task (technician action).
        Enforces valid status transitions: ASSIGNED → IN_PROGRESS → COMPLETED.
        Automatically reverts technician availability to AVAILABLE on completion.

        Args:
            task_id: The repair task ID
            new_status: The new status value
            technician_id: The requesting technician's user ID

        Returns:
            The updated repair task
        """
        return self.repair_task_repo.update_status(task_id, new_status, technician_id)

    def get_available_technicians(self):
        """
        Get all technicians with AVAILABLE status.

        Returns:
            A list of available technicians
        """
        return self.repair_task_repo.get_available_technicians()

    def update_technician_availability(self, technician_id: int, availability: str):
        """
        Manually update a technician's availability status.

        Args:
            technician_id: The technician's user ID
            availability: The new availability value

        Returns:
            The updated user
        """
        return self.repair_task_repo.update_technician_availability(technician_id, availability)

    def delete_repair_task(self, task_id: int):
        """
        Delete a repair task.

        Args:
            task_id: The ID of the repair task to delete

        Returns:
            Success message
        """
        return self.repair_task_repo.delete(task_id)
