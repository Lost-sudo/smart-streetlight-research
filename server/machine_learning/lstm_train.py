"""
lstm_train.py
=============
Training pipeline for the LSTM Degradation Trend Forecasting model.

Problem Type : Time-Series Regression
Algorithm    : Long Short-Term Memory (LSTM) via PyTorch
Target       : Next-step power consumption prediction

Follows the ML Design Document:
  §7.3  — LSTM for degradation trend forecasting
  §8    — Model Training Strategy (70 / 15 / 15 split)
  §9    — Evaluation Metric: Mean Absolute Error (MAE)

Note: TensorFlow is not available for Python 3.14, so PyTorch is used instead.
      The model is exported as a .pt file.
"""

import os
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from sklearn.model_selection import train_test_split

# Directory where model artifacts are persisted
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


# ------------------------------------------------------------------ #
#  Data splitting (§8.2) — adapted for time-series                    #
# ------------------------------------------------------------------ #

def split_sequences(
    X: np.ndarray,
    y: np.ndarray,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    random_state: int = 42,
) -> tuple:
    """
    Splits sequence data into Training (70%), Validation (15%),
    and Test (15%) sets.

    Parameters
    ----------
    X : np.ndarray
        Input sequences of shape (n_samples, lookback, n_features).
    y : np.ndarray
        Target values of shape (n_samples,).
    train_ratio, val_ratio, test_ratio : float
        Split proportions (must sum to 1.0).
    random_state : int
        Seed for reproducibility.

    Returns
    -------
    tuple of (X_train, X_val, X_test, y_train, y_val, y_test)
    """
    assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 1e-6

    # First split: separate test set
    X_temp, X_test, y_temp, y_test = train_test_split(
        X, y, test_size=test_ratio, random_state=random_state
    )

    # Second split: separate train and validation
    relative_val = val_ratio / (train_ratio + val_ratio)
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp, test_size=relative_val, random_state=random_state
    )

    print(f"[split] Train: {len(X_train)}  |  Val: {len(X_val)}  |  Test: {len(X_test)}")
    return X_train, X_val, X_test, y_train, y_val, y_test


# ------------------------------------------------------------------ #
#  LSTM Model definition (§7.3)                                       #
# ------------------------------------------------------------------ #

class LSTMModel(nn.Module):
    """
    PyTorch LSTM model for time-series regression.

    Architecture:
      LSTM (64 units) → Dropout (0.2) → Linear (32) → ReLU → Linear (1)
    """

    def __init__(self, input_size: int, hidden_size: int = 64, dropout: float = 0.2):
        super(LSTMModel, self).__init__()
        self.hidden_size = hidden_size

        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            batch_first=True,
        )
        self.dropout = nn.Dropout(dropout)
        self.fc1 = nn.Linear(hidden_size, 32)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(32, 1)

    def forward(self, x):
        # x shape: (batch, lookback, features)
        lstm_out, _ = self.lstm(x)
        # Take only the last time step's output
        last_hidden = lstm_out[:, -1, :]    # (batch, hidden_size)
        out = self.dropout(last_hidden)
        out = self.relu(self.fc1(out))
        out = self.fc2(out)                 # (batch, 1)
        return out.squeeze(-1)              # (batch,)


def build_lstm_model(
    input_size: int,
    hidden_size: int = 64,
    dropout: float = 0.2,
) -> LSTMModel:
    """
    Builds a PyTorch LSTM model for time-series regression.

    Parameters
    ----------
    input_size : int
        Number of input features per timestep.
    hidden_size : int
        Number of LSTM hidden units (default: 64).
    dropout : float
        Dropout rate for regularization (default: 0.2).

    Returns
    -------
    LSTMModel
        The constructed (untrained) model.
    """
    model = LSTMModel(input_size, hidden_size, dropout)
    print(f"[build] LSTM model built: input_size={input_size}, hidden={hidden_size}")
    print(model)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"[build] Total parameters: {total_params:,}")
    return model


# ------------------------------------------------------------------ #
#  Model training                                                     #
# ------------------------------------------------------------------ #

def train_model(
    model: LSTMModel,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
    epochs: int = 50,
    batch_size: int = 32,
    learning_rate: float = 0.001,
    patience: int = 5,
) -> dict:
    """
    Trains the LSTM model with early stopping.

    Parameters
    ----------
    model : LSTMModel
        The PyTorch LSTM model.
    X_train, y_train : np.ndarray
        Training data.
    X_val, y_val : np.ndarray
        Validation data for early stopping.
    epochs : int
        Maximum training epochs (default: 50).
    batch_size : int
        Batch size (default: 32).
    learning_rate : float
        Adam optimizer learning rate (default: 0.001).
    patience : int
        Early stopping patience (default: 5).

    Returns
    -------
    dict
        Training history with 'train_loss' and 'val_loss' per epoch.
    """
    # Convert numpy arrays to PyTorch tensors
    X_train_t = torch.FloatTensor(X_train)
    y_train_t = torch.FloatTensor(y_train)
    X_val_t = torch.FloatTensor(X_val)
    y_val_t = torch.FloatTensor(y_val)

    # Create DataLoader for batching
    train_dataset = TensorDataset(X_train_t, y_train_t)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)

    # Loss and optimizer
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)

    # Training loop with early stopping
    history = {"train_loss": [], "val_loss": []}
    best_val_loss = float("inf")
    best_model_state = None
    epochs_without_improvement = 0

    for epoch in range(1, epochs + 1):
        # --- Training phase ---
        model.train()
        train_losses = []

        for X_batch, y_batch in train_loader:
            optimizer.zero_grad()
            predictions = model(X_batch)
            loss = criterion(predictions, y_batch)
            loss.backward()
            optimizer.step()
            train_losses.append(loss.item())

        avg_train_loss = np.mean(train_losses)

        # --- Validation phase ---
        model.eval()
        with torch.no_grad():
            val_predictions = model(X_val_t)
            val_loss = criterion(val_predictions, y_val_t).item()

        history["train_loss"].append(avg_train_loss)
        history["val_loss"].append(val_loss)

        print(f"  Epoch {epoch:3d}/{epochs} — Train Loss: {avg_train_loss:.6f} | Val Loss: {val_loss:.6f}")

        # --- Early stopping check ---
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_model_state = model.state_dict().copy()
            epochs_without_improvement = 0
        else:
            epochs_without_improvement += 1

        if epochs_without_improvement >= patience:
            print(f"\n[train] Early stopping triggered at epoch {epoch} (patience={patience})")
            break

    # Restore best weights
    if best_model_state is not None:
        model.load_state_dict(best_model_state)
        print(f"[train] Restored best model weights (val_loss={best_val_loss:.6f})")

    print(f"[train] LSTM training completed after {len(history['train_loss'])} epochs.")
    return history


# ------------------------------------------------------------------ #
#  Model evaluation (§9 — MAE)                                       #
# ------------------------------------------------------------------ #

def evaluate_model(
    model: LSTMModel,
    X: np.ndarray,
    y: np.ndarray,
    split_name: str = "Test",
) -> dict:
    """
    Evaluates the LSTM model using Mean Absolute Error (MAE)
    as specified in ML Document §9.

    Parameters
    ----------
    model : LSTMModel
        Trained LSTM model.
    X : np.ndarray
        Input sequences.
    y : np.ndarray
        True target values.
    split_name : str
        Label for display (e.g., "Test", "Validation").

    Returns
    -------
    dict
        Dictionary with 'loss_mse' and 'mae' values.
    """
    model.eval()
    X_t = torch.FloatTensor(X)
    y_t = torch.FloatTensor(y)

    with torch.no_grad():
        predictions = model(X_t)
        mse_loss = nn.MSELoss()(predictions, y_t).item()
        mae = nn.L1Loss()(predictions, y_t).item()

    metrics = {"loss_mse": mse_loss, "mae": mae}

    print(f"\n{'=' * 50}")
    print(f"  {split_name} Set Evaluation (LSTM)")
    print(f"{'=' * 50}")
    print(f"  Loss (MSE)          : {mse_loss:.6f}")
    print(f"  Mean Absolute Error : {mae:.6f}")
    print(f"{'=' * 50}\n")

    return metrics


# ------------------------------------------------------------------ #
#  Export model                                                       #
# ------------------------------------------------------------------ #

def save_model(
    model: LSTMModel,
    model_filename: str = "lstm_model.pt",
) -> str:
    """
    Saves the trained PyTorch LSTM model to disk.

    Returns
    -------
    str
        Absolute path to the saved model file.
    """
    os.makedirs(MODELS_DIR, exist_ok=True)
    model_path = os.path.join(MODELS_DIR, model_filename)
    torch.save(model.state_dict(), model_path)
    print(f"[export] LSTM model saved to {model_path}")
    return model_path
