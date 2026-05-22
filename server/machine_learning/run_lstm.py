"""
run_lstm.py
===========
Standalone entry point that orchestrates the full LSTM training pipeline.

Outputs for Chapter 4:
  - Figure 4.3: Training vs. Validation Loss Convergence (per-epoch table)
  - Figure 4.4: Actual vs. Predicted Degradation Trajectory (sample device)
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


def _print_loss_convergence(history: dict):
    """Print Chapter 4 Figure 4.3 data: Training vs Validation Loss per epoch."""
    train_losses = history["train_loss"]
    val_losses = history["val_loss"]
    n_epochs = len(train_losses)
    
    print(f"\n  {'─' * 70}")
    print(f"  CHAPTER 4 FIGURE 4.3: LSTM Training vs. Validation Loss Convergence")
    print(f"  {'─' * 70}")
    print(f"  {'Epoch':>7s}  {'Train Loss':>12s}  {'Val Loss':>12s}  {'Convergence'}")
    print(f"  {'─' * 60}")
    
    max_bar = 40
    max_loss = max(max(train_losses), max(val_losses)) if train_losses else 1.0
    
    for i in range(n_epochs):
        t_loss = train_losses[i]
        v_loss = val_losses[i]
        t_bar_len = int((t_loss / max_loss) * max_bar) if max_loss > 0 else 0
        v_bar_len = int((v_loss / max_loss) * max_bar) if max_loss > 0 else 0
        t_bar = "█" * t_bar_len
        v_bar = "░" * v_bar_len
        print(f"  {i+1:>7d}  {t_loss:>12.4f}  {v_loss:>12.4f}  T:{t_bar}")
        print(f"  {'':>7s}  {'':>12s}  {'':>12s}  V:{v_bar}")
    
    print(f"  {'─' * 60}")
    print(f"  Final Train Loss : {train_losses[-1]:.4f}")
    print(f"  Final Val Loss   : {val_losses[-1]:.4f}")
    print(f"  Best Val Loss    : {min(val_losses):.4f} (Epoch {val_losses.index(min(val_losses)) + 1})")
    print(f"  Total Epochs     : {n_epochs}")
    print(f"  {'─' * 70}\n")


def _print_degradation_trajectory(model, X_test, y_test, node_ids_test, threshold):
    """Print Chapter 4 Figure 4.4 data: Actual vs Predicted degradation trajectory.
    
    For a sample device from the test set, shows how the LSTM predicted health
    (1 - P(failure)) compares to the actual health label (1 - y_true) over time.
    """
    model.eval()
    
    # Find a node with both positive and negative labels (interesting trajectory)
    unique_nodes = np.unique(node_ids_test)
    best_node = None
    best_score = -1
    
    for nid in unique_nodes:
        mask = node_ids_test == nid
        y_node = y_test[mask]
        n_samples = len(y_node)
        n_pos = np.sum(y_node == 1)
        # Prefer nodes with a mix of labels and enough samples
        if n_samples >= 10 and n_pos > 0 and n_pos < n_samples:
            mix_score = min(n_pos, n_samples - n_pos)
            if mix_score > best_score:
                best_score = mix_score
                best_node = nid
    
    if best_node is None:
        # Fallback: just pick the node with the most samples
        node_counts = {nid: np.sum(node_ids_test == nid) for nid in unique_nodes}
        best_node = max(node_counts, key=node_counts.get)
    
    mask = node_ids_test == best_node
    X_node = X_test[mask]
    y_node = y_test[mask]
    
    with torch.no_grad():
        logits = model(torch.FloatTensor(X_node)).numpy()
    probs = 1.0 / (1.0 + np.exp(-logits))  # P(imminent failure)
    
    # Health = 1 - P(failure), clamped to [0, 1]
    actual_health = 1.0 - y_node.astype(float)
    predicted_health = np.clip(1.0 - probs, 0.0, 1.0)
    
    n = len(actual_health)
    
    print(f"\n  {'─' * 75}")
    print(f"  CHAPTER 4 FIGURE 4.4: Actual vs. Predicted Degradation Trajectory (LSTM)")
    print(f"  {'─' * 75}")
    print(f"  Sample Node ID: {best_node}  |  Total Timesteps: {n}  |  Threshold: {threshold:.3f}")
    print(f"  {'─' * 75}")
    print(f"  {'Timestep':>10s}  {'Actual Health':>14s}  {'Predicted Health':>16s}  {'P(Failure)':>12s}  {'Trajectory'}")
    print(f"  {'─' * 72}")
    
    # Print at reasonable intervals (max ~30 rows)
    step = max(1, n // 30)
    
    for i in range(0, n, step):
        ah = actual_health[i]
        ph = predicted_health[i]
        pf = probs[i]
        
        # Visual bar
        bar_a = "█" * int(ah * 20)
        bar_p = "░" * int(ph * 20)
        
        print(f"  {i:>10d}  {ah:>14.4f}  {ph:>16.4f}  {pf:>12.4f}  A:{bar_a}")
        print(f"  {'':>10s}  {'':>14s}  {'':>16s}  {'':>12s}  P:{bar_p}")
    
    # Print last point if not already printed
    if (n - 1) % step != 0:
        i = n - 1
        ah = actual_health[i]
        ph = predicted_health[i]
        pf = probs[i]
        bar_a = "█" * int(ah * 20)
        bar_p = "░" * int(ph * 20)
        print(f"  {i:>10d}  {ah:>14.4f}  {ph:>16.4f}  {pf:>12.4f}  A:{bar_a}")
        print(f"  {'':>10s}  {'':>14s}  {'':>16s}  {'':>12s}  P:{bar_p}")
    
    # Summary statistics
    mae = float(np.mean(np.abs(actual_health - predicted_health)))
    corr = float(np.corrcoef(actual_health, predicted_health)[0, 1]) if n > 1 else 0.0
    
    print(f"  {'─' * 72}")
    print(f"  Trajectory MAE         : {mae:.4f}")
    print(f"  Correlation (Actual/Pred): {corr:.4f}")
    print(f"  {'─' * 75}\n")


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
    # Also split node_ids for trajectory analysis
    n = len(X)
    train_end = len(X_train)
    val_end = train_end + len(X_val)
    node_ids_test = node_ids[val_end:]

    print("\n[Step 4] Build + train model...")
    model = build_lstm_model(input_size=X.shape[2])
    model, history = train_model(model, X_train, y_train, X_val, y_val)

    # ============================================================== #
    #  CHAPTER 4 FIGURE 4.3: Loss Convergence                         #
    # ============================================================== #
    _print_loss_convergence(history)

    print("\n[Step 5] Select validation threshold...")
    model.eval()
    with torch.no_grad():
        val_logits = model(torch.FloatTensor(X_val)).numpy()
    val_probs = 1.0 / (1.0 + np.exp(-val_logits))
    threshold = select_threshold(y_val, val_probs, min_recall=0.85)

    print("\n[Step 6] Evaluate...")
    evaluate_model(model, X_val, y_val, threshold=threshold, split_name="Validation")
    test_metrics = evaluate_model(model, X_test, y_test, threshold=threshold, split_name="Test")

    # ============================================================== #
    #  CHAPTER 4 FIGURE 4.4: Degradation Trajectory                   #
    # ============================================================== #
    _print_degradation_trajectory(model, X_test, y_test, node_ids_test, threshold)

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
    print(f"  Epochs Run : {len(history['train_loss'])}")
    print("=" * 60)

    return test_metrics


if __name__ == "__main__":
    main()

