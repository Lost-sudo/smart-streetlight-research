from __future__ import annotations

import logging
import math
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

# Exponential decay scale for TTF → failure-probability conversion.
# Calibrated to the model's observed output range (normal ≈ 200-270 TTF,
# degrading ≈ 40-100 TTF, faulty ≈ 0 TTF).  A larger value makes the
# curve decay more slowly (lower probabilities for healthy readings).
DECAY_SCALE = 150.0

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
    def __init__(self, use_lstm: bool = True, rf_threshold: float = 0.5):
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
                logger.info("Loaded Random Forest model artifact.")
            else:
                logger.warning("Random Forest model not found.")
                
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
                    logger.warning("LSTM target scaler not found.")
            else:
                logger.warning("LSTM model/scaler not found.")
        except Exception as e:
            logger.exception("Error loading ML artifacts.")

    def detect_fault(self, iot_log: IoTNodeLogCreate, historical_logs: list = None, streetlight_info: Any = None):
        """
        Detect if the streetlight is currently faulty using Random Forest.
        Returns None if model is missing.
        """
        if not self.rf_model:
            return None

        # --- RAW SENSOR FEATURES ---
        voltage = iot_log.voltage
        current = iot_log.current
        power = abs(iot_log.power_consumption)
        ldr = iot_log.light_intensity
        pwm = getattr(iot_log, "pwm", 255.0)
        if pwm is None:
            pwm = 255.0

        # --- TEMPORAL FEATURES ---
        d_voltage = getattr(iot_log, "d_voltage", None)
        d_current = getattr(iot_log, "d_current", None)
        d_power = getattr(iot_log, "d_power", None)
        std_voltage_5 = getattr(iot_log, "std_voltage_5", None)
        std_current_5 = getattr(iot_log, "std_current_5", None)

        if any(v is None for v in [d_voltage, d_current, d_power, std_voltage_5, std_current_5]):
            d_voltage, d_current, d_power = 0.0, 0.0, 0.0
            std_voltage_5, std_current_5 = 0.0, 0.0

            if historical_logs and len(historical_logs) > 0:
                prev = historical_logs[0]
                d_voltage = voltage - float(getattr(prev, "voltage", voltage))
                d_current = current - float(getattr(prev, "current", current))
                prev_power = abs(float(getattr(prev, "power_consumption", power)))
                d_power = power - prev_power

            if historical_logs and len(historical_logs) >= 4:
                recent_voltages = [float(getattr(l, "voltage", voltage)) for l in historical_logs[:4]] + [voltage]
                recent_currents = [float(getattr(l, "current", current)) for l in historical_logs[:4]] + [current]
                std_voltage_5 = float(pd.Series(recent_voltages).std())
                std_current_5 = float(pd.Series(recent_currents).std())

        df = pd.DataFrame([{
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
        }])

        try:
            probas = self.rf_model.predict_proba(df[RF_FEATURES])
            failure_prob = float(probas[0][1]) if probas.shape[1] > 1 else float(self.rf_model.predict(df[RF_FEATURES])[0])
        except Exception as e:
            logger.exception("Random Forest prediction error.")
            return None

        is_faulty = failure_prob >= self.rf_threshold
        
        # Identify "SYSTEM_FAILURE" (total power loss)
        fault_type = "HARDWARE_FAULT"
        if is_faulty and voltage == 0 and current == 0:
            fault_type = "SYSTEM_FAILURE"

        return {
            "is_faulty": is_faulty,
            "confidence": round(failure_prob, 4),
            "urgency_level": self._map_urgency(failure_prob),
            "fault_type": fault_type
        }

    def predict_failure(self, iot_log: IoTNodeLogCreate, historical_logs=None):
        """
        Use LSTM to predict time-to-failure.
        Returns None if models missing or historical data < 9 logs.
        """
        if not self.use_lstm or not self.lstm_model or not self.lstm_scaler:
            return None

        if not historical_logs or len(historical_logs) < 9:
            return None
            
        latest_history = historical_logs[-9:]
        
        sequence_data = []
        for log in latest_history:
            sequence_data.append([
                getattr(log, "voltage", 11.0),
                getattr(log, "current", 0.6),
                abs(getattr(log, "power_consumption", 7.0)),
                getattr(log, "light_intensity", 200.0)
            ])
            
        sequence_data.append([
            iot_log.voltage,
            iot_log.current,
            abs(iot_log.power_consumption),
            iot_log.light_intensity
        ])
        
        df = pd.DataFrame(sequence_data, columns=LSTM_FEATURES)
        scaled_data = self.lstm_scaler.transform(df.values)
        input_tensor = torch.FloatTensor(scaled_data).unsqueeze(0)
        
        with torch.no_grad():
            raw_output = self.lstm_model(input_tensor).item()
        
        if self.lstm_target_scaler:
            predicted_ttf = float(self.lstm_target_scaler.inverse_transform(np.array([[raw_output]]))[0, 0])
        else:
            predicted_ttf = raw_output

        predicted_ttf = max(predicted_ttf, 0.0)
        
        # Convert time-to-failure to failure probability using exponential decay.
        # This maps the model's practical output range into meaningful bands:
        #   TTF ≈ 0   → 100%  (faulty / imminent failure)
        #   TTF ≈ 50  →  72%  (degrading)
        #   TTF ≈ 150 →  37%  (moderate health)
        #   TTF ≈ 264 →  17%  (healthy)
        failure_prob = math.exp(-predicted_ttf / DECAY_SCALE)
        failure_prob = min(max(failure_prob, 0.0), 1.0)
        
        urgency_level = self._map_urgency(failure_prob)
        
        # Estimate a human-readable failure date from the TTF.
        # Each TTF unit ≈ one dataset timestep; use 2-minute intervals
        # (the model's effective temporal resolution from training data).
        minutes_to_failure = predicted_ttf * 2.0
        predicted_failure_date = datetime.utcnow() + timedelta(minutes=minutes_to_failure)

        logger.debug(
            "LSTM prediction — raw=%.4f, TTF=%.1f, prob=%.2f%%, urgency=%s",
            raw_output, predicted_ttf, failure_prob * 100, urgency_level,
        )

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
        elif probability < 0.9:
            return "high"
        return "critical"
