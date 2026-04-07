# Machine Learning Implementation Guide

This document provides a comprehensive guide for implementing and integrating machine learning (ML) models into the **Smart Streetlight Research** project. It covers the end-to-end workflow from data preparation to backend integration and inference.

## 1. Project Overview

The ML component focuses on two primary areas:
1.  **Failure Prediction (Classification)**: Using a Random Forest Classifier to identify whether a streetlight is "Normal" or "Faulty" based on current sensor readings.
2.  **Degradation Trend Forecasting (Time-Series)**: Using a Long Short-Term Memory (LSTM) model to predict future degradation levels, enabling proactive maintenance.

---

## 2. Machine Learning Directory Structure

The ML-related code is located in `server/machine_learning/`:

```text
server/machine_learning/
├── models/                     # Directory for serialized models (.joblib, .keras)
├── random_forest_data.py        # Data extraction for Random Forest
├── random_forest_preprocess.py  # Preprocessing and feature engineering (RF)
├── random_forest_train.py       # Training and evaluation (RF)
├── run_random_forest.py         # Entry point for Random Forest pipeline
├── lstm_data.py                 # Data extraction for LSTM
├── lstm_preprocess.py           # Preprocessing and feature engineering (LSTM)
├── lstm_train.py                # Training and evaluation (LSTM)
├── run_lstm.py                  # Entry point for LSTM pipeline
└── run_all.py                   # Master script to run both pipelines
```

---

## 3. Implementation Workflow

### Step 1: Model Training
Before the web server can perform inference, the models must be trained and saved into the `models/` directory.

1.  **Navigate to the ML directory**:
    ```bash
    cd server/machine_learning
    ```
2.  **Run the training suite**:
    ```bash
    python run_all.py
    ```
    This will produce the following artifacts in `server/machine_learning/models/`:
    - `random_forest_model.joblib`
    - `random_forest_scaler.joblib`
    - `lstm_model.pt` (PyTorch)
    - `lstm_scaler.joblib`

### Step 2: Backend Integration (FastAPI)
The FastAPI backend needs to load these models and use them during the `add_log` lifecycle.

#### 1. Create an `MLInferenceService`
Located in `server/web_server/app/services/ml_inference.py`, this service will:
- Load the models (Singleton pattern recommended for performance).
- Provide a `predict_failure(log_data)` method.
- Provide a `forecast_degradation(history_data)` method.

#### 2. Update `StreetlightLogService`
Modify the `add_log_from_iot` method in `server/web_server/app/services/streetlight_log.py` to trigger inference:

```python
# Location: server/web_server/app/services/streetlight_log.py

def add_log_from_iot(self, iot_log: IoTNodeLogCreate) -> StreetlightLogRead:
    # 1. Save the new log to the database
    streetlight = self.streetlight_repo.get_by_device_id(iot_log.device_id)
    new_log = self.streetlight_log_repo.create(streetlight.id, iot_log)
    
    # 2. Perform ML Inference (Random Forest)
    prediction = self.ml_inference_service.predict_failure(iot_log)
    
    # 3. Store prediction in Predictive Maintenance Log
    self.predictive_maintenance_service.create_log({
        "streetlight_id": streetlight.id,
        "prediction_type": "Random Forest",
        "predicted_status": prediction['status'],
        "confidence_score": prediction['confidence'],
        "timestamp": datetime.utcnow()
    })
    
    return new_log
```

---

## 4. Feature Engineering Details

### Random Forest (Failure Prediction)
- **Inputs**: `voltage`, `current`, `power`, `light_intensity`.
- **Pre-processing**: Standard scaling using `rf_scaler.joblib`.
- **Output**: Binary classification (0: Normal, 1: Faulty).

### LSTM (Degradation Forecasting)
- **Inputs**: Last `N` entries of `voltage` and `current`.
- **Pre-processing**: MinMaxScaler and reshaping for (samples, time_steps, features).
- **Output**: A floating-point value representing the predicted degradation level in the next time step.

---

## 5. Deployment Considerations

- **Dependencies**: Ensure `scikit-learn`, `joblib`, `tensorflow` (or `pytorch`), and `numpy` are in `requirements.txt`.
- **Performance**: Loading the model should be done once when the application starts. Use `FastAPI` lifecycle events (`@app.on_event("startup")`).
- **Database Synchronization**: Ensure the ML pipelines use the same SQLAlchemy models to fetch training data as the web server does for operational data.

---

## 6. Next Steps for Tomorrow

1.  [ ] Verify existing training scripts run without errors in the local environment.
2.  [ ] Create `MLInferenceService` in the `web_server`.
3.  [ ] Implement model loading logic using `joblib` and `pickle`.
4.  [ ] Integrate inference call within `StreetlightLogService.add_log_from_iot`.
5.  [ ] Verify predictions are correctly saved to the `predictive_maintenance_logs` table.

---

> [!NOTE]
> The current system uses placeholder training data logic. Ensure the database has sufficient logs before running a real training session.
