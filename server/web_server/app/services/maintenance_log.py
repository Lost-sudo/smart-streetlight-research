from sqlalchemy.orm import Session
from app.repositories.maintenance_log import MaintenanceLogRepository
from app.schemas.streetlight import MaintenanceLogCreate, MaintenanceLogUpdate

class MaintenanceLogService:
    def __init__(self, db: Session):
        self.log_repo = MaintenanceLogRepository(db)

    def create_log(self, log: MaintenanceLogCreate):
        return self.log_repo.create(log)

    def get_log_by_id(self, log_id: int):
        return self.log_repo.get_by_id(log_id)

    def get_all_logs(self):
        return self.log_repo.get_all()

    def update_log(self, log_id: int, log: MaintenanceLogUpdate):
        return self.log_repo.update(log_id, log)

    def delete_log(self, log_id: int):
        return self.log_repo.delete(log_id)
