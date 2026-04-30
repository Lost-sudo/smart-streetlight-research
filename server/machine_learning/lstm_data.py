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

# Features the LSTM will use (real IoT sensor data)
# No 'timestep' — it's a monotonically increasing counter that leaks position,
# not sensor degradation patterns. The model must generalize across devices.
LSTM_FEATURES = ["voltage", "current", "power", "ldr"]
LSTM_TARGET = "time_to_failure"


# ------------------------------------------------------------------ #
#  Dataset path                                                       #
# ------------------------------------------------------------------ #

DATASET_PATH = os.path.join(
    os.path.dirname(__file__), "datasets", "streetlight_dataset.csv"
)


# ------------------------------------------------------------------ #
#  LSTM dataset loader                                                #
# ------------------------------------------------------------------ #

def load_lstm_dataset(csv_path: str = DATASET_PATH) -> pd.DataFrame:
    """Load the real IoT dataset and compute time_to_failure for LSTM training.

    Steps:
      1. Load CSV
      2. Ensure power is always positive
      3. Create binary failure_status from mode (mode > 0 → faulty)
      4. Compute time_to_failure per device:
         - For each row, count how many timesteps remain until the device
           transitions from NORMAL to a fault state (mode > 0).
         - Once in a fault state, time_to_failure = 0.
      5. Add node_id column for grouping during sequence creation.

    Returns
    -------
    pd.DataFrame
        DataFrame with LSTM features, time_to_failure target, and node_id.
    """
    df = pd.read_csv(csv_path)

    # --- Ensure power is always positive ---
    df["power"] = df["power"].abs()

    # --- Binary target: 0 = Normal, 1 = Faulty (any fault type) ---
    df["failure_status"] = (df["mode"] > 0).astype(int)

    # --- Sort by device and timestep ---
    df = df.sort_values(["device_id", "timestep"]).reset_index(drop=True)

    # --- Compute time_to_failure ---
    # For each device, we compute the reverse countdown to the next fault.
    # Walking backwards: if current row is faulty, ttf=0.
    # If current row is normal, ttf = distance (in rows) to the next faulty row.
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

    # --- Assign node_id (needed for LSTM sequence grouping) ---
    # Use the device_id directly, but map to integer for compatibility
    device_ids = df["device_id"].unique()
    device_map = {did: i for i, did in enumerate(device_ids)}
    df["node_id"] = df["device_id"].map(device_map)

    normal_count = (df["failure_status"] == 0).sum()
    faulty_count = (df["failure_status"] == 1).sum()

    print(f"[lstm_data] Loaded real IoT dataset: {csv_path}")
    print(f"[lstm_data] Total samples: {len(df)}")
    print(f"[lstm_data] Normal: {normal_count}, Faulty: {faulty_count}")
    print(f"[lstm_data] time_to_failure range: [{df['time_to_failure'].min():.0f}, {df['time_to_failure'].max():.0f}]")
    print(f"[lstm_data] Devices: {list(device_ids)}")
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
) -> pd.DataFrame:
    """Load the real dataset (legacy interface for run_lstm.py compatibility).

    The n_nodes, n_timesteps, and random_state parameters are ignored —
    the real dataset is always used.
    """
    return load_lstm_dataset()


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
