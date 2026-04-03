"""
run_all.py
==========
Master training script that runs BOTH model pipelines sequentially:

  1. Random Forest — Failure Prediction (Classification)
  2. LSTM — Degradation Trend Forecasting (Time-Series Regression)

Usage:
    cd server/machine_learning
    python run_all.py
"""

from run_random_forest import main as train_random_forest
from run_lstm import main as train_lstm


def main():
    print("╔" + "═" * 60 + "╗")
    print("║  Smart Streetlight — Full Model Training Suite             ║")
    print("╚" + "═" * 60 + "╝")

    # ---------------------------------------------------------- #
    #  Model 1: Random Forest Classifier                          #
    # ---------------------------------------------------------- #
    print("\n\n" + "▶" * 20 + " RANDOM FOREST " + "◀" * 20)
    rf_metrics = train_random_forest()

    # ---------------------------------------------------------- #
    #  Model 2: LSTM Degradation Forecaster                       #
    # ---------------------------------------------------------- #
    print("\n\n" + "▶" * 20 + " LSTM " + "◀" * 20)
    lstm_metrics = train_lstm()

    # ---------------------------------------------------------- #
    #  Final Summary                                              #
    # ---------------------------------------------------------- #
    print("\n" + "╔" + "═" * 60 + "╗")
    print("║  All Models Trained Successfully!                          ║")
    print("╠" + "═" * 60 + "╣")
    print(f"║  Random Forest — Test Accuracy : {rf_metrics['accuracy']:.4f}                   ║")
    print(f"║  Random Forest — Test F1-Score : {rf_metrics['f1_score']:.4f}                   ║")
    print(f"║  LSTM          — Test MAE      : {lstm_metrics['mae']:.6f}                 ║")
    print("╚" + "═" * 60 + "╝")


if __name__ == "__main__":
    main()
