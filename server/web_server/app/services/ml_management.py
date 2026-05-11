from sqlalchemy.orm import Session
from app.models.ml_version import MLVersion
from app.core.config import settings
import logging
import threading
from datetime import datetime

logger = logging.getLogger(__name__)

# Global state for tracking retraining status across requests
_training_state = {
    "is_training": False,
    "progress": 0,
    "status_message": "Idle",
    "last_run": None,
    "error": None
}

class MLManagementService:
    def __init__(self, db: Session):
        self.db = db

    def get_current_model_versions(self):
        """
        Retrieves the latest versions for both Random Forest and LSTM models.
        """
        rf_version = self.db.query(MLVersion).filter(
            MLVersion.version_type == "model",
            MLVersion.base_name == "random_forest_model"
        ).order_by(MLVersion.version_number.desc()).first()

        lstm_version = self.db.query(MLVersion).filter(
            MLVersion.version_type == "model",
            MLVersion.base_name == "lstm_model"
        ).order_by(MLVersion.version_number.desc()).first()

        return {
            "random_forest": {
                "version": rf_version.version_number if rf_version else 0,
                "file_name": rf_version.file_name if rf_version else "N/A",
                "metrics": rf_version.metrics if rf_version else {},
                "created_at": rf_version.created_at if rf_version else None
            },
            "lstm": {
                "version": lstm_version.version_number if lstm_version else 0,
                "file_name": lstm_version.file_name if lstm_version else "N/A",
                "metrics": lstm_version.metrics if lstm_version else {},
                "created_at": lstm_version.created_at if lstm_version else None
            }
        }

    def get_data_stats(self):
        """
        Calculates statistics about the telemetry data repository.
        """
        from app.models.streetlight_log import StreetlightLog
        from sqlalchemy import func
        
        total_count = self.db.query(func.count(StreetlightLog.id)).scalar()
        
        # Estimate storage size (assuming ~200 bytes per record for metadata and indexes)
        # In a real app, you might query pg_total_relation_size
        estimated_bytes = total_count * 200 
        
        if estimated_bytes < 1024 * 1024:
            storage_str = f"{estimated_bytes / 1024:.1f} KB"
        else:
            storage_str = f"{estimated_bytes / (1024 * 1024):.1f} MB"

        return {
            "total_points": total_count,
            "storage_size": storage_str,
            "last_updated": datetime.utcnow().isoformat()
        }

    def export_data(self, format: str = "csv"):
        """
        Exports all telemetry logs in the specified format.
        """
        from app.models.streetlight_log import StreetlightLog
        import pandas as pd
        import io
        from fastapi.responses import StreamingResponse

        # Fetch data
        query = self.db.query(StreetlightLog)
        df = pd.read_sql(query.statement, self.db.bind)

        if format.lower() == "json":
            content = df.to_json(orient="records")
            return StreamingResponse(
                io.BytesIO(content.encode()),
                media_type="application/json",
                headers={"Content-Disposition": f"attachment; filename=telemetry_export_{datetime.utcnow().strftime('%Y%m%d')}.json"}
            )
        else:
            stream = io.StringIO()
            df.to_csv(stream, index=False)
            return StreamingResponse(
                io.BytesIO(stream.getvalue().encode()),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=telemetry_export_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
            )

    def get_dataset_versions(self):
        """
        Retrieves all recorded dataset snapshots from the database.
        """
        datasets = self.db.query(MLVersion).filter(
            MLVersion.version_type == "dataset"
        ).order_by(MLVersion.version_number.desc()).all()

        return [
            {
                "id": d.id,
                "version": d.version_number,
                "file_name": d.file_name,
                "row_count": d.row_count,
                "created_at": d.created_at,
                "hf_url": d.hf_url
            } for d in datasets
        ]

    def download_dataset_file(self, file_name: str):
        """
        Streams a physical dataset file from the local machine_learning/datasets directory.
        """
        import os
        from fastapi.responses import FileResponse
        
        SERVER_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        DATASETS_DIR = os.path.join(SERVER_DIR, "..", "machine_learning", "datasets")
        file_path = os.path.join(DATASETS_DIR, file_name)

        if not os.path.exists(file_path):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Dataset file not found on disk.")

        return FileResponse(
            path=file_path,
            filename=file_name,
            media_type="text/csv"
        )

    def get_training_status(self):
        """
        Returns the current state of the retraining pipeline.
        """
        return _training_state

    def trigger_retraining_background(self):
        """
        Triggers the retraining pipeline in a separate thread.
        """
        if _training_state["is_training"]:
            return {"message": "Retraining is already in progress.", "status": "active"}

        def run_retraining():
            global _training_state
            _training_state["is_training"] = True
            _training_state["progress"] = 0
            _training_state["error"] = None
            _training_state["status_message"] = "Initializing environment..."
            
            logger.info("Starting background retraining pipeline...")
            try:
                import sys
                import os
                SERVER_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                ML_PATH = os.path.join(SERVER_DIR, "..", "machine_learning")
                if ML_PATH not in sys.path:
                    sys.path.append(ML_PATH)
                
                # Step 0: Sync Dataset
                _training_state["progress"] = 10
                _training_state["status_message"] = "Synchronizing datasets..."
                from retrain_utils import update_dataset_from_db
                shared_csv_path = update_dataset_from_db("streetlight_dataset_augmented")
                
                # Step 1: LSTM Training
                _training_state["progress"] = 30
                _training_state["status_message"] = "Training LSTM model (Predictive Maintenance)..."
                from run_lstm import main as run_lstm
                run_lstm(csv_path=shared_csv_path)
                
                # Step 2: Random Forest Training
                _training_state["progress"] = 70
                _training_state["status_message"] = "Training Random Forest model (Fault Detection)..."
                from run_random_forest import main as run_rf
                run_rf(csv_path=shared_csv_path)
                
                _training_state["progress"] = 100
                _training_state["status_message"] = "Retraining completed successfully."
                _training_state["last_run"] = datetime.utcnow().isoformat()
                logger.info("Background retraining pipeline completed successfully.")
            except Exception as e:
                _training_state["error"] = str(e)
                _training_state["status_message"] = f"Error: {e}"
                logger.error(f"Error during background retraining: {e}")
            finally:
                # Keep status_message and progress for a few seconds so the client can see 100%
                # Then reset is_training
                import time
                time.sleep(5)
                _training_state["is_training"] = False
                if _training_state["progress"] == 100:
                     _training_state["status_message"] = "Idle"

        thread = threading.Thread(target=run_retraining)
        thread.start()
        return {"message": "Retraining pipeline started in the background.", "status": "started"}
