# Machine Learning Implementation Guide

This guide describes the latest implementation workflow for integrating ML in the Smart Streetlight system.

## 1. Scope

The system currently defines three ML model types:

1. Random Forest for fault classification
2. Support Vector Machine (SVM) for anomaly detection
3. LSTM for time-series degradation/failure trend forecasting

## 2. Data Contract Alignment

All inference inputs should align with the current IoT telemetry contract:

- `node_id`
- `timestamp`
- `light_level`
- `voltage`
- `current`
- `power`
- `relay_state`
- `device_status`

Do not use legacy payload names (`device_id`, `power_consumption`, `light_intensity`) in new ML service code.

## 3. Suggested ML Directory Layout

```text
server/machine_learning/
├── models/
├── datasets/
├── features/
├── random_forest_train.py
├── svm_train.py
├── lstm_train.py
├── run_random_forest.py
├── run_svm.py
├── run_lstm.py
└── run_all.py
```

## 4. Training Workflow

1. Export/prepare latest historical data from `streetlight_logs`.
2. Run preprocessing and feature engineering.
3. Train RF, SVM, and LSTM models.
4. Evaluate and save artifacts with version tags.
5. Register model version metadata.

Example command flow:

```bash
cd server/machine_learning
python run_all.py
```

Expected artifacts (example names):

- `random_forest_model.joblib`
- `svm_model.joblib`
- `lstm_model.pt`
- corresponding scaler/preprocessor artifacts

## 5. FastAPI Integration

### 5.1 ML Inference Service

Create a singleton ML service responsible for:

- loading active model versions on startup
- validating input schema from telemetry
- producing RF/SVM/LSTM outputs
- returning a unified inference object

### 5.2 Log Ingestion Hook

In telemetry ingestion flow:

1. save incoming telemetry
2. compute derived features
3. run ML inference
4. update `PredictiveMaintenance`
5. raise/update `Alert` when thresholds are exceeded

## 6. Output Contract (Recommended)

```json
{
  "node_id": "SL-001",
  "rf_fault_class": "normal",
  "rf_probability": 0.14,
  "svm_anomaly": false,
  "svm_score": -0.32,
  "lstm_risk_score": 0.27,
  "urgency_level": "low",
  "inference_timestamp": "2026-05-11T12:00:00Z"
}
```

## 7. Production Considerations

- Load models once at startup to reduce latency.
- Use versioned artifacts and keep rollback-ready copies.
- Track inference latency and model quality metrics.
- Add safe fallback behavior if one model is unavailable.

## 8. Validation Checklist

- Telemetry schema matches current system fields.
- RF/SVM/LSTM models all load successfully.
- Inference output persists to `PredictiveMaintenance`.
- Alert generation behaves correctly for medium/high risk.
- Dashboard receives updated prediction fields.
