"""
lstm_preprocess.py
==================
Preprocessing pipeline for the LSTM Degradation Trend Forecasting model.

Handles:
  - MinMaxScaler normalization (standard for neural networks)
  - Sliding-window sequence creation for LSTM input
  - Scaler persistence for inference-time reuse

The LSTM expects input shaped as (samples, timesteps, features).
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler

from lstm_data import LSTM_FEATURES, LSTM_TARGET

# Directory where fitted artifacts are saved
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


# ------------------------------------------------------------------ #
#  Scaling                                                            #
# ------------------------------------------------------------------ #

def scale_features(
    df: pd.DataFrame,
    fit: bool = True,
    scaler_filename: str = "lstm_scaler.joblib",
) -> tuple:
    """
    Applies MinMaxScaler to the LSTM feature columns.

    MinMaxScaler is preferred over StandardScaler for LSTM/neural networks
    because it bounds values between 0 and 1, which helps with sigmoid/tanh
    activation functions.

    Parameters
    ----------
    df : pd.DataFrame
        DataFrame containing the LSTM feature columns.
    fit : bool
        If True, fits a new scaler and saves it. If False, loads an
        existing scaler (for inference).
    scaler_filename : str
        Filename for the scaler artifact.

    Returns
    -------
    tuple of (scaled_array, scaler)
        - scaled_array: np.ndarray of shape (n_samples, n_features)
        - scaler: the fitted MinMaxScaler instance
    """
    scaler_path = os.path.join(MODELS_DIR, scaler_filename)

    if fit:
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled = scaler.fit_transform(df[LSTM_FEATURES].values)
        os.makedirs(MODELS_DIR, exist_ok=True)
        joblib.dump(scaler, scaler_path)
        print(f"[lstm_preprocess] MinMaxScaler fitted and saved to {scaler_path}")
    else:
        if not os.path.exists(scaler_path):
            raise FileNotFoundError(
                f"Scaler not found at {scaler_path}. Train the LSTM first."
            )
        scaler = joblib.load(scaler_path)
        scaled = scaler.transform(df[LSTM_FEATURES].values)
        print(f"[lstm_preprocess] MinMaxScaler loaded from {scaler_path}")

    return scaled, scaler


# ------------------------------------------------------------------ #
#  Sliding window sequence creation                                   #
# ------------------------------------------------------------------ #

def create_sequences(
    data: np.ndarray,
    lookback: int = 10,
    target_col_index: int = None,
) -> tuple:
    """
    Creates sliding-window sequences for LSTM training.

    Given a 2D array of shape (timesteps, features), produces:
      X : (n_samples, lookback, features)   — input sequences
      y : (n_samples,)                      — next-step target value

    Parameters
    ----------
    data : np.ndarray
        Scaled 2D array of shape (timesteps, features).
    lookback : int
        Number of past time steps to use as input (default: 10).
    target_col_index : int or None
        Column index for the target variable in `data`.
        If None, defaults to the `power_consumption` column index.

    Returns
    -------
    tuple of (X, y)
        X: np.ndarray of shape (n_samples, lookback, n_features)
        y: np.ndarray of shape (n_samples,)
    """
    if target_col_index is None:
        # power_consumption is the 3rd column (index 2) in LSTM_FEATURES
        target_col_index = LSTM_FEATURES.index(LSTM_TARGET)

    X, y = [], []

    for i in range(lookback, len(data)):
        X.append(data[i - lookback : i])           # past `lookback` steps
        y.append(data[i, target_col_index])         # next-step target

    return np.array(X), np.array(y)


# ------------------------------------------------------------------ #
#  Full preprocessing pipeline                                        #
# ------------------------------------------------------------------ #

def preprocess_pipeline(
    df: pd.DataFrame,
    lookback: int = 10,
    fit: bool = True,
) -> tuple:
    """
    Runs the full LSTM preprocessing pipeline:
      1. Scale features with MinMaxScaler
      2. Group by node and create sliding-window sequences
      3. Concatenate all node sequences

    Parameters
    ----------
    df : pd.DataFrame
        Raw sequential sensor data with a 'node_id' column.
    lookback : int
        Number of past time steps per input sequence (default: 10).
    fit : bool
        True for training (fits scaler), False for inference (loads scaler).

    Returns
    -------
    tuple of (X, y)
        X: np.ndarray of shape (total_samples, lookback, n_features)
        y: np.ndarray of shape (total_samples,)
    """
    # Scale features
    scaled_data, scaler = scale_features(df, fit=fit)

    # Build a temporary DataFrame with node_id for grouping
    df_scaled = pd.DataFrame(scaled_data, columns=LSTM_FEATURES)
    df_scaled["node_id"] = df["node_id"].values

    # Create sequences per node (to avoid cross-node contamination)
    all_X, all_y = [], []

    for node_id, group in df_scaled.groupby("node_id"):
        node_data = group[LSTM_FEATURES].values
        if len(node_data) > lookback:
            X_node, y_node = create_sequences(node_data, lookback=lookback)
            all_X.append(X_node)
            all_y.append(y_node)

    X = np.concatenate(all_X, axis=0)
    y = np.concatenate(all_y, axis=0)

    print(f"[lstm_preprocess] Sequences created: X={X.shape}, y={y.shape}")
    return X, y
