"""
lstm_preprocess.py
==================
Preprocessing pipeline for the LSTM imminent-failure classifier.

Handles:
  - MinMaxScaler normalization for features (standard for neural networks)
  - Sliding-window sequence creation for LSTM input
  - Scaler persistence for inference-time reuse

The LSTM expects input shaped as (samples, timesteps, features).
Target: imminent_failure (binary classification)
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler

from lstm_data import LSTM_FEATURES

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


def derive_horizon_steps(df: pd.DataFrame, horizon_hours: int = 24) -> int:
    """Derive horizon steps from median timestep delta in the dataset."""
    if "device_id" not in df.columns or "timestep" not in df.columns:
        return max(1, horizon_hours * 6)
    deltas = (
        df.sort_values(["device_id", "timestep"])
        .groupby("device_id")["timestep"]
        .diff()
        .dropna()
    )
    median_delta = float(deltas.median()) if len(deltas) else 10.0
    if median_delta <= 0:
        median_delta = 10.0
    horizon_minutes = horizon_hours * 60.0
    return max(1, int(round(horizon_minutes / median_delta)))


def build_imminent_failure_target(df: pd.DataFrame, horizon_steps: int) -> np.ndarray:
    """Build binary label: 1 if system failure occurs within horizon."""
    if "time_to_failure" not in df.columns:
        raise ValueError("time_to_failure is required to derive imminent failure target.")
    return (df["time_to_failure"].values <= float(horizon_steps)).astype(np.float32)


# ------------------------------------------------------------------ #
#  Sliding window sequence creation                                   #
# ------------------------------------------------------------------ #

def create_sequences(
    data: np.ndarray,
    target_data: np.ndarray,
    lookback: int = 10,
) -> tuple:
    """
    Creates sliding-window sequences for LSTM training.

    Given a 2D array of shape (timesteps, features) and a 1D target array, produces:
      X : (n_samples, lookback, features)   - input sequences
      y : (n_samples,)                      - target value at the end of the window

    Parameters
    ----------
    data : np.ndarray
        Scaled 2D array of shape (timesteps, features).
    target_data : np.ndarray
        1D array of shape (timesteps,) with time_to_failure values.
    lookback : int
        Number of past time steps to use as input (default: 10).

    Returns
    -------
    tuple of (X, y)
        X: np.ndarray of shape (n_samples, lookback, n_features)
        y: np.ndarray of shape (n_samples,)
    """
    X, y = [], []

    for i in range(lookback, len(data)):
        X.append(data[i - lookback : i])          # past `lookback` steps as features
        y.append(target_data[i])                   # time_to_failure at current step

    return np.array(X), np.array(y)


# ------------------------------------------------------------------ #
#  Full preprocessing pipeline                                        #
# ------------------------------------------------------------------ #

def preprocess_pipeline(
    df: pd.DataFrame,
    lookback: int = 10,
    horizon_hours: int = 24,
    fault_only: bool = True,
    fit: bool = True,
) -> tuple:
    """
    Runs the full LSTM preprocessing pipeline:
      1. Scale features with MinMaxScaler
      2. Build binary imminent-failure target from horizon
      3. Group by node and create sliding-window sequences
      4. Concatenate all node sequences

    Parameters
    ----------
    df : pd.DataFrame
        Raw sequential sensor data with a 'node_id' column.
    lookback : int
        Number of past time steps per input sequence (default: 10).
    fit : bool
        True for training (fits scalers), False for inference (loads scalers).

    Returns
    -------
    tuple of (X, y, feature_scaler, horizon_steps)
        X: np.ndarray of shape (total_samples, lookback, n_features)
        y: np.ndarray of shape (total_samples,) — binary labels {0, 1}
    """
    # Scale features
    scaled_data, feature_scaler = scale_features(df, fit=fit)

    horizon_steps = derive_horizon_steps(df, horizon_hours=horizon_hours)
    imminent_target = build_imminent_failure_target(df, horizon_steps=horizon_steps)

    # Build a temporary DataFrame with node_id for grouping
    df_scaled = pd.DataFrame(scaled_data, columns=LSTM_FEATURES)
    df_scaled["node_id"] = df["node_id"].values
    df_scaled["imminent_failure"] = imminent_target
    df_scaled["mode"] = df["mode"].values if "mode" in df.columns else 0

    # Create sequences per node (to avoid cross-node contamination)
    all_X, all_y, all_node_ids = [], [], []

    for node_id, group in df_scaled.groupby("node_id"):
        node_data = group[LSTM_FEATURES].values
        node_target = group["imminent_failure"].values
        node_mode = group["mode"].values
        if len(node_data) > lookback:
            X_node, y_node = create_sequences(node_data, node_target, lookback=lookback)
            # Context alignment: keep only samples where current row is fault state
            # so the classifier learns to predict failure progression after a fault trigger.
            if fault_only:
                mode_at_target = node_mode[lookback:]
                keep = mode_at_target != 0
                X_node = X_node[keep]
                y_node = y_node[keep]
            if len(X_node) > 0:
                all_X.append(X_node)
                all_y.append(y_node)
                all_node_ids.append(np.full(len(y_node), int(node_id), dtype=np.int32))

    X = np.concatenate(all_X, axis=0)
    y = np.concatenate(all_y, axis=0)
    node_ids = np.concatenate(all_node_ids, axis=0)

    positive_rate = float(y.mean()) if len(y) else 0.0
    context_label = "fault-only" if fault_only else "all-context"
    print(f"[lstm_preprocess] Sequences created ({context_label}): X={X.shape}, y={y.shape}")
    print(
        f"[lstm_preprocess] Horizon: {horizon_hours}h -> {horizon_steps} steps, "
        f"positive rate={positive_rate:.4f}"
    )
    return X, y.astype(np.float32), node_ids, feature_scaler, horizon_steps
