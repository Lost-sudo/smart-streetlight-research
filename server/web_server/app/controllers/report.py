from sqlalchemy.orm import Session
from app.services.report import ReportService
from app.schemas.report import ReportResponse

class ReportController:
    def __init__(self, db: Session):
        self.report_service = ReportService(db)

    def get_system_report(self, month: int, year: int) -> ReportResponse:
        return self.report_service.get_system_report(month, year)
