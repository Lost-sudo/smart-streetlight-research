from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import HTTPException, status
from datetime import datetime

from app.models.repair_task import RepairTask, RepairTaskStatus, TechnicianAvailability
from app.models.user import User
from app.models.streetlight import Alert
from app.schemas.repair_task import RepairTaskCreate


class RepairTaskRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, task: RepairTaskCreate):
        """
        Create a new repair task linked to an alert.

        Args:
            task: The repair task data to create

        Returns:
            The created repair task
        """
        # Verify alert exists
        alert = self.db.query(Alert).filter(Alert.id == task.alert_id).first()
        if not alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Alert not found",
            )

        # Prevent duplicate tasks for the same alert
        existing = (
            self.db.query(RepairTask)
            .filter(RepairTask.alert_id == task.alert_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A repair task already exists for this alert",
            )

        db_task = RepairTask(
            alert_id=task.alert_id,
            description=task.description,
            status=RepairTaskStatus.pending,
        )
        self.db.add(db_task)
        self.db.commit()
        self.db.refresh(db_task)
        return db_task

    def get_by_id(self, task_id: int):
        """
        Get a repair task by its ID.

        Args:
            task_id: The ID of the repair task to retrieve

        Returns:
            The repair task with the given ID
        """
        return self.db.query(RepairTask).filter(RepairTask.id == task_id).first()

    def get_all(self):
        """
        Get all repair tasks.

        Returns:
            A list of all repair tasks
        """
        return self.db.query(RepairTask).all()

    def get_unassigned(self):
        """
        Get all repair tasks that are still pending (unassigned).

        Returns:
            A list of unassigned repair tasks
        """
        return (
            self.db.query(RepairTask)
            .filter(RepairTask.status == RepairTaskStatus.pending)
            .all()
        )

    def get_active_unresolved(self):
        """
        Get all repair tasks linked to unresolved alerts (for admin/operator view).

        Returns:
            A list of active repair tasks requiring attention
        """
        return (
            self.db.query(RepairTask)
            .join(Alert, RepairTask.alert_id == Alert.id)
            .filter(
                Alert.is_resolved == False,
                RepairTask.status != RepairTaskStatus.completed,
            )
            .all()
        )

    def get_by_technician(self, technician_id: int):
        """
        Get all repair tasks assigned to a specific technician.

        Args:
            technician_id: The technician's user ID

        Returns:
            A list of repair tasks assigned to the technician
        """
        return (
            self.db.query(RepairTask)
            .filter(RepairTask.technician_id == technician_id)
            .all()
        )

    def assign_technician(self, task_id: int, technician_id: int, assigner_id: int, assigned_by_type: str):
        """
        Atomically assign a technician to a repair task using optimistic locking.
        Also sets the technician's availability to BUSY.

        Args:
            task_id: The repair task ID
            technician_id: The technician's user ID
            assigner_id: The ID of the user performing the assignment
            assigned_by_type: Who is assigning (admin, operator, self_assigned)

        Returns:
            The updated repair task

        Raises:
            HTTPException: If task not found, already assigned, technician unavailable, or version conflict
        """
        db_task = self.get_by_id(task_id)
        if not db_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repair task not found",
            )

        if db_task.status != RepairTaskStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Task is already assigned or completed",
            )

        # Verify technician exists and is available
        technician = self.db.query(User).filter(User.id == technician_id).first()
        if not technician:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Technician not found",
            )

        if technician.role.value != "technician":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not a technician",
            )

        if technician.availability != TechnicianAvailability.available:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Technician is not available",
            )

        # Optimistic locking: use version to prevent race conditions
        current_version = db_task.version
        rows_updated = (
            self.db.query(RepairTask)
            .filter(
                and_(
                    RepairTask.id == task_id,
                    RepairTask.version == current_version,
                    RepairTask.status == RepairTaskStatus.pending,
                )
            )
            .update(
                {
                    RepairTask.technician_id: technician_id,
                    RepairTask.assigned_by_user_id: assigner_id,
                    RepairTask.assigned_by_type: assigned_by_type,
                    RepairTask.status: RepairTaskStatus.assigned,
                    RepairTask.assigned_at: datetime.utcnow(),
                    RepairTask.version: current_version + 1,
                },
                synchronize_session="fetch",
            )
        )

        if rows_updated == 0:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Assignment conflict — task was modified by another request. Please retry.",
            )

        # Update technician availability to BUSY
        technician.availability = TechnicianAvailability.busy

        self.db.commit()
        self.db.refresh(db_task)
        return db_task

    def update_status(self, task_id: int, new_status: str, technician_id: int):
        """
        Update the status of a repair task. Only the assigned technician can update.

        Args:
            task_id: The repair task ID
            new_status: The new status value
            technician_id: The requesting technician's user ID

        Returns:
            The updated repair task
        """
        db_task = self.get_by_id(task_id)
        if not db_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repair task not found",
            )

        if db_task.technician_id != technician_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the assigned technician can update this task",
            )

        # Validate status transitions
        valid_transitions = {
            RepairTaskStatus.assigned: [RepairTaskStatus.in_progress],
            RepairTaskStatus.in_progress: [RepairTaskStatus.completed],
        }

        current = db_task.status
        target = RepairTaskStatus(new_status)

        if target not in valid_transitions.get(current, []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status transition from '{current.value}' to '{target.value}'",
            )

        db_task.status = target

        if target == RepairTaskStatus.completed:
            db_task.completed_at = datetime.utcnow()
            # Revert technician availability to AVAILABLE
            technician = self.db.query(User).filter(User.id == technician_id).first()
            if technician:
                technician.availability = TechnicianAvailability.available

        self.db.commit()
        self.db.refresh(db_task)
        return db_task

    def get_available_technicians(self):
        """
        Get all technicians with AVAILABLE status.

        Returns:
            A list of available technicians
        """
        return (
            self.db.query(User)
            .filter(
                User.role == "technician",
                User.availability == TechnicianAvailability.available,
                User.is_active == True,
            )
            .all()
        )

    def update_technician_availability(self, technician_id: int, availability: str):
        """
        Manually update a technician's availability status.

        Args:
            technician_id: The technician's user ID
            availability: The new availability status

        Returns:
            The updated user
        """
        technician = self.db.query(User).filter(User.id == technician_id).first()
        if not technician:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Technician not found",
            )

        if technician.role.value != "technician":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not a technician",
            )

        technician.availability = TechnicianAvailability(availability)
        self.db.commit()
        self.db.refresh(technician)
        return technician

    def delete(self, task_id: int):
        """
        Delete a repair task.

        Args:
            task_id: The ID of the repair task to delete

        Returns:
            Success message
        """
        db_task = self.get_by_id(task_id)
        if not db_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repair task not found",
            )
        self.db.delete(db_task)
        self.db.commit()
        return {"message": "Repair task deleted successfully"}
