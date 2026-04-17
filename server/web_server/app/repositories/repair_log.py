from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.repair_log import RepairLog
from app.models.repair_task import RepairTask, RepairTaskStatus
from app.schemas.repair_log import RepairLogCreate, RepairLogUpdate


class RepairLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, log: RepairLogCreate) -> RepairLog:
        """
        Create a repair log entry.
        Validates that the repair task exists and is completed.
        """
        # Verify repair task exists
        task = self.db.query(RepairTask).filter(RepairTask.id == log.repair_task_id).first()
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repair task not found",
            )

        # Prevent duplicate repair logs for the same task
        existing = self.db.query(RepairLog).filter(RepairLog.repair_task_id == log.repair_task_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A repair log already exists for this repair task",
            )

        db_log = RepairLog(
            repair_task_id=log.repair_task_id,
            streetlight_id=task.streetlight_id,
            technician_id=task.technician_id,
            diagnosis=log.diagnosis,
            action_taken=log.action_taken,
            parts_replaced=log.parts_replaced,
            repair_duration_minutes=log.repair_duration_minutes,
            notes=log.notes,
        )
        self.db.add(db_log)
        self.db.commit()
        self.db.refresh(db_log)
        return db_log

    def get_by_id(self, log_id: int) -> RepairLog:
        return self.db.query(RepairLog).filter(RepairLog.id == log_id).first()

    def get_all(self):
        return self.db.query(RepairLog).order_by(RepairLog.created_at.desc()).all()

    def get_by_repair_task_id(self, repair_task_id: int) -> RepairLog:
        return self.db.query(RepairLog).filter(RepairLog.repair_task_id == repair_task_id).first()

    def get_by_streetlight_id(self, streetlight_id: int):
        return (
            self.db.query(RepairLog)
            .filter(RepairLog.streetlight_id == streetlight_id)
            .order_by(RepairLog.created_at.desc())
            .all()
        )

    def get_by_technician_id(self, technician_id: int):
        return (
            self.db.query(RepairLog)
            .filter(RepairLog.technician_id == technician_id)
            .order_by(RepairLog.created_at.desc())
            .all()
        )

    def update(self, log_id: int, update: RepairLogUpdate) -> RepairLog:
        db_log = self.get_by_id(log_id)
        if not db_log:
            return None

        update_data = update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_log, field, value)

        self.db.commit()
        self.db.refresh(db_log)
        return db_log

    def delete(self, log_id: int):
        db_log = self.get_by_id(log_id)
        if not db_log:
            return None
        self.db.delete(db_log)
        self.db.commit()
        return db_log
