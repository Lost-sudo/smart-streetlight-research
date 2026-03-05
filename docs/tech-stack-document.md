# Technology Stack Document

## 1. Introduction

This document defines the technology stack to be used for the development and deployment of the web-based smart streetlight automation and predictive maintenance system using IoT and machine learning. The selected technologies are chosen to ensure scalability, performance, maintainability, and seamless integration between the backend and machine learning components.

A unified Python-based backend is implemented using FastAPI, enabling both application logic and machine learning services to be developed in the same language. The frontend is implemented using Next.js to provide a modern, responsive web interface.

## 2. System Architecture Overview

The system follows a client–server architecture with a layered design:

- **IoT Devices:** Data Producers & Actuators
- **Backend + ML Services:** FastAPI
- **Database Layer:** PostgreSQL
- **Web Frontend:** Next.js

## 3. Hardware Stack (IoT Layer)

### 3.1 Microcontroller

- **ESP32 Development Board**

### 3.2 Sensors and Actuators

- Light Dependent Resistor (LDR)
- Voltage Sensor
- Current Sensor

### 3.3 Actuators

- 5V Relay Module (Lamp switching)

### 3.4 Power Supply Subsystem

- 12V DC Power Supply
- DC-DC Buck Converter (12V -> 5V)
- Regulated 3.3V (ESP32 internal)

### 3.5 Communication

- Wi-Fi Module (built-in ESP32)

## 4. Backend and Machine Learning Stack

### 4.1 Programming Language

- **Python 3.10+**

### 4.2 Backend Framework

- **FastAPI**
  - High-performance asynchronous API framework
  - Automatic OpenAPI/Swagger documentation
  - Native support for async IO

### 4.3 API Communication

- RESTful APIs (JSON-based)

### 4.4 Authentication and Security

- OAuth2 with JWT (JSON Web Tokens)
- HTTPS / TLS encryption
- Role-Based Access Control (RBAC)

## 5. Machine Learning Stack

### 5.1 Data Processing

- NumPy
- Pandas

### 5.2 Machine Learning Libraries

- **Scikit-learn:** Classification and anomaly detection
- **TensorFlow / PyTorch:** Optional for deep learning models

### 5.3 Model Types

- Random Forest (failure classification)
- Support Vector Machine (anomaly detection)
- LSTM (time-series failure prediction)

### 5.4 Model Lifecycle

- Offline model training
- Periodic retraining using historical data
- Model inference exposed via FastAPI endpoints

## 6. Database Stack

### 6.1 Primary Database

- **PostgreSQL**
  - Streetlight metadata
  - User accounts and roles
  - Maintenance records

### 6.2 Time-Series / Sensor Data (Optional)

- **InfluxDB** or **TimescaleDB**

### 6.3 ORM / Database Tools

- SQLAlchemy
- Alembic (database migrations)

## 7. Frontend Stack

### 7.1 Framework

- **Next.js (TypeScript)**

### 7.2 UI and Styling

- Tailwind CSS
- ShadCN/UI
- Lucide Icons

### 7.3 State Management

- Redux Toolkit
- React Context API (lightweight state)

### 7.4 Data Fetching

- RTK Query

## 8. Visualization and Mapping

- **Chart.js / Recharts:** Energy usage and analytics
- **Mapbox / Leaflet:** Streetlight location mapping

## 9. DevOps and Deployment Stack

### 9.1 Containerization

- **Docker**
- **Docker Compose**

### 9.2 Deployment Environment

- Cloud Server (AWS / GCP / Azure)
- On-Premise LGU Server (optional)

### 9.3 Web Server

- **Nginx:** Reverse proxy
- **Uvicorn:** ASGI server for FastAPI

## 10. Monitoring and Logging

- **Prometheus:** Metrics monitoring
- **Grafana:** Visual dashboards
- Python Logging Module

## 11. Development Tools

- Git and GitHub
- VS Code
- Arduino IDE
- Postman / Swagger UI

## 12. Rationale for Technology Choices

- **FastAPI:** Enables a unified backend and ML environment using Python, reducing integration complexity.
- **Next.js:** Provides server-side rendering and optimized frontend performance.
- **PostgreSQL:** Ensures reliable and scalable relational data storage.
- **Docker:** Simplifies deployment and environment consistency.
- **ML libraries:** Allow accurate predictive maintenance and anomaly detection.

## 13. Future Technology Enhancements

- Edge AI deployment on IoT devices
- Mobile application using React Native
- Integration with smart city platforms

## 14. Conclusion

This technology stack provides a robust, scalable, and future-ready foundation for the implementation of the web-based smart streetlight automation and predictive maintenance system using IoT and machine learning, ensuring efficient development, deployment, and long-term maintainability.
