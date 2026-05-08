from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.controllers.report import ReportController
from app.schemas.report import ReportResponse
from app.dependencies.rbac import require_roles
from app.models.user import UserRole

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)

def get_report_controller(db: Session = Depends(get_db)):
    return ReportController(db)

@router.get("/system-metrics", response_model=ReportResponse, dependencies=[Depends(require_roles([UserRole.admin, UserRole.operator, UserRole.technician]))])
def get_system_report(
    month: int = None, 
    year: int = None, 
    controller: ReportController = Depends(get_report_controller)
):
    """
    Get aggregated system metrics for the reports page.
    Supports filtering by month and year via query parameters.
    """
    now = datetime.utcnow()
    target_month = month if month is not None else now.month
    target_year = year if year is not None else now.year
    
    return controller.get_system_report(target_month, target_year)
