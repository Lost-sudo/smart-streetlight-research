"""
random_forest_preprocess.py
===========================
Preprocessing pipeline for the Random Forest Fault Detection model.

Handles:
  - Temporal feature engineering (diffs, rolling statistics)
  - Feature extraction (no scaling — RF is scale-invariant)
"""

import os
import numpy as np
import pandas as pd

from random_forest_data import RF_FEATURES, RF_TARGET


DATASETS_DIR = os.path.join(os.path.dirname(__file__), "datasets")
DATASET_CSV = os.path.join(DATASETS_DIR, "streetlight_dataset.csv")


def add_temporal_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add temporal (delta + rolling) features to the DataFrame.

    These features allow the Random Forest to detect:
      - Voltage/current/power fluctuation over time
      - Degradation trends
      - Instability patterns

    The data MUST be sorted by time before calling this function.

    Parameters
    ----------
    df : pd.DataFrame
        DataFrame sorted by timestep, containing voltage, current, power.

    Returns
    -------
    pd.DataFrame
        DataFrame with added temporal features.
    """
    # Compute temporal features per device to avoid cross-device contamination.
    group_key = "device_id" if "device_id" in df.columns else None
    if group_key:
        g = df.groupby(group_key, sort=False)
        df["d_voltage"] = g["voltage"].diff().fillna(0)
        df["d_current"] = g["current"].diff().fillna(0)
        df["d_power"] = g["power"].diff().fillna(0)
        df["std_current_10"] = (
            g["current"].rolling(10).std().reset_index(level=0, drop=True).fillna(0)
        )
        df["std_voltage_10"] = (
            g["voltage"].rolling(10).std().reset_index(level=0, drop=True).fillna(0)
        )
        # --- New discriminative features ---
        v_max10 = g["voltage"].rolling(10).max().reset_index(level=0, drop=True).fillna(df["voltage"])
        v_min10 = g["voltage"].rolling(10).min().reset_index(level=0, drop=True).fillna(df["voltage"])
        c_max10 = g["current"].rolling(10).max().reset_index(level=0, drop=True).fillna(df["current"])
        c_min10 = g["current"].rolling(10).min().reset_index(level=0, drop=True).fillna(df["current"])
        df["voltage_range_10"] = v_max10 - v_min10
        df["current_range_10"] = c_max10 - c_min10
    else:
        df["d_voltage"] = df["voltage"].diff().fillna(0)
        df["d_current"] = df["current"].diff().fillna(0)
        df["d_power"] = df["power"].diff().fillna(0)
        df["std_current_10"] = df["current"].rolling(10).std().fillna(0)
        df["std_voltage_10"] = df["voltage"].rolling(10).std().fillna(0)
        # --- New discriminative features ---
        v_max10 = df["voltage"].rolling(10).max().fillna(df["voltage"])
        v_min10 = df["voltage"].rolling(10).min().fillna(df["voltage"])
        c_max10 = df["current"].rolling(10).max().fillna(df["current"])
        c_min10 = df["current"].rolling(10).min().fillna(df["current"])
        df["voltage_range_10"] = v_max10 - v_min10
        df["current_range_10"] = c_max10 - c_min10

    # Absolute delta features (computed after diff, works for both branches)
    df["abs_d_voltage"] = df["d_voltage"].abs()
    df["abs_d_current"] = df["d_current"].abs()

    print(f"[rf_preprocess] Added temporal features: d_voltage, d_current, d_power, std_current_10, std_voltage_10")
    print(f"[rf_preprocess] Added discriminative features: abs_d_voltage, abs_d_current, voltage_range_10, current_range_10")
    return df


def preprocess_pipeline(df: pd.DataFrame) -> tuple:
    """
    Preprocesses data for Random Forest training/inference.

    Steps:
      1. Sort by timestep (ensures temporal features are meaningful)
      2. Add temporal features (diffs, rolling stds)
      3. Extract feature matrix X and target vector y

    No StandardScaler is used — Random Forest is scale-invariant.

    Parameters
    ----------
    df : pd.DataFrame
        DataFrame containing raw sensor columns + failure_status target.

    Returns
    -------
    tuple of (X, y, df)
        X: np.ndarray of shape (n_samples, n_features) — raw features
        y: np.ndarray of shape (n_samples,) — target labels
        df: pd.DataFrame with added temporal features
    """
    # 1. Sort by device + timestep to ensure temporal features are correct
    if "device_id" in df.columns:
        df = df.sort_values(["device_id", "timestep"]).reset_index(drop=True)
    else:
        df = df.sort_values("timestep").reset_index(drop=True)

    # 2. Add temporal features
    df = add_temporal_features(df)

    # 3. Extract features and target
    X = df[RF_FEATURES].values
    y = df[RF_TARGET].values

    print(f"[rf_preprocess] X shape: {X.shape}, y shape: {y.shape}")
    classes, counts = np.unique(y, return_counts=True)
    class_report = ", ".join(f"{int(k)}={int(v)}" for k, v in zip(classes, counts))
    print(f"[rf_preprocess] Class balance: {class_report}")
    print(f"[rf_preprocess] Features: {RF_FEATURES}")

    return X, y, df


# ------------------------------------------------------------------ #
#  CLI: Run standalone to remove synthetic data                       #
# ------------------------------------------------------------------ #

if __name__ == "__main__":
    removed = remove_synthetic_from_csv()
    print(f"Done. Removed {removed} synthetic rows.")
