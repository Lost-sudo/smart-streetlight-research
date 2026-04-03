"""
lstm_data.py
============
Generates synthetic sequential (time-series) streetlight sensor data
for training the LSTM Degradation Trend Forecasting model.

Problem Type: Time-Series Regression (Degradation Forecasting)
Target     : Next-step power consumption value

The generator simulates multiple streetlight nodes, each producing a
time series of sensor readings that gradually degrade over time,
mimicking real-world component wear.

Features (from ML Design Document §5):
  - voltage (V)
  - current (A)
  - power_consumption (W)
  - light_intensity (Lux)
"""

import numpy as np
import pandas as pd


# ------------------------------------------------------------------ #
#  Sensor feature names used by the LSTM                              #
# ------------------------------------------------------------------ #
LSTM_FEATURES = ["voltage", "current", "power_consumption", "light_intensity"]
LSTM_TARGET = "power_consumption"  # predict next-step power consumption


def _generate_single_node_series(
    node_id: int,
    n_timesteps: int,
    rng: np.random.RandomState,
) -> pd.DataFrame:
    """
    Generates a single streetlight node's time-series data with
    gradual degradation injected into the signal.

    Parameters
    ----------
    node_id : int
        Identifier for the simulated node.
    n_timesteps : int
        Number of time steps to simulate.
    rng : np.random.RandomState
        Random state for reproducibility.

    Returns
    -------
    pd.DataFrame
        Time-ordered DataFrame with sensor features.
    """
    t = np.arange(n_timesteps)

    # Base signals with slight degradation trend
    degradation_factor = 1.0 + (t / n_timesteps) * 0.3  # gradual increase

    voltage = 220.0 - (t / n_timesteps) * 15.0 + rng.normal(0, 2.0, n_timesteps)
    current = 0.45 * degradation_factor + rng.normal(0, 0.03, n_timesteps)
    power_consumption = (
        100.0 * degradation_factor + rng.normal(0, 5.0, n_timesteps)
    )
    light_intensity = (
        350.0 - (t / n_timesteps) * 100.0 + rng.normal(0, 15.0, n_timesteps)
    )

    df = pd.DataFrame({
        "node_id": node_id,
        "timestep": t,
        "voltage": voltage,
        "current": current,
        "power_consumption": power_consumption,
        "light_intensity": light_intensity,
    })

    return df


def generate_sequential_dataset(
    n_nodes: int = 50,
    n_timesteps: int = 200,
    random_state: int = 42,
) -> pd.DataFrame:
    """
    Generates a multi-node sequential dataset for LSTM training.

    Each node produces `n_timesteps` sensor readings in order,
    simulating gradual degradation over the node's lifetime.

    Parameters
    ----------
    n_nodes : int
        Number of simulated streetlight nodes (default: 50).
    n_timesteps : int
        Number of time steps per node (default: 200).
    random_state : int
        Seed for reproducibility.

    Returns
    -------
    pd.DataFrame
        DataFrame with columns: node_id, timestep, voltage, current,
        power_consumption, light_intensity.
        Total rows = n_nodes × n_timesteps.
    """
    rng = np.random.RandomState(random_state)
    node_dfs = []

    for node_id in range(n_nodes):
        node_df = _generate_single_node_series(node_id, n_timesteps, rng)
        node_dfs.append(node_df)

    df = pd.concat(node_dfs, ignore_index=True)
    print(f"[lstm_data] Generated {n_nodes} nodes × {n_timesteps} timesteps = {len(df)} rows")
    return df


# --------------------------------------------------------------------- #
#  CLI entry point                                                       #
# --------------------------------------------------------------------- #
if __name__ == "__main__":
    df = generate_sequential_dataset()
    print(f"\nDataset shape: {df.shape}")
    print(f"\nSample rows (node 0, first 10 timesteps):")
    print(df[df["node_id"] == 0].head(10).to_string())
    print(f"\nDescriptive statistics:\n{df[LSTM_FEATURES].describe().to_string()}")
