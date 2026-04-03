"""
run_random_forest.py
====================
Standalone entry point that orchestrates the full Random Forest training pipeline:

  1. Generate synthetic streetlight sensor data
  2. Preprocess and scale features
  3. Split into Train (70%) / Validation (15%) / Test (15%)
  4. Train a Random Forest Classifier
  5. Evaluate on Validation and Test sets
  6. Print feature importance
  7. Export the trained model to models/random_forest_model.joblib

Usage:
    cd server/machine_learning
    python run_random_forest.py
"""

from random_forest_data import generate_synthetic_dataset
from random_forest_preprocess import preprocess_pipeline, ALL_FEATURES
from random_forest_train import split_dataset, train_model, evaluate_model, print_feature_importance, save_model


def main():
    print("=" * 60)
    print("  Smart Streetlight — Random Forest Model Training")
    print("=" * 60)

    # ---------------------------------------------------------- #
    # Step 1: Generate synthetic dataset                          #
    # ---------------------------------------------------------- #
    print("\n[Step 1] Generating synthetic sensor data...")
    df = generate_synthetic_dataset(n_samples=2000, faulty_ratio=0.25)
    print(f"  → Dataset shape: {df.shape}")
    print(f"  → Class distribution:\n{df['failure_status'].value_counts().to_string()}")

    # ---------------------------------------------------------- #
    # Step 2: Preprocess (handle missing values + scale)          #
    # ---------------------------------------------------------- #
    print("\n[Step 2] Preprocessing data...")
    df = preprocess_pipeline(df, fit=True)

    # ---------------------------------------------------------- #
    # Step 3: Split dataset (70 / 15 / 15)                        #
    # ---------------------------------------------------------- #
    print("\n[Step 3] Splitting dataset...")
    X_train, X_val, X_test, y_train, y_val, y_test = split_dataset(df)

    # ---------------------------------------------------------- #
    # Step 4: Train Random Forest model                           #
    # ---------------------------------------------------------- #
    print("\n[Step 4] Training Random Forest Classifier...")
    model = train_model(X_train, y_train, n_estimators=100)

    # ---------------------------------------------------------- #
    # Step 5: Evaluate on Validation and Test sets                #
    # ---------------------------------------------------------- #
    print("\n[Step 5] Evaluating model...")
    val_metrics = evaluate_model(model, X_val, y_val, split_name="Validation")
    test_metrics = evaluate_model(model, X_test, y_test, split_name="Test")

    # ---------------------------------------------------------- #
    # Step 6: Feature importance                                  #
    # ---------------------------------------------------------- #
    print_feature_importance(model, ALL_FEATURES)

    # ---------------------------------------------------------- #
    # Step 7: Export model                                        #
    # ---------------------------------------------------------- #
    print("[Step 7] Exporting model...")
    model_path = save_model(model)

    # ---------------------------------------------------------- #
    # Summary                                                     #
    # ---------------------------------------------------------- #
    print("\n" + "=" * 60)
    print("  Random Forest Training Complete!")
    print("=" * 60)
    print(f"  Model file   : {model_path}")
    print(f"  Test Accuracy : {test_metrics['accuracy']:.4f}")
    print(f"  Test F1-Score : {test_metrics['f1_score']:.4f}")
    print(f"  Test ROC-AUC  : {test_metrics['roc_auc']:.4f}")
    print("=" * 60)

    return test_metrics


if __name__ == "__main__":
    main()
