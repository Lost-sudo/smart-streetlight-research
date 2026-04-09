import os
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from app.schemas.streetlight import IoTNodeLogCreate

import torch
import torch.nn as nn

# Define paths relative to this file to the models directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, "machine_learning", "models")
RF_MODEL_PATH = os.path.join(MODELS_DIR, "random_forest_model.joblib")
RF_SCALER_PATH = os.path.join(MODELS_DIR, "random_forest_scaler.joblib")
LSTM_MODEL_PATH = os.path.join(MODELS_DIR, "lstm_model.pt")
LSTM_SCALER_PATH = os.path.join(MODELS_DIR, "lstm_scaler.joblib")

class LSTMModel(nn.Module):
    def __init__(self, input_size: int, hidden_size: int = 64, dropout: float = 0.2):
        super(LSTMModel, self).__init__()
        self.hidden_size = hidden_size
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            batch_first=True,
        )
        self.dropout = nn.Dropout(dropout)
        self.fc1 = nn.Linear(hidden_size, 32)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(32, 1)

    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        last_hidden = lstm_out[:, -1, :]
        out = self.dropout(last_hidden)
        out = self.relu(self.fc1(out))
        out = self.fc2(out)
        return out.squeeze(-1)

class MLPredictionService:
    def __init__(self, use_lstm: bool = True):
        self.use_lstm = use_lstm
        self.rf_model = None
        self.rf_scaler = None
        self.lstm_model = None
        self.lstm_scaler = None
        self._load_artifacts()

    def _load_artifacts(self):
        try:
            if os.path.exists(RF_MODEL_PATH) and os.path.exists(RF_SCALER_PATH):
                self.rf_model = joblib.load(RF_MODEL_PATH)
                self.rf_scaler = joblib.load(RF_SCALER_PATH)
                print(f"[MLPredictionService] Loaded Random Forest model.")
            else:
                print(f"[MLPredictionService] Warning: Random Forest model or scaler not found.")
                
            if os.path.exists(LSTM_MODEL_PATH) and os.path.exists(LSTM_SCALER_PATH):
                self.lstm_model = LSTMModel(input_size=4)
                self.lstm_model.load_state_dict(torch.load(LSTM_MODEL_PATH, weights_only=True))
                self.lstm_model.eval() # Set to evaluation mode
                self.lstm_scaler = joblib.load(LSTM_SCALER_PATH)
                print(f"[MLPredictionService] Loaded LSTM model.")
            else:
                print(f"[MLPredictionService] Warning: LSTM model or scaler not found.")
        except Exception as e:
            print(f"[MLPredictionService] Error loading artifacts: {e}. Falling back to mock prediction.")

    def detect_fault(self, iot_log: IoTNodeLogCreate):
        """
        Uses Random Forest to detect if the streetlight is CURRENTLY faulty.
        """
        if not self.rf_model or not self.rf_scaler:
            return self._mock_detect_fault(iot_log)

        operating_hours = 1000.0
        voltage_fluctuation = 0.0
        current_deviation = 0.0
        power_trend = 0.0
        fault_frequency = 0.0

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
        
        cols = list(features_dict.keys())
        df[cols] = self.rf_scaler.transform(df[cols])

        try:
            probas = self.rf_model.predict_proba(df)
            failure_prob = float(probas[0][1]) if probas.shape[1] > 1 else float(self.rf_model.predict(df)[0])
        except Exception as e:
            print(f"[MLPredictionService] RF Prediction error {e}. Falling back to mock fault detection.")
            return self._mock_detect_fault(iot_log)

        is_faulty = failure_prob > 0.5
        return {
            "is_faulty": is_faulty,
            "confidence": round(failure_prob, 4),
            "urgency_level": self._map_urgency(failure_prob)
        }

    def predict_failure(self, iot_log: IoTNodeLogCreate, historical_logs=None):
        """
        Uses LSTM to forecast PREDICTIVE MAINTENANCE needs (future failure).
        """
        if not self.use_lstm or not self.lstm_model or not self.lstm_scaler:
            return self._mock_prediction(iot_log)

        if not historical_logs or len(historical_logs) < 9:
            # Not enough history for sequence prediction. Fallback to a mock trend.
            return self._mock_prediction(iot_log)
            
        features = ["voltage", "current", "power_consumption", "light_intensity"]
        
        # Chronological order of previous logs
        latest_history = historical_logs[-9:]
        
        sequence_data = []
        for log in latest_history:
            sequence_data.append([
                getattr(log, "voltage", 220.0),
                getattr(log, "current", 0.45),
                getattr(log, "power_consumption", 100.0),
                getattr(log, "light_intensity", 350.0)
            ])
            
        sequence_data.append([
            iot_log.voltage,
            iot_log.current,
            iot_log.power_consumption,
            iot_log.light_intensity
        ])
        
        df = pd.DataFrame(sequence_data, columns=features)
        scaled_data = self.lstm_scaler.transform(df.values)
        input_tensor = torch.FloatTensor(scaled_data).unsqueeze(0)
        
        with torch.no_grad():
            predicted_power_consumption = self.lstm_model(input_tensor).item()
        
        # MAPPING LSTM PREDICTION TO FAILURE PROBABILITY
        base_probability = 0.1
        if predicted_power_consumption > 150:
            failure_prob = 0.95
        elif predicted_power_consumption > 130:
            failure_prob = 0.5 + (predicted_power_consumption - 130) * 0.02
        else:
            failure_prob = base_probability
            
        failure_prob = min(max(failure_prob, 0.0), 1.0)
        
        urgency_level = self._map_urgency(failure_prob)
        predicted_failure_date = datetime.utcnow() + timedelta(days=int((1 - failure_prob) * 365))

        return {
            "failure_probability": round(failure_prob, 4),
            "predicted_failure_date": predicted_failure_date,
            "urgency_level": urgency_level
        }

    def _mock_detect_fault(self, iot_log: IoTNodeLogCreate):
        """Fallback for RF if model unavailable."""
        failure_prob = 0.1
        if iot_log.voltage < 200 or iot_log.voltage > 240:
            failure_prob += 0.4
        if iot_log.power_consumption > 150:
            failure_prob += 0.3
        
        failure_prob = min(failure_prob, 0.99)
        return {
            "is_faulty": failure_prob > 0.5,
            "confidence": round(failure_prob, 4),
            "urgency_level": self._map_urgency(failure_prob)
        }

    def _mock_prediction(self, iot_log: IoTNodeLogCreate):
        """Fallback for LSTM predictive maintenance if history or model unavailable."""
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
        return "high"
