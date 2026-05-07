"""
lstm_train.py
=============
Training pipeline for the LSTM Time-to-Failure Prediction model.

Problem Type : Time-Series Regression
Algorithm    : Long Short-Term Memory (LSTM) via PyTorch
Target       : time_to_failure (number of timesteps until failure)

Follows the ML Design Document:
  7.3  - LSTM for degradation trend forecasting
  8    - Model Training Strategy (70 / 15 / 15 split)
  9    - Evaluation Metrics: MSE, MAE, R-squared

Note: TensorFlow is not available for Python 3.14, so PyTorch is used instead.
      The model is exported as a .pt file.
"""

import copy
import os
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from sklearn.model_selection import train_test_split

# Directory where model artifacts are persisted
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


# ------------------------------------------------------------------ #
#  Data splitting (70 / 15 / 15)                                      #
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
    """
    assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 1e-6

    X_temp, X_test, y_temp, y_test = train_test_split(
        X, y, test_size=test_ratio, random_state=random_state
    )

    relative_val = val_ratio / (train_ratio + val_ratio)
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp, test_size=relative_val, random_state=random_state
    )

    print(f"[split] Train: {len(X_train)}  |  Val: {len(X_val)}  |  Test: {len(X_test)}")
    return X_train, X_val, X_test, y_train, y_val, y_test


# ------------------------------------------------------------------ #
#  LSTM Model definition                                              #
# ------------------------------------------------------------------ #

class LSTMModel(nn.Module):
    """
    PyTorch LSTM model for time-series regression (time-to-failure).

    Architecture:
      LSTM (64 units) -> Dropout (0.2) -> Linear (32) -> ReLU -> Linear (1)
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
    """Builds a PyTorch LSTM model for time-to-failure regression."""
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
    """Trains the LSTM model with early stopping using MSE loss."""
    # Convert numpy arrays to PyTorch tensors
    X_train_t = torch.FloatTensor(X_train)
    y_train_t = torch.FloatTensor(y_train)
    X_val_t = torch.FloatTensor(X_val)
    y_val_t = torch.FloatTensor(y_val)

    # Create DataLoader for batching
    train_dataset = TensorDataset(X_train_t, y_train_t)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)

    # MSE loss for regression (predicting continuous time-to-failure)
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

        print(f"  Epoch {epoch:3d}/{epochs} - Train Loss: {avg_train_loss:.4f} | Val Loss: {val_loss:.4f}")

        # --- Early stopping check ---
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_model_state = copy.deepcopy(model.state_dict())
            epochs_without_improvement = 0
        else:
            epochs_without_improvement += 1

        if epochs_without_improvement >= patience:
            print(f"\n[train] Early stopping triggered at epoch {epoch} (patience={patience})")
            break

    # Restore best weights
    if best_model_state is not None:
        model.load_state_dict(best_model_state)
        print(f"[train] Restored best model weights (val_loss={best_val_loss:.4f})")

    print(f"[train] LSTM training completed after {len(history['train_loss'])} epochs.")
    return history


# ------------------------------------------------------------------ #
#  Model evaluation                                                   #
# ------------------------------------------------------------------ #

def evaluate_model(
    model: LSTMModel,
    X: np.ndarray,
    y: np.ndarray,
    split_name: str = "Test",
) -> dict:
    """
    Evaluates the LSTM model using MSE, MAE, and R-squared.

    Parameters
    ----------
    model : LSTMModel
        Trained LSTM model.
    X : np.ndarray
        Input sequences.
    y : np.ndarray
        True target values (time_to_failure).
    split_name : str
        Label for display.

    Returns
    -------
    dict
        Dictionary with 'mse', 'mae', and 'r2' values.
    """
    model.eval()
    X_t = torch.FloatTensor(X)
    y_t = torch.FloatTensor(y)

    with torch.no_grad():
        predictions = model(X_t)
        mse = nn.MSELoss()(predictions, y_t).item()
        mae = nn.L1Loss()(predictions, y_t).item()

        # R-squared
        ss_res = ((predictions - y_t) ** 2).sum().item()
        ss_tot = ((y_t - y_t.mean()) ** 2).sum().item()
        r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 0.0

    metrics = {"mse": mse, "mae": mae, "r2": r2}

    print(f"\n{'=' * 55}")
    print(f"  {split_name} Set Evaluation (LSTM Time-to-Failure)")
    print(f"{'=' * 55}")
    print(f"  MSE (Mean Squared Error)  : {mse:.4f}")
    print(f"  MAE (Mean Absolute Error) : {mae:.4f}")
    print(f"  R-squared                 : {r2:.4f}")
    print(f"{'=' * 55}\n")

    return metrics


# ------------------------------------------------------------------ #
#  Export model                                                       #
# ------------------------------------------------------------------ #

def save_model(
    model: LSTMModel,
    model_filename: str = "lstm_model.pt",
) -> str:
    """Saves the trained PyTorch LSTM model to disk."""
    os.makedirs(MODELS_DIR, exist_ok=True)
    model_path = os.path.join(MODELS_DIR, model_filename)
    torch.save(model.state_dict(), model_path)
    print(f"[export] LSTM model saved to {model_path}")
    return model_path
