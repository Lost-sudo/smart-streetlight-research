import os
import sys
import pandas as pd
from typing import Optional, List

# --- Auto-fix PYTHONPATH for 'app' imports ---
# This ensures that we can always find the web_server/app modules 
# regardless of which directory we run the script from.
ML_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(ML_DIR, "models")
DATASETS_DIR = os.path.join(ML_DIR, "datasets")
SERVER_DIR = os.path.dirname(ML_DIR)
WEB_SERVER_DIR = os.path.join(SERVER_DIR, "web_server")

if WEB_SERVER_DIR not in sys.path:
    sys.path.insert(0, WEB_SERVER_DIR)

try:
    from app.core.database import SessionLocal
    from app.models.ml_version import MLVersion
    from app.core.config import settings
    from huggingface_hub import hf_hub_download, HfApi
except ImportError as e:
    print(f"[retrain_utils] Warning: Could not import app modules: {e}")

def get_next_model_version(base_name: str) -> int:
    """
    Finds the next version number for a model by scanning DB and Storage.
    """
    db = SessionLocal()
    found_version = 0
    try:
        # 1. Check DB
        latest_v = db.query(MLVersion).filter(
            MLVersion.version_type == "model",
            MLVersion.base_name == base_name
        ).order_by(MLVersion.version_number.desc()).first()
        
        if latest_v:
            found_version = latest_v.version_number
        else:
            # 2. Bootstrap: Scan Storage if DB is empty
            print(f"[retrain_utils] No DB records for {base_name}. Scanning storage...")
            if settings.PROD:
                try:
                    api = HfApi()
                    files = api.list_repo_files(repo_id=settings.HF_MODEL_REPO, repo_type="model", token=settings.HF_TOKEN)
                    version_files = [f for f in files if f.startswith(base_name) and "_V" in f]
                    if version_files:
                        versions = [int(f.split("_V")[-1].split(".")[0]) for f in version_files]
                        found_version = max(versions)
                except Exception as e:
                    print(f"[retrain_utils] Cloud scan failed: {e}")
            else:
                import glob
                local_pattern = os.path.join(ML_DIR, "models", f"{base_name}_V*")
                local_files = glob.glob(local_pattern)
                if local_files:
                    versions = []
                    for f in local_files:
                        try:
                            v = int(os.path.basename(f).split("_V")[-1].split(".")[0])
                            versions.append(v)
                        except: continue
                    if versions:
                        found_version = max(versions)
                        
        if found_version > 0:
            print(f"[retrain_utils] Found existing {base_name} V{found_version}. Next will be V{found_version + 1}")
    finally:
        db.close()
    
    return found_version + 1

def get_latest_dataset_from_hf(base_name: str = "streetlight_dataset_augmented") -> Optional[str]:
    """
    Finds the latest version of the dataset and retrieves it.
    - Scans DB first.
    - If DB is empty, scans Storage (Local or HF Repo).
    """
    db = SessionLocal()
    found_version = 0
    latest_filename = None
    
    try:
        # 1. Check DB
        latest_v = db.query(MLVersion).filter(
            MLVersion.version_type == "dataset",
            MLVersion.base_name == base_name
        ).order_by(MLVersion.version_number.desc()).first()
        
        if latest_v:
            found_version = latest_v.version_number
            latest_filename = latest_v.file_name
        else:
            # 2. Universal Bootstrap: Scan storage if DB is empty
            print(f"[retrain_utils] No DB records for dataset {base_name}. Scanning storage...")
            if settings.PROD:
                try:
                    from huggingface_hub import HfApi
                    api = HfApi()
                    files = api.list_repo_files(repo_id=settings.HF_DATASET_REPO, repo_type="dataset", token=settings.HF_TOKEN)
                    version_files = [f for f in files if f.startswith(base_name) and "_V" in f and f.endswith(".csv")]
                    if version_files:
                        versions = [int(f.split("_V")[-1].split(".")[0]) for f in version_files]
                        found_version = max(versions)
                        latest_filename = f"{base_name}_V{found_version}.csv"
                except Exception as e:
                    print(f"[retrain_utils] Cloud scan failed: {e}")
                local_pattern = os.path.join(DATASETS_DIR, f"{base_name}_V*.csv")
                local_files = glob.glob(local_pattern)
                if local_files:
                    versions = []
                    for f in local_files:
                        try:
                            v = int(os.path.basename(f).split("_V")[-1].split(".")[0])
                            versions.append(v)
                        except: continue
                    if versions:
                        found_version = max(versions)
                        latest_filename = f"{base_name}_V{found_version}.csv"

        if not latest_filename:
            print(f"[retrain_utils] No dataset found for {base_name}.")
            return None
            
        print(f"[retrain_utils] Latest version identified: V{found_version} ({latest_filename})")
        
        if settings.PROD:
            # Download from HF
            local_path = hf_hub_download(
                repo_id=settings.HF_DATASET_REPO,
                filename=latest_filename,
                repo_type="dataset",
                token=settings.HF_TOKEN
            )
            print(f"[retrain_utils] Successfully downloaded from HF to {local_path}")
            local_path = os.path.join(DATASETS_DIR, latest_filename)
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
    Handles model registration and physical versioning.
    """
    db = SessionLocal()
    try:
        ext = ".joblib"
        if model_path.endswith(".pt") or model_path.endswith(".pth"):
            ext = ".pt"
        filename = f"{base_name}_V{version_number}{ext}"
        
        # Physical Versioning locally
        versioned_local_path = os.path.join(MODELS_DIR, filename)
        if os.path.abspath(model_path) != os.path.abspath(versioned_local_path):
            import shutil
            shutil.copy2(model_path, versioned_local_path)
            print(f"[retrain_utils] Versioned model saved locally: {versioned_local_path}")
            
        hf_url = None
        if settings.PROD:
            from app.services.hugging_face_service import HuggingFaceService
            hf = HuggingFaceService()
            response = hf.upload_model(versioned_local_path, path_in_repo=filename, commit_message=f"Model Retraining V{version_number}")
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
    Handles LSTM artifact registration and physical versioning locally.
    """
    db = SessionLocal()
    try:
        model_filename = f"lstm_model_V{version_number}.pt"
        scaler_filename = f"lstm_scaler_V{version_number}.joblib"
        target_scaler_filename = f"lstm_target_scaler_V{version_number}.joblib"
        
        # Physical Versioning locally
        import shutil
        MODELS_DIR = os.path.dirname(model_path)
        shutil.copy2(model_path, os.path.join(MODELS_DIR, model_filename))
        shutil.copy2(scaler_path, os.path.join(MODELS_DIR, scaler_filename))
        shutil.copy2(target_scaler_path, os.path.join(MODELS_DIR, target_scaler_filename))
        print(f"[retrain_utils] Versioned artifacts saved locally in {MODELS_DIR}")

        hf_url = None
        if settings.PROD:
            from app.services.hugging_face_service import HuggingFaceService
            hf = HuggingFaceService()
            
            # Upload versioned files
            hf.upload_model(os.path.join(MODELS_DIR, model_filename), path_in_repo=model_filename)
            hf.upload_model(os.path.join(MODELS_DIR, scaler_filename), path_in_repo=scaler_filename)
            hf.upload_model(os.path.join(MODELS_DIR, target_scaler_filename), path_in_repo=target_scaler_filename)
            
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


def get_latest_model_path(base_name: str) -> Optional[str]:
    """
    Finds the latest versioned model path for inference.
    - Scans DB for the latest 'active' version.
    - If PROD=True: Downloads from HF if not local.
    - If PROD=False: Uses local versioned file.
    """
    db = SessionLocal()
    try:
        latest_v = db.query(MLVersion).filter(
            MLVersion.version_type == "model",
            MLVersion.base_name == base_name
        ).order_by(MLVersion.version_number.desc()).first()
        
        if not latest_v:
            # Universal Bootstrap for Inference: Scan storage if DB is empty
            print(f"[retrain_utils] Inference: No DB record for {base_name}. Scanning storage...")
            import glob
            ext = ".pt" if "lstm" in base_name else ".joblib"
            local_pattern = os.path.join(MODELS_DIR, f"{base_name}_V*{ext}")
            local_files = glob.glob(local_pattern)
            if local_files:
                versions = []
                for f in local_files:
                    try:
                        v = int(os.path.basename(f).split("_V")[-1].split(".")[0])
                        versions.append(v)
                    except: continue
                if versions:
                    found_version = max(versions)
                    latest_filename = f"{base_name}_V{found_version}{ext}"
                    local_path = os.path.join(MODELS_DIR, latest_filename)
                    print(f"[retrain_utils] Inference: Bootstrapped to local {latest_filename}")
                    return local_path
            return None
            
        filename = latest_v.file_name
        print(f"[retrain_utils] Inference: Using {base_name} V{latest_v.version_number} ({filename})")
        
        if settings.PROD and latest_v.hf_url:
            # Ensure it exists locally via HF download
            local_path = hf_hub_download(
                repo_id=settings.HF_MODEL_REPO,
                filename=filename,
                repo_type="model",
                token=settings.HF_TOKEN
            )
            return local_path
        else:
            local_path = os.path.join(MODELS_DIR, filename)
            if os.path.exists(local_path):
                return local_path
            
        return None
    except Exception as e:
        print(f"[retrain_utils] Error getting model path: {e}")
        return None
    finally:
        db.close()

def get_and_register_next_dataset(base_name: str) -> str:
    """
    Ensures a new dataset version is created and registered for the current run.
    1. Finds latest version (e.g. V1).
    2. Downloads it (if PROD and missing).
    3. Fetches NEW logs from DB.
    4. Saves as V2.
    5. Registers V2 in DB/Cloud.
    Returns the path to the NEW versioned dataset.
    """
    # Fix pathing
    import sys
    import pandas as pd
    if str(SERVER_DIR / "web_server") not in sys.path:
        sys.path.append(str(SERVER_DIR / "web_server"))
    
    from app.services.ml_data_service import MLDataService
    
    # A. Get current latest
    latest_path = get_latest_dataset_path(base_name)
    current_v = 0
    if latest_path:
        try:
            current_v = int(os.path.basename(latest_path).split("_V")[-1].split(".")[0])
        except: pass
    
    next_v = current_v + 1
    new_filename = f"{base_name}_V{next_v}.csv"
    new_local_path = os.path.join(DATASETS_DIR, new_filename)
    
    print(f"[retrain_utils] Preparing Dataset {new_filename} for this run...")
    
    # B. Load existing data
    if latest_path and os.path.exists(latest_path):
        df = pd.read_csv(latest_path)
    else:
        # Fallback to base if V1 doesn't exist
        fallback = os.path.join(DATASETS_DIR, f"{base_name}.csv")
        df = pd.read_csv(fallback) if os.path.exists(fallback) else pd.DataFrame()

    # C. Try to append NEW logs from DB
    try:
        data_service = MLDataService()
        new_df = data_service.get_latest_logs_as_df()
        if not new_df.empty:
            print(f"[retrain_utils] Appending {len(new_df)} new logs from DB.")
            df = pd.concat([df, new_df], ignore_index=True)
        else:
            print(f"[retrain_utils] No new logs in DB. Aligning version {next_v} with existing data.")
    except Exception as e:
        print(f"[retrain_utils] Warning: Could not fetch new logs from DB: {e}")

    # D. Save the new version
    df.to_csv(new_local_path, index=False)
    
    # E. Register the new version
    hf_url = None
    if settings.PROD:
        from hf_service import upload_to_hf
        hf_url = upload_to_hf(new_local_path, settings.HF_DATASET_REPO, repo_type="dataset")
    
    db = SessionLocal()
    try:
        new_record = MLVersion(
            version_type="dataset",
            version_number=next_v,
            file_name=new_filename,
            hf_url=hf_url,
            row_count=len(df),
            base_name=base_name,
            status="active"
        )
        db.add(new_record)
        db.commit()
        print(f"[retrain_utils] Dataset {new_filename} registered successfully.")
    finally:
        db.close()
        
    return new_local_path

def update_dataset_from_db(base_name: str = "streetlight_dataset_augmented") -> str:
    """
    Fetches new logs from DB, merges with latest version, and ALWAYS 
    creates a new dataset version (V_n+1).
    Returns the path to the new versioned CSV.
    """
    from app.services.ml_data_service import MLDataService
    db = SessionLocal()
    try:
        # 1. Fetch new data from DB (last 3 months)
        print(f"[retrain_utils] Fetching new telemetry from database...")
        df_new = MLDataService.fetch_training_data(db, n_months=3)
        
        if df_new.empty:
            print("[retrain_utils] No new logs found in database. Creating a new version from existing data...")
        else:
            print(f"[retrain_utils] Found {len(df_new)} new logs to append.")
            
        # 2. Sync/Version (This always increments the version)
        new_v_record = MLDataService.sync_dataset_to_hf(db, df_new, base_name=base_name)
        
        if not new_v_record:
            raise Exception("Failed to sync/version dataset.")
            
        new_path = os.path.join(DATASETS_DIR, new_v_record.file_name)
        return new_path
        
    except Exception as e:
        print(f"[retrain_utils] Error during dataset update: {e}")
        # Fallback to just loading latest if update fails
        return get_latest_dataset_from_hf(base_name)
    finally:
        db.close()

def get_latest_model_path(base_name: str) -> Optional[str]:
    """
    Finds the latest versioned model path for inference.
    - Scans DB for the latest 'active' version.
    - If PROD=True: Downloads from HF if not local.
    - If PROD=False: Uses local versioned file.
    """
    db = SessionLocal()
    try:
        latest_v = db.query(MLVersion).filter(
            MLVersion.version_type == "model",
            MLVersion.base_name == base_name
        ).order_by(MLVersion.version_number.desc()).first()
        
        if not latest_v:
            # Universal Bootstrap for Inference: Scan storage if DB is empty
            print(f"[retrain_utils] Inference: No DB record for {base_name}. Scanning storage...")
            import glob
            ext = ".pt" if "lstm" in base_name else ".joblib"
            local_pattern = os.path.join(MODELS_DIR, f"{base_name}_V*{ext}")
            local_files = glob.glob(local_pattern)
            if local_files:
                versions = []
                for f in local_files:
                    try:
                        v = int(os.path.basename(f).split("_V")[-1].split(".")[0])
                        versions.append(v)
                    except: continue
                if versions:
                    found_version = max(versions)
                    latest_filename = f"{base_name}_V{found_version}{ext}"
                    local_path = os.path.join(MODELS_DIR, latest_filename)
                    print(f"[retrain_utils] Inference: Bootstrapped to local {latest_filename}")
                    return local_path
            return None
            
        filename = latest_v.file_name
        print(f"[retrain_utils] Inference: Using {base_name} V{latest_v.version_number} ({filename})")
        
        if settings.PROD and latest_v.hf_url:
            # Ensure it exists locally via HF download
            local_path = hf_hub_download(
                repo_id=settings.HF_MODEL_REPO,
                filename=filename,
                repo_type="model",
                token=settings.HF_TOKEN
            )
            return local_path
        else:
            local_path = os.path.join(MODELS_DIR, filename)
            if os.path.exists(local_path):
                return local_path
            
        return None
    except Exception as e:
        print(f"[retrain_utils] Error getting model path: {e}")
        return None
    finally:
        db.close()
