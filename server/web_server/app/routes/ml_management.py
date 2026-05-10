from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.controllers.ml_management import MLManagementController
from app.dependencies.rbac import require_roles
from app.models.user import UserRole

router = APIRouter(
    prefix="/ml",
    tags=["ML Management"]
)

def get_ml_controller(db: Session = Depends(get_db)):
    return MLManagementController(db)

@router.get("/versions", dependencies=[Depends(require_roles([UserRole.admin]))])
def get_model_versions(controller: MLManagementController = Depends(get_ml_controller)):
    return controller.get_model_versions()

@router.get("/data-stats", dependencies=[Depends(require_roles([UserRole.admin]))])
def get_data_stats(controller: MLManagementController = Depends(get_ml_controller)):
    return controller.get_data_stats()

@router.get("/datasets", dependencies=[Depends(require_roles([UserRole.admin]))])
def get_dataset_versions(controller: MLManagementController = Depends(get_ml_controller)):
    return controller.get_dataset_versions()

@router.get("/datasets/download", dependencies=[Depends(require_roles([UserRole.admin]))])
def download_dataset(file_name: str, controller: MLManagementController = Depends(get_ml_controller)):
    return controller.download_dataset(file_name)

@router.get("/status", dependencies=[Depends(require_roles([UserRole.admin]))])
def get_training_status(controller: MLManagementController = Depends(get_ml_controller)):
    return controller.get_training_status()

@router.get("/export", dependencies=[Depends(require_roles([UserRole.admin]))])
def export_data(format: str = "csv", controller: MLManagementController = Depends(get_ml_controller)):
    return controller.export_data(format)

@router.post("/retrain", dependencies=[Depends(require_roles([UserRole.admin]))])
def trigger_retraining(controller: MLManagementController = Depends(get_ml_controller)):
    return controller.trigger_retraining()
