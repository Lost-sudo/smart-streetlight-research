import os
import tempfile
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Optional, List

from app.models.streetlight_log import StreetlightLog
from app.models.ml_version import MLVersion
from app.services.hugging_face_service import HuggingFaceService
from app.core.config import settings

FAULT_TYPE_MAP = {
    "NORMAL": 0,
    "VOLTAGE_FLUCTUATION": 1,
    "OVERCURRENT": 2,
    "SENSOR_DEGRADATION": 3,
    "LAMP_DEGRADATION": 4,
    "SYSTEM_FAILURE": 5,
    "INTERMITTENT_FAULT": 6
}

REVERSE_FAULT_TYPE_MAP = {v: k for k, v in FAULT_TYPE_MAP.items()}

class MLDataService:
    @staticmethod
    def _format_dataset_for_csv(df: pd.DataFrame) -> pd.DataFrame:
        """
        Private helper to format a DataFrame to match the standard streetlight dataset schema.
        """
        df_out = df.copy()
        
        # Rename columns to match CSV schema
        name_map = {
            "streetlight_id": "device_id",
            "power_consumption": "power",
            "light_intensity": "ldr"
        }
        df_out = df_out.rename(columns=name_map)
        
        # Map mode back to fault_name for the CSV
        if 'mode' in df_out.columns:
            df_out['fault_name'] = df_out['mode'].map(REVERSE_FAULT_TYPE_MAP).fillna("UNKNOWN")
        
        # Generate timestep if missing
        if 'device_id' in df_out.columns and 'timestep' not in df_out.columns:
            df_out['timestep'] = df_out.groupby('device_id').cumcount()
            
        # Ensure standard columns exist
        csv_columns = ["device_id", "timestep", "ldr", "light_intensity", "voltage", "current", "power", "mode", "fault_name", "pwm"]
        if "light_intensity" not in df_out.columns:
            df_out["light_intensity"] = 0
            
        # Filter to keep only standard columns
        existing_cols = [col for col in csv_columns if col in df_out.columns]
        return df_out[existing_cols]

    @staticmethod
    def fetch_training_data(db: Session, n_months: int = 3) -> pd.DataFrame:
        """
        Fetches historical streetlight logs from the database for the last N months.
        """
        start_date = datetime.utcnow() - timedelta(days=n_months * 30)
        
        query = db.query(StreetlightLog).filter(StreetlightLog.timestamp >= start_date)
        
        # Load into pandas
        df = pd.read_sql(query.statement, db.bind)
        
        if df.empty:
            return df
            
        # Ensure timestamp is datetime
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Map fault_type string to integer
        df['mode'] = df['fault_type'].map(FAULT_TYPE_MAP).fillna(0).astype(int)
        
        return df

    @staticmethod
    def preprocess_for_rf(df: pd.DataFrame) -> pd.DataFrame:
        """
        Prepares data for Random Forest training (multi-class fault detection).
        """
        if df.empty:
            return df
            
        # Copy to avoid modifying the original
        df_rf = df.copy()
        
        # Data Cleaning: Absolute values for power-related fields
        df_rf["power_consumption"] = df_rf["power_consumption"].abs()
        
        # Drop the original string fault_type column to avoid conflicts with renamed 'mode'
        if "fault_type" in df_rf.columns:
            df_rf = df_rf.drop(columns=["fault_type"])
            
        # Standardize column names to match what training scripts expect
        # Map internal DB names to training names
        name_map = {
            "power_consumption": "power",
            "light_intensity": "ldr",
            "mode": "fault_type"
        }
        df_rf = df_rf.rename(columns=name_map)
        
        # Ensure critical features are present and non-null
        required_features = ["voltage", "current", "power", "ldr", "pwm"]
        df_rf = df_rf.dropna(subset=required_features)
        
        return df_rf

    @staticmethod
    def preprocess_for_lstm(df: pd.DataFrame) -> pd.DataFrame:
        """
        Prepares data for LSTM training (Predictive Maintenance / TTF).
        """
        if df.empty:
            return df
            
        df_lstm = df.copy()
        
        # Data Cleaning
        df_lstm["power_consumption"] = df_lstm["power_consumption"].abs()
        
        # Sort by device and timestamp
        df_lstm = df_lstm.sort_values(["streetlight_id", "timestamp"]).reset_index(drop=True)
        
        # Rename for compatibility
        name_map = {
            "streetlight_id": "device_id",
            "power_consumption": "power",
            "light_intensity": "ldr"
        }
        df_lstm = df_lstm.rename(columns=name_map)
        
        # Create 'timestep' column based on sequence per device
        df_lstm["timestep"] = df_lstm.groupby("device_id").cumcount()
        
        # Define terminal failure state (mode 5 = SYSTEM_FAILURE)
        df_lstm["failure_status"] = (df_lstm["mode"] == 5).astype(int)
        
        # Compute time_to_failure (TTF)
        # We compute the distance to the next failure_status == 1
        ttf_values = np.zeros(len(df_lstm), dtype=float)
        
        for device_id, group in df_lstm.groupby("device_id"):
            idx = group.index.values
            fault_flags = group["failure_status"].values
            n = len(fault_flags)
            ttf = np.zeros(n, dtype=float)
            
            countdown = 0.0
            found_failure = False
            # Walk backwards
            for i in range(n - 1, -1, -1):
                if fault_flags[i] == 1:
                    countdown = 0.0
                    found_failure = True
                else:
                    if found_failure:
                        countdown += 1.0
                    else:
                        # If no failure found yet in the future, we could use a max TTF or exclude
                        # For now, let's keep it as a large number or just count from the end
                        countdown += 1.0
                ttf[i] = countdown
            
            ttf_values[idx] = ttf
            
        df_lstm["time_to_failure"] = ttf_values
        
        # Feature engineering: elapsed_time
        df_lstm["elapsed_time"] = df_lstm.groupby("device_id")["timestep"].transform(lambda x: x - x.min())
        
        return df_lstm

    @staticmethod
    def get_balanced_dataset(df: pd.DataFrame, target_col: str = "fault_type") -> pd.DataFrame:
        """
        Oversamples rare fault types to ensure a balanced dataset.
        """
        if df.empty:
            return df
            
        # Count samples per class
        counts = df[target_col].value_counts()
        max_count = counts.max()
        
        balanced_dfs = []
        for class_val, count in counts.items():
            class_df = df[df[target_col] == class_val]
            if count < max_count:
                # Oversample
                oversampled = class_df.sample(max_count, replace=True, random_state=42)
                balanced_dfs.append(oversampled)
            else:
                balanced_dfs.append(class_df)
                
        return pd.concat(balanced_dfs).sample(frac=1, random_state=42).reset_index(drop=True)

    @staticmethod
    def export_to_csv(df: pd.DataFrame, base_name: str = "streetlight_dataset", versioned: bool = True, append: bool = False, upload_to_hf: bool = False) -> str:
        """
        Exports the DataFrame to a CSV file. 
        DEPRECATED: Use sync_dataset_to_hf for cloud-first operations.
        """
        # Determine the target directory relative to this file
        CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
        SERVER_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", ".."))
        base_path = os.path.join(SERVER_ROOT, "machine_learning", "datasets")
        os.makedirs(base_path, exist_ok=True)
        
        # Format the data
        df_new = MLDataService._format_dataset_for_csv(df)
        base_filepath = os.path.join(base_path, f"{base_name}.csv")
        filepath = base_filepath
        
        if versioned:
            # Combine Original + New for a full snapshot
            if os.path.exists(base_filepath):
                df_orig = pd.read_csv(base_filepath)
                df_final = pd.concat([df_orig, df_new], ignore_index=True)
            else:
                df_final = df_new
                
            # Find the next version number
            version = 1
            while os.path.exists(os.path.join(base_path, f"{base_name}_V{version}.csv")):
                version += 1
            
            filepath = os.path.join(base_path, f"{base_name}_V{version}.csv")
            df_final.to_csv(filepath, index=False)
            print(f"[export] Created local versioned snapshot: {filepath}")
            
        elif append:
            header = not os.path.exists(base_filepath)
            df_new.to_csv(base_filepath, mode='a', index=False, header=header)
            print(f"[export] Appended {len(df_new)} rows to {base_filepath}")
            
        else:
            df_new.to_csv(base_filepath, index=False)
            print(f"[export] Overwrote local dataset: {base_filepath}")

        # Cloud Upload Integration
        if upload_to_hf:
            hf = HuggingFaceService()
            hf.upload_dataset(filepath, commit_message=f"Dataset Snapshot: {os.path.basename(filepath)}")
            
        return filepath

    @staticmethod
    def sync_dataset_to_hf(db: Session, df_new: pd.DataFrame, base_name: str = "streetlight_dataset_augmented") -> "MLVersion":
        """
        Cloud-First Synchronization:
        1. Finds the latest version in the database.
        2. Downloads previous snapshot from HF (if exists).
        3. Merges with new data.
        4. Uploads to HF as a new version.
        5. Updates the database with the new version record.
        """
        from huggingface_hub import hf_hub_download
        
        # 1. Find latest version
        latest_v = db.query(MLVersion).filter(
            MLVersion.version_type == "dataset",
            MLVersion.base_name == base_name
        ).order_by(MLVersion.version_number.desc()).first()
        
        next_version = (latest_v.version_number + 1) if latest_v else 1
        
        # Format the new logs
        df_batch = MLDataService._format_dataset_for_csv(df_new)
        df_merged = df_batch

        # 2. Download and Merge if history exists
        if latest_v and latest_v.hf_url:
            try:
                print(f"[sync] Downloading previous version V{latest_v.version_number} from HF...")
                local_prev_path = hf_hub_download(
                    repo_id=settings.HF_DATASET_REPO,
                    filename=latest_v.file_name,
                    repo_type="dataset",
                    token=settings.HF_TOKEN
                )
                df_orig = pd.read_csv(local_prev_path)
                df_merged = pd.concat([df_orig, df_batch], ignore_index=True)
                print(f"[sync] Successfully merged with V{latest_v.version_number} ({len(df_orig)} rows)")
            except Exception as e:
                print(f"[sync] Warning: Could not load previous version: {e}")

        # 3. Save to a temporary file for upload
        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
            tmp_path = tmp.name
            df_merged.to_csv(tmp_path, index=False)
        
        # 4. Upload to Hugging Face
        filename = f"{base_name}_V{next_version}.csv"
        hf = HuggingFaceService()
        response = hf.upload_dataset(tmp_path, path_in_repo=filename, commit_message=f"Dataset Snapshot V{next_version}")
        
        # Clean up temp file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
            
        if not response:
            print("[sync] Sync failed: Upload to Hugging Face failed.")
            return None
            
        # 5. Update Database Record
        hf_url = f"https://huggingface.co/datasets/{settings.HF_DATASET_REPO}/resolve/main/{filename}"
        new_v = MLVersion(
            version_type="dataset",
            version_number=next_version,
            file_name=filename,
            hf_url=hf_url,
            row_count=len(df_merged),
            base_name=base_name
        )
        db.add(new_v)
        db.commit()
        db.refresh(new_v)
        
        print(f"[sync] Success! Dataset synced to HF as V{next_version} ({len(df_merged)} rows)")
        return new_v
