# Machine Learning Design Document

## 1. Introduction

This Machine Learning (ML) Design Document describes the design, data flow, algorithms, training process, and deployment strategy of the machine learning component for the Web-Based Smart Streetlight Automation and Predictive Maintenance System Using IoT and Machine Learning.

The ML module is responsible for analyzing historical and real-time streetlight sensor data to detect anomalies and predict potential failures, enabling proactive and cost-efficient maintenance.

## 2. Objectives of the Machine Learning Module

The primary objectives of the ML component are:

- Predict streetlight component failures before they occur
- Detect abnormal operating conditions in real time
- Classify maintenance urgency levels
- Reduce unplanned outages and maintenance costs

## 3. Machine Learning Problem Definition

### 3.1 Problem Type

- Supervised Learning (Failure Prediction)
- Unsupervised / Semi-Supervised Learning (Anomaly Detection)
- Time-Series Forecasting (Degradation Trend Analysis)

### 3.2 Target Variables

- **Failure Status** (Normal / Faulty): Used by Random Forest.
- **Time to Failure** (RUL - Remaining Useful Life): Used by LSTM.
- **Maintenance Urgency Level** (Low, Medium, High): Derived from model outputs.

## 4. Data Sources and Data Collection

### 4.1 Data Sources

Data is collected from IoT-enabled streetlight nodes, including:

- Light intensity readings
- Voltage levels
- Current consumption
- Power usage
- Operational status (ON/OFF, dimming level)
- Fault and error logs

### 4.2 Data Collection Frequency

- **Sensor data:** Every 1–5 minutes
- **Aggregated summaries:** Hourly / Daily

## 5. Feature Engineering

### 5.1 Raw Features

- **Voltage (V)**
- **Current (A)**
- **Power (W)**
- **Light intensity (Lux)**
- **Timestep** (Sequential index for LSTM)

### 5.2 Engineered Features (Used by Random Forest)

- **Operating Hours:** Total accumulated time the lamp has been active.
- **Voltage Fluctuation:** Short-term variance or standard deviation in voltage readings.
- **Current Deviation:** Difference between measured current and expected nominal current.
- **Power Trend:** Rate of change in power consumption over recent cycles.
- **Fault Frequency:** Count of minor glitches or transient errors detected by the MCU.

## 6. Data Preprocessing

- Handling missing values (interpolation / mean substitution)
- Noise filtering and smoothing
- Normalization and scaling (StandardScaler)
- Label encoding for categorical variables
- Time-window aggregation for time-series analysis

## 7. Model Selection and Design

### 7.1 Fault Detection Model (Random Forest)

- **Model Type:** Random Forest Classifier
- **Input:** Snapshot of current sensor readings + Engineered features.
- **Output:** Binary classification (0: Normal, 1: Faulty).
- **Rationale:** Robust to noise and provides feature importance.

### 7.2 Predictive Maintenance Model (LSTM)

- **Model Type:** Long Short-Term Memory (LSTM)
- **Input:** Sequence of historical sensor readings (voltage, current, power, light).
- **Output:** Regression value (Time to Failure).
- **Rationale:** Captures temporal dependencies in degradation patterns.

## 8. Model Training Strategy

### 8.1 Training Dataset

- Historical sensor data
- Labeled failure events

### 8.2 Data Splitting

- **Training Set:** 70%
- **Validation Set:** 15%
- **Test Set:** 15%

### 8.3 Training Environment

- Offline training using historical datasets
- Periodic retraining based on new data

## 9. Model Evaluation Metrics

- Accuracy, Precision, Recall, F1-Score (RF)
- Mean Absolute Error (LSTM)
- ROC-AUC (for failure prediction)

## 10. Maintenance Urgency Classification Logic

Maintenance urgency is derived using:

- Failure probability output
- Anomaly score threshold
- Operating duration

**Urgency Levels:**

- **Low:** Normal operation
- **Medium:** Potential degradation detected (RUL < Threshold)
- **High:** High probability of failure or immediate fault detected

## 11. Model Deployment and Integration

### 11.1 Deployment Architecture

- Models deployed within the FastAPI backend
- Inference exposed via REST API endpoints

### 11.2 Real-Time Inference Flow

1. Sensor data received by backend
2. Preprocessing pipeline applied
3. ML model performs inference
4. Prediction results stored in database
5. Alerts generated if thresholds are exceeded

## 12. Model Retraining and Lifecycle Management

- Scheduled retraining (monthly or quarterly)
- Performance monitoring
- Model versioning and rollback

## 13. Ethical and Practical Considerations

- Data privacy and secure storage
- Bias minimization through diverse data collection
- Avoidance of over-reliance on automated decisions

## 14. Limitations

- Initial lack of labeled failure data
- Sensor noise and environmental effects
- Model performance dependent on data quality

## 15. Future Enhancements

- Edge-based inference on IoT devices
- Online learning models
- Integration of weather and traffic data

## 16. IoT Data Requirements (Field Specification)

To ensure the ML models function correctly, the IoT devices should send the following data fields in their telemetry payload.

### 16.1 Required Raw Sensors

These fields are **mandatory** for every transmission:

| Field Name | Data Type | Unit | Description |
| :--- | :--- | :--- | :--- |
| `device_id` | String | - | Unique identifier for the streetlight node. |
| `voltage` | Float | Volts (V) | RMS voltage measurement. |
| `current` | Float | Amperes (A) | RMS current measurement. |
| `power_consumption` | Float | Watts (W) | Active power consumption. |
| `light_intensity` | Float | Lux | Ambient light level from LDR sensor. |
| `timestamp` | ISO8601 | - | Date and time of the reading. |

### 16.2 Advanced Features (Hybrid Support)

The system now supports **Automatic Feature Extraction**. You can choose to calculate these on the IoT device or let the backend handle them.

| Field Name | IoT Requirement | Backend Fallback |
| :--- | :--- | :--- |
| `voltage_fluctuation`| **Highly Recommended** | Calculated as StdDev of recent logs. |
| `operating_hours` | Optional | Calculated from `installation_date`. |
| `current_deviation` | Optional | Calculated from historical mean current. |
| `power_trend` | Optional | Calculated from the delta of previous logs. |
| `fault_frequency` | Optional | Defaults to 0 if not provided. |

> [!TIP]
> For the best accuracy, the IoT device should still send **`voltage_fluctuation`** if possible, as it can sample voltage faster than the network can transmit.

### 16.3 Sample JSON Payload (Minimal)

```json
{
  "device_id": "SL-001",
  "voltage": 218.5,
  "current": 0.46,
  "power_consumption": 102.3,
  "light_intensity": 345.0,
  "timestamp": "2024-04-24T17:30:00Z"
}
```

## 17. Conclusion

The machine learning design outlined in this document enables intelligent, data-driven predictive maintenance for streetlight infrastructure. By integrating ML models directly within the FastAPI backend, the system achieves efficient inference, scalability, and maintainability, supporting the overall objectives of smart city automation.
