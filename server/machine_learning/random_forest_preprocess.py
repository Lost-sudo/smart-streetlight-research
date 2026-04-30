"""
random_forest_preprocess.py
===========================
Preprocessing pipeline for the Random Forest Fault Detection model.

Handles:
  - Temporal feature engineering (diffs, rolling statistics)
  - Feature extraction (no scaling — RF is scale-invariant)
"""

import numpy as np
import pandas as pd

from random_forest_data import RF_FEATURES, RF_TARGET


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
    # --- Delta features: change from previous reading ---
    df["d_voltage"] = df["voltage"].diff().fillna(0)
    df["d_current"] = df["current"].diff().fillna(0)
    df["d_power"] = df["power"].diff().fillna(0)

    # --- Rolling statistics: variability over last 5 readings ---
    df["std_current_5"] = df["current"].rolling(5).std().fillna(0)
    df["std_voltage_5"] = df["voltage"].rolling(5).std().fillna(0)

    print(f"[rf_preprocess] Added temporal features: d_voltage, d_current, d_power, std_current_5, std_voltage_5")
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
    # 1. Sort by timestep to ensure temporal features are correct
    df = df.sort_values("timestep").reset_index(drop=True)

    # 2. Add temporal features
    df = add_temporal_features(df)

    # 3. Extract features and target
    X = df[RF_FEATURES].values
    y = df[RF_TARGET].values

    print(f"[rf_preprocess] X shape: {X.shape}, y shape: {y.shape}")
    print(f"[rf_preprocess] Class balance: 0={int((y==0).sum())}, 1={int((y==1).sum())}")
    print(f"[rf_preprocess] Features: {RF_FEATURES}")

    return X, y, df
