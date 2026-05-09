import os
import sys
import pandas as pd
from typing import Optional

# Setup paths to import from web_server/app
ML_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_DIR = os.path.dirname(ML_DIR)
WEB_SERVER_DIR = os.path.join(SERVER_DIR, "web_server")

if WEB_SERVER_DIR not in sys.path:
    sys.path.append(WEB_SERVER_DIR)

try:
    from app.core.database import SessionLocal
    from app.models.ml_version import MLVersion
    from app.core.config import settings
    from huggingface_hub import hf_hub_download
except ImportError:
    print("[retrain_utils] Warning: Could not import app modules. DB/Remote features will be limited.")

def get_latest_dataset_from_hf(base_name: str = "streetlight_dataset_augmented") -> Optional[str]:
    """
    Finds the latest version of the dataset in the DB and retrieves it.
    - If PROD=True: Downloads from HF.
    - If PROD=False: Loads from local machine_learning/datasets/.
    """
    db = SessionLocal()
    try:
        latest_v = db.query(MLVersion).filter(
            MLVersion.version_type == "dataset",
            MLVersion.base_name == base_name
        ).order_by(MLVersion.version_number.desc()).first()
        
        if not latest_v:
            print(f"[retrain_utils] No version history found in DB for {base_name}.")
            return None
            
        print(f"[retrain_utils] Found latest version: V{latest_v.version_number} ({latest_v.file_name})")
        
        if settings.PROD:
            # Download from HF
            local_path = hf_hub_download(
                repo_id=settings.HF_DATASET_REPO,
                filename=latest_v.file_name,
                repo_type="dataset",
                token=settings.HF_TOKEN
            )
            print(f"[retrain_utils] Successfully downloaded from HF to {local_path}")
        else:
            # Use local path
            local_path = os.path.join(ML_DIR, "datasets", latest_v.file_name)
            if not os.path.exists(local_path):
                print(f"[retrain_utils] Error: Local file not found at {local_path}")
                return None
            print(f"[retrain_utils] Using local file: {local_path}")
            
        return local_path
        
    except Exception as e:
        print(f"[retrain_utils] Error fetching dataset: {e}")
        return None
    finally:
        db.close()

def upload_trained_model_to_hf(model_path: str, version_number: int, base_name: str = "random_forest_model", metrics: dict = None):
    """
    Handles model registration:
    - If PROD=True: Uploads to HF and records in DB.
    - If PROD=False: Records local path in DB.
    """
    db = SessionLocal()
    try:
        filename = f"{base_name}_V{version_number}.joblib"
        if model_path.endswith(".pt") or model_path.endswith(".pth"):
            filename = f"{base_name}_V{version_number}.pt"
            
        hf_url = None
        if settings.PROD:
            from app.services.hugging_face_service import HuggingFaceService
            hf = HuggingFaceService()
            response = hf.upload_model(model_path, path_in_repo=filename, commit_message=f"Model Retraining V{version_number}")
            if response:
                hf_url = f"https://huggingface.co/{settings.HF_MODEL_REPO}/resolve/main/{filename}"
            else:
                print("[retrain_utils] Sync failed: Upload to Hugging Face failed.")
                return None
        
        new_v = MLVersion(
            version_type="model",
            version_number=version_number,
            file_name=filename,
            hf_url=hf_url,
            metrics=metrics,
            base_name=base_name,
            status="active"
        )
        db.add(new_v)
        db.commit()
        
        mode_str = "HF (Cloud)" if settings.PROD else "Local Storage"
        print(f"[retrain_utils] Model V{version_number} registered via {mode_str}.")
        return new_v
    except Exception as e:
        print(f"[retrain_utils] Error registering model: {e}")
    finally:
        db.close()
    return None

def upload_lstm_artifacts(model_path: str, scaler_path: str, target_scaler_path: str, version_number: int, metrics: dict = None):
    """
    Handles LSTM artifact registration (Model + Scalers).
    """
    db = SessionLocal()
    try:
        model_filename = f"lstm_model_V{version_number}.pt"
        hf_url = None
        
        if settings.PROD:
            from app.services.hugging_face_service import HuggingFaceService
            hf = HuggingFaceService()
            
            # Upload Model
            hf.upload_model(model_path, path_in_repo=model_filename, commit_message=f"LSTM Model V{version_number}")
            
            # Upload Scalers
            scaler_filename = f"lstm_scaler_V{version_number}.joblib"
            hf.upload_model(scaler_path, path_in_repo=scaler_filename, commit_message=f"LSTM Scaler V{version_number}")
            
            target_scaler_filename = f"lstm_target_scaler_V{version_number}.joblib"
            hf.upload_model(target_scaler_path, path_in_repo=target_scaler_filename, commit_message=f"LSTM Target Scaler V{version_number}")
            
            hf_url = f"https://huggingface.co/{settings.HF_MODEL_REPO}/resolve/main/{model_filename}"
        
        # Record in DB
        new_v = MLVersion(
            version_type="model",
            version_number=version_number,
            file_name=model_filename,
            hf_url=hf_url,
            metrics=metrics,
            base_name="lstm_model",
            status="active"
        )
        db.add(new_v)
        db.commit()
        
        mode_str = "HF (Cloud)" if settings.PROD else "Local Storage"
        print(f"[retrain_utils] LSTM Package V{version_number} registered via {mode_str}.")
        return new_v
    except Exception as e:
        print(f"[retrain_utils] Error registering LSTM artifacts: {e}")
    finally:
        db.close()
    return None

