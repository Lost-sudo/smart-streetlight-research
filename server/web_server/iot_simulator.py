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
INTERVAL_SECONDS = 30
DEVICE_IDS = ["Node-1"]
TEST_MODE = False

def generate_data(device_id: str, test_mode: bool = False) -> dict:
    current_time = datetime.now(timezone.utc).isoformat()
    
    if test_mode:
        return {
            "device_id": device_id,
            "voltage": 220.0,
            "current": 0.5,
            "power_consumption": 110.0,
            "light_intensity": 80.0,
            "timestamp": current_time
        }

    # 10% chance to generate an anomaly (to trigger Alerts via ML Pipeline)
    is_anomaly = random.random() < 0.10

    if is_anomaly:
        return {
            "device_id": device_id,
            "voltage": round(random.uniform(90.0, 140.0), 2),     # Dropped voltage
            "current": round(random.uniform(2.5, 4.0), 2),        # High current
            "power_consumption": round(random.uniform(400.0, 600.0), 2), # High power spike
            "light_intensity": round(random.uniform(5.0, 20.0), 2),      # Dimming incorrectly
            "timestamp": current_time
        }
    else:
        return {
            "device_id": device_id,
            "voltage": round(random.uniform(215.0, 235.0), 2),
            "current": round(random.uniform(0.4, 0.6), 2),
            "power_consumption": round(random.uniform(90.0, 135.0), 2),
            "light_intensity": round(random.uniform(70.0, 100.0), 2),
            "timestamp": current_time
        }

def validate_payload(data: dict) -> bool:
    try:
        IoTNodeLogCreate(**data)
        return True
    except Exception as e:
        print(f"[Validation Failed] {e}")
        return False

def simulate_iot_devices():
    print(f"=== Starting IoT Simulator ===")
    print(f"Targeting Backend: {API_URL}{ENDPOINT}")
    print(f"Interval: Every {INTERVAL_SECONDS} seconds")
    print(f"Devices: {DEVICE_IDS}\n")

    while True:
        for device_id in DEVICE_IDS:
            payload = generate_data(device_id, test_mode=TEST_MODE)
            
            if not validate_payload(payload):
                continue
            
            try:
                response = requests.post(f"{API_URL}{ENDPOINT}", json=payload, timeout=10)
                
                if response.status_code in [200, 201]:
                    print(f"[API Success] Received Payload via Backend: {response.json()}")
                else:
                    print(f"[API Error] Unexpected backend response ({response.status_code}): {response.text}")
                    
            except requests.exceptions.RequestException as e:
                print(f"[Network Error] Delivery failed: {e}")
                
        print(f"Waiting {INTERVAL_SECONDS} seconds for next transmission...\n")
        try:
            time.sleep(INTERVAL_SECONDS)
        except KeyboardInterrupt:
            print("\nShutting down IoT Simulator.")
            sys.exit(0)

if __name__ == "__main__":
    simulate_iot_devices()
