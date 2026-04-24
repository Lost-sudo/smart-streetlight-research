# IoT Data Specification

This document provides the technical requirements for the data payloads sent by the IoT streetlight nodes to the central server. Following this specification ensures compatibility with the real-time monitoring and machine learning (Random Forest & LSTM) components.

## 1. Transmission Protocol
- **Method**: HTTP POST
- **Endpoint**: `/streetlight_log/telemetry`
- **Content-Type**: `application/json`

## 2. Telemetry Payload Schema

The IoT device must send a JSON object with the following fields.

### 2.1 Mandatory Fields (Raw Sensors)
These fields are required for every transmission.

| Field Name | Type | Unit | Description |
| :--- | :--- | :--- | :--- |
| `device_id` | String | - | Unique identifier for the streetlight (e.g., "SL-001"). |
| `voltage` | Float | Volts (V) | RMS voltage measurement. |
| `current` | Float | Amperes (A) | RMS current measurement. |
| `power_consumption` | Float | Watts (W) | Active power consumption. |
| `light_intensity` | Float | Lux | Ambient light level from LDR sensor. |
| `timestamp` | String | ISO8601 | Date and time of reading (e.g., `2024-04-24T17:30:00Z`). |

### 2.2 Optional Advanced Features
The backend automatically calculates these if they are missing, but sending them from the IoT side can improve accuracy.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `voltage_fluctuation`| Float | Short-term variance in voltage (measured at high frequency). |
| `operating_hours` | Float | Cumulative runtime of the streetlight hardware. |
| `fault_frequency` | Integer | Count of minor glitches/errors detected by the local MCU. |

## 3. Sample JSON Payloads

### 3.1 Minimal Payload (Recommended)
Use this if you want the backend to handle all feature engineering.

```json
{
  "device_id": "SL-001",
  "voltage": 221.4,
  "current": 0.45,
  "power_consumption": 99.8,
  "light_intensity": 350.0,
  "timestamp": "2024-04-24T18:00:00Z"
}
```

### 3.2 Full Payload
Use this if the IoT device is performing its own edge calculations.

```json
{
  "device_id": "SL-001",
  "voltage": 221.4,
  "current": 0.45,
  "power_consumption": 99.8,
  "light_intensity": 350.0,
  "voltage_fluctuation": 0.02,
  "operating_hours": 1450.5,
  "fault_frequency": 0,
  "timestamp": "2024-04-24T18:00:00Z"
}
```

## 4. Error Handling
- **201 Created**: Data successfully received and processed by ML models.
- **404 Not Found**: The `device_id` does not exist in the system database.
- **422 Unprocessable Entity**: Missing mandatory fields or incorrect data types.
