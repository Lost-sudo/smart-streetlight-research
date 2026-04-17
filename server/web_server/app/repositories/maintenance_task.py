from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import HTTPException, status
from datetime import datetime
from typing import Optional, List

from app.models.maintenance_task import MaintenanceTask, MaintenanceTaskStatus, MaintenanceTaskPriority
from app.models.streetlight import MaintenanceLog, MaintenanceStatus, PredictiveAlert, Streetlight, StreetlightStatus
from app.models.user import User, TechnicianAvailability, UserRole
from app.schemas.maintenance_task import MaintenanceTaskCreate, MaintenanceTaskComplete


class MaintenanceTaskRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, task: MaintenanceTaskCreate) -> MaintenanceTask:
        """Create a new maintenance task."""
        # Prevent duplicate tasks for the same predictive alert
        if task.predictive_alert_id:
            existing = (
                self.db.query(MaintenanceTask)
                .filter(MaintenanceTask.predictive_alert_id == task.predictive_alert_id)
                .first()
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A maintenance task already exists for this predictive alert",
                )

        db_task = MaintenanceTask(
            streetlight_id=task.streetlight_id,
            predictive_alert_id=task.predictive_alert_id,
            description=task.description,
            priority=MaintenanceTaskPriority(task.priority.value),
            scheduled_date=task.scheduled_date,
        )
        self.db.add(db_task)
        self.db.commit()
        self.db.refresh(db_task)
        return db_task

    def get_by_id(self, task_id: int) -> Optional[MaintenanceTask]:
        return self.db.query(MaintenanceTask).filter(MaintenanceTask.id == task_id).first()

    def get_all(self) -> List[MaintenanceTask]:
        return self.db.query(MaintenanceTask).order_by(MaintenanceTask.created_at.desc()).all()

    def get_active(self) -> List[MaintenanceTask]:
        return (
            self.db.query(MaintenanceTask)
            .filter(MaintenanceTask.status != MaintenanceTaskStatus.completed)
            .order_by(MaintenanceTask.created_at.desc())
            .all()
        )

    def get_by_technician(self, technician_id: int) -> List[MaintenanceTask]:
        return (
            self.db.query(MaintenanceTask)
            .filter(MaintenanceTask.technician_id == technician_id)
            .order_by(MaintenanceTask.created_at.desc())
            .all()
        )

    def assign_technician(self, task_id: int, technician_id: int, scheduled_date: datetime = None) -> MaintenanceTask:
        """Assign a technician to a maintenance task."""
        db_task = self.get_by_id(task_id)
        if not db_task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance task not found")

        if db_task.status not in [MaintenanceTaskStatus.pending]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Task is already assigned or completed",
            )

        # Verify technician exists
        technician = self.db.query(User).filter(User.id == technician_id).first()
        if not technician:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technician not found")
        if technician.role.value != "technician":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is not a technician")

        db_task.technician_id = technician_id
        db_task.status = MaintenanceTaskStatus.assigned
        db_task.assigned_at = datetime.utcnow()
        if scheduled_date:
            db_task.scheduled_date = scheduled_date

        # Set technician to busy
        technician.availability = TechnicianAvailability.busy

        self.db.commit()
        self.db.refresh(db_task)
        return db_task

    def update_status(self, task_id: int, new_status: str, user_id: int, user_role: str) -> MaintenanceTask:
        """Update the status of a maintenance task (assigned -> in_progress -> completed)."""
        db_task = self.get_by_id(task_id)
        if not db_task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance task not found")

        # Permission check
        is_assigned_tech = db_task.technician_id == user_id
        is_admin_or_operator = user_role in ["admin", "operator"]
        if not (is_assigned_tech or is_admin_or_operator):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the assigned technician or an admin/operator can update this task",
            )

        # Valid transitions
        valid_transitions = {
            MaintenanceTaskStatus.assigned: [MaintenanceTaskStatus.in_progress],
            MaintenanceTaskStatus.in_progress: [MaintenanceTaskStatus.completed],
        }

        current = db_task.status
        target = MaintenanceTaskStatus(new_status)
        if target not in valid_transitions.get(current, []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status transition from '{current.value}' to '{target.value}'",
            )

        db_task.status = target

        # Set streetlight to maintenance when in_progress
        if target == MaintenanceTaskStatus.in_progress:
            if db_task.streetlight:
                db_task.streetlight.status = StreetlightStatus.maintenance

        if target == MaintenanceTaskStatus.completed:
            db_task.completed_at = datetime.utcnow()
            # Revert technician availability
            if db_task.technician_id:
                technician = self.db.query(User).filter(User.id == db_task.technician_id).first()
                if technician:
                    technician.availability = TechnicianAvailability.available
            # Resolve the predictive alert
            if db_task.predictive_alert_id:
                alert = self.db.query(PredictiveAlert).filter(PredictiveAlert.id == db_task.predictive_alert_id).first()
                if alert:
                    alert.is_resolved = True
            # Reset streetlight to active
            streetlight = self.db.query(Streetlight).filter(Streetlight.id == db_task.streetlight_id).first()
            if streetlight:
                streetlight.status = StreetlightStatus.active

        self.db.commit()
        self.db.refresh(db_task)
        return db_task

    def complete_with_log(self, task_id: int, completion: MaintenanceTaskComplete, user_id: int, user_role: str) -> MaintenanceTask:
        """Complete a maintenance task and create a MaintenanceLog entry."""
        # First update status to completed
        db_task = self.update_status(task_id, "completed", user_id, user_role)

        # Create the maintenance log
        maintenance_log = MaintenanceLog(
            streetlight_id=db_task.streetlight_id,
            technician_id=db_task.technician_id,
            maintenance_task_id=db_task.id,
            description=completion.description or db_task.description or "Scheduled maintenance completed",
            parts_replaced=completion.parts_replaced or "",
            scheduled_date=db_task.scheduled_date or db_task.created_at,
            completion_date=datetime.utcnow(),
            status=MaintenanceStatus.completed,
        )
        self.db.add(maintenance_log)
        self.db.commit()
        self.db.refresh(db_task)
        return db_task

    def delete(self, task_id: int) -> Optional[MaintenanceTask]:
        db_task = self.get_by_id(task_id)
        if not db_task:
            return None
        self.db.delete(db_task)
        self.db.commit()
        return db_task
