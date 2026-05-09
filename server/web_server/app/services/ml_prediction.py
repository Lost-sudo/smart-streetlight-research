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

# LSTM features — including 'elapsed_time' derived from timesteps
LSTM_FEATURES = ["voltage", "current", "power", "ldr", "elapsed_time"]

FAULT_TYPE_MAP = {
    0: "NORMAL",
    1: "VOLTAGE_FLUCTUATION",
    2: "OVERCURRENT",
    3: "SENSOR_DEGRADATION",
    4: "LAMP_DEGRADATION",
    5: "SYSTEM_FAILURE",
    6: "INTERMITTENT_FAULT"
}

# server/web_server/app/services -> server
SERVER_DIR = Path(__file__).resolve().parents[3]
MODELS_DIR = SERVER_DIR / "machine_learning" / "models"
RF_MODEL_PATH = MODELS_DIR / "random_forest_model.joblib"
LSTM_MODEL_PATH = MODELS_DIR / "lstm_model.pt"
LSTM_SCALER_PATH = MODELS_DIR / "lstm_scaler.joblib"
LSTM_TARGET_SCALER_PATH = MODELS_DIR / "lstm_target_scaler.joblib"

# Exponential decay scale for TTF → failure-probability conversion.
# Dynamically calibrated from the target scaler's max range at load time.
# Formula: scale = -max_ttf / ln(target_floor_prob)
# This maps max TTF → ~5% probability, TTF=0 → 100%.
DEFAULT_DECAY_SCALE = 600.0  # fallback if target scaler unavailable

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
        self.decay_scale = DEFAULT_DECAY_SCALE
        
        # Version tracking for Hot-Reloading
        self.rf_version = 0
        self.lstm_version = 0
        self.last_update_check = datetime.min
        self.update_cooldown = timedelta(minutes=1) # Don't spam DB checks
        
        self._load_artifacts()

    def _check_for_updates(self):
        """Checks if a newer model version exists in the database."""
        now = datetime.utcnow()
        if now - self.last_update_check < self.update_cooldown:
            return

        self.last_update_check = now
        db = SessionLocal()
        try:
            from app.models.ml_version import MLVersion
            
            # Check RF
            latest_rf = db.query(MLVersion).filter(
                MLVersion.version_type == "model",
                MLVersion.base_name == "random_forest_model"
            ).order_by(MLVersion.version_number.desc()).first()
            
            if latest_rf and latest_rf.version_number > self.rf_version:
                logger.info(f"New RF model detected (V{latest_rf.version_number}). Reloading...")
                self._load_artifacts()
                return

            # Check LSTM
            latest_lstm = db.query(MLVersion).filter(
                MLVersion.version_type == "model",
                MLVersion.base_name == "lstm_model"
            ).order_by(MLVersion.version_number.desc()).first()
            
            if latest_lstm and latest_lstm.version_number > self.lstm_version:
                logger.info(f"New LSTM model detected (V{latest_lstm.version_number}). Reloading...")
                self._load_artifacts()
                
        except Exception as e:
            logger.error(f"Hot-reload check failed: {e}")
        finally:
            db.close()

    def _load_artifacts(self):
        try:
            from app.core.config import settings
            import sys
            ML_PATH = str(SERVER_DIR / "machine_learning")
            if ML_PATH not in sys.path:
                sys.path.append(ML_PATH)
            
            from retrain_utils import get_latest_model_path
            from app.core.database import SessionLocal
            from app.models.ml_version import MLVersion
            
            mode_label = "PRODUCTION (Hugging Face)" if settings.PROD else "LOCAL (Filesystem)"
            logger.info(f"ML Service initializing in {mode_label} mode.")
            
            db = SessionLocal()
            
            # 1. Load Random Forest
            latest_rf_v = db.query(MLVersion).filter(
                MLVersion.version_type == "model",
                MLVersion.base_name == "random_forest_model"
            ).order_by(MLVersion.version_number.desc()).first()
            
            rf_path = get_latest_model_path("random_forest_model")
            if rf_path:
                self.rf_model = joblib.load(rf_path)
                self.rf_version = latest_rf_v.version_number if latest_rf_v else 1
                source = "Hugging Face" if settings.PROD and latest_rf_v and latest_rf_v.hf_url else "Local Storage"
                logger.info(f"Loaded RF Model V{self.rf_version} from {source}")
            
            # 2. Load LSTM
            latest_lstm_v = db.query(MLVersion).filter(
                MLVersion.version_type == "model",
                MLVersion.base_name == "lstm_model"
            ).order_by(MLVersion.version_number.desc()).first()
            
            lstm_path = get_latest_model_path("lstm_model")
            if lstm_path:
                self.lstm_version = latest_lstm_v.version_number if latest_lstm_v else 1
                v_suffix = f"V{self.lstm_version}"
                
                self.lstm_model = LSTMModel(input_size=len(LSTM_FEATURES))
                self.lstm_model.load_state_dict(_torch_load_state_dict(Path(lstm_path)))
                self.lstm_model.eval()
                
                # Use matching versioned scalers
                s_path = MODELS_DIR / f"lstm_scaler_{v_suffix}.joblib"
                ts_path = MODELS_DIR / f"lstm_target_scaler_{v_suffix}.joblib"
                
                if not s_path.exists(): s_path = LSTM_SCALER_PATH
                if not ts_path.exists(): ts_path = LSTM_TARGET_SCALER_PATH
                
                if s_path.exists(): self.lstm_scaler = joblib.load(s_path)
                if ts_path.exists(): self.lstm_target_scaler = joblib.load(ts_path)
                
                source = "Hugging Face" if settings.PROD and latest_lstm_v and latest_lstm_v.hf_url else "Local Storage"
                logger.info(f"Loaded LSTM Package {v_suffix} from {source}")
            
            db.close()
        except Exception as e:
            logger.exception("Error loading ML artifacts.")

        # Re-calibrate decay scale
        if self.lstm_target_scaler is not None:
            max_ttf = float(self.lstm_target_scaler.data_max_[0])
            self.decay_scale = -max_ttf / math.log(0.05)

        # Calibrate decay scale from the target scaler's actual data range.
        # We want: exp(-max_ttf / scale) ≈ target_floor (e.g. 5%)
        # So: scale = -max_ttf / ln(target_floor)
        if self.lstm_target_scaler is not None:
            max_ttf = float(self.lstm_target_scaler.data_max_[0])
            target_floor = 0.05  # 5% probability at max TTF
            self.decay_scale = -max_ttf / math.log(target_floor)
            logger.info("Calibrated decay scale: %.1f (max_ttf=%.0f min)", self.decay_scale, max_ttf)
        else:
            self.decay_scale = DEFAULT_DECAY_SCALE
            logger.warning("Using default decay scale: %.1f", self.decay_scale)

    def detect_fault(self, iot_log: IoTNodeLogCreate, historical_logs: list = None, streetlight_info: Any = None):
        """
        Detect if the streetlight is currently faulty using Random Forest.
        """
        self._check_for_updates()
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
            # Predict specific mode (0-6)
            pred_mode = int(self.rf_model.predict(df[RF_FEATURES])[0])
            
            # Get confidence (probability of the predicted class)
            probas = self.rf_model.predict_proba(df[RF_FEATURES])[0]
            confidence = float(probas[pred_mode])
        except Exception as e:
            logger.exception("Random Forest multi-class prediction error.")
            return None

        is_faulty = pred_mode > 0
        fault_name = FAULT_TYPE_MAP.get(pred_mode, "UNKNOWN_FAULT")

        return {
            "is_faulty": is_faulty,
            "confidence": round(confidence, 4),
            "urgency_level": self._map_urgency(1.0 - probas[0]), # Probability of ANY fault
            "fault_type": fault_name
        }

    def predict_failure(self, iot_log: IoTNodeLogCreate, historical_logs=None):
        """
        Use LSTM to predict time-to-failure.
        """
        self._check_for_updates()
        if not self.use_lstm or not self.lstm_model or not self.lstm_scaler:
            return None

        if not historical_logs or len(historical_logs) < 9:
            return None

        # Guard: skip prediction when the streetlight is OFF.
        # Zero voltage + zero current + zero power is the expected pattern
        # for daytime-off mode, but the LSTM was trained with these same
        # values for SYSTEM_FAILURE (mode=5). Running the model on off-state
        # data would always return TTF≈0 → 100% failure probability.
        voltage = getattr(iot_log, "voltage", None) or 0.0
        current = getattr(iot_log, "current", None) or 0.0
        power = abs(getattr(iot_log, "power_consumption", None) or 0.0)
        is_on = getattr(iot_log, "is_on", None)

        if voltage == 0 and current == 0 and power == 0:
            logger.info(
                "LSTM skipped — streetlight is OFF (V=0, I=0, P=0, is_on=%s). "
                "Cannot distinguish off-state from system failure.",
                is_on,
            )
            return None
            
        latest_history = historical_logs[-9:]
        
        sequence_data = []
        for log in latest_history:
            sequence_data.append([
                getattr(log, "voltage", 11.0),
                getattr(log, "current", 0.6),
                abs(getattr(log, "power_consumption", 7.0)),
                getattr(log, "light_intensity", 200.0),
                float(getattr(log, "timestep", 0)) # Using timestep as elapsed_time
            ])
            
        sequence_data.append([
            iot_log.voltage,
            iot_log.current,
            abs(iot_log.power_consumption),
            iot_log.light_intensity,
            float(getattr(iot_log, "timestep", 0))
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
        # The decay scale is calibrated from the target scaler's actual range
        # so that max TTF → ~5% and TTF=0 → 100%.
        failure_prob = math.exp(-predicted_ttf / self.decay_scale)
        failure_prob = min(max(failure_prob, 0.0), 1.0)
        
        urgency_level = self._map_urgency(failure_prob)
        
        # Estimate a human-readable failure date from the TTF.
        # predicted_ttf is already in minutes after inverse-transform.
        predicted_failure_date = datetime.utcnow() + timedelta(minutes=predicted_ttf)

        logger.info(
            "LSTM prediction — raw=%.4f, TTF=%.1f min (%.1f hr), decay_scale=%.1f, prob=%.2f%%, urgency=%s",
            raw_output, predicted_ttf, predicted_ttf / 60.0, self.decay_scale,
            failure_prob * 100, urgency_level,
        )
        logger.info(
            "LSTM input sample — first=[V=%.2f,I=%.3f,P=%.2f,L=%.0f] last=[V=%.2f,I=%.3f,P=%.2f,L=%.0f]",
            sequence_data[0][0], sequence_data[0][1], sequence_data[0][2], sequence_data[0][3],
            sequence_data[-1][0], sequence_data[-1][1], sequence_data[-1][2], sequence_data[-1][3],
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
