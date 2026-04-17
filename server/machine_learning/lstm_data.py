"""
Unified synthetic streetlight sensor data for both LSTM and Random Forest training.

Each node simulates a streetlight going through:
  Normal operation -> Gradual degradation -> Catastrophic failure

The dataset includes:
  - `time_to_failure`: countdown (in timesteps) until the node fails (LSTM regression target)
  - `failure_status`:  binary flag, 1 = the node is currently in a failed state (RF target)
  - `timestep`:        the current timestep of the node (included as an LSTM feature)
"""

import numpy as np
import pandas as pd


# Features the LSTM will use (includes timestep for temporal awareness)
LSTM_FEATURES = ["timestep", "voltage", "current", "power_consumption", "light_intensity"]
LSTM_TARGET = "time_to_failure"

# Features the Random Forest will use (snapshot-based, no temporal info)
RF_FEATURES = [
    "voltage", "current", "power_consumption", "light_intensity",
    "operating_hours", "voltage_fluctuation", "current_deviation",
    "power_trend", "fault_frequency",
]
RF_TARGET = "failure_status"


def _generate_single_node_series(
    node_id: int,
    n_timesteps: int,
    rng: np.random.RandomState,
) -> pd.DataFrame:
    """Generate a single streetlight's lifecycle: normal -> degradation -> failure."""
    t = np.arange(n_timesteps)

    # Point of failure (last 5% of timesteps)
    failure_idx = int(n_timesteps * 0.95)

    # --- Degradation factor: starts at 1.0, ramps up to ~1.35 at failure point ---
    degradation_factor = 1.0 + (t / failure_idx).clip(max=1.0) * 0.35

    # --- Core sensor readings degrade over time ---
    voltage = 220.0 - (t / failure_idx).clip(max=1.0) * 20.0 + rng.normal(0, 2.0, n_timesteps)
    current = 0.45 * degradation_factor + rng.normal(0, 0.03, n_timesteps)
    power_consumption = 100.0 * degradation_factor + rng.normal(0, 5.0, n_timesteps)
    light_intensity = 350.0 - (t / failure_idx).clip(max=1.0) * 150.0 + rng.normal(0, 15.0, n_timesteps)

    # --- Extra engineered features for Random Forest ---
    operating_hours = np.linspace(rng.uniform(500, 2000), rng.uniform(4000, 8000), num=n_timesteps)
    voltage_fluctuation = 0.02 * degradation_factor + rng.normal(0, 0.01, n_timesteps)
    current_deviation = 0.01 * degradation_factor + rng.normal(0, 0.02, n_timesteps)
    power_trend = (t / n_timesteps) * 2.0 + rng.normal(0, 0.1, n_timesteps)
    lam = 0.3 + (t / n_timesteps) * 3.0
    fault_frequency = rng.poisson(lam=lam, size=n_timesteps)

    # --- Failure status: binary label ---
    failure_status = np.zeros(n_timesteps, dtype=int)
    failure_status[failure_idx:] = 1

    # --- Time to failure: countdown in timesteps ---
    # Before failure point: counts down from failure_idx to 0
    # At and after failure point: 0 (already failed)
    time_to_failure = np.maximum(failure_idx - t, 0).astype(float)

    # --- When the node has actually failed, readings go catastrophic ---
    n_failed = n_timesteps - failure_idx
    voltage[failure_idx:] = rng.normal(80.0, 10.0, n_failed)
    current[failure_idx:] = rng.normal(2.5, 0.5, n_failed)
    power_consumption[failure_idx:] = rng.normal(500.0, 50.0, n_failed)
    light_intensity[failure_idx:] = rng.normal(10.0, 5.0, n_failed)
    voltage_fluctuation[failure_idx:] = rng.normal(0.15, 0.05, n_failed)
    current_deviation[failure_idx:] = rng.normal(0.30, 0.08, n_failed)
    fault_frequency[failure_idx:] = rng.poisson(lam=6.0, size=n_failed)

    df = pd.DataFrame({
        "node_id": node_id,
        "timestep": t,
        "voltage": voltage,
        "current": current,
        "power_consumption": power_consumption,
        "light_intensity": light_intensity,
        "operating_hours": operating_hours,
        "voltage_fluctuation": voltage_fluctuation,
        "current_deviation": current_deviation,
        "power_trend": power_trend,
        "fault_frequency": fault_frequency,
        "failure_status": failure_status,
        "time_to_failure": time_to_failure,
    })

    return df


def generate_sequential_dataset(
    n_nodes: int = 200,
    n_timesteps: int = 150,
    random_state: int = 42,
) -> pd.DataFrame:
    """Generate the full dataset across multiple streetlight nodes."""
    rng = np.random.RandomState(random_state)
    node_dfs = []

    for node_id in range(n_nodes):
        node_df = _generate_single_node_series(node_id, n_timesteps, rng)
        node_dfs.append(node_df)

    return pd.concat(node_dfs, ignore_index=True)


# --------------------------------------------------------------------- #
#  CLI entry point                                                       #
# --------------------------------------------------------------------- #
if __name__ == "__main__":
    df = generate_sequential_dataset()
    print(f"\nDataset shape: {df.shape}")
    print(f"\nSample rows (node 0, first 5 timesteps):")
    print(df[df["node_id"] == 0].head(5).to_string())
    print("\n... (middle of lifecycle) ...")
    mid = df[(df["node_id"] == 0) & (df["timestep"].between(70, 74))]
    print(mid.to_string())
    print("\n... (failure zone) ...")
    print(df[df["node_id"] == 0].tail(5).to_string())
    print(f"\ntime_to_failure stats:\n{df['time_to_failure'].describe()}")
    print(f"\nfailure_status distribution:\n{df['failure_status'].value_counts()}")
