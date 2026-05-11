# System Design Document

## 1. Introduction

### 1.1 Purpose

This System Design Document defines the architecture, components, data flow, and technical decisions for the Web-Based Smart Streetlight Automation and Predictive Maintenance System using IoT and Machine Learning.

### 1.2 Scope

The design covers:

- IoT hardware node design (ESP32 + Wi-Fi + electrical sensors)
- Communication and networking between nodes and backend
- Backend API, business logic, and persistence
- Machine learning pipeline for fault prediction
- Web dashboard integration
- Security, reliability, and deployment considerations

## 2. System Overview

The system consists of streetlight IoT nodes deployed in the field and a centralized web platform.
Each IoT node uses an ESP32 microcontroller with built-in Wi-Fi and attached electrical sensors to measure streetlight operating conditions. Sensor telemetry is sent to the backend in near real time. The backend stores and analyzes data, runs prediction models, and serves monitoring and control features to the web dashboard.

**High-Level Functions:**

- Automated streetlight control (ON/OFF, rule-based behavior)
- Real-time monitoring of electrical conditions
- Fault and anomaly detection
- Predictive maintenance insights
- Centralized multi-role web management

## 3. Overall Architecture

### 3.1 Architectural Style

The system follows a layered client-server architecture:

1. **IoT Device Layer**
2. **Communication Layer**
3. **Backend + ML Layer**
4. **Database Layer**
5. **Frontend Layer**

### 3.2 Deployment Context

- IoT nodes are physically distributed at streetlight locations.
- Backend services are deployed centrally (cloud or LGU-hosted server).
- Web clients (Admin, Operator, Technician, Viewer) access backend over HTTPS.

## 4. Component Design

### 4.1 IoT Device Layer (Current Implementation)

**Node Hardware:**

- ESP32 development board (main controller)
- Built-in ESP32 Wi-Fi connectivity
- LDR sensor (ambient light)
- Voltage sensor
- Current sensor
- Relay module (lamp switching)

**Responsibilities:**

- Read ambient and electrical sensor values
- Compute derived values (for example, power from voltage and current)
- Control relay output based on server command or local logic
- Publish telemetry at a fixed interval
- Maintain safe fallback behavior if connection is lost

**Primary Telemetry Fields:**

- `node_id`
- `timestamp`
- `light_level`
- `voltage`
- `current`
- `power`
- `relay_state`
- `device_status`

### 4.2 Communication Layer

**Protocol (Current):**

- REST over HTTP/HTTPS via Wi-Fi

**Optional Future Protocol:**

- MQTT for lighter bi-directional messaging at scale

**Responsibilities:**

- Device-to-server telemetry transmission
- Server-to-device control command delivery
- Retry and reconnection handling

### 4.3 Backend Application Layer

**Core Components:**

- FastAPI API server
- Authentication and authorization (RBAC + JWT/OAuth2)
- Streetlight telemetry ingestion service
- Control command service
- Alerting and notification logic

**Responsibilities:**

- Validate and process incoming telemetry
- Persist real-time and historical records
- Expose APIs for dashboard visualization and controls
- Trigger alerts on thresholds and predicted risk

### 4.4 Database Layer

**Primary Database:**

- PostgreSQL

**Optional Time-Series Extension/DB:**

- TimescaleDB or InfluxDB

**Stored Data:**

- Streetlight and node metadata
- Sensor telemetry history
- Fault/alert events
- Maintenance logs
- Users, roles, and audit-relevant actions

### 4.5 Machine Learning Layer

**Functions:**

- Anomaly detection from electrical behavior
- Failure risk prediction
- Maintenance urgency classification

**Input Features (Examples):**

- Voltage/current fluctuations
- Power trend changes
- Historical fault frequency
- Operating duration patterns

**Outputs:**

- Fault class / anomaly flag
- Failure probability score
- Priority level (Low, Medium, High)

### 4.6 Frontend Layer

**Platform:**

- Web dashboard (Next.js)

**Capabilities:**

- Real-time node status monitoring
- Node-level charts for voltage/current/power/light
- Alerts and maintenance views
- Role-based control actions (relay ON/OFF)
- Reporting and historical review

## 5. End-to-End Data Flow

1. ESP32 node reads LDR, voltage, and current sensors.
2. Node computes/attaches power and status data.
3. Node sends payload to backend API via Wi-Fi.
4. Backend validates and stores telemetry in database.
5. Rule engine and ML module analyze current and historical behavior.
6. System updates dashboard views and raises alerts when needed.
7. User control action (for example relay toggle) is sent from dashboard to backend.
8. Backend dispatches command to target ESP32 node and stores action log.

## 6. Automation and Control Logic

- Automatic lamp behavior can be based on LDR threshold and/or schedule.
- Manual override from dashboard is available to authorized roles.
- Electrical thresholds can trigger immediate warning/fault alerts.
- Predictive model results adjust maintenance priority before hard failure.

## 7. Security Design

- HTTPS/TLS for web and API transport
- Token-based authentication (JWT/OAuth2)
- Role-Based Access Control for user actions
- Unique device identity (`node_id`) and server-side payload validation
- Audit trail for critical control events

## 8. Reliability and Fault Tolerance

- Retry logic for intermittent Wi-Fi outages
- Local temporary buffering on node during short disconnections
- Backend-side idempotent ingestion safeguards (where applicable)
- Health visibility for offline/unstable nodes

## 9. Scalability and Deployment

**Deployment Targets:**

- Frontend: Vercel
- Backend/API: Railway (Dockerized FastAPI)
- Database: Managed PostgreSQL

**Scalability Notes:**

- Add nodes horizontally without changing node firmware architecture
- Scale API replicas behind reverse proxy/load balancing
- Use time-series optimization for growing telemetry volume

## 10. Constraints and Assumptions

**Constraints:**

- Wi-Fi coverage quality varies by streetlight location
- Hardware budget limits sensor and redundancy options

**Assumptions:**

- ESP32 nodes are properly provisioned and calibrated
- Telemetry interval and payload format are standardized across nodes
- Sufficient historical data will be collected for ML retraining

## 11. Future Improvements

- MQTT migration for large-scale deployments
- Edge-side anomaly pre-filtering on ESP32
- Integration of traffic/weather context in prediction logic
- Fine-grained dimming control (beyond relay ON/OFF)

## 12. Conclusion

This design reflects the current implementation direction of the project, specifically the ESP32 + Wi-Fi + electrical sensor IoT architecture, and provides a consistent foundation for backend, ML, and dashboard development.
