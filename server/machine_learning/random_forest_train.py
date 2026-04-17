"""
random_forest_train.py
======================
Training pipeline for the Random Forest Fault Detection model.

Problem Type : Binary Classification (is this streetlight currently faulty?)
Algorithm    : Random Forest Classifier via scikit-learn
Target       : failure_status (0 = normal, 1 = fault)

Evaluation Metrics: Accuracy, Precision, Recall, F1-Score, AUC-ROC
"""

import os
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    classification_report,
    confusion_matrix,
)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


# ------------------------------------------------------------------ #
#  Data splitting                                                     #
# ------------------------------------------------------------------ #

def split_data(
    X: np.ndarray,
    y: np.ndarray,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    random_state: int = 42,
) -> tuple:
    """Splits data into Train (70%), Validation (15%), Test (15%) sets."""
    assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 1e-6

    X_temp, X_test, y_temp, y_test = train_test_split(
        X, y, test_size=test_ratio, random_state=random_state, stratify=y
    )

    relative_val = val_ratio / (train_ratio + val_ratio)
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp, test_size=relative_val, random_state=random_state, stratify=y_temp
    )

    print(f"[split] Train: {len(X_train)}  |  Val: {len(X_val)}  |  Test: {len(X_test)}")
    return X_train, X_val, X_test, y_train, y_val, y_test


# ------------------------------------------------------------------ #
#  Model building                                                     #
# ------------------------------------------------------------------ #

def build_model(
    n_estimators: int = 100,
    max_depth: int = 15,
    random_state: int = 42,
) -> RandomForestClassifier:
    """Builds a Random Forest classifier for fault detection."""
    model = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        random_state=random_state,
        class_weight="balanced",  # Handle imbalanced classes
        n_jobs=-1,
    )
    print(f"[build] Random Forest: n_estimators={n_estimators}, max_depth={max_depth}")
    return model


# ------------------------------------------------------------------ #
#  Model training                                                     #
# ------------------------------------------------------------------ #

def train_model(
    model: RandomForestClassifier,
    X_train: np.ndarray,
    y_train: np.ndarray,
) -> RandomForestClassifier:
    """Trains the Random Forest model."""
    print("[train] Training Random Forest...")
    model.fit(X_train, y_train)
    print("[train] Training complete.")
    return model


# ------------------------------------------------------------------ #
#  Model evaluation                                                   #
# ------------------------------------------------------------------ #

def evaluate_model(
    model: RandomForestClassifier,
    X: np.ndarray,
    y: np.ndarray,
    split_name: str = "Test",
) -> dict:
    """Evaluates the RF model with comprehensive classification metrics."""
    y_pred = model.predict(X)
    y_proba = model.predict_proba(X)[:, 1]

    accuracy = accuracy_score(y, y_pred)
    precision = precision_score(y, y_pred, zero_division=0)
    recall = recall_score(y, y_pred, zero_division=0)
    f1 = f1_score(y, y_pred, zero_division=0)
    auc_roc = roc_auc_score(y, y_proba)

    metrics = {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "auc_roc": auc_roc,
    }

    print(f"\n{'=' * 55}")
    print(f"  {split_name} Set Evaluation (Random Forest Fault Detection)")
    print(f"{'=' * 55}")
    print(f"  Accuracy  : {accuracy * 100:.2f}%")
    print(f"  Precision : {precision:.4f}")
    print(f"  Recall    : {recall:.4f}")
    print(f"  F1 Score  : {f1:.4f}")
    print(f"  AUC-ROC   : {auc_roc:.4f}")
    print(f"\n  Confusion Matrix:")
    cm = confusion_matrix(y, y_pred)
    print(f"    TN={cm[0][0]:5d}  FP={cm[0][1]:5d}")
    print(f"    FN={cm[1][0]:5d}  TP={cm[1][1]:5d}")
    print(f"{'=' * 55}\n")

    return metrics


# ------------------------------------------------------------------ #
#  Export model                                                       #
# ------------------------------------------------------------------ #

def save_model(
    model: RandomForestClassifier,
    model_filename: str = "random_forest_model.joblib",
) -> str:
    """Saves the trained Random Forest model to disk."""
    os.makedirs(MODELS_DIR, exist_ok=True)
    model_path = os.path.join(MODELS_DIR, model_filename)
    joblib.dump(model, model_path)
    print(f"[export] Random Forest model saved to {model_path}")
    return model_path
