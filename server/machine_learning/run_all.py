"""
run_all.py
==========
Runs both the LSTM and Random Forest training pipelines in sequence.

Usage:
    cd server/machine_learning
    python run_all.py
"""

from run_lstm import main as run_lstm
from run_random_forest import main as run_rf


def main():
    print("\n" + "#" * 60)
    print("#  Training All Models")
    print("#" * 60)

    print("\n>>> Training LSTM (Time-to-Failure) <<<\n")
    lstm_metrics = run_lstm()

    print("\n>>> Training Random Forest (Fault Detection) <<<\n")
    rf_metrics = run_rf()

    print("\n" + "#" * 60)
    print("#  All Models Trained Successfully!")
    print("#" * 60)
    print(f"  LSTM  - Test MAE: {lstm_metrics['mae']:.4f}, R2: {lstm_metrics['r2']:.4f}")
    print(f"  RF    - Test Accuracy: {rf_metrics['accuracy']*100:.2f}%, F1: {rf_metrics['f1']:.4f}")
    print("#" * 60)


if __name__ == "__main__":
    main()
