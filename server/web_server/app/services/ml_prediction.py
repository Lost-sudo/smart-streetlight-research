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
    # Discriminative features for multi-class fault separation
    "abs_d_voltage", "abs_d_current",
    "voltage_range_5", "current_range_5",
]

# LSTM features — including 'elapsed_time' derived from timesteps
LSTM_FEATURES = ["voltage", "current", "power", "ldr", "elapsed_time", "fault_code"]

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
LSTM_THRESHOLD_PATH = MODELS_DIR / "lstm_threshold.joblib"
LSTM_INFERENCE_CONFIG_PATH = MODELS_DIR / "lstm_inference_config.joblib"
DEFAULT_LSTM_THRESHOLD = 0.65

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
        self.lstm_threshold = DEFAULT_LSTM_THRESHOLD
        self.lstm_inference_config = {"horizon_hours": 24, "horizon_steps": 144}
        
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
        from app.core.database import SessionLocal
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
                db_filename = latest_rf_v.file_name if latest_rf_v else "N/A"
                source = "Hugging Face" if settings.PROD and latest_rf_v and latest_rf_v.hf_url else "Local Storage"
                logger.info(f"Loaded RF Model V{self.rf_version} ({db_filename}) from {source}")
                logger.info(f"RF model file path: {rf_path}")
            
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
                ts_path = MODELS_DIR / f"lstm_threshold_{v_suffix}.joblib"
                cfg_path = MODELS_DIR / f"lstm_inference_config_{v_suffix}.joblib"
                
                if not s_path.exists(): s_path = LSTM_SCALER_PATH
                if not ts_path.exists(): ts_path = LSTM_THRESHOLD_PATH
                if not cfg_path.exists(): cfg_path = LSTM_INFERENCE_CONFIG_PATH
                
                if s_path.exists(): self.lstm_scaler = joblib.load(s_path)
                if ts_path.exists(): self.lstm_threshold = float(joblib.load(ts_path))
                if cfg_path.exists(): self.lstm_inference_config = joblib.load(cfg_path)
                
                source = "Hugging Face" if settings.PROD and latest_lstm_v and latest_lstm_v.hf_url else "Local Storage"
                db_filename = latest_lstm_v.file_name if latest_lstm_v else "N/A"
                logger.info(f"Loaded LSTM Package {v_suffix} ({db_filename}) from {source}")
                logger.info(f"LSTM model file path: {lstm_path}")
            
            db.close()
        except Exception as e:
            logger.exception("Error loading ML artifacts.")

        logger.info("LSTM threshold loaded: %.3f", self.lstm_threshold)

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

        # --- NEW DISCRIMINATIVE FEATURES ---
        abs_d_voltage = abs(d_voltage)
        abs_d_current = abs(d_current)

        voltage_range_5 = 0.0
        current_range_5 = 0.0
        if historical_logs and len(historical_logs) >= 4:
            recent_voltages = [float(getattr(l, "voltage", voltage)) for l in historical_logs[:4]] + [voltage]
            recent_currents = [float(getattr(l, "current", current)) for l in historical_logs[:4]] + [current]
            voltage_range_5 = max(recent_voltages) - min(recent_voltages)
            current_range_5 = max(recent_currents) - min(recent_currents)
        elif historical_logs and len(historical_logs) > 0:
            recent_voltages = [float(getattr(l, "voltage", voltage)) for l in historical_logs] + [voltage]
            recent_currents = [float(getattr(l, "current", current)) for l in historical_logs] + [current]
            voltage_range_5 = max(recent_voltages) - min(recent_voltages)
            current_range_5 = max(recent_currents) - min(recent_currents)

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
            "abs_d_voltage": abs_d_voltage,
            "abs_d_current": abs_d_current,
            "voltage_range_5": voltage_range_5,
            "current_range_5": current_range_5,
        }])

        try:
            # Predict specific mode (0-6)
            pred_mode = int(self.rf_model.predict(df[RF_FEATURES])[0])
            
            # Get confidence (probability of the predicted class)
            probas = self.rf_model.predict_proba(df[RF_FEATURES])[0]
            class_order = list(getattr(self.rf_model, "classes_", []))
            if pred_mode in class_order:
                pred_idx = class_order.index(pred_mode)
                confidence = float(probas[pred_idx])
            else:
                confidence = float(np.max(probas))
        except Exception as e:
            logger.exception("Random Forest multi-class prediction error.")
            return None

        is_faulty = pred_mode > 0
        fault_name = FAULT_TYPE_MAP.get(pred_mode, "UNKNOWN_FAULT")

        class_order = list(getattr(self.rf_model, "classes_", []))
        if 0 in class_order:
            normal_idx = class_order.index(0)
            p_normal = float(probas[normal_idx])
        else:
            p_normal = 0.0

        rf_urgency = self._map_urgency(1.0 - p_normal)

        # Only SYSTEM_FAILURE can reach "critical" — others cap at "high" (warning)
        if fault_name != "SYSTEM_FAILURE" and rf_urgency == "critical":
            rf_urgency = "high"

        return {
            "is_faulty": is_faulty,
            "confidence": round(confidence, 4),
            "urgency_level": rf_urgency,
            "fault_type": fault_name
        }

    def predict_failure(self, iot_log: IoTNodeLogCreate, historical_logs=None, fault_context: dict | None = None):
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

        if not fault_context or not fault_context.get("is_faulty"):
            logger.info("LSTM skipped - healthy RF context.")
            return None
        fault_type = str(fault_context.get("fault_type", "UNKNOWN"))
        if fault_type == "NORMAL":
            logger.info("LSTM skipped - RF classified NORMAL.")
            return None
        logger.info("LSTM running due to RF fault trigger: %s", fault_type)
        fault_code_map = {v: k for k, v in FAULT_TYPE_MAP.items()}
        current_fault_code = float(fault_code_map.get(fault_type, 1))
            
        latest_history = historical_logs[-9:]
        
        sequence_data = []
        for log in latest_history:
            hist_ft = getattr(log, "fault_type", None)
            hist_fault_code = float(fault_code_map.get(str(hist_ft), current_fault_code))
            sequence_data.append([
                getattr(log, "voltage", 11.0),
                getattr(log, "current", 0.6),
                abs(getattr(log, "power_consumption", 7.0)),
                getattr(log, "light_intensity", 200.0),
                float(getattr(log, "timestep", 0)), # Using timestep as elapsed_time
                hist_fault_code
            ])
            
        sequence_data.append([
            iot_log.voltage,
            iot_log.current,
            abs(iot_log.power_consumption),
            iot_log.light_intensity,
            float(getattr(iot_log, "timestep", 0)),
            current_fault_code
        ])
        
        df = pd.DataFrame(sequence_data, columns=LSTM_FEATURES)
        scaled_data = self.lstm_scaler.transform(df.values)
        input_tensor = torch.FloatTensor(scaled_data).unsqueeze(0)
        
        with torch.no_grad():
            raw_output = self.lstm_model(input_tensor).item()

        failure_prob = 1.0 / (1.0 + math.exp(-raw_output))
        failure_prob = min(max(float(failure_prob), 0.0), 1.0)
        
        urgency_level = self._map_urgency(failure_prob)

        # Only SYSTEM_FAILURE can reach "critical" urgency.
        # All other fault types are capped at "high" (warning level).
        if fault_type != "SYSTEM_FAILURE" and urgency_level == "critical":
            logger.info(
                "LSTM urgency capped: %s → high (fault_type=%s is not SYSTEM_FAILURE)",
                urgency_level, fault_type,
            )
            urgency_level = "high"
        
        horizon_hours = int(self.lstm_inference_config.get("horizon_hours", 24))
        predicted_failure_date = datetime.utcnow() + timedelta(hours=horizon_hours)

        logger.info(
            "LSTM prediction — raw=%.4f, prob=%.2f%%, threshold=%.2f, urgency=%s, rf_fault=%s",
            raw_output, failure_prob * 100, self.lstm_threshold, urgency_level, fault_type
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
