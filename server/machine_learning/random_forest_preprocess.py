"""
random_forest_preprocess.py
===========================
Data preprocessing pipeline for the Random Forest Failure Prediction model.

Follows ML Design Document §6:
  - Handles missing values (mean substitution)
  - Normalizes / scales numerical features (StandardScaler)
  - Persists the fitted scaler alongside the model for inference-time reuse
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler

# Directory where fitted artifacts (scaler, etc.) are saved
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


# ------------------------------------------------------------------ #
#  Feature definitions                                                #
# ------------------------------------------------------------------ #

# Raw sensor features
RAW_FEATURES = [
    "voltage",
    "current",
    "power_consumption",
    "light_intensity",
    "operating_hours",
]

# Engineered features
ENGINEERED_FEATURES = [
    "voltage_fluctuation",
    "current_deviation",
    "power_trend",
    "fault_frequency",
]

# All features expected by the model (in order)
ALL_FEATURES = RAW_FEATURES + ENGINEERED_FEATURES

# Target column
TARGET_COLUMN = "failure_status"


# ------------------------------------------------------------------ #
#  Preprocessing functions                                            #
# ------------------------------------------------------------------ #

def handle_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    """
    Fills missing values using column-wise mean substitution.
    (ML Design Document §6 — Handling missing values)
    """
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
    return df


def scale_features(
    df: pd.DataFrame,
    fit: bool = True,
    scaler_filename: str = "random_forest_scaler.joblib",
) -> pd.DataFrame:
    """
    Applies StandardScaler normalization to all feature columns.

    Parameters
    ----------
    df : pd.DataFrame
        DataFrame containing at least the columns listed in ALL_FEATURES.
    fit : bool
        If True, fits a new scaler and saves it. If False, loads a
        previously-fitted scaler (for inference).
    scaler_filename : str
        Name of the scaler artifact file.

    Returns
    -------
    pd.DataFrame
        The DataFrame with scaled feature columns.
    """
    scaler_path = os.path.join(MODELS_DIR, scaler_filename)

    if fit:
        scaler = StandardScaler()
        df[ALL_FEATURES] = scaler.fit_transform(df[ALL_FEATURES])
        # Persist the scaler so it can be loaded at inference time
        os.makedirs(MODELS_DIR, exist_ok=True)
        joblib.dump(scaler, scaler_path)
        print(f"[preprocess] Scaler fitted and saved to {scaler_path}")
    else:
        if not os.path.exists(scaler_path):
            raise FileNotFoundError(
                f"Scaler file not found at {scaler_path}. "
                "Train the model first to generate the scaler."
            )
        scaler = joblib.load(scaler_path)
        df[ALL_FEATURES] = scaler.transform(df[ALL_FEATURES])
        print(f"[preprocess] Scaler loaded from {scaler_path}")

    return df


def preprocess_pipeline(
    df: pd.DataFrame,
    fit: bool = True,
) -> pd.DataFrame:
    """
    Runs the full preprocessing pipeline:
      1. Handle missing values
      2. Scale features

    Parameters
    ----------
    df : pd.DataFrame
        Raw or generated sensor data.
    fit : bool
        True for training (fits scaler), False for inference (loads scaler).

    Returns
    -------
    pd.DataFrame
        Preprocessed DataFrame ready for model training or prediction.
    """
    df = handle_missing_values(df)
    df = scale_features(df, fit=fit)
    return df
