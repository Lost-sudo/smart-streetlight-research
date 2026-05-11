# ML Retraining and Model Versioning Plan

This plan defines the latest retraining workflow aligned with the current system architecture.

## 1. Goal

Enable reliable retraining, versioning, and rollout of all defined ML models:

- Random Forest
- Support Vector Machine (SVM)
- LSTM

## 2. Current System Alignment

- IoT telemetry comes from ESP32 nodes over Wi-Fi.
- Backend/API and ML inference run in FastAPI.
- Historical data is stored in PostgreSQL (`streetlight_logs` and related tables).
- Model metadata should be tracked in a model-version registry table.

## 3. Retraining Triggers

- Scheduled cycle (monthly or quarterly)
- Manual trigger from admin settings
- Data drift or model performance degradation

## 4. Training Dataset Contract

### 4.1 Required Fields

- `node_id`
- `timestamp`
- `light_level`
- `voltage`
- `current`
- `power`
- `relay_state`
- `device_status`

### 4.2 Derived Training Features

- `d_voltage`, `d_current`, `d_power`
- rolling mean/std windows
- `operating_hours`
- `voltage_fluctuation`
- `fault_frequency`

### 4.3 Label Strategy

- RF: fault class labels from maintenance/fault events
- SVM: normal-baseline training set + anomaly boundary labels/heuristics
- LSTM: sequential failure trend target (risk/TTF proxy)

## 5. Pipeline Flow

1. Extract and validate training data from DB.
2. Build dataset snapshot (versioned).
3. Train RF, SVM, and LSTM.
4. Evaluate metrics and compare with active models.
5. Save artifacts and metadata as a new model version.
6. Promote only if acceptance criteria pass.
7. Reload active models in inference service.

## 6. Versioning Requirements

Track per model version:

- model type (`rf`, `svm`, `lstm`)
- version tag
- training date
- dataset snapshot reference
- metrics (F1/ROC-AUC/MAE etc.)
- artifact location
- status (`candidate`, `active`, `archived`, `failed`)

## 7. Deployment and Rollout

- Keep active + previous stable version available locally.
- Use controlled activation (manual approval or policy-based auto-promote).
- Support immediate rollback to last stable version.

## 8. Operational Safety

- Abort deployment if mandatory metrics regress beyond threshold.
- Keep inference running using existing active models during retraining.
- Emit retraining and model-load events to logs/monitoring.

## 9. Suggested Next Implementation Steps

1. Add `svm_train.py` and `run_svm.py` if not present.
2. Standardize feature extraction shared by RF/SVM/LSTM.
3. Implement model version table usage in inference loader.
4. Add admin endpoint for retraining job status.
5. Add rollback endpoint for model version control.
