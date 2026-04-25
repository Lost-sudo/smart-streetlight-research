"""
random_forest_train.py
======================
Training pipeline for the Random Forest Fault Detection model.

Problem Type : Binary Classification (is this streetlight currently faulty?)
Algorithm    : Random Forest Classifier via scikit-learn
Target       : failure_status (0 = normal, 1 = fault)

Key improvements:
  - Stratified train/val/test split (both classes in all sets)
  - Classification report with per-class metrics
  - Test predictions saved to CSV for debugging

Evaluation Metrics: Accuracy, Precision, Recall, F1-Score, AUC-ROC
"""

import os
import joblib
import numpy as np
import pandas as pd
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

from lstm_data import RF_FEATURES

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
DATASETS_DIR = os.path.join(os.path.dirname(__file__), "datasets")


# ------------------------------------------------------------------ #
#  Data splitting (stratified — both classes in all sets)              #
# ------------------------------------------------------------------ #

def split_data(
    X: np.ndarray,
    y: np.ndarray,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    random_state: int = 42,
) -> tuple:
    """Splits data into Train (70%), Validation (15%), Test (15%) with stratification.

    Uses stratified shuffle split to ensure both Normal and Faulty classes
    appear in all sets. This is appropriate for single-device IoT data
    where there is no node-level leakage concern.
    """
    assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 1e-6

    # First split: separate test set
    X_temp, X_test, y_temp, y_test = train_test_split(
        X, y, test_size=test_ratio, random_state=random_state, stratify=y
    )

    # Second split: separate validation from training
    relative_val = val_ratio / (train_ratio + val_ratio)
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp, test_size=relative_val, random_state=random_state, stratify=y_temp
    )

    print(f"[split] Stratified split (both classes in all sets):")
    print(f"[split] Train: {len(X_train)}  |  Val: {len(X_val)}  |  Test: {len(X_test)}")
    print(f"[split] Train class balance: 0={int((y_train==0).sum())}, 1={int((y_train==1).sum())}")
    print(f"[split] Val   class balance: 0={int((y_val==0).sum())}, 1={int((y_val==1).sum())}")
    print(f"[split] Test  class balance: 0={int((y_test==0).sum())}, 1={int((y_test==1).sum())}")

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

    # --- Classification Report (per-class performance) ---
    print(f"\n  Classification Report:")
    print(classification_report(y, y_pred, target_names=["Normal", "Faulty"]))
    print(f"{'=' * 55}\n")

    return metrics


# ------------------------------------------------------------------ #
#  Save test predictions for analysis                                 #
# ------------------------------------------------------------------ #

def save_predictions(
    model: RandomForestClassifier,
    X_test: np.ndarray,
    y_test: np.ndarray,
    filename: str = "rf_test_predictions.csv",
) -> str:
    """Save test set predictions to CSV for debugging misclassifications."""
    df_test = pd.DataFrame(X_test, columns=RF_FEATURES)
    df_test["y_true"] = y_test
    df_test["y_pred"] = model.predict(X_test)
    df_test["y_proba"] = model.predict_proba(X_test)[:, 1]

    os.makedirs(DATASETS_DIR, exist_ok=True)
    filepath = os.path.join(DATASETS_DIR, filename)
    df_test.to_csv(filepath, index=False)
    print(f"[predictions] Test predictions saved to {filepath}")
    return filepath


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
