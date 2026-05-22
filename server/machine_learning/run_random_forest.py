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
    build_model,
    train_model,
    evaluate_model,
    save_predictions,
    save_model,
    split_data
)
from random_forest_data import RF_FEATURES
import retrain_utils


def main(csv_path: str = None):
    from app.core.config import settings
    
    print("=" * 60)
    print("  Smart Streetlight - Random Forest Fault Detection Training")
    print(f"  Mode: {'PRODUCTION (Cloud)' if settings.PROD else 'LOCAL (Demo)'}")
    print("=" * 60)

    # ---------------------------------------------------------- #
    # Step 1: Load real IoT sensor data                           #
    # ---------------------------------------------------------- #
    if not csv_path:
        # --- [Step 1] Incremental Data Update ---
        # Fetch new logs from DB and create a NEW version (V_n+1)
        from retrain_utils import update_dataset_from_db
        csv_path = update_dataset_from_db("streetlight_dataset_augmented")
    
    print(f"\n[Step 2] Loading dataset from: {csv_path}")
    df = load_real_dataset(csv_path=csv_path)
    print(f"  -> Dataset shape: {df.shape}")

    # ---------------------------------------------------------- #
    # Step 2: Preprocess (temporal features, no scaling)          #
    # ---------------------------------------------------------- #
    print(f"\n[Step 2] Preprocessing ({len(RF_FEATURES)} features)...")
    X, y, df_processed = preprocess_pipeline(df)

    # ---------------------------------------------------------- #
    # Step 3: Stratified split (70 / 15 / 15)                     #
    # ---------------------------------------------------------- #
    print("\n[Step 3] Stratified split (both classes in all sets)...")
    X_train, X_val, X_test, y_train, y_val, y_test = split_data(X, y)

    # ---------------------------------------------------------- #
    # Step 4: Build and train Random Forest                       #
    # ---------------------------------------------------------- #
    print("\n[Step 4] Building Random Forest model...")
    model = build_model(n_estimators=200, max_depth=25)

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
    print("[Step 7] Exporting model locally...")
    model_path = save_model(model)

    # ---------------------------------------------------------- #
    # Step 8: Registration & Versioning                           #
    # ---------------------------------------------------------- #
    print("\n[Step 8] Registering model in registry...")
    from retrain_utils import upload_trained_model_to_hf, get_next_model_version
    
    next_m_version = get_next_model_version("random_forest_model")
    upload_trained_model_to_hf(model_path, next_m_version, base_name="random_forest_model", metrics=test_metrics)

    # ---------------------------------------------------------- #
    # Step 9: Feature Importance (Chapter 4 formatted)             #
    # ---------------------------------------------------------- #
    from random_forest_data import RF_FEATURE_DISPLAY_NAMES
    
    print("\n[Step 9] Feature Importance:")
    importances = model.feature_importances_
    sorted_features = sorted(zip(RF_FEATURES, importances), key=lambda x: -x[1])
    
    print(f"\n  {'─' * 65}")
    print(f"  CHAPTER 4 FIGURE: Random Forest Feature Importance (Relative Weight)")
    print(f"  {'─' * 65}")
    
    max_bar_len = 40
    max_imp = sorted_features[0][1] if sorted_features else 1.0
    
    for fname, imp in sorted_features:
        display_name = RF_FEATURE_DISPLAY_NAMES.get(fname, fname)
        bar_len = int((imp / max_imp) * max_bar_len)
        bar = "█" * bar_len
        print(f"    {display_name:<28s} {bar} {imp:.4f}")
    
    print(f"  {'─' * 65}")

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
    print("=" * 60)

    return test_metrics


if __name__ == "__main__":
    main()
