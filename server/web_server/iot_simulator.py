"""
IoT Simulator - Degradation Lifecycle Mode
===========================================
Sends streetlight sensor logs following a realistic lifecycle:
  Normal -> Gradual Degradation -> Catastrophic Failure

This mirrors the LSTM training data so the ML models can be
tested with realistic sequential patterns.

Usage:
    cd server/web_server
    python iot_simulator.py
"""

import os
import sys
import time
import random
import requests
from datetime import datetime, timezone

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.schemas.streetlight import IoTNodeLogCreate

API_URL = "http://localhost:8000"
ENDPOINT = "/streetlight_log/telemetry"
INTERVAL_SECONDS = 2       # Seconds between each log transmission
DEVICE_ID = "SL-001"
TOTAL_TIMESTEPS = 150       # Total lifecycle length (matches training data)
FAILURE_POINT = 0.95        # Failure occurs at 95% of lifecycle


def generate_degradation_reading(timestep: int, total: int, rng: random.Random) -> dict:
    """
    Generate a single sensor reading based on the current lifecycle position.

    Phase 1 (0% - 80%):   Normal operation with minor noise
    Phase 2 (80% - 95%):  Accelerated degradation
    Phase 3 (95% - 100%): Catastrophic failure
    """
    current_time = datetime.now(timezone.utc).isoformat()
    progress = timestep / total  # 0.0 -> 1.0
    failure_idx = FAILURE_POINT

    if progress >= failure_idx:
        # === PHASE 3: CATASTROPHIC FAILURE ===
        voltage = round(rng.gauss(80.0, 10.0), 2)
        current = round(rng.gauss(2.5, 0.5), 2)
        power_consumption = round(rng.gauss(500.0, 50.0), 2)
        light_intensity = round(max(rng.gauss(10.0, 5.0), 0.0), 2)
        phase = "FAILURE"
    elif progress >= 0.80:
        # === PHASE 2: ACCELERATED DEGRADATION ===
        deg = (progress - 0.80) / (failure_idx - 0.80)  # 0.0 -> 1.0 within this phase
        voltage = round(220.0 - deg * 25.0 + rng.gauss(0, 3.0), 2)
        current = round(0.45 + deg * 0.6 + rng.gauss(0, 0.05), 2)
        power_consumption = round(100.0 + deg * 60.0 + rng.gauss(0, 8.0), 2)
        light_intensity = round(max(350.0 - deg * 200.0 + rng.gauss(0, 20.0), 5.0), 2)
        phase = "DEGRADING"
    else:
        # === PHASE 1: NORMAL OPERATION ===
        deg = progress / 0.80  # 0.0 -> 1.0 within this phase (slow drift)
        voltage = round(220.0 - deg * 5.0 + rng.gauss(0, 2.0), 2)
        current = round(0.45 + deg * 0.05 + rng.gauss(0, 0.03), 2)
        power_consumption = round(100.0 + deg * 10.0 + rng.gauss(0, 5.0), 2)
        light_intensity = round(max(350.0 - deg * 30.0 + rng.gauss(0, 15.0), 10.0), 2)
        phase = "NORMAL"

    return {
        "device_id": DEVICE_ID,
        "voltage": voltage,
        "current": current,
        "power_consumption": power_consumption,
        "light_intensity": light_intensity,
        "timestamp": current_time,
        "_phase": phase,       # Internal, not sent to API
        "_timestep": timestep, # Internal, not sent to API
    }


def validate_payload(data: dict) -> bool:
    try:
        clean = {k: v for k, v in data.items() if not k.startswith("_")}
        IoTNodeLogCreate(**clean)
        return True
    except Exception as e:
        print(f"[Validation Failed] {e}")
        return False


def simulate_degradation():
    print("=" * 60)
    print("  IoT Simulator - Degradation Lifecycle Mode")
    print("=" * 60)
    print(f"  Device      : {DEVICE_ID}")
    print(f"  Backend     : {API_URL}{ENDPOINT}")
    print(f"  Lifecycle   : {TOTAL_TIMESTEPS} timesteps")
    print(f"  Interval    : {INTERVAL_SECONDS}s between logs")
    print(f"  Failure at  : {int(FAILURE_POINT * 100)}% ({int(TOTAL_TIMESTEPS * FAILURE_POINT)} timesteps)")
    print("=" * 60)
    print()

    rng = random.Random(42)

    for timestep in range(TOTAL_TIMESTEPS):
        payload = generate_degradation_reading(timestep, TOTAL_TIMESTEPS, rng)

        if not validate_payload(payload):
            continue

        phase = payload.pop("_phase")
        step = payload.pop("_timestep")
        progress_pct = (timestep / TOTAL_TIMESTEPS) * 100

        # Progress bar
        bar_len = 30
        filled = int(bar_len * timestep / TOTAL_TIMESTEPS)
        bar = "#" * filled + "-" * (bar_len - filled)

        try:
            response = requests.post(f"{API_URL}{ENDPOINT}", json=payload, timeout=10)

            if response.status_code in [200, 201]:
                print(
                    f"  [{bar}] Step {step+1:3d}/{TOTAL_TIMESTEPS} "
                    f"| {phase:9s} "
                    f"| V={payload['voltage']:6.1f} "
                    f"I={payload['current']:4.2f} "
                    f"P={payload['power_consumption']:6.1f} "
                    f"L={payload['light_intensity']:5.1f} "
                    f"| OK"
                )
            else:
                print(f"  [Step {step+1}] API Error ({response.status_code}): {response.text[:80]}")

        except requests.exceptions.RequestException as e:
            print(f"  [Step {step+1}] Network Error: {e}")

        try:
            time.sleep(INTERVAL_SECONDS)
        except KeyboardInterrupt:
            print("\n\nSimulation interrupted by user.")
            sys.exit(0)

    print()
    print("=" * 60)
    print("  Degradation lifecycle complete!")
    print(f"  Sent {TOTAL_TIMESTEPS} logs for {DEVICE_ID}")
    print("=" * 60)


if __name__ == "__main__":
    simulate_degradation()
