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

from random_forest_data import RF_FEATURES, FAULT_TYPE_MAP

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

    print(f"[split] Stratified split ({len(np.unique(y))} classes in all sets):")
    print(f"[split] Train: {len(X_train)}  |  Val: {len(X_val)}  |  Test: {len(X_test)}")

    return X_train, X_val, X_test, y_train, y_val, y_test


# ------------------------------------------------------------------ #
#  Model building                                                     #
# ------------------------------------------------------------------ #

def build_model(
    n_estimators: int = 200,
    max_depth: int = 25,
    random_state: int = 42,
) -> RandomForestClassifier:
    """Builds a Random Forest classifier for fault detection."""
    model = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        random_state=random_state,
        class_weight="balanced",  # Handle imbalanced classes
        min_samples_leaf=2,       # Reduce overfitting on majority class
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
    """Evaluates the multi-class RF model and prints Chapter 4 formatted output.
    
    Outputs:
      1. Per-class Precision, Recall, F1-Score table
      2. Full multi-class confusion matrix (raw counts + row-normalized %)
      3. Macro-averaged metrics
    """
    y_pred = model.predict(X)
    
    # --- Dynamically detect all classes present ---
    all_classes = sorted(set(np.unique(y)) | set(np.unique(y_pred)))
    labels = [int(c) for c in all_classes]
    
    # Short abbreviation mapping for confusion matrix headers
    ABBREV_MAP = {
        0: "N", 1: "VF", 2: "OC", 3: "SD", 4: "LD",
        5: "SF", 6: "IF", 7: "DS",
    }
    SHORT_NAME_MAP = {
        0: "Normal", 1: "VolFluc", 2: "OverCur", 3: "SensDeg", 4: "LampDeg",
        5: "SysFail", 6: "IntFail", 7: "DayStand",
    }
    
    target_names = [FAULT_TYPE_MAP.get(i, f"CLASS_{i}") for i in labels]
    
    accuracy = accuracy_score(y, y_pred)
    precision_w = precision_score(y, y_pred, average='weighted', zero_division=0)
    recall_w = recall_score(y, y_pred, average='weighted', zero_division=0)
    f1_w = f1_score(y, y_pred, average='weighted', zero_division=0)
    
    # Macro averages (used in Chapter 4 table)
    precision_m = precision_score(y, y_pred, average='macro', zero_division=0, labels=labels)
    recall_m = recall_score(y, y_pred, average='macro', zero_division=0, labels=labels)
    f1_m = f1_score(y, y_pred, average='macro', zero_division=0, labels=labels)

    metrics = {
        "accuracy": accuracy,
        "precision": precision_w,
        "recall": recall_w,
        "f1": f1_w,
        "precision_macro": precision_m,
        "recall_macro": recall_m,
        "f1_macro": f1_m,
    }

    # ============================================================== #
    #  CHAPTER 4 OUTPUT: Classification Report                        #
    # ============================================================== #
    print(f"\n{'=' * 70}")
    print(f"  {split_name} Set Evaluation — Multi-Class Fault Detection")
    print(f"{'=' * 70}")
    print(f"  Overall Accuracy : {accuracy * 100:.2f}%")
    print(f"  Weighted F1      : {f1_w:.4f}")
    print(f"  Macro F1         : {f1_m:.4f}")
    
    # --- Per-class metrics (scikit-learn classification report) ---
    print(f"\n  Classification Report:")
    report = classification_report(
        y, y_pred, labels=labels, target_names=target_names,
        zero_division=0, digits=4
    )
    print(report)
    
    # --- Chapter 4 formatted table ---
    print(f"\n  {'─' * 70}")
    print(f"  CHAPTER 4 TABLE: Per-Class Precision / Recall / F1-Score")
    print(f"  {'─' * 70}")
    report_dict = classification_report(
        y, y_pred, labels=labels, target_names=target_names,
        zero_division=0, output_dict=True
    )
    print(f"  {'Diagnostic Condition':<28s} {'Precision':>10s} {'Recall':>10s} {'F1-Score':>10s}")
    print(f"  {'─' * 58}")
    
    ch4_names = {
        "NORMAL": "Normal Operation",
        "VOLTAGE_FLUCTUATION": "Voltage Fluctuation",
        "OVERCURRENT": "Overcurrent",
        "SENSOR_DEGRADATION": "Sensor Degradation",
        "LAMP_DEGRADATION": "Lamp Degradation",
        "SYSTEM_FAILURE": "System Failure",
        "INTERMITTENT_FAULT": "Intermittent Failure",
        "DAYTIME_STANDBY": "Daytime Standby Mode",
    }
    
    for name in target_names:
        m = report_dict[name]
        display = ch4_names.get(name, name)
        print(f"  {display:<28s} {m['precision']:>10.2f} {m['recall']:>10.2f} {m['f1-score']:>10.2f}")
    
    print(f"  {'─' * 58}")
    print(f"  {'Macro Average':<28s} {precision_m:>10.2f} {recall_m:>10.2f} {f1_m:>10.2f}")
    print(f"  {'Weighted Average':<28s} {precision_w:>10.2f} {recall_w:>10.2f} {f1_w:>10.2f}")
    
    # ============================================================== #
    #  CHAPTER 4 OUTPUT: Confusion Matrix                             #
    # ============================================================== #
    cm = confusion_matrix(y, y_pred, labels=labels)
    
    # Row-normalized confusion matrix (percentages)
    cm_norm = np.zeros_like(cm, dtype=float)
    for i in range(cm.shape[0]):
        row_sum = cm[i].sum()
        if row_sum > 0:
            cm_norm[i] = cm[i] / row_sum * 100
    
    abbrevs = [ABBREV_MAP.get(i, f"C{i}") for i in labels]
    short_names = [SHORT_NAME_MAP.get(i, f"Class{i}") for i in labels]
    
    print(f"\n  {'─' * 70}")
    print(f"  CHAPTER 4 FIGURE: Multi-Class Confusion Matrix (Raw Counts)")
    print(f"  {'─' * 70}")
    
    # Header row
    header = f"  {'Actual':<18s}" + "".join(f"[{a:^5s}]" for a in abbrevs)
    print(f"\n  {'':18s}" + "[ PREDICTED OPERATIONAL DIAGNOSTIC CONDITIONS ]")
    print(header)
    
    for i, label_i in enumerate(labels):
        row_abbrev = f"[{abbrevs[i]}] {short_names[i]}"
        row_str = f"  {row_abbrev:<18s}"
        for j in range(len(labels)):
            row_str += f"{cm[i, j]:^7d}"
        print(row_str)
    
    print(f"\n  {'─' * 70}")
    print(f"  CHAPTER 4 FIGURE: Confusion Matrix (Row-Normalized %)")
    print(f"  {'─' * 70}")
    
    header2 = f"  {'Actual':<18s}" + "".join(f"[{a:^5s}]" for a in abbrevs)
    print(f"\n  {'':18s}" + "[ PREDICTED OPERATIONAL DIAGNOSTIC CONDITIONS ]")
    print(header2)
    
    for i, label_i in enumerate(labels):
        row_abbrev = f"[{abbrevs[i]}] {short_names[i]}"
        row_str = f"  {row_abbrev:<18s}"
        for j in range(len(labels)):
            row_str += f"{cm_norm[i, j]:^7.1f}"
        print(row_str)
    
    print(f"\n{'=' * 70}\n")

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
