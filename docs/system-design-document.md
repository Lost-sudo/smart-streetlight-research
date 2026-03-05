# System Design Document

## 1. Introduction

### 1.1 Purpose

This System Design Document describes the overall architecture, components, data flow, and interactions of the Web-Based Smart Streetlight Automation and Predictive Maintenance System Using IoT and Machine Learning. It serves as a technical blueprint for system implementation based on the approved Product Requirement Document (PRD).

### 1.2 Scope

The design covers:

- IoT hardware and sensor layer
- Communication and networking layer
- Backend and database layer
- Machine Learning module
- Web-based frontend dashboard
- Security and deployment considerations

## 2. System Overview

The system is composed of distributed IoT-enabled streetlight nodes that collect operational data and transmit it to a centralized server. The backend processes real-time and historical data, applies machine learning models for predictive maintenance, and exposes services to a web-based dashboard for monitoring and control.

**High-Level Functions:**

- Automated streetlight control (ON/OFF, dimming)
- Real-time monitoring and fault detection
- Predictive maintenance using ML
- Centralized web-based management

## 3. Overall Architecture

### 3.1 Architectural Style

The system follows a layered architecture combined with a client–server model:

1. **IoT Device Layer**
2. **Communication Layer**
3. **Backend Application Layer**
4. **Machine Learning Layer**
5. **Frontend Presentation Layer**

## 4. Component Design

### 4.1 IoT Device Layer

**Components:**

- Microcontroller (Arduino / ESP32 / ESP8266)
- Light Sensor (LDR)
- Electrical Sensors (Voltage, Current, Power)
- Relay / Dimming Module
- Communication Module (Wi-Fi / GSM)

**Responsibilities:**

- Sense environmental and electrical parameters
- Execute control commands from server
- Transmit sensor data periodically

**Data Collected:**

- Light intensity
- Voltage and current levels
- Power consumption
- Lamp operational status

### 4.2 Communication Layer

**Protocols:**

- HTTP/HTTPS REST API
- MQTT (optional for lightweight messaging)

**Responsibilities:**

- Secure data transmission between IoT nodes and backend
- Command delivery for automation and control

### 4.3 Backend Application Layer

**Components:**

- API Server (FastAPI-Python)
- Authentication and Authorization Service
- Business Logic Module

**Responsibilities:**

- Receive and validate sensor data
- Store and manage system data
- Handle user requests and control commands
- Trigger alerts and notifications

### 4.4 Database Layer

**Databases:**

- Relational Database (PostgreSQL / MySQL)
- Time-Series Database (optional for sensor data)

**Stored Data:**

- Streetlight metadata
- Sensor readings (real-time and historical)
- Maintenance logs
- User accounts and roles

### 4.5 Machine Learning Layer

**ML Functions:**

- Anomaly detection
- Failure prediction
- Maintenance risk classification

**Inputs:**

- Historical sensor data
- Power usage trends
- Error and fault logs

**Outputs:**

- Failure probability score
- Maintenance urgency level (Low, Medium, High)

**Model Types (Example):**

- Random Forest
- Support Vector Machine
- LSTM (for time-series prediction)

### 4.6 Frontend Layer

**Platform:**

- Web-based dashboard

**Features:**

- Real-time streetlight status view
- Interactive map visualization
- Manual and automated control panel
- Maintenance alerts and reports

## 5. Data Flow Design

1. Sensors collect data from streetlight nodes
2. Data is transmitted to backend server
3. Backend stores data in database
4. ML module analyzes data and predicts failures
5. Alerts and insights are generated
6. Dashboard displays results to users
7. Control commands are sent back to IoT devices

## 6. Automation and Control Logic

- Automatic switching based on ambient light levels
- Scheduled ON/OFF timing
- Adaptive dimming based on predefined rules
- Manual override via dashboard

## 7. Security Design

- Encrypted communication (HTTPS / TLS)
- Device authentication using unique IDs
- Role-based access control (RBAC)
- Secure credential storage

## 8. Deployment Architecture

**Deployment Environment:**

- Cloud-based server or local LGU data center
- IoT devices deployed across streetlight locations

**Scalability Considerations:**

- Horizontal scaling of backend services
- Modular addition of streetlight nodes

## 9. Fault Tolerance and Reliability

- Local buffering of sensor data during network outages
- Retry mechanisms for data transmission
- Redundant alert generation

## 10. Constraints and Assumptions

**Constraints:**

- Limited hardware budget
- Network availability in remote areas

**Assumptions:**

- Sensors are properly calibrated
- Regular data availability for ML training

## 11. Future Improvements

- Integration with traffic and weather data
- Mobile application support
- Edge-based ML inference

## 12. Conclusion

This system design provides a comprehensive technical foundation for implementing the Web-Based Smart Streetlight Automation and Predictive Maintenance System Using IoT and Machine Learning, ensuring scalability, reliability, and intelligent decision-making.
