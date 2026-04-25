"""
Loads real IoT sensor data from datasets/dataset.csv for Random Forest training.

The Random Forest is a fault DETECTOR -- it classifies whether a streetlight
is currently in a "failed" state based on its current sensor snapshot
plus temporal features (diffs, rolling statistics).

Data source:
  - datasets/dataset.csv  (collected from a real IoT streetlight device)

Columns used:
  - voltage, current, power, ldr, pwm, mode  (raw sensor readings)
  - fault  (0 = NORMAL, 1-6 = various fault types → binarized to 0/1)
"""

import os
import numpy as np
import pandas as pd

DATASET_PATH = os.path.join(os.path.dirname(__file__), "datasets", "dataset.csv")


def load_real_dataset(csv_path: str = DATASET_PATH) -> pd.DataFrame:
    """Load and prepare the real IoT dataset for Random Forest training.

    Steps:
      1. Load CSV
      2. Fix negative power (absolute value)
      3. Encode mode as binary (NIGHT=1, DAY=0)
      4. Create binary target: failure_status (fault > 0 → 1)
      5. Keep ALL data (no gray-zone removal — real observations are genuine)

    Returns
    -------
    pd.DataFrame
        Cleaned DataFrame ready for temporal feature engineering.
    """
    df = pd.read_csv(csv_path)

    # --- Ensure power is always positive ---
    df["power"] = df["power"].abs()

    # --- Encode 'mode' as binary: NIGHT=1, DAY=0 ---
    df["mode_encoded"] = (df["mode"].str.upper() == "NIGHT").astype(int)

    # --- Binary target: 0 = Normal, 1 = Faulty (any fault type) ---
    df["failure_status"] = (df["fault"] > 0).astype(int)

    normal_count = (df["failure_status"] == 0).sum()
    faulty_count = (df["failure_status"] == 1).sum()

    print(f"[rf_data] Loaded real IoT dataset: {csv_path}")
    print(f"[rf_data] Total samples: {len(df)}")
    print(f"[rf_data] Normal: {normal_count}, Faulty: {faulty_count}")
    print(f"[rf_data] Fault type breakdown:")
    for _, row in df.groupby(["fault", "fault_name"]).size().reset_index(name="count").iterrows():
        print(f"          fault={int(row['fault'])} ({row['fault_name']}): {row['count']}")

    return df


if __name__ == "__main__":
    df = load_real_dataset()
    print(f"\nDataset shape: {df.shape}")
    print(f"\nClass distribution:\n{df['failure_status'].value_counts()}")
    print(f"\nSample rows:\n{df.head(10).to_string()}")
    print(f"\nDescriptive statistics:\n{df[['voltage','current','power','ldr','pwm']].describe().to_string()}")
