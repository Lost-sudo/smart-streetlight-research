from sqlalchemy.orm import Session
from app.repositories.repair_log import RepairLogRepository
from app.schemas.repair_log import RepairLogCreate, RepairLogUpdate
from fastapi import HTTPException, status


class RepairLogService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = RepairLogRepository(db)

    def create_repair_log(self, log: RepairLogCreate):
        return self.repo.create(log)

    def get_repair_log_by_id(self, log_id: int):
        log = self.repo.get_by_id(log_id)
        if log is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repair log not found")
        return log

    def get_all_repair_logs(self):
        return self.repo.get_all()

    def get_by_repair_task_id(self, repair_task_id: int):
        return self.repo.get_by_repair_task_id(repair_task_id)

    def get_by_streetlight_id(self, streetlight_id: int):
        return self.repo.get_by_streetlight_id(streetlight_id)

    def get_by_technician_id(self, technician_id: int):
        return self.repo.get_by_technician_id(technician_id)

    def update_repair_log(self, log_id: int, update: RepairLogUpdate):
        updated = self.repo.update(log_id, update)
        if updated is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repair log not found")
        return updated

    def delete_repair_log(self, log_id: int):
        deleted = self.repo.delete(log_id)
        if deleted is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repair log not found")
        return {"message": "Repair log deleted successfully"}
