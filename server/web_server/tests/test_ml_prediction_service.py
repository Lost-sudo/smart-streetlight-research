from datetime import datetime
from types import SimpleNamespace

import numpy as np

from app.schemas.streetlight import IoTNodeLogCreate
from app.services.ml_prediction import MLPredictionService


class DummyScaler:
    def transform(self, values):
        return np.array(values, dtype=np.float32)


class DummyModel:
    def __init__(self, output: float):
        self.output = output

    def __call__(self, x):
        import torch
        return torch.tensor([self.output], dtype=torch.float32)


def _build_service(raw_logit: float = 1.2):
    svc = MLPredictionService.__new__(MLPredictionService)
    svc.use_lstm = True
    svc.rf_threshold = 0.5
    svc.rf_model = None
    svc.lstm_model = DummyModel(raw_logit)
    svc.lstm_scaler = DummyScaler()
    svc.lstm_threshold = 0.65
    svc.lstm_inference_config = {"horizon_hours": 24, "horizon_steps": 144}
    svc._check_for_updates = lambda: None
    return svc


def _log(v=230.0, c=0.8, p=184.0, l=150.0, ts=1.0):
    row = IoTNodeLogCreate(
        device_id="SL-1",
        voltage=v,
        current=c,
        power_consumption=p,
        light_intensity=l,
        timestamp=datetime.utcnow(),
    )
    return SimpleNamespace(
        voltage=row.voltage,
        current=row.current,
        power_consumption=row.power_consumption,
        light_intensity=row.light_intensity,
        timestep=ts,
    )


def test_predict_failure_skips_for_healthy_rf_context():
    svc = _build_service()
    iot = IoTNodeLogCreate(
        device_id="SL-1",
        voltage=230,
        current=0.8,
        power_consumption=184,
        light_intensity=150,
        timestamp=datetime.utcnow(),
    )
    history = [_log(ts=float(i)) for i in range(1, 10)]

    result = svc.predict_failure(iot, history, fault_context={"is_faulty": False, "fault_type": "NORMAL"})
    assert result is None


def test_predict_failure_runs_for_voltage_fluctuation_fault():
    svc = _build_service(raw_logit=2.0)
    iot = IoTNodeLogCreate(
        device_id="SL-1",
        voltage=242,
        current=0.9,
        power_consumption=218,
        light_intensity=130,
        timestamp=datetime.utcnow(),
    )
    history = [_log(v=228 + (i % 3), ts=float(i)) for i in range(1, 10)]

    result = svc.predict_failure(
        iot,
        history,
        fault_context={"is_faulty": True, "fault_type": "VOLTAGE_FLUCTUATION"},
    )
    assert result is not None
    assert 0.0 <= result["failure_probability"] <= 1.0
    assert result["urgency_level"] in {"low", "medium", "high", "critical"}


def test_predict_failure_skips_when_off_state():
    svc = _build_service()
    iot = IoTNodeLogCreate(
        device_id="SL-1",
        voltage=0,
        current=0,
        power_consumption=0,
        light_intensity=150,
        timestamp=datetime.utcnow(),
    )
    history = [_log(ts=float(i)) for i in range(1, 10)]

    result = svc.predict_failure(
        iot,
        history,
        fault_context={"is_faulty": True, "fault_type": "VOLTAGE_FLUCTUATION"},
    )
    assert result is None
