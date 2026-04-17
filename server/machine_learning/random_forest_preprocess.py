"""
random_forest_preprocess.py
===========================
Preprocessing pipeline for the Random Forest Fault Detection model.

Handles:
  - StandardScaler normalization
  - Feature extraction
  - Scaler persistence for inference-time reuse
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

from lstm_data import RF_FEATURES, RF_TARGET

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


def preprocess_pipeline(
    df: pd.DataFrame,
    fit: bool = True,
    scaler_filename: str = "random_forest_scaler.joblib",
) -> tuple:
    """
    Preprocesses data for Random Forest training/inference.

    Parameters
    ----------
    df : pd.DataFrame
        DataFrame containing RF features and target.
    fit : bool
        If True, fits a new scaler and saves it.
        If False, loads an existing scaler (for inference).
    scaler_filename : str
        Filename for the scaler artifact.

    Returns
    -------
    tuple of (X, y, scaler)
        X: np.ndarray of shape (n_samples, n_features) -- scaled features
        y: np.ndarray of shape (n_samples,) -- target labels
        scaler: the fitted StandardScaler instance
    """
    scaler_path = os.path.join(MODELS_DIR, scaler_filename)

    X = df[RF_FEATURES].values
    y = df[RF_TARGET].values

    if fit:
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        os.makedirs(MODELS_DIR, exist_ok=True)
        joblib.dump(scaler, scaler_path)
        print(f"[rf_preprocess] StandardScaler fitted and saved to {scaler_path}")
    else:
        if not os.path.exists(scaler_path):
            raise FileNotFoundError(
                f"Scaler not found at {scaler_path}. Train the Random Forest first."
            )
        scaler = joblib.load(scaler_path)
        X_scaled = scaler.transform(X)
        print(f"[rf_preprocess] StandardScaler loaded from {scaler_path}")

    print(f"[rf_preprocess] X shape: {X_scaled.shape}, y shape: {y.shape}")
    print(f"[rf_preprocess] Class balance: 0={int((y==0).sum())}, 1={int((y==1).sum())}")
    return X_scaled, y, scaler
