from sqlalchemy.orm import Session
from app.services.repair_log import RepairLogService
from app.schemas.repair_log import RepairLogCreate, RepairLogRead, RepairLogUpdate
from typing import List


class RepairLogController:
    def __init__(self, db: Session):
        self.service = RepairLogService(db)

    def create_repair_log(self, log: RepairLogCreate) -> RepairLogRead:
        created = self.service.create_repair_log(log)
        return RepairLogRead.model_validate(created, from_attributes=True)

    def get_repair_log_by_id(self, log_id: int) -> RepairLogRead:
        log = self.service.get_repair_log_by_id(log_id)
        return RepairLogRead.model_validate(log, from_attributes=True)

    def get_all_repair_logs(self) -> List[RepairLogRead]:
        logs = self.service.get_all_repair_logs()
        return [RepairLogRead.model_validate(l, from_attributes=True) for l in logs]

    def get_by_repair_task_id(self, repair_task_id: int):
        log = self.service.get_by_repair_task_id(repair_task_id)
        if log is None:
            return None
        return RepairLogRead.model_validate(log, from_attributes=True)

    def get_by_streetlight_id(self, streetlight_id: int) -> List[RepairLogRead]:
        logs = self.service.get_by_streetlight_id(streetlight_id)
        return [RepairLogRead.model_validate(l, from_attributes=True) for l in logs]

    def get_by_technician_id(self, technician_id: int) -> List[RepairLogRead]:
        logs = self.service.get_by_technician_id(technician_id)
        return [RepairLogRead.model_validate(l, from_attributes=True) for l in logs]

    def update_repair_log(self, log_id: int, update: RepairLogUpdate) -> RepairLogRead:
        updated = self.service.update_repair_log(log_id, update)
        return RepairLogRead.model_validate(updated, from_attributes=True)

    def delete_repair_log(self, log_id: int):
        return self.service.delete_repair_log(log_id)
