"""
Unified data module for both LSTM and Random Forest training.

Loads real IoT sensor data from datasets/streetlight_dataset.csv.

Dataset columns:
  device_id, timestep, ldr, light_intensity, voltage, current, power,
  mode (fault code: 0=normal, 1-6=fault types), fault_name, pwm

The module provides:
  - Feature/target definitions for both models
  - Real dataset loader with time_to_failure computation for the LSTM
  - Real dataset loader for Random Forest fault detection
"""

import os
import numpy as np
import pandas as pd


# ------------------------------------------------------------------ #
#  Feature / target definitions                                       #
# ------------------------------------------------------------------ #

# Features the LSTM will use (real IoT sensor data + derived features)
# We now include 'elapsed_time' derived from timesteps to help the model 
# understand where it is in the lifecycle.
LSTM_FEATURES = ["voltage", "current", "power", "ldr", "elapsed_time", "fault_code", "confidence"]
LSTM_TARGET = "imminent_failure"


# ------------------------------------------------------------------ #
#  Dataset path                                                       #
# ------------------------------------------------------------------ #

DATASET_PATH = os.path.join(
    os.path.dirname(__file__), "datasets", "streetlight_dataset_augmented.csv"
)


# ------------------------------------------------------------------ #
#  LSTM dataset loader                                                #
# ------------------------------------------------------------------ #

from typing import Optional

def load_lstm_dataset(csv_path: str = DATASET_PATH, df: Optional[pd.DataFrame] = None, remote: bool = False) -> pd.DataFrame:
    """Load the real IoT dataset and compute time_to_failure for LSTM training.
    """
    if df is None:
        from retrain_utils import get_latest_dataset_from_hf
        
        # If remote is requested, OR if the default path doesn't exist, scan for latest
        if remote or not os.path.exists(csv_path):
            print(f"[lstm_data] Scanning for latest dataset version...")
            latest_path = get_latest_dataset_from_hf()
            if latest_path:
                csv_path = latest_path
            else:
                if not os.path.exists(csv_path):
                    raise FileNotFoundError(f"[lstm_data] No dataset found at {csv_path} and scan found no version history.")
                
        df = pd.read_csv(csv_path)

    # --- Ensure power is always positive ---
    if "power" in df.columns:
        df["power"] = df["power"].abs()

    # --- Define terminal failure state ---
    # We ONLY treat mode 5 (SYSTEM_FAILURE) as the terminal EOL state (TTF=0).
    # Other faults (1-4, 6) are considered "degraded" but not failed,
    # which teaches the model to predict a "flow" of risk rather than 100% immediately.
    if "mode" in df.columns:
        df["failure_status"] = (df["mode"] == 5).astype(int)
        df["fault_code"] = df["mode"].astype(float)
    else:
        df["fault_code"] = 0.0

    # --- Sort by device and timestep ---
    if "device_id" in df.columns and "timestep" in df.columns:
        df = df.sort_values(["device_id", "timestep"]).reset_index(drop=True)

    # --- Derived Feature: elapsed_time (utilize the timesteps) ---
    # We calculate how many steps have passed since the device started.
    if "device_id" in df.columns and "timestep" in df.columns:
        df["elapsed_time"] = df.groupby("device_id")["timestep"].transform(lambda x: x - x.min())

    # --- Compute time_to_failure ---
    # For each device, we compute the reverse countdown to the next fault.
    if "device_id" in df.columns and "failure_status" in df.columns:
        ttf_values = np.zeros(len(df), dtype=float)

        for device_id, group in df.groupby("device_id"):
            idx = group.index.values
            fault_flags = group["failure_status"].values
            n = len(fault_flags)
            ttf = np.zeros(n, dtype=float)

            # Walk backwards to compute time_to_failure
            countdown = 0.0
            for i in range(n - 1, -1, -1):
                if fault_flags[i] == 1:
                    countdown = 0.0
                else:
                    countdown += 1.0
                ttf[i] = countdown

            ttf_values[idx] = ttf

        df["time_to_failure"] = ttf_values

    # Binary target for LSTM classifier is created in preprocessing where
    # horizon-to-steps is derived from dataset cadence.

    # --- Assign node_id (needed for LSTM sequence grouping) ---
    # Use the device_id directly, but map to integer for compatibility
    if "device_id" in df.columns:
        device_ids = df["device_id"].unique()
        device_map = {did: i for i, did in enumerate(device_ids)}
        df["node_id"] = df["device_id"].map(device_map)

    # --- Generate confidence from Random Forest model ---
    # If a trained RF model exists, use it to compute confidence scores
    # for each row. This mirrors what happens at inference time.
    try:
        from retrain_utils import get_latest_model_path
        rf_path = get_latest_model_path("random_forest_model")
        if rf_path and os.path.exists(rf_path):
            import joblib
            rf_model = joblib.load(rf_path)

            # Compute temporal features needed by the RF model
            g = df.groupby("device_id", sort=False)
            temp_df = df.copy()
            temp_df["d_voltage"] = g["voltage"].diff().fillna(0)
            temp_df["d_current"] = g["current"].diff().fillna(0)
            temp_df["d_power"] = g["power"].diff().fillna(0)
            temp_df["std_voltage_5"] = g["voltage"].rolling(5).std().reset_index(level=0, drop=True).fillna(0)
            temp_df["std_current_5"] = g["current"].rolling(5).std().reset_index(level=0, drop=True).fillna(0)
            v_max5 = g["voltage"].rolling(5).max().reset_index(level=0, drop=True).fillna(temp_df["voltage"])
            v_min5 = g["voltage"].rolling(5).min().reset_index(level=0, drop=True).fillna(temp_df["voltage"])
            c_max5 = g["current"].rolling(5).max().reset_index(level=0, drop=True).fillna(temp_df["current"])
            c_min5 = g["current"].rolling(5).min().reset_index(level=0, drop=True).fillna(temp_df["current"])
            temp_df["abs_d_voltage"] = temp_df["d_voltage"].abs()
            temp_df["abs_d_current"] = temp_df["d_current"].abs()
            temp_df["voltage_range_5"] = v_max5 - v_min5
            temp_df["current_range_5"] = c_max5 - c_min5

            from random_forest_data import RF_FEATURES
            X_rf = temp_df[RF_FEATURES].values
            probas = rf_model.predict_proba(X_rf)
            confidence = np.max(probas, axis=1)
            df["confidence"] = confidence
            print(f"[lstm_data] RF confidence scores injected: mean={confidence.mean():.4f}, min={confidence.min():.4f}, max={confidence.max():.4f}")
        else:
            df["confidence"] = 0.5
            print("[lstm_data] No RF model found. Using default confidence=0.5")
    except Exception as e:
        df["confidence"] = 0.5
        print(f"[lstm_data] Failed to compute RF confidence ({e}). Using default confidence=0.5")

    normal_count = (df["failure_status"] == 0).sum() if "failure_status" in df.columns else 0
    faulty_count = (df["failure_status"] == 1).sum() if "failure_status" in df.columns else 0

    print(f"[lstm_data] Loaded real IoT dataset")
    print(f"[lstm_data] Total samples: {len(df)}")
    print(f"[lstm_data] Normal: {normal_count}, Faulty: {faulty_count}")
    
    if "time_to_failure" in df.columns:
        print(f"[lstm_data] time_to_failure range: [{df['time_to_failure'].min():.0f}, {df['time_to_failure'].max():.0f}]")
    
    if "device_id" in df.columns:
        print(f"[lstm_data] Devices: {list(df['device_id'].unique())}")
        
    if "mode" in df.columns and "fault_name" in df.columns:
        print(f"[lstm_data] Fault type breakdown:")
        for _, row in df.groupby(["mode", "fault_name"]).size().reset_index(name="count").iterrows():
            print(f"          mode={int(row['mode'])} ({row['fault_name']}): {row['count']}")

    return df


# ------------------------------------------------------------------ #
#  Legacy compatibility: generate_sequential_dataset wraps the loader #
# ------------------------------------------------------------------ #

def generate_sequential_dataset(
    n_nodes: int = 200,
    n_timesteps: int = 150,
    random_state: int = 42,
    df: Optional[pd.DataFrame] = None
) -> pd.DataFrame:
    """Load the real dataset (legacy interface for run_lstm.py compatibility).

    The n_nodes, n_timesteps, and random_state parameters are ignored —
    the real dataset is always used.
    """
    return load_lstm_dataset(df=df)


# --------------------------------------------------------------------- #
#  CLI entry point                                                       #
# --------------------------------------------------------------------- #
if __name__ == "__main__":
    df = load_lstm_dataset()
    print(f"\nDataset shape: {df.shape}")
    print(f"\nSample rows (first 10):")
    print(df.head(10).to_string())
    print(f"\ntime_to_failure stats:\n{df['time_to_failure'].describe()}")
    print(f"\nfailure_status distribution:\n{df['failure_status'].value_counts()}")
