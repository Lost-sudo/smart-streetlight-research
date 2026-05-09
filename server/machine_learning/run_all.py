"""
run_all.py
==========
Runs both the LSTM and Random Forest training pipelines in sequence.

Usage:
    cd server/machine_learning
    python run_all.py
"""

import argparse
from run_lstm import main as run_lstm
from run_random_forest import main as run_rf


def main():
    print("\n" + "#" * 60)
    print("#  Training All Models")
    # --- Step 0: Centralized Data Update ---
    # We update the dataset ONCE at the start so both models use the same fresh version
    print("\n" + "="*60)
    print("  [Step 0] Synchronizing Dataset Versions")
    print("="*60)
    from retrain_utils import update_dataset_from_db
    shared_csv_path = update_dataset_from_db("streetlight_dataset_augmented")
    
    # --- Step 1: LSTM Training ---
    print("\n>>> Training LSTM (Time-to-Failure) <<<")
    lstm_metrics = run_lstm(csv_path=shared_csv_path)

    # --- Step 2: Random Forest Training ---
    print("\n>>> Training Random Forest (Fault Detection) <<<")
    rf_metrics = run_rf(csv_path=shared_csv_path)

    print("\n" + "#" * 60)
    print("#  All Models Trained Successfully!")
    print("#" * 60)
    print(f"  LSTM  - Test MAE: {lstm_metrics['mae']:.4f}, R2: {lstm_metrics['r2']:.4f}")
    print(f"  RF    - Test Accuracy: {rf_metrics['accuracy']*100:.2f}%, F1: {rf_metrics['f1']:.4f}")
    print("#" * 60)


if __name__ == "__main__":
    main()
