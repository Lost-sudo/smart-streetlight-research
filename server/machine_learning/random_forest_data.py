"""
Tabular sensor data for Random Forest training, filtered from the unified dataset.

The Random Forest is a fault DETECTOR -- it classifies whether a streetlight
is currently in a "failed" state based on its current sensor snapshot.

We filter the sequential dataset to keep only:
  - Clean NORMAL readings (early timesteps, before degradation kicks in)
  - Clear FAULT readings (timesteps where failure_status == 1)

This eliminates the "gray area" degradation zone, giving the RF a clean
binary classification problem.
"""

import numpy as np
import pandas as pd
from lstm_data import generate_sequential_dataset, RF_FEATURES, RF_TARGET


def generate_synthetic_dataset(
    n_nodes: int = 500,
    random_state: int = 42,
) -> pd.DataFrame:
    """Generate filtered normal-vs-fault dataset for Random Forest training."""
    # 1. Generate the full lifecycle data
    full_df = generate_sequential_dataset(
        n_nodes=n_nodes, n_timesteps=150, random_state=random_state
    )

    # 2. Keep only clean "Normal" data (first 20% of each node's life)
    #    and clear "Fault" data (failure_status == 1)
    max_timestep = full_df.groupby("node_id")["timestep"].transform("max")
    normal_cutoff = max_timestep * 0.20

    normal_df = full_df[full_df["timestep"] <= normal_cutoff].copy()
    normal_df["failure_status"] = 0  # Ensure label is clean

    faulty_df = full_df[full_df["failure_status"] == 1].copy()

    # 3. Concatenate and shuffle
    df = pd.concat([normal_df, faulty_df], ignore_index=True)
    df = df.sample(frac=1.0, random_state=random_state).reset_index(drop=True)

    print(f"[rf_data] Normal samples: {len(normal_df)}, Fault samples: {len(faulty_df)}")
    print(f"[rf_data] Total filtered dataset: {len(df)}")

    return df


if __name__ == "__main__":
    df = generate_synthetic_dataset()
    print(f"\nFiltered Dataset shape: {df.shape}")
    print(f"\nClass distribution:\n{df['failure_status'].value_counts()}")
    print(f"\nFeatures used: {RF_FEATURES}")
    print(f"\nSample rows:\n{df.head(10)[RF_FEATURES + [RF_TARGET]].to_string()}")
    print(f"\nDescriptive statistics:\n{df[RF_FEATURES].describe().to_string()}")
