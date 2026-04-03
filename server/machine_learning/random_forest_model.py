"""
random_forest_model.py
======================
Inference utilities for the trained Random Forest Failure Prediction model.

Provides functions to:
  - Load the trained model from disk
  - Run predictions on new sensor data
  - Load the fitted scaler for preprocessing new inputs

This module is intended to be imported by the FastAPI backend
for real-time inference (ML Design Document §11).
"""

import os
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

# Define the model directory path
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


def load_failure_prediction_model(
    model_filename: str = "random_forest_model.joblib",
) -> RandomForestClassifier:
    """
    Loads a trained Random Forest model from the 'models/' directory.

    Parameters
    ----------
    model_filename : str
        Filename of the serialized model (default: random_forest_model.joblib).

    Returns
    -------
    RandomForestClassifier or None
        The loaded model, or None if the file is not found.
    """
    model_path = os.path.join(MODELS_DIR, model_filename)
    if os.path.exists(model_path):
        model = joblib.load(model_path)
        print(f"[model] Random Forest loaded from {model_path}")
        return model
    else:
        print(f"[model] Model file {model_path} not found.")
        return None


def load_scaler(
    scaler_filename: str = "random_forest_scaler.joblib",
):
    """
    Loads the fitted StandardScaler from the 'models/' directory.

    Parameters
    ----------
    scaler_filename : str
        Filename of the serialized scaler (default: random_forest_scaler.joblib).

    Returns
    -------
    StandardScaler or None
        The loaded scaler, or None if the file is not found.
    """
    scaler_path = os.path.join(MODELS_DIR, scaler_filename)
    if os.path.exists(scaler_path):
        scaler = joblib.load(scaler_path)
        print(f"[model] Scaler loaded from {scaler_path}")
        return scaler
    else:
        print(f"[model] Scaler file {scaler_path} not found.")
        return None


def predict_failure_status(model, sensor_data: pd.DataFrame):
    """
    Predicts the failure status (Normal / Faulty) using the loaded model.

    Parameters
    ----------
    model : RandomForestClassifier
        A trained Random Forest model.
    sensor_data : pd.DataFrame
        Preprocessed sensor data with the expected feature columns.

    Returns
    -------
    tuple of (predictions, probabilities)
        - predictions: array of 0 (Normal) or 1 (Faulty)
        - probabilities: array of shape (n_samples, 2) with class probabilities
    """
    if model:
        predictions = model.predict(sensor_data)
        probabilities = model.predict_proba(sensor_data)
        return predictions, probabilities
    else:
        return None, None
