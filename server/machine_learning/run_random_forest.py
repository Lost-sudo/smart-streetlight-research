"""
run_random_forest.py
====================
Standalone entry point that orchestrates the full Random Forest training pipeline:

  1. Load real IoT sensor data from datasets/dataset.csv
  2. Preprocess: temporal feature engineering (no scaling — RF is scale-invariant)
  3. Chronological split into Train (70%) / Validation (15%) / Test (15%)
  4. Build and train a Random Forest classifier
  5. Evaluate on Validation and Test sets (with classification report)
  6. Save test predictions to CSV for debugging
  7. Export the trained model to models/random_forest_model.joblib

Usage:
    cd server/machine_learning
    python run_random_forest.py
"""

from random_forest_data import load_real_dataset
from random_forest_preprocess import preprocess_pipeline
from random_forest_train import (
    split_data,
    build_model,
    train_model,
    evaluate_model,
    save_model,
    save_predictions,
)
from lstm_data import RF_FEATURES


def main():
    print("=" * 60)
    print("  Smart Streetlight - Random Forest Fault Detection Training")
    print("  (Trained on Real IoT Data)")
    print("=" * 60)

    # ---------------------------------------------------------- #
    # Step 1: Load real IoT sensor data                           #
    # ---------------------------------------------------------- #
    print("\n[Step 1] Loading real IoT dataset...")
    df = load_real_dataset()
    print(f"  -> Dataset shape: {df.shape}")

    # ---------------------------------------------------------- #
    # Step 2: Preprocess (temporal features, no scaling)          #
    # ---------------------------------------------------------- #
    print(f"\n[Step 2] Preprocessing ({len(RF_FEATURES)} features)...")
    X, y, df_processed = preprocess_pipeline(df, fit=True)

    # ---------------------------------------------------------- #
    # Step 3: Stratified split (70 / 15 / 15)                     #
    # ---------------------------------------------------------- #
    print("\n[Step 3] Stratified split (both classes in all sets)...")
    X_train, X_val, X_test, y_train, y_val, y_test = split_data(X, y)

    # ---------------------------------------------------------- #
    # Step 4: Build and train Random Forest                       #
    # ---------------------------------------------------------- #
    print("\n[Step 4] Building Random Forest model...")
    model = build_model(n_estimators=100, max_depth=15)

    print("\n[Step 4b] Training Random Forest model...")
    model = train_model(model, X_train, y_train)

    # ---------------------------------------------------------- #
    # Step 5: Evaluate on Validation and Test sets                #
    # ---------------------------------------------------------- #
    print("\n[Step 5] Evaluating model...")
    val_metrics = evaluate_model(model, X_val, y_val, split_name="Validation")
    test_metrics = evaluate_model(model, X_test, y_test, split_name="Test")

    # ---------------------------------------------------------- #
    # Step 6: Save test predictions for analysis                  #
    # ---------------------------------------------------------- #
    print("[Step 6] Saving test predictions...")
    pred_path = save_predictions(model, X_test, y_test)

    # ---------------------------------------------------------- #
    # Step 7: Export model                                        #
    # ---------------------------------------------------------- #
    print("[Step 7] Exporting model...")
    model_path = save_model(model)

    # ---------------------------------------------------------- #
    # Step 8: Feature Importance                                  #
    # ---------------------------------------------------------- #
    print("\n[Step 8] Feature Importance:")
    importances = model.feature_importances_
    for fname, imp in sorted(zip(RF_FEATURES, importances), key=lambda x: -x[1]):
        bar = "#" * int(imp * 50)
        print(f"  {fname:25s} : {imp:.4f} {bar}")

    # ---------------------------------------------------------- #
    # Summary                                                     #
    # ---------------------------------------------------------- #
    print("\n" + "=" * 60)
    print("  Random Forest Training Complete!")
    print("=" * 60)
    print(f"  Model file        : {model_path}")
    print(f"  Predictions file  : {pred_path}")
    print(f"  Test Accuracy     : {test_metrics['accuracy'] * 100:.2f}%")
    print(f"  Test F1 Score     : {test_metrics['f1']:.4f}")
    print(f"  Test AUC-ROC      : {test_metrics['auc_roc']:.4f}")
    print("=" * 60)

    return test_metrics


if __name__ == "__main__":
    main()
