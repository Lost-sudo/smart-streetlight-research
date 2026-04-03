from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.controllers.alert import AlertController
from app.core.database import get_db
from app.schemas.streetlight import AlertCreate, AlertRead, AlertUpdate
from typing import List

router = APIRouter(
    prefix="/alert",
    tags=["Alert"]
)

def get_alert_controller(db: Session = Depends(get_db)):
    return AlertController(db)

@router.post("/", response_model=AlertRead)
def create_alert(alert: AlertCreate, controller: AlertController = Depends(get_alert_controller)):
    return controller.create_alert(alert)

@router.get("/{alert_id}", response_model=AlertRead)
def get_alert(alert_id: int, controller: AlertController = Depends(get_alert_controller)):
    return controller.get_alert_by_id(alert_id)

@router.get("/", response_model=List[AlertRead])
def get_all_alerts(controller: AlertController = Depends(get_alert_controller)):
    return controller.get_all_alerts()

@router.patch("/{alert_id}", response_model=AlertRead)
def update_alert(alert_id: int, alert: AlertUpdate, controller: AlertController = Depends(get_alert_controller)):
    return controller.update_alert(alert_id, alert)

@router.delete("/{alert_id}")
def delete_alert(alert_id: int, controller: AlertController = Depends(get_alert_controller)):
    return controller.delete_alert(alert_id)
