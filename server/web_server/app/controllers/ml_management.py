from sqlalchemy.orm import Session
from app.services.ml_management import MLManagementService

class MLManagementController:
    def __init__(self, db: Session):
        self.service = MLManagementService(db)

    def get_model_versions(self):
        return self.service.get_current_model_versions()

    def get_data_stats(self):
        return self.service.get_data_stats()

    def get_dataset_versions(self):
        return self.service.get_dataset_versions()

    def download_dataset(self, file_name: str):
        return self.service.download_dataset_file(file_name)

    def get_training_status(self):
        return self.service.get_training_status()

    def export_data(self, format: str = "csv"):
        return self.service.export_data(format)

    def trigger_retraining(self):
        return self.service.trigger_retraining_background()
