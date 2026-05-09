"""
Loads real IoT sensor data from datasets/streetlight_dataset.csv for Random Forest training.

The Random Forest is a fault DETECTOR -- it classifies whether a streetlight
is currently in a "failed" state based on its current sensor snapshot
plus temporal features (diffs, rolling statistics).

Data source:
  - datasets/streetlight_dataset.csv  (collected from a real IoT streetlight device)

Columns used:
  - voltage, current, power, ldr, pwm  (raw sensor readings)
  - mode  (0 = NORMAL, 1-6 = various fault types → binarized to 0/1)
"""

import os
import numpy as np
import pandas as pd

from lstm_data import DATASET_PATH

# Features the Random Forest will use (real IoT sensor data + temporal features)
RF_FEATURES = [
    "voltage", "current", "power", "ldr",
    "d_voltage", "d_current", "d_power",
    "std_current_5", "std_voltage_5",
]
RF_TARGET = "fault_type"


from typing import Optional

def load_real_dataset(csv_path: str = DATASET_PATH, df: Optional[pd.DataFrame] = None, remote: bool = False) -> pd.DataFrame:
    """Load and prepare the real IoT dataset for Random Forest training.
    """
    if df is None:
        from retrain_utils import get_latest_dataset_from_hf
        
        # If remote is requested, OR if the default path doesn't exist, scan for latest
        if remote or not os.path.exists(csv_path):
            print(f"[rf_data] Scanning for latest dataset version...")
            latest_path = get_latest_dataset_from_hf()
            if latest_path:
                csv_path = latest_path
            else:
                if not os.path.exists(csv_path):
                    raise FileNotFoundError(f"[rf_data] No dataset found at {csv_path} and scan found no version history.")
                
        df = pd.read_csv(csv_path)

    # --- Ensure power is always positive ---
    if "power" in df.columns:
        df["power"] = df["power"].abs()

    # --- Multi-class target: 0-6 modes ---
    if "mode" in df.columns:
        df["fault_type"] = df["mode"].astype(int)

    # For backward compatibility or binary needs, we can still see normal vs faulty
    normal_count = (df["fault_type"] == 0).sum()
    faulty_count = (df["fault_type"] > 0).sum()

    print(f"[rf_data] Loaded multi-class dataset")
    print(f"[rf_data] Total samples: {len(df)}")
    print(f"[rf_data] Normal: {normal_count}, Faulty: {faulty_count}")
    
    if "fault_name" in df.columns:
        print(f"[rf_data] Multi-class distribution:")
        for _, row in df.groupby(["mode", "fault_name"]).size().reset_index(name="count").iterrows():
            print(f"          mode={int(row['mode'])} ({row['fault_name']}): {row['count']}")

    return df


if __name__ == "__main__":
    df = load_real_dataset()
    print(f"\nDataset shape: {df.shape}")
    print(f"\nClass distribution:\n{df['failure_status'].value_counts()}")
    print(f"\nSample rows:\n{df.head(10).to_string()}")
    print(f"\nDescriptive statistics:\n{df[['voltage','current','power','ldr','pwm']].describe().to_string()}")
