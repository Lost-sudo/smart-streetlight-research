from __future__ import annotations

import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
import torch
import torch.nn as nn

from app.schemas.streetlight import IoTNodeLogCreate

logger = logging.getLogger(__name__)

RF_FEATURES = [
    "voltage",
    "current",
    "power_consumption",
    "light_intensity",
    "operating_hours",
    "voltage_fluctuation",
    "current_deviation",
    "power_trend",
    "fault_frequency",
]

# LSTM features now include timestep for temporal awareness
LSTM_FEATURES = ["timestep", "voltage", "current", "power_consumption", "light_intensity"]

# server/web_server/app/services -> server
SERVER_DIR = Path(__file__).resolve().parents[3]
MODELS_DIR = SERVER_DIR / "machine_learning" / "models"
RF_MODEL_PATH = MODELS_DIR / "random_forest_model.joblib"
RF_SCALER_PATH = MODELS_DIR / "random_forest_scaler.joblib"
LSTM_MODEL_PATH = MODELS_DIR / "lstm_model.pt"
LSTM_SCALER_PATH = MODELS_DIR / "lstm_scaler.joblib"

# Maximum time-to-failure from training (n_timesteps * 0.95)
# This is used to normalize the LSTM output into a probability
MAX_TTF = 142.0  # 150 * 0.95 = 142 max timesteps to failure in training data

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


def _torch_load_state_dict(path: Path) -> dict[str, Any]:
    try:
        return torch.load(path, map_location="cpu", weights_only=True)
    except TypeError:
        return torch.load(path, map_location="cpu")


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
            if RF_MODEL_PATH.exists() and RF_SCALER_PATH.exists():
                self.rf_model = joblib.load(RF_MODEL_PATH)
                self.rf_scaler = joblib.load(RF_SCALER_PATH)
                logger.info("Loaded Random Forest model artifacts.")
            else:
                logger.warning("Random Forest model/scaler not found; using mock fault detection.")
                
            if LSTM_MODEL_PATH.exists() and LSTM_SCALER_PATH.exists():
                self.lstm_model = LSTMModel(input_size=len(LSTM_FEATURES))
                self.lstm_model.load_state_dict(_torch_load_state_dict(LSTM_MODEL_PATH))
                self.lstm_model.eval()
                self.lstm_scaler = joblib.load(LSTM_SCALER_PATH)
                logger.info("Loaded LSTM model artifacts.")
            else:
                logger.warning("LSTM model/scaler not found; using mock predictive maintenance.")
        except Exception as e:
            logger.exception("Error loading ML artifacts; using mock predictions.")

    def detect_fault(self, iot_log: IoTNodeLogCreate, historical_logs: list = None, streetlight_info: Any = None):
        """Use Random Forest to detect if the streetlight is currently in a fault state."""
        if not self.rf_model or not self.rf_scaler:
            return self._mock_detect_fault(iot_log)

        # --- AUTOMATIC FEATURE EXTRACTION ---
        
        # 1. Operating Hours: Use IoT value, or calculate from installation date
        if iot_log.operating_hours is not None:
            operating_hours = iot_log.operating_hours
        elif streetlight_info and streetlight_info.installation_date:
            delta = datetime.utcnow() - streetlight_info.installation_date
            operating_hours = max(delta.total_seconds() / 3600.0, 0.0)
        else:
            operating_hours = 1000.0 # Fallback

        # 2. Voltage Fluctuation: Use IoT value, or calculate StdDev from history
        if iot_log.voltage_fluctuation is not None:
            voltage_fluctuation = iot_log.voltage_fluctuation
        elif historical_logs and len(historical_logs) > 1:
            voltages = [float(getattr(l, "voltage", 220.0)) for l in historical_logs] + [iot_log.voltage]
            voltage_fluctuation = float(pd.Series(voltages).std())
        else:
            voltage_fluctuation = 0.0

        # 3. Current Deviation: Use IoT value, or calculate deviation from mean
        if iot_log.current_deviation is not None:
            current_deviation = iot_log.current_deviation
        elif historical_logs and len(historical_logs) > 3:
            avg_current = sum(float(getattr(l, "current", 0.45)) for l in historical_logs) / len(historical_logs)
            current_deviation = iot_log.current - avg_current
        else:
            current_deviation = 0.0

        # 4. Power Trend: Use IoT value, or calculate slope/delta from history
        if iot_log.power_trend is not None:
            power_trend = iot_log.power_trend
        elif historical_logs and len(historical_logs) > 1:
            # Simple delta from previous reading
            prev_power = float(getattr(historical_logs[0], "power_consumption", 100.0))
            power_trend = iot_log.power_consumption - prev_power
        else:
            power_trend = 0.0

        # 5. Fault Frequency
        fault_frequency = float(iot_log.fault_frequency) if iot_log.fault_frequency is not None else 0.0

        df = pd.DataFrame(
            [
                {
                    "voltage": iot_log.voltage,
                    "current": iot_log.current,
                    "power_consumption": iot_log.power_consumption,
                    "light_intensity": iot_log.light_intensity,
                    "operating_hours": operating_hours,
                    "voltage_fluctuation": voltage_fluctuation,
                    "current_deviation": current_deviation,
                    "power_trend": power_trend,
                    "fault_frequency": fault_frequency,
                }
            ]
        )

        df[RF_FEATURES] = self.rf_scaler.transform(df[RF_FEATURES])

        try:
            probas = self.rf_model.predict_proba(df)
            failure_prob = float(probas[0][1]) if probas.shape[1] > 1 else float(self.rf_model.predict(df)[0])
        except Exception as e:
            logger.exception("Random Forest prediction error; using mock fault detection.")
            return self._mock_detect_fault(iot_log)

        is_faulty = failure_prob > 0.5
        return {
            "is_faulty": is_faulty,
            "confidence": round(failure_prob, 4),
            "urgency_level": self._map_urgency(failure_prob)
        }

    def predict_failure(self, iot_log: IoTNodeLogCreate, historical_logs=None):
        """
        Use LSTM to predict time-to-failure.
        
        The LSTM outputs a raw time_to_failure value (in timesteps).
        We convert this to:
          - failure_probability: higher when time_to_failure is low
          - predicted_failure_date: estimated date based on time_to_failure
          - urgency_level: low/medium/high based on probability
        """
        if not self.use_lstm or not self.lstm_model or not self.lstm_scaler:
            return self._mock_prediction(iot_log)

        if not historical_logs or len(historical_logs) < 9:
            return self._mock_prediction(iot_log)
            
        latest_history = historical_logs[-9:]
        
        # Build the sequence with timestep included as a feature
        sequence_data = []
        for i, log in enumerate(latest_history):
            sequence_data.append([
                float(i),  # timestep (relative position in sequence)
                getattr(log, "voltage", 220.0),
                getattr(log, "current", 0.45),
                getattr(log, "power_consumption", 100.0),
                getattr(log, "light_intensity", 350.0)
            ])
            
        sequence_data.append([
            float(len(latest_history)),  # current timestep
            iot_log.voltage,
            iot_log.current,
            iot_log.power_consumption,
            iot_log.light_intensity
        ])
        
        df = pd.DataFrame(sequence_data, columns=LSTM_FEATURES)
        scaled_data = self.lstm_scaler.transform(df.values)
        input_tensor = torch.FloatTensor(scaled_data).unsqueeze(0)
        
        with torch.no_grad():
            predicted_ttf = self.lstm_model(input_tensor).item()
        
        # Clamp to valid range
        predicted_ttf = max(predicted_ttf, 0.0)
        
        # Convert time-to-failure to failure probability
        # Lower TTF = higher probability of failure
        # TTF of 0 = 100% failure, TTF of MAX_TTF+ = low probability
        failure_prob = 1.0 - min(predicted_ttf / MAX_TTF, 1.0)
        failure_prob = min(max(failure_prob, 0.0), 1.0)
        
        urgency_level = self._map_urgency(failure_prob)
        
        # Each timestep approximates ~6 hours in a real deployment
        # So predicted_ttf * 6 hours = predicted time until failure
        hours_to_failure = predicted_ttf * 6.0
        predicted_failure_date = datetime.utcnow() + timedelta(hours=hours_to_failure)

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
