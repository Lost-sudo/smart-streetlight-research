import os
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from app.schemas.streetlight import IoTNodeLogCreate

# Define paths relative to this file to the models directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, "machine_learning", "models")
MODEL_PATH = os.path.join(MODELS_DIR, "random_forest_model.joblib")
SCALER_PATH = os.path.join(MODELS_DIR, "random_forest_scaler.joblib")

class MLPredictionService:
    def __init__(self):
        # Load models on initialization to avoid loading on every request
        self.model = None
        self.scaler = None
        self._load_artifacts()

    def _load_artifacts(self):
        try:
            if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
                self.model = joblib.load(MODEL_PATH)
                self.scaler = joblib.load(SCALER_PATH)
                print(f"[MLPredictionService] Successfully loaded model and scaler from {MODELS_DIR}")
            else:
                print(f"[MLPredictionService] Warning: Model or scaler not found in {MODELS_DIR}. Falling back to mock prediction.")
        except Exception as e:
            print(f"[MLPredictionService] Error loading artifacts: {e}. Falling back to mock prediction.")

    def predict_failure(self, iot_log: IoTNodeLogCreate, historical_logs=None):
        """
        Takes raw IoT node log data and optional historical logs to engineer features,
        runs prediction, and maps it to a failure probability and urgency.
        """
        # Ensure we have a model
        if not self.model or not self.scaler:
            return self._mock_prediction(iot_log)

        # 1. Derive features
        # If we had robust historical logs we would calculate actual fluctuations. 
        # For real-time processing of a single point without heavy DB queries, we mock engineered features
        # or use very basic defaults.
        operating_hours = 1000.0  # Placeholder: ideally queried from DB
        voltage_fluctuation = 0.0 # Placeholder
        current_deviation = 0.0   # Placeholder
        power_trend = 0.0         # Placeholder
        fault_frequency = 0.0     # Placeholder

        # Features array must follow exact order expected by random forest
        features_dict = {
            "voltage": [iot_log.voltage],
            "current": [iot_log.current],
            "power_consumption": [iot_log.power_consumption],
            "light_intensity": [iot_log.light_intensity],
            "operating_hours": [operating_hours],
            "voltage_fluctuation": [voltage_fluctuation],
            "current_deviation": [current_deviation],
            "power_trend": [power_trend],
            "fault_frequency": [fault_frequency]
        }
        df = pd.DataFrame(features_dict)
        
        # 2. Scale features
        # We assume ALL_FEATURES order from random_forest_preprocess.py is the same as the dict keys.
        cols = list(features_dict.keys())
        df[cols] = self.scaler.transform(df[cols])

        # 3. Predict probability
        try:
            # predict_proba returns array of shape (n_samples, n_classes). We want probability of class 1 (failure)
            probas = self.model.predict_proba(df)
            failure_prob = float(probas[0][1]) if probas.shape[1] > 1 else float(self.model.predict(df)[0])
        except Exception as e:
            print(f"[MLPredictionService] Prediction error {e}. Falling back to mock.")
            return self._mock_prediction(iot_log)

        # 4. Map to output format
        urgency_level = self._map_urgency(failure_prob)
        predicted_failure_date = datetime.utcnow() + timedelta(days=int((1 - failure_prob) * 365))

        return {
            "failure_probability": round(failure_prob, 4),
            "predicted_failure_date": predicted_failure_date,
            "urgency_level": urgency_level
        }

    def _mock_prediction(self, iot_log: IoTNodeLogCreate):
        """Fallback rule-based prediction if model is unavailable."""
        failure_prob = 0.1
        if iot_log.voltage < 200 or iot_log.voltage > 240:
            failure_prob += 0.4
        if iot_log.power_consumption > 150:
            failure_prob += 0.3
        
        failure_prob = min(failure_prob, 0.99)
        urgency_level = self._map_urgency(failure_prob)
        predicted_failure_date = datetime.utcnow() + timedelta(days=int((1 - failure_prob) * 365))

        return {
            "failure_probability": round(failure_prob, 4),
            "predicted_failure_date": predicted_failure_date,
            "urgency_level": urgency_level
        }

    def _map_urgency(self, probability: float) -> str:
        if probability < 0.3:
            return "low"
        elif probability < 0.7:
            return "medium"
        return "high" # or critical depending on enum, let's use high as per schema unless critical is supported
