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

- Failure Status (Normal / Faulty)
- Failure Probability Score
- Maintenance Urgency Level (Low, Medium, High)

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

- Voltage (V)
- Current (A)
- Power (W)
- Light intensity (Lux)
- Operating hours

### 5.2 Engineered Features

- Power consumption trends
- Voltage fluctuation rate
- Current deviation from baseline
- Operating time since last maintenance
- Frequency of minor faults

## 6. Data Preprocessing

- Handling missing values (interpolation / mean substitution)
- Noise filtering and smoothing
- Normalization and scaling
- Label encoding for categorical variables
- Time-window aggregation for time-series analysis

## 7. Model Selection and Design

### 7.1 Failure Prediction Model

- **Model Type:** Random Forest Classifier
- **Rationale:**
  - Handles non-linear relationships
  - Robust to noise
  - Interpretable feature importance

### 7.2 Anomaly Detection Model

- **Model Type:** Support Vector Machine (One-Class SVM)
- **Rationale:**
  - Effective for detecting deviations from normal behavior
  - Suitable when labeled fault data is limited

### 7.3 Time-Series Prediction Model (Optional)

- **Model Type:** Long Short-Term Memory (LSTM)
- **Rationale:**
  - Captures temporal dependencies
  - Effective for degradation trend forecasting

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

- Accuracy
- Precision
- Recall
- F1-Score
- ROC-AUC (for failure prediction)
- Mean Absolute Error (for time-series models)

## 10. Maintenance Urgency Classification Logic

Maintenance urgency is derived using:

- Failure probability output
- Anomaly score threshold
- Operating duration

**Urgency Levels:**

- **Low:** Normal operation
- **Medium:** Potential degradation detected
- **High:** High probability of failure

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

## 16. Conclusion

The machine learning design outlined in this document enables intelligent, data-driven predictive maintenance for streetlight infrastructure. By integrating ML models directly within the FastAPI backend, the system achieves efficient inference, scalability, and maintainability, supporting the overall objectives of smart city automation.
