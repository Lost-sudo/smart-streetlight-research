from typing import List
from sqlalchemy.orm import Session
from app.schemas.streetlight import MaintenanceLogCreate, MaintenanceLogRead, MaintenanceLogUpdate
from app.services.maintenance_log import MaintenanceLogService

class MaintenanceLogController:
    def __init__(self, db: Session):
        self.log_service = MaintenanceLogService(db)

    def create_log(self, log: MaintenanceLogCreate) -> MaintenanceLogRead:
        new_log = self.log_service.create_log(log)
        return MaintenanceLogRead.model_validate(new_log, from_attributes=True)

    def get_log_by_id(self, log_id: int) -> MaintenanceLogRead:
        log = self.log_service.get_log_by_id(log_id=log_id)
        return MaintenanceLogRead.model_validate(log, from_attributes=True)

    def get_all_logs(self) -> List[MaintenanceLogRead]:
        logs = self.log_service.get_all_logs()
        return [MaintenanceLogRead.model_validate(l, from_attributes=True) for l in logs]

    def update_log(self, log_id: int, log: MaintenanceLogUpdate) -> MaintenanceLogRead:
        updated_log = self.log_service.update_log(log_id=log_id, log=log)
        return MaintenanceLogRead.model_validate(updated_log, from_attributes=True)

    def delete_log(self, log_id: int) -> str:
        self.log_service.delete_log(log_id=log_id)
        return "Maintenance log has been successfully deleted."
