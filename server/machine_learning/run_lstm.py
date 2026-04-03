"""
run_lstm.py
===========
Standalone entry point that orchestrates the full LSTM training pipeline:

  1. Generate synthetic sequential streetlight sensor data
  2. Preprocess: MinMaxScaler + sliding-window sequences
  3. Split into Train (70%) / Validation (15%) / Test (15%)
  4. Build and train an LSTM model
  5. Evaluate on Validation and Test sets
  6. Export the trained model to models/lstm_model.pt

Usage:
    cd server/machine_learning
    python run_lstm.py
"""

from lstm_data import generate_sequential_dataset
from lstm_preprocess import preprocess_pipeline
from lstm_train import (
    split_sequences,
    build_lstm_model,
    train_model,
    evaluate_model,
    save_model,
)


def main():
    print("=" * 60)
    print("  Smart Streetlight — LSTM Degradation Forecasting Training")
    print("=" * 60)

    # ---------------------------------------------------------- #
    # Step 1: Generate synthetic sequential data                  #
    # ---------------------------------------------------------- #
    print("\n[Step 1] Generating synthetic sequential data...")
    df = generate_sequential_dataset(n_nodes=50, n_timesteps=200)
    print(f"  → Dataset shape: {df.shape}")

    # ---------------------------------------------------------- #
    # Step 2: Preprocess (scale + create sequences)               #
    # ---------------------------------------------------------- #
    LOOKBACK = 10
    print(f"\n[Step 2] Preprocessing (lookback={LOOKBACK})...")
    X, y = preprocess_pipeline(df, lookback=LOOKBACK, fit=True)

    # ---------------------------------------------------------- #
    # Step 3: Split dataset (70 / 15 / 15)                        #
    # ---------------------------------------------------------- #
    print("\n[Step 3] Splitting dataset...")
    X_train, X_val, X_test, y_train, y_val, y_test = split_sequences(X, y)

    # ---------------------------------------------------------- #
    # Step 4: Build and train LSTM model                          #
    # ---------------------------------------------------------- #
    print("\n[Step 4] Building LSTM model...")
    input_size = X_train.shape[2]  # number of features per timestep
    model = build_lstm_model(input_size, hidden_size=64, dropout=0.2)

    print("\n[Step 4b] Training LSTM model...")
    history = train_model(
        model, X_train, y_train, X_val, y_val,
        epochs=50, batch_size=32,
    )

    # ---------------------------------------------------------- #
    # Step 5: Evaluate on Validation and Test sets                #
    # ---------------------------------------------------------- #
    print("\n[Step 5] Evaluating model...")
    val_metrics = evaluate_model(model, X_val, y_val, split_name="Validation")
    test_metrics = evaluate_model(model, X_test, y_test, split_name="Test")

    # ---------------------------------------------------------- #
    # Step 6: Export model                                        #
    # ---------------------------------------------------------- #
    print("[Step 6] Exporting model...")
    model_path = save_model(model)

    # ---------------------------------------------------------- #
    # Summary                                                     #
    # ---------------------------------------------------------- #
    print("\n" + "=" * 60)
    print("  LSTM Training Complete!")
    print("=" * 60)
    print(f"  Model file : {model_path}")
    print(f"  Test MAE   : {test_metrics['mae']:.6f}")
    print(f"  Test MSE   : {test_metrics['loss_mse']:.6f}")
    print("=" * 60)

    return test_metrics


if __name__ == "__main__":
    main()
