"""
random_forest_train.py
======================
Training pipeline for the Random Forest Failure Prediction model.

Problem Type: Supervised Classification
Algorithm  : Random Forest Classifier (scikit-learn)

Follows the ML Design Document:
  §7.1  — Random Forest Classifier for failure prediction
  §8    — Model Training Strategy
           - 70 % Training / 15 % Validation / 15 % Test split
  §9    — Evaluation Metrics: Accuracy, Precision, Recall, F1, ROC-AUC
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

from random_forest_preprocess import ALL_FEATURES, TARGET_COLUMN

# Directory where model artifacts are persisted
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


# ------------------------------------------------------------------ #
#  Data splitting (§8.2)                                              #
# ------------------------------------------------------------------ #

def split_dataset(
    df: pd.DataFrame,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    random_state: int = 42,
):
    """
    Splits the dataset into Training (70 %), Validation (15 %), and
    Test (15 %) sets as specified in ML Design Document §8.2.

    Returns
    -------
    tuple of (X_train, X_val, X_test, y_train, y_val, y_test)
    """
    assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 1e-6, \
        "Ratios must sum to 1.0"

    X = df[ALL_FEATURES]
    y = df[TARGET_COLUMN]

    # First split: separate the test set
    X_temp, X_test, y_temp, y_test = train_test_split(
        X, y,
        test_size=test_ratio,
        random_state=random_state,
        stratify=y,
    )

    # Second split: separate training and validation from the remainder
    relative_val_ratio = val_ratio / (train_ratio + val_ratio)
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp,
        test_size=relative_val_ratio,
        random_state=random_state,
        stratify=y_temp,
    )

    print(f"[split] Train: {len(X_train)}  |  Val: {len(X_val)}  |  Test: {len(X_test)}")
    return X_train, X_val, X_test, y_train, y_val, y_test


# ------------------------------------------------------------------ #
#  Model training (§7.1)                                              #
# ------------------------------------------------------------------ #

def train_model(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    n_estimators: int = 100,
    random_state: int = 42,
) -> RandomForestClassifier:
    """
    Trains a Random Forest Classifier.

    Parameters
    ----------
    X_train : pd.DataFrame
        Training features.
    y_train : pd.Series
        Training labels.
    n_estimators : int
        Number of trees in the forest (default 100).
    random_state : int
        Seed for reproducibility.

    Returns
    -------
    RandomForestClassifier
        The fitted model.
    """
    model = RandomForestClassifier(
        n_estimators=n_estimators,
        random_state=random_state,
        n_jobs=-1,              # use all CPU cores
        class_weight="balanced", # handle class imbalance
    )
    model.fit(X_train, y_train)
    print(f"[train] Random Forest trained with {n_estimators} estimators.")
    return model


# ------------------------------------------------------------------ #
#  Model evaluation (§9)                                              #
# ------------------------------------------------------------------ #

def evaluate_model(
    model: RandomForestClassifier,
    X: pd.DataFrame,
    y: pd.Series,
    split_name: str = "Test",
) -> dict:
    """
    Evaluates the model using the metrics specified in ML Document §9:
      Accuracy, Precision, Recall, F1-Score, ROC-AUC.

    Parameters
    ----------
    model : RandomForestClassifier
        Trained model.
    X : pd.DataFrame
        Feature matrix.
    y : pd.Series
        True labels.
    split_name : str
        Label for print output (e.g., "Validation", "Test").

    Returns
    -------
    dict
        Dictionary of metric name → value.
    """
    y_pred = model.predict(X)
    y_proba = model.predict_proba(X)[:, 1]

    metrics = {
        "accuracy": accuracy_score(y, y_pred),
        "precision": precision_score(y, y_pred, zero_division=0),
        "recall": recall_score(y, y_pred, zero_division=0),
        "f1_score": f1_score(y, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y, y_proba),
    }

    print(f"\n{'=' * 50}")
    print(f"  {split_name} Set Evaluation")
    print(f"{'=' * 50}")
    for name, value in metrics.items():
        print(f"  {name:<12}: {value:.4f}")
    print(f"\n  Classification Report:\n{classification_report(y, y_pred, target_names=['Normal', 'Faulty'])}")
    print(f"  Confusion Matrix:\n{confusion_matrix(y, y_pred)}\n")

    return metrics


# ------------------------------------------------------------------ #
#  Feature importance                                                 #
# ------------------------------------------------------------------ #

def print_feature_importance(
    model: RandomForestClassifier,
    feature_names: list,
):
    """
    Prints the feature importance ranking from the trained Random Forest.
    Useful for interpretability (ML Document §7.1 Rationale).
    """
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1]

    print(f"\n{'=' * 50}")
    print("  Feature Importance Ranking")
    print(f"{'=' * 50}")
    for rank, idx in enumerate(indices, start=1):
        print(f"  {rank}. {feature_names[idx]:<25} {importances[idx]:.4f}")
    print()


# ------------------------------------------------------------------ #
#  Export model (§11)                                                 #
# ------------------------------------------------------------------ #

def save_model(
    model: RandomForestClassifier,
    model_filename: str = "random_forest_model.joblib",
) -> str:
    """
    Serializes the trained model to disk using joblib.

    Returns
    -------
    str
        Absolute path to the saved model file.
    """
    os.makedirs(MODELS_DIR, exist_ok=True)
    model_path = os.path.join(MODELS_DIR, model_filename)
    joblib.dump(model, model_path)
    print(f"[export] Model saved to {model_path}")
    return model_path
