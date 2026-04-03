from sqlalchemy.orm import Session
from app.schemas.streetlight import PredictiveMaintenanceCreate, PredictiveMaintenanceRead, PredictiveMaintenanceUpdate
from app.services.predictive_maintenance_log import PredictiveMaintenanceService
from typing import List

class PredictiveMaintenanceController:
    def __init__(self, db: Session):
        self.log_service = PredictiveMaintenanceService(db)

    def create_log(self, log: PredictiveMaintenanceCreate) -> PredictiveMaintenanceRead:
        new_log = self.log_service.create_log(log)
        return PredictiveMaintenanceRead.model_validate(new_log, from_attributes=True)

    def get_log_by_id(self, log_id: int) -> PredictiveMaintenanceRead:
        log = self.log_service.get_log_by_id(log_id=log_id)
        return PredictiveMaintenanceRead.model_validate(log, from_attributes=True)

    def get_all_logs(self) -> List[PredictiveMaintenanceRead]:
        logs = self.log_service.get_all_logs()
        return [PredictiveMaintenanceRead.model_validate(l, from_attributes=True) for l in logs]

    def update_log(self, log_id: int, log: PredictiveMaintenanceUpdate) -> PredictiveMaintenanceRead:
        updated_log = self.log_service.update_log(log_id=log_id, log=log)
        return PredictiveMaintenanceRead.model_validate(updated_log, from_attributes=True)

    def delete_log(self, log_id: int) -> str:
        self.log_service.delete_log(log_id=log_id)
        return "Predictive maintenance log has been successfully deleted."