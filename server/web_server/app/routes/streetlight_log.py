from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db, SessionLocal
from app.schemas.streetlight import StreetlightLogRead, IoTNodeLogCreate
from app.services.predictive_maintenance_log import PredictiveMaintenanceService
from app.controllers.streetlight_log import StreetlightLogController
from app.dependencies.rbac import require_roles
from app.models.user import UserRole
from typing import List

router = APIRouter(
    prefix="/streetlight_log",
    tags=["Streetlight Log"]
)

def get_streetlight_log_controller(db: Session = Depends(get_db)):
    return StreetlightLogController(db)

def run_predictive_analysis(streetlight_id: int):
    """Background task to run decoupled predictive maintenance"""
    db = SessionLocal()
    try:
        service = PredictiveMaintenanceService(db)
        service.analyze_node(streetlight_id)
    finally:
        db.close()

@router.post("/telemetry", response_model=StreetlightLogRead)
def add_log_from_iot(iot_log: IoTNodeLogCreate, background_tasks: BackgroundTasks, controller: StreetlightLogController = Depends(get_streetlight_log_controller)):
    created = controller.add_log_from_iot(iot_log=iot_log)
    
    # --- INTERVAL-BASED AI TRIGGER ---
    # Predictive maintenance (LSTM) is resource-intensive. 
    # We trigger it every 50 logs (or on the very first log).
    log_count = controller.get_log_count(created.streetlight_id)
    if log_count == 1 or log_count % 50 == 0:
        background_tasks.add_task(run_predictive_analysis, created.streetlight_id)
        
    return created

@router.get("/{streetlight_log_id}", dependencies=[Depends(require_roles([UserRole.admin, UserRole.operator, UserRole.technician]))], response_model=StreetlightLogRead)
def get_streetlight_log_by_id(streetlight_log_id: int, controller: StreetlightLogController = Depends(get_streetlight_log_controller)):
    return controller.get_streetlight_log_by_id(streetlight_log_id=streetlight_log_id)

@router.get("/", dependencies=[Depends(require_roles([UserRole.admin, UserRole.operator, UserRole.technician]))], response_model=List[StreetlightLogRead])
def get_all_streetlight_logs(controller: StreetlightLogController = Depends(get_streetlight_log_controller)):
    return controller.get_all_streetlight_logs()

@router.get("/by-streetlight/{streetlight_id}", dependencies=[Depends(require_roles([UserRole.admin, UserRole.operator, UserRole.technician]))], response_model=List[StreetlightLogRead])
def get_streetlight_logs_by_streetlight_id(streetlight_id: int, limit: int = Query(100, ge=1, le=1000), controller: StreetlightLogController = Depends(get_streetlight_log_controller)):
    return controller.get_streetlight_logs_by_streetlight_id(streetlight_id=streetlight_id, limit=limit)