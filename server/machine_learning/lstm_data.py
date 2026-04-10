"""Synthetic sequential (time-series) streetlight sensor data for LSTM training."""

import numpy as np
import pandas as pd


LSTM_FEATURES = ["voltage", "current", "power_consumption", "light_intensity"]
LSTM_TARGET = "power_consumption"  # predict next-step power consumption


def _generate_single_node_series(
    node_id: int,
    n_timesteps: int,
    rng: np.random.RandomState,
) -> pd.DataFrame:
    t = np.arange(n_timesteps)

    degradation_factor = 1.0 + (t / n_timesteps) * 0.3

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
    print(f"\nSample rows (node 0, first 10 timesteps):")
    print(df[df["node_id"] == 0].head(10).to_string())
    print(f"\nDescriptive statistics:\n{df[LSTM_FEATURES].describe().to_string()}")
