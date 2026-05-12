"""
run_lstm.py
===========
Standalone entry point that orchestrates the full LSTM training pipeline.
"""

import os
import sys
import joblib
import numpy as np
import torch

from lstm_data import load_lstm_dataset
from lstm_preprocess import preprocess_pipeline
from lstm_train import (
    split_sequences_chronological,
    build_lstm_model,
    train_model,
    evaluate_model,
    save_model,
    select_threshold,
)


def main(csv_path: str = None):
    # Ensure web_server/app imports work when running from machine_learning dir.
    ml_dir = os.path.dirname(os.path.abspath(__file__))
    server_dir = os.path.dirname(ml_dir)
    web_server_dir = os.path.join(server_dir, "web_server")
    if web_server_dir not in sys.path:
        sys.path.insert(0, web_server_dir)

    from app.core.config import settings

    print("=" * 60)
    print("  Smart Streetlight - LSTM Imminent-Failure Classifier Training")
    print(f"  Mode: {'PRODUCTION (Cloud)' if settings.PROD else 'LOCAL (Demo)'}")
    print("=" * 60)

    if not csv_path:
        from retrain_utils import update_dataset_from_db
        csv_path = update_dataset_from_db("streetlight_dataset_augmented")

    print(f"\n[Step 1] Loading dataset from: {csv_path}")
    df = load_lstm_dataset(csv_path=csv_path)

    print("\n[Step 2] Preprocess (feature scale + binary horizon target)...")
    X, y, node_ids, _, horizon_steps = preprocess_pipeline(
        df, lookback=10, horizon_hours=24, fault_only=True
    )

    print("\n[Step 3] Chronological split...")
    X_train, X_val, X_test, y_train, y_val, y_test = split_sequences_chronological(
        X, y, node_ids=node_ids
    )

    print("\n[Step 4] Build + train model...")
    model = build_lstm_model(input_size=X.shape[2])
    model = train_model(model, X_train, y_train, X_val, y_val)

    print("\n[Step 5] Select validation threshold...")
    model.eval()
    with torch.no_grad():
        val_logits = model(torch.FloatTensor(X_val)).numpy()
    val_probs = 1.0 / (1.0 + np.exp(-val_logits))
    threshold = select_threshold(y_val, val_probs, min_recall=0.85)

    print("\n[Step 6] Evaluate...")
    evaluate_model(model, X_val, y_val, threshold=threshold, split_name="Validation")
    test_metrics = evaluate_model(model, X_test, y_test, threshold=threshold, split_name="Test")

    print("\n[Step 7] Export artifacts...")
    model_path = save_model(model)
    models_dir = os.path.dirname(model_path)
    scaler_path = os.path.join(models_dir, "lstm_scaler.joblib")
    threshold_path = os.path.join(models_dir, "lstm_threshold.joblib")
    config_path = os.path.join(models_dir, "lstm_inference_config.joblib")

    joblib.dump(float(threshold), threshold_path)
    joblib.dump({"horizon_steps": int(horizon_steps), "horizon_hours": 24}, config_path)

    print("\n[Step 8] Register artifacts...")
    from retrain_utils import upload_lstm_artifacts, get_next_model_version
    next_m_version = get_next_model_version("lstm_model")
    upload_lstm_artifacts(model_path, scaler_path, threshold_path, next_m_version, metrics=test_metrics)

    print("\n" + "=" * 60)
    print("  LSTM Training Complete")
    print("=" * 60)
    print(f"  Model      : {model_path}")
    print(f"  Horizon    : 24h ({horizon_steps} steps)")
    print(f"  Threshold  : {threshold:.3f}")
    print(f"  Test PR-AUC: {test_metrics['pr_auc']:.4f}")
    print(f"  Test ROC-AUC: {test_metrics['roc_auc']:.4f}")
    print(f"  Test MAE   : {test_metrics['mae']:.4f}")
    print(f"  Test F1    : {test_metrics['f1']:.4f}")
    print("=" * 60)

    return test_metrics


if __name__ == "__main__":
    main()
