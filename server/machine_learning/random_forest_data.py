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
RF_TARGET = "failure_status"


def load_real_dataset(csv_path: str = DATASET_PATH) -> pd.DataFrame:
    """Load and prepare the real IoT dataset for Random Forest training.

    Steps:
      1. Load CSV
      2. Fix negative power (absolute value)
      3. Create binary target: failure_status (mode > 0 → 1)
      4. Keep ALL data (no gray-zone removal — real observations are genuine)

    Returns
    -------
    pd.DataFrame
        Cleaned DataFrame ready for temporal feature engineering.
    """
    df = pd.read_csv(csv_path)

    # --- Ensure power is always positive ---
    df["power"] = df["power"].abs()

    # --- Binary target: 0 = Normal, 1 = Faulty (any fault type) ---
    df["failure_status"] = (df["mode"] > 0).astype(int)

    normal_count = (df["failure_status"] == 0).sum()
    faulty_count = (df["failure_status"] == 1).sum()

    print(f"[rf_data] Loaded real IoT dataset: {csv_path}")
    print(f"[rf_data] Total samples: {len(df)}")
    print(f"[rf_data] Normal: {normal_count}, Faulty: {faulty_count}")
    print(f"[rf_data] Fault type breakdown:")
    for _, row in df.groupby(["mode", "fault_name"]).size().reset_index(name="count").iterrows():
        print(f"          mode={int(row['mode'])} ({row['fault_name']}): {row['count']}")

    return df


if __name__ == "__main__":
    df = load_real_dataset()
    print(f"\nDataset shape: {df.shape}")
    print(f"\nClass distribution:\n{df['failure_status'].value_counts()}")
    print(f"\nSample rows:\n{df.head(10).to_string()}")
    print(f"\nDescriptive statistics:\n{df[['voltage','current','power','ldr','pwm']].describe().to_string()}")
