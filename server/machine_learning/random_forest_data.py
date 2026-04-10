"""Synthetic tabular streetlight sensor data for Random Forest training."""

import numpy as np
import pandas as pd


def generate_synthetic_dataset(
    n_samples: int = 2000,
    faulty_ratio: float = 0.25,
    random_state: int = 42,
) -> pd.DataFrame:
    rng = np.random.RandomState(random_state)

    n_faulty = int(n_samples * faulty_ratio)
    n_normal = n_samples - n_faulty

    normal_data = {
        "voltage": rng.normal(loc=220.0, scale=5.0, size=n_normal),
        "current": rng.normal(loc=0.45, scale=0.05, size=n_normal),
        "power_consumption": rng.normal(loc=100.0, scale=10.0, size=n_normal),
        "light_intensity": rng.normal(loc=350.0, scale=30.0, size=n_normal),
        "operating_hours": rng.uniform(low=0, high=5000, size=n_normal),
        "voltage_fluctuation": rng.normal(loc=0.02, scale=0.01, size=n_normal),
        "current_deviation": rng.normal(loc=0.0, scale=0.02, size=n_normal),
        "power_trend": rng.normal(loc=0.0, scale=0.5, size=n_normal),
        "fault_frequency": rng.poisson(lam=0.3, size=n_normal),
        "failure_status": np.zeros(n_normal, dtype=int),
    }

    faulty_data = {
        "voltage": rng.normal(loc=195.0, scale=15.0, size=n_faulty),
        "current": rng.normal(loc=0.70, scale=0.15, size=n_faulty),
        "power_consumption": rng.normal(loc=145.0, scale=25.0, size=n_faulty),
        "light_intensity": rng.normal(loc=180.0, scale=60.0, size=n_faulty),
        "operating_hours": rng.uniform(low=3000, high=10000, size=n_faulty),
        "voltage_fluctuation": rng.normal(loc=0.12, scale=0.05, size=n_faulty),
        "current_deviation": rng.normal(loc=0.25, scale=0.08, size=n_faulty),
        "power_trend": rng.normal(loc=3.0, scale=1.5, size=n_faulty),
        "fault_frequency": rng.poisson(lam=4.0, size=n_faulty),
        "failure_status": np.ones(n_faulty, dtype=int),
    }

    df_normal = pd.DataFrame(normal_data)
    df_faulty = pd.DataFrame(faulty_data)
    df = pd.concat([df_normal, df_faulty], ignore_index=True)
    df = df.sample(frac=1.0, random_state=random_state).reset_index(drop=True)

    return df


if __name__ == "__main__":
    df = generate_synthetic_dataset()
    print(f"Dataset shape: {df.shape}")
    print(f"\nClass distribution:\n{df['failure_status'].value_counts()}")
    print(f"\nSample rows:\n{df.head(10).to_string()}")
    print(f"\nDescriptive statistics:\n{df.describe().to_string()}")
