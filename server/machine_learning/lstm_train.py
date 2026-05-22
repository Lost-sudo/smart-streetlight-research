"""
lstm_train.py
=============
Training pipeline for the LSTM imminent-failure classification model.
"""

import copy
import os
import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics import average_precision_score, confusion_matrix, precision_recall_fscore_support, roc_auc_score
from torch.utils.data import DataLoader, TensorDataset, WeightedRandomSampler

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


def split_sequences_chronological(
    X: np.ndarray,
    y: np.ndarray,
    node_ids: np.ndarray | None = None,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
) -> tuple:
    """Time-safe split; if node_ids are provided, split chronologically per node."""
    assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 1e-6
    if node_ids is not None:
        train_parts_X, val_parts_X, test_parts_X = [], [], []
        train_parts_y, val_parts_y, test_parts_y = [], [], []
        for nid in np.unique(node_ids):
            idx = np.where(node_ids == nid)[0]
            Xn, yn = X[idx], y[idx]
            n = len(Xn)
            if n < 10:
                continue
            tr_end = int(n * train_ratio)
            va_end = tr_end + int(n * val_ratio)
            train_parts_X.append(Xn[:tr_end]); train_parts_y.append(yn[:tr_end])
            val_parts_X.append(Xn[tr_end:va_end]); val_parts_y.append(yn[tr_end:va_end])
            test_parts_X.append(Xn[va_end:]); test_parts_y.append(yn[va_end:])
        X_train = np.concatenate(train_parts_X, axis=0)
        y_train = np.concatenate(train_parts_y, axis=0)
        X_val = np.concatenate(val_parts_X, axis=0)
        y_val = np.concatenate(val_parts_y, axis=0)
        X_test = np.concatenate(test_parts_X, axis=0)
        y_test = np.concatenate(test_parts_y, axis=0)
        print(f"[split] Per-node chronological split: Train={len(X_train)} | Val={len(X_val)} | Test={len(X_test)}")
        return X_train, X_val, X_test, y_train, y_val, y_test

    n = len(X)
    train_end = int(n * train_ratio)
    val_end = train_end + int(n * val_ratio)

    X_train, y_train = X[:train_end], y[:train_end]
    X_val, y_val = X[train_end:val_end], y[train_end:val_end]
    X_test, y_test = X[val_end:], y[val_end:]

    print(f"[split] Train: {len(X_train)} | Val: {len(X_val)} | Test: {len(X_test)}")
    return X_train, X_val, X_test, y_train, y_val, y_test


class LSTMModel(nn.Module):
    def __init__(self, input_size: int, hidden_size: int = 64, dropout: float = 0.2):
        super(LSTMModel, self).__init__()
        self.lstm = nn.LSTM(input_size=input_size, hidden_size=hidden_size, batch_first=True)
        self.dropout = nn.Dropout(dropout)
        self.fc1 = nn.Linear(hidden_size, 32)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(32, 1)

    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        last_hidden = lstm_out[:, -1, :]
        out = self.dropout(last_hidden)
        out = self.relu(self.fc1(out))
        out = self.fc2(out)
        return out.squeeze(-1)


def build_lstm_model(input_size: int, hidden_size: int = 64, dropout: float = 0.2) -> LSTMModel:
    model = LSTMModel(input_size, hidden_size, dropout)
    print(f"[build] LSTM model built: input_size={input_size}, hidden={hidden_size}")
    return model


def _compute_pos_weight(y: np.ndarray) -> float:
    pos = float(np.sum(y == 1))
    neg = float(np.sum(y == 0))
    if pos <= 0:
        return 1.0
    return max(1.0, neg / pos)


def _build_sampler(y: np.ndarray) -> WeightedRandomSampler:
    class_counts = np.bincount(y.astype(int), minlength=2)
    weights = np.zeros(2, dtype=np.float32)
    for c in [0, 1]:
        weights[c] = 1.0 / class_counts[c] if class_counts[c] > 0 else 0.0
    sample_weights = weights[y.astype(int)]
    return WeightedRandomSampler(sample_weights, num_samples=len(sample_weights), replacement=True)


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
) -> tuple:
    """Trains the LSTM model and returns (model, history).
    
    Returns
    -------
    tuple of (LSTMModel, dict)
        model: the trained model with best weights restored
        history: dict with keys 'train_loss' and 'val_loss', each a list
                 of per-epoch loss values (for Chapter 4 Figure 4.3)
    """
    X_train_t = torch.FloatTensor(X_train)
    y_train_t = torch.FloatTensor(y_train)
    X_val_t = torch.FloatTensor(X_val)
    y_val_t = torch.FloatTensor(y_val)

    train_dataset = TensorDataset(X_train_t, y_train_t)
    sampler = _build_sampler(y_train)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, sampler=sampler)

    pos_weight = torch.tensor([_compute_pos_weight(y_train)], dtype=torch.float32)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)

    best_val_loss = float("inf")
    best_model_state = None
    epochs_without_improvement = 0

    # ── History tracking for Chapter 4 Figure 4.3 ──
    history = {"train_loss": [], "val_loss": []}

    for epoch in range(1, epochs + 1):
        model.train()
        train_losses = []
        for X_batch, y_batch in train_loader:
            optimizer.zero_grad()
            logits = model(X_batch)
            loss = criterion(logits, y_batch)
            loss.backward()
            optimizer.step()
            train_losses.append(loss.item())

        avg_train_loss = float(np.mean(train_losses))
        model.eval()
        with torch.no_grad():
            val_logits = model(X_val_t)
            val_loss = criterion(val_logits, y_val_t).item()

        # Record history
        history["train_loss"].append(avg_train_loss)
        history["val_loss"].append(val_loss)

        print(f"  Epoch {epoch:3d}/{epochs} - Train Loss: {avg_train_loss:.4f} | Val Loss: {val_loss:.4f}")

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_model_state = copy.deepcopy(model.state_dict())
            epochs_without_improvement = 0
        else:
            epochs_without_improvement += 1

        if epochs_without_improvement >= patience:
            print(f"[train] Early stopping at epoch {epoch}")
            break

    if best_model_state is not None:
        model.load_state_dict(best_model_state)
        print(f"[train] Restored best model (val_loss={best_val_loss:.4f})")

    return model, history


def _metrics_at_threshold(y_true: np.ndarray, probs: np.ndarray, threshold: float) -> dict:
    y_pred = (probs >= threshold).astype(int)
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_true, y_pred, average="binary", zero_division=0
    )
    return {
        "threshold": threshold,
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
    }


def select_threshold(y_true: np.ndarray, probs: np.ndarray, min_recall: float = 0.75) -> float:
    candidates = np.linspace(0.1, 0.9, 17)
    best = None
    for t in candidates:
        m = _metrics_at_threshold(y_true, probs, float(t))
        y_pred = (probs >= float(t)).astype(int)
        tn, fp, _, _ = confusion_matrix(y_true.astype(int), y_pred, labels=[0, 1]).ravel()
        fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
        if m["recall"] >= min_recall and fpr <= 0.25:
            if best is None or m["precision"] > best["precision"]:
                best = m
    if best is None:
        all_metrics = [_metrics_at_threshold(y_true, probs, float(t)) for t in candidates]
        best = max(all_metrics, key=lambda x: (x["recall"], x["f1"]))
    return float(best["threshold"])


def evaluate_model(model: LSTMModel, X: np.ndarray, y: np.ndarray, threshold: float, split_name: str = "Test") -> dict:
    model.eval()
    X_t = torch.FloatTensor(X)
    with torch.no_grad():
        logits = model(X_t).numpy()
    probs = 1.0 / (1.0 + np.exp(-logits))

    metrics = _metrics_at_threshold(y.astype(int), probs, threshold)
    metrics["mae"] = float(np.mean(np.abs(y - probs)))
    metrics["pr_auc"] = float(average_precision_score(y, probs))
    if len(np.unique(y)) > 1:
        metrics["roc_auc"] = float(roc_auc_score(y, probs))
    else:
        metrics["roc_auc"] = 0.0

    print(
        f"\n[eval:{split_name}] threshold={threshold:.2f} mae={metrics['mae']:.4f} "
        f"pr_auc={metrics['pr_auc']:.4f} roc_auc={metrics['roc_auc']:.4f} "
        f"precision={metrics['precision']:.4f} recall={metrics['recall']:.4f} f1={metrics['f1']:.4f}"
    )
    return metrics


def save_model(model: LSTMModel, model_filename: str = "lstm_model.pt") -> str:
    os.makedirs(MODELS_DIR, exist_ok=True)
    model_path = os.path.join(MODELS_DIR, model_filename)
    torch.save(model.state_dict(), model_path)
    print(f"[export] LSTM model saved to {model_path}")
    return model_path
