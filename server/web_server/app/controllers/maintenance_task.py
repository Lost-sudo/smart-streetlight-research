from typing import List
from sqlalchemy.orm import Session
from app.services.maintenance_task import MaintenanceTaskService
from app.schemas.maintenance_task import (
    MaintenanceTaskCreate,
    MaintenanceTaskRead,
    MaintenanceTaskAssign,
    MaintenanceTaskComplete,
)


class MaintenanceTaskController:
    def __init__(self, db: Session):
        self.service = MaintenanceTaskService(db)

    def create_task(self, task: MaintenanceTaskCreate) -> MaintenanceTaskRead:
        created = self.service.create_task(task)
        return MaintenanceTaskRead.model_validate(created, from_attributes=True)

    def get_task_by_id(self, task_id: int) -> MaintenanceTaskRead:
        task = self.service.get_task_by_id(task_id)
        return MaintenanceTaskRead.model_validate(task, from_attributes=True)

    def get_all_tasks(self) -> List[MaintenanceTaskRead]:
        tasks = self.service.get_all_tasks()
        return [MaintenanceTaskRead.model_validate(t, from_attributes=True) for t in tasks]

    def get_active_tasks(self) -> List[MaintenanceTaskRead]:
        tasks = self.service.get_active_tasks()
        return [MaintenanceTaskRead.model_validate(t, from_attributes=True) for t in tasks]

    def get_tasks_by_technician(self, technician_id: int) -> List[MaintenanceTaskRead]:
        tasks = self.service.get_tasks_by_technician(technician_id)
        return [MaintenanceTaskRead.model_validate(t, from_attributes=True) for t in tasks]

    def assign_technician(self, task_id: int, assignment: MaintenanceTaskAssign) -> MaintenanceTaskRead:
        updated = self.service.assign_technician(task_id, assignment.technician_id, assignment.scheduled_date)
        return MaintenanceTaskRead.model_validate(updated, from_attributes=True)

    def update_status(self, task_id: int, new_status: str, user_id: int, user_role: str) -> MaintenanceTaskRead:
        updated = self.service.update_status(task_id, new_status, user_id, user_role)
        return MaintenanceTaskRead.model_validate(updated, from_attributes=True)

    def complete_with_log(self, task_id: int, completion: MaintenanceTaskComplete, user_id: int, user_role: str) -> MaintenanceTaskRead:
        updated = self.service.complete_with_log(task_id, completion, user_id, user_role)
        return MaintenanceTaskRead.model_validate(updated, from_attributes=True)

    def delete_task(self, task_id: int):
        return self.service.delete_task(task_id)
