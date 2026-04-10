"""Preprocessing utilities for the Random Forest failure predictor."""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


RAW_FEATURES = [
    "voltage",
    "current",
    "power_consumption",
    "light_intensity",
    "operating_hours",
]

ENGINEERED_FEATURES = [
    "voltage_fluctuation",
    "current_deviation",
    "power_trend",
    "fault_frequency",
]

ALL_FEATURES = RAW_FEATURES + ENGINEERED_FEATURES

TARGET_COLUMN = "failure_status"


def handle_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
    return df


def scale_features(
    df: pd.DataFrame,
    fit: bool = True,
    scaler_filename: str = "random_forest_scaler.joblib",
) -> pd.DataFrame:
    scaler_path = os.path.join(MODELS_DIR, scaler_filename)

    if fit:
        scaler = StandardScaler()
        df[ALL_FEATURES] = scaler.fit_transform(df[ALL_FEATURES])
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
    df = handle_missing_values(df)
    df = scale_features(df, fit=fit)
    return df
