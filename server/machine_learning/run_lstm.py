"""
run_lstm.py
===========
Standalone entry point that orchestrates the full LSTM training pipeline:

  1. Load real IoT sequential streetlight sensor data
  2. Preprocess: MinMaxScaler + sliding-window sequences
  3. Split into Train (70%) / Validation (15%) / Test (15%)
  4. Build and train an LSTM model
  5. Evaluate on Validation and Test sets
  6. Export the trained model to models/lstm_model.pt

Usage:
    cd server/machine_learning
    python run_lstm.py
"""

from lstm_data import load_lstm_dataset
from lstm_preprocess import preprocess_pipeline
from lstm_train import (
    split_sequences,
    build_lstm_model,
    train_model,
    evaluate_model,
    save_model,
)
import retrain_utils


def main(csv_path: str = None):
    from app.core.config import settings
    
    print("=" * 60)
    print("  Smart Streetlight - LSTM Time-to-Failure Training")
    print(f"  Mode: {'PRODUCTION (Cloud)' if settings.PROD else 'LOCAL (Demo)'}")
    print("=" * 60)

    # ---------------------------------------------------------- #
    # Step 1: Load real IoT sequential data                      #
    # ---------------------------------------------------------- #
    if not csv_path:
        # --- [Step 1] Incremental Data Update ---
        # Fetch new logs from DB and create a NEW version (V_n+1)
        from retrain_utils import update_dataset_from_db
        csv_path = update_dataset_from_db("streetlight_dataset_augmented")
    
    print(f"\n[Step 2] Loading dataset from: {csv_path}")
    from lstm_data import load_lstm_dataset
    df = load_lstm_dataset(csv_path=csv_path)
    print(f"  -> Dataset shape: {df.shape}")
    print(f"  -> time_to_failure range: [{df['time_to_failure'].min()}, {df['time_to_failure'].max()}]")

    # ---------------------------------------------------------- #
    # Step 2: Preprocess (scale + create sequences)               #
    # ---------------------------------------------------------- #
    X, y, scaler, target_scaler = preprocess_pipeline(df)

    # ---------------------------------------------------------- #
    # Step 3: Split dataset (70 / 15 / 15)                        #
    # ---------------------------------------------------------- #
    print("\n[Step 3] Splitting dataset...")
    X_train, X_val, X_test, y_train, y_val, y_test = split_sequences(X, y)

    # ---------------------------------------------------------- #
    # Step 4: Build and train LSTM model                          #
    # ---------------------------------------------------------- #
    print("\n[Step 4] Building LSTM model...")
    model = build_lstm_model(input_size=X.shape[2])

    print("\n[Step 4b] Training LSTM model...")
    model = train_model(model, X_train, y_train, X_val, y_val)

    # ---------------------------------------------------------- #
    # Step 5: Evaluate on Validation and Test sets                #
    # ---------------------------------------------------------- #
    print("\n[Step 5] Evaluating model...")
    evaluate_model(model, X_val, y_val, split_name="Validation")
    test_metrics = evaluate_model(model, X_test, y_test, split_name="Test")

    # ---------------------------------------------------------- #
    # Step 6: Export model                                        #
    # ---------------------------------------------------------- #
    print("[Step 6] Exporting model locally...")
    model_path = save_model(model)

    # ---------------------------------------------------------- #
    # Step 7: Registration & Versioning                           #
    # ---------------------------------------------------------- #
    print("\n[Step 7] Registering model and scalers in registry...")
    from retrain_utils import upload_lstm_artifacts, get_next_model_version
    import os
    
    # Artifact paths
    MODELS_DIR = os.path.dirname(model_path)
    scaler_path = os.path.join(MODELS_DIR, "lstm_scaler.joblib")
    target_scaler_path = os.path.join(MODELS_DIR, "lstm_target_scaler.joblib")
    
    next_m_version = get_next_model_version("lstm_model")
    
    upload_lstm_artifacts(
        model_path, 
        scaler_path, 
        target_scaler_path, 
        next_m_version, 
        metrics=test_metrics
    )

    # ---------------------------------------------------------- #
    # Summary                                                     #
    # ---------------------------------------------------------- #
    print("\n" + "=" * 60)
    print("  LSTM Training Complete!")
    print("=" * 60)
    print(f"  Model file : {model_path}")
    print(f"  Test MAE   : {test_metrics['mae']:.4f} timesteps")
    print(f"  Test MSE   : {test_metrics['mse']:.4f}")
    print(f"  Test R2    : {test_metrics['r2']:.4f}")
    print("=" * 60)

    return test_metrics


if __name__ == "__main__":
    main()
