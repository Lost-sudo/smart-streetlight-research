from sqlalchemy.orm import Session
from app.repositories.predictive_maintenance_log import PredictiveMaintenanceRepository
from app.schemas.streetlight import PredictiveMaintenanceCreate, PredictiveMaintenanceRead, PredictiveMaintenanceUpdate

class PredictiveMaintenanceService:
    def __init__(self, db: Session):
        self.log_repo = PredictiveMaintenanceRepository(db)

    def create_log(self, log: PredictiveMaintenanceCreate):
        return self.log_repo.create(log)

    def get_log_by_id(self, log_id: int):
        return self.log_repo.get_by_id(log_id)

    def get_all_logs(self):
        return self.log_repo.get_all()

    def update_log(self, log_id: int, log: PredictiveMaintenanceUpdate):
        return self.log_repo.update(log_id, log)

    def delete_log(self, log_id: int):
        return self.log_repo.delete(log_id)