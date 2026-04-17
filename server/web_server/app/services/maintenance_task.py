from sqlalchemy.orm import Session
from app.repositories.maintenance_task import MaintenanceTaskRepository
from app.schemas.maintenance_task import MaintenanceTaskCreate, MaintenanceTaskComplete
from fastapi import HTTPException, status
from datetime import datetime


class MaintenanceTaskService:
    def __init__(self, db: Session):
        self.repo = MaintenanceTaskRepository(db)

    def create_task(self, task: MaintenanceTaskCreate):
        return self.repo.create(task)

    def get_task_by_id(self, task_id: int):
        task = self.repo.get_by_id(task_id)
        if task is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance task not found")
        return task

    def get_all_tasks(self):
        return self.repo.get_all()

    def get_active_tasks(self):
        return self.repo.get_active()

    def get_tasks_by_technician(self, technician_id: int):
        return self.repo.get_by_technician(technician_id)

    def assign_technician(self, task_id: int, technician_id: int, scheduled_date: datetime = None):
        return self.repo.assign_technician(task_id, technician_id, scheduled_date)

    def update_status(self, task_id: int, new_status: str, user_id: int, user_role: str):
        return self.repo.update_status(task_id, new_status, user_id, user_role)

    def complete_with_log(self, task_id: int, completion: MaintenanceTaskComplete, user_id: int, user_role: str):
        return self.repo.complete_with_log(task_id, completion, user_id, user_role)

    def delete_task(self, task_id: int):
        deleted = self.repo.delete(task_id)
        if deleted is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance task not found")
        return {"message": "Maintenance task deleted successfully"}
