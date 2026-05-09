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
    Finds the latest version of the dataset in the DB and downloads it from HF.
    Returns the local path to the downloaded file.
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
        
        # Download from HF
        local_path = hf_hub_download(
            repo_id=settings.HF_DATASET_REPO,
            filename=latest_v.file_name,
            repo_type="dataset",
            token=settings.HF_TOKEN
        )
        print(f"[retrain_utils] Successfully downloaded to {local_path}")
        return local_path
        
    except Exception as e:
        print(f"[retrain_utils] Error fetching remote dataset: {e}")
        return None
    finally:
        db.close()

def upload_trained_model_to_hf(model_path: str, version_number: int, base_name: str = "random_forest_model", metrics: dict = None):
    """
    Uploads a newly trained model to HF and records it in the DB.
    """
    db = SessionLocal()
    try:
        from app.services.hugging_face_service import HuggingFaceService
        
        filename = f"{base_name}_V{version_number}.joblib"
        if model_path.endswith(".pt") or model_path.endswith(".pth"):
            filename = f"{base_name}_V{version_number}.pt"
            
        hf = HuggingFaceService()
        response = hf.upload_model(model_path, path_in_repo=filename, commit_message=f"Model Retraining V{version_number}")
        
        if response:
            hf_url = f"https://huggingface.co/{settings.HF_MODEL_REPO}/resolve/main/{filename}"
            new_v = MLVersion(
                version_type="model",
                version_number=version_number,
                file_name=filename,
                hf_url=hf_url,
                metrics=metrics,
                base_name=base_name
            )
            db.add(new_v)
            db.commit()
            print(f"[retrain_utils] Model V{version_number} uploaded and recorded.")
            return new_v
    except Exception as e:
        print(f"[retrain_utils] Error uploading model: {e}")
    finally:
        db.close()
    return None

def upload_lstm_artifacts(model_path: str, scaler_path: str, target_scaler_path: str, version_number: int, metrics: dict = None):
    """
    Uploads the LSTM model AND its associated scalers to HF.
    """
    db = SessionLocal()
    try:
        from app.services.hugging_face_service import HuggingFaceService
        hf = HuggingFaceService()
        
        # 1. Upload Model
        model_filename = f"lstm_model_V{version_number}.pt"
        hf.upload_model(model_path, path_in_repo=model_filename, commit_message=f"LSTM Model V{version_number}")
        
        # 2. Upload Scalers
        scaler_filename = f"lstm_scaler_V{version_number}.joblib"
        hf.upload_model(scaler_path, path_in_repo=scaler_filename, commit_message=f"LSTM Scaler V{version_number}")
        
        target_scaler_filename = f"lstm_target_scaler_V{version_number}.joblib"
        hf.upload_model(target_scaler_path, path_in_repo=target_scaler_filename, commit_message=f"LSTM Target Scaler V{version_number}")
        
        # 3. Record in DB
        hf_url = f"https://huggingface.co/{settings.HF_MODEL_REPO}/resolve/main/{model_filename}"
        new_v = MLVersion(
            version_type="model",
            version_number=version_number,
            file_name=model_filename,
            hf_url=hf_url,
            metrics=metrics,
            base_name="lstm_model"
        )
        db.add(new_v)
        db.commit()
        print(f"[retrain_utils] LSTM Package V{version_number} (Model + 2 Scalers) uploaded.")
        return new_v
    except Exception as e:
        print(f"[retrain_utils] Error uploading LSTM artifacts: {e}")
    finally:
        db.close()
    return None

