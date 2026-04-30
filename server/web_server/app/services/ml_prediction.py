from __future__ import annotations

import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
import torch
import torch.nn as nn

from app.schemas.streetlight import IoTNodeLogCreate

logger = logging.getLogger(__name__)

RF_FEATURES = [
    "voltage", "current", "power", "ldr",
    "d_voltage", "d_current", "d_power",
    "std_current_5", "std_voltage_5",
]

# LSTM features — no 'timestep' (it leaks position, not sensor patterns)
LSTM_FEATURES = ["voltage", "current", "power", "ldr"]

# server/web_server/app/services -> server
SERVER_DIR = Path(__file__).resolve().parents[3]
MODELS_DIR = SERVER_DIR / "machine_learning" / "models"
RF_MODEL_PATH = MODELS_DIR / "random_forest_model.joblib"
LSTM_MODEL_PATH = MODELS_DIR / "lstm_model.pt"
LSTM_SCALER_PATH = MODELS_DIR / "lstm_scaler.joblib"
LSTM_TARGET_SCALER_PATH = MODELS_DIR / "lstm_target_scaler.joblib"

# Maximum time-to-failure from training data (used as fallback normalization).
MAX_TTF = 1732.0  # Max time_to_failure from real streetlight_dataset.csv

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
    def __init__(self, use_lstm: bool = True, rf_threshold: float = 0.35):
        self.use_lstm = use_lstm
        self.rf_threshold = rf_threshold
        self.rf_model = None
        self.lstm_model = None
        self.lstm_scaler = None
        self.lstm_target_scaler = None
        self._load_artifacts()

    def _load_artifacts(self):
        try:
            if RF_MODEL_PATH.exists():
                self.rf_model = joblib.load(RF_MODEL_PATH)
                logger.info("Loaded Random Forest model artifact (no scaler needed).")
            else:
                logger.warning("Random Forest model not found; using mock fault detection.")
                
            if LSTM_MODEL_PATH.exists() and LSTM_SCALER_PATH.exists():
                self.lstm_model = LSTMModel(input_size=len(LSTM_FEATURES))
                self.lstm_model.load_state_dict(_torch_load_state_dict(LSTM_MODEL_PATH))
                self.lstm_model.eval()
                self.lstm_scaler = joblib.load(LSTM_SCALER_PATH)
                logger.info("Loaded LSTM model and feature scaler.")

                if LSTM_TARGET_SCALER_PATH.exists():
                    self.lstm_target_scaler = joblib.load(LSTM_TARGET_SCALER_PATH)
                    logger.info("Loaded LSTM target scaler for inverse-transform.")
                else:
                    logger.warning("LSTM target scaler not found; using raw TTF output.")
            else:
                logger.warning("LSTM model/scaler not found; using mock predictive maintenance.")
        except Exception as e:
            logger.exception("Error loading ML artifacts; using mock predictions.")

    def detect_fault(self, iot_log: IoTNodeLogCreate, historical_logs: list = None, streetlight_info: Any = None):
        """Use Random Forest to detect if the streetlight is currently in a fault state.

        The model was trained on real IoT data with these features:
          - Raw sensors: voltage, current, power, ldr, pwm
          - Temporal: d_voltage, d_current, d_power (diffs from previous)
          - Rolling: std_current_5, std_voltage_5 (variability over 5 readings)

        No scaler is used — Random Forest is scale-invariant.
        """
        if not self.rf_model:
            return self._mock_detect_fault(iot_log)

        # --- RAW SENSOR FEATURES ---
        voltage = iot_log.voltage
        current = iot_log.current
        power = abs(iot_log.power_consumption)  # Ensure positive
        ldr = iot_log.light_intensity           # Map light_intensity -> ldr
        pwm = 255.0                             # Default full brightness

        # --- TEMPORAL FEATURES (computed from historical logs) ---
        d_voltage = 0.0
        d_current = 0.0
        d_power = 0.0
        std_voltage_5 = 0.0
        std_current_5 = 0.0

        if historical_logs and len(historical_logs) > 0:
            # Delta features: difference from most recent historical reading
            prev = historical_logs[0]  # Most recent previous log
            d_voltage = voltage - float(getattr(prev, "voltage", voltage))
            d_current = current - float(getattr(prev, "current", current))
            prev_power = abs(float(getattr(prev, "power_consumption", power)))
            d_power = power - prev_power

        if historical_logs and len(historical_logs) >= 4:
            # Rolling std over last 5 readings (4 historical + current)
            recent_voltages = [float(getattr(l, "voltage", voltage)) for l in historical_logs[:4]] + [voltage]
            recent_currents = [float(getattr(l, "current", current)) for l in historical_logs[:4]] + [current]
            std_voltage_5 = float(pd.Series(recent_voltages).std())
            std_current_5 = float(pd.Series(recent_currents).std())

        df = pd.DataFrame(
            [
                {
                    "voltage": voltage,
                    "current": current,
                    "power": power,
                    "ldr": ldr,
                    "pwm": pwm,
                    "d_voltage": d_voltage,
                    "d_current": d_current,
                    "d_power": d_power,
                    "std_current_5": std_current_5,
                    "std_voltage_5": std_voltage_5,
                }
            ]
        )

        try:
            probas = self.rf_model.predict_proba(df[RF_FEATURES])
            failure_prob = float(probas[0][1]) if probas.shape[1] > 1 else float(self.rf_model.predict(df[RF_FEATURES])[0])
        except Exception as e:
            logger.exception("Random Forest prediction error; using mock fault detection.")
            return self._mock_detect_fault(iot_log)

        is_faulty = failure_prob >= self.rf_threshold
        return {
            "is_faulty": is_faulty,
            "confidence": round(failure_prob, 4),
            "urgency_level": self._map_urgency(failure_prob)
        }

    def predict_failure(self, iot_log: IoTNodeLogCreate, historical_logs=None):
        """
        Use LSTM to predict time-to-failure.
        
        The LSTM outputs a normalized [0, 1] time_to_failure value.
        We inverse-transform it to real timestep counts, then convert to:
          - failure_probability: higher when time_to_failure is low
          - predicted_failure_date: estimated date based on time_to_failure
          - urgency_level: low/medium/high based on probability
        """
        if not self.use_lstm or not self.lstm_model or not self.lstm_scaler:
            return self._mock_prediction(iot_log)

        if not historical_logs or len(historical_logs) < 9:
            return self._mock_prediction(iot_log)
            
        latest_history = historical_logs[-9:]
        
        # Build the sequence with features matching training:
        # [voltage, current, power, ldr] — no timestep
        sequence_data = []
        for log in latest_history:
            sequence_data.append([
                getattr(log, "voltage", 11.0),
                getattr(log, "current", 0.6),
                abs(getattr(log, "power_consumption", 7.0)),  # Ensure positive
                getattr(log, "light_intensity", 200.0)
            ])
            
        sequence_data.append([
            iot_log.voltage,
            iot_log.current,
            abs(iot_log.power_consumption),  # Ensure positive
            iot_log.light_intensity
        ])
        
        df = pd.DataFrame(sequence_data, columns=LSTM_FEATURES)
        scaled_data = self.lstm_scaler.transform(df.values)
        input_tensor = torch.FloatTensor(scaled_data).unsqueeze(0)
        
        with torch.no_grad():
            raw_output = self.lstm_model(input_tensor).item()
        
        # Inverse-transform the normalized output back to real timestep count
        if self.lstm_target_scaler:
            predicted_ttf = float(
                self.lstm_target_scaler.inverse_transform(
                    np.array([[raw_output]])
                )[0, 0]
            )
        else:
            # Fallback: assume output is already in real units
            predicted_ttf = raw_output

        # Clamp to valid range
        predicted_ttf = max(predicted_ttf, 0.0)
        
        # Convert time-to-failure to failure probability
        # Lower TTF = higher probability of failure
        failure_prob = 1.0 - min(predicted_ttf / MAX_TTF, 1.0)
        failure_prob = min(max(failure_prob, 0.0), 1.0)
        
        urgency_level = self._map_urgency(failure_prob)
        
        # Each timestep approximates ~6 hours in a real deployment
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
