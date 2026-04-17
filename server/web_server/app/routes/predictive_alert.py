from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.controllers.predictive_alert import PredictiveAlertController
from app.core.database import get_db
from app.schemas.predictive_alert import PredictiveAlertCreate, PredictiveAlertRead, PredictiveAlertUpdate
from typing import List

router = APIRouter(
    prefix="/predictive-alert",
    tags=["Predictive Alert"]
)

def get_predictive_alert_controller(db: Session = Depends(get_db)):
    return PredictiveAlertController(db)

@router.post("/", response_model=PredictiveAlertRead)
def create_alert(alert: PredictiveAlertCreate, controller: PredictiveAlertController = Depends(get_predictive_alert_controller)):
    return controller.create_alert(alert)

@router.get("/{alert_id}", response_model=PredictiveAlertRead)
def get_alert(alert_id: int, controller: PredictiveAlertController = Depends(get_predictive_alert_controller)):
    return controller.get_alert_by_id(alert_id)

@router.get("/", response_model=List[PredictiveAlertRead])
def get_all_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    controller: PredictiveAlertController = Depends(get_predictive_alert_controller)
):
    return controller.get_all_alerts(skip=skip, limit=limit)

@router.patch("/{alert_id}/resolve", response_model=PredictiveAlertRead)
def resolve_alert(alert_id: int, controller: PredictiveAlertController = Depends(get_predictive_alert_controller)):
    return controller.resolve_alert(alert_id)
