# Product Requirement Document (PRD)

## 1. Product Overview

**Product Name:** Web-Based Smart Streetlight Automation and Predictive Maintenance System using IoT and Machine Learning.

**Product Description:** A web-based system that integrates Internet of Things (IoT) devices and Machine Learning to automate streetlight operations and predict maintenance needs. The system aims to reduce energy consumption, improve public safety, minimize downtime, and lower operational costs by enabling real-time monitoring, automated control, and predictive maintenance of streetlights.

**Target Users:**

- Local Government Units (LGUs)
- Municipal Engineering Offices
- City Maintenance Teams
- Utility and Energy Management Departments

**Problem Statement:** Traditional streetlights systems rely on manual operation and reactive maintenance, leading to high energy waste, delayed fault detection, frequent outages, and increased maintenance costs. There is a need for an intelligent, automated, and data-driven solution to efficiently manage streetlight infrastructure.

## 2. Goals and Objectives

### 2.1 Primary Goals

- Automate streetlight operation based on environmental and scheduling conditions
- Detect faults and anomalies in real time
- Predict maintenance requirements before failures occur
- Provide centralized monitoring and control via a web dashboard

### 2.2 Success Metrics

- Reduction in energy consumption (%)
- Decrease in streetlight downtime
- Accuracy of maintenance prediction model
- Response time to detected faults
- User satisfaction and system usability

## 3. Scope

### 3.1 In-Scope

- IoT-based streetlight monitoring
- Automated ON/OFF and dimming control
- Data collection (power usage, voltage, current, status)
- Machine learning-based predictive maintenance
- Web-based monitoring dashboard
- Alerts and notifications

### 3.2 Out-of-Scope

- Physical installation of streetlights
- Manual repair operations
- Integration with third-party billing systems (future work)

## 4. Functional Requirements

### 4.1 IoT Device Layer

- **FR-01:** Sensor shall collect real-time data (light intensity, voltage, current, power consumption).
- **FR-02:** Each streetlight node shall transmit data to the central server via Wi-Fi or GSM.
- **FR-03:** The system shall support remote ON/OFF and dimming control.

### 4.2 Data Management

- **FR-04:** The system shall store sensor data in a centralized database.
- **FR-05:** The system shall maintain historical records for analysis and reporting.

### 4.3 Machine Learning Module

- **FR-06:** The system shall analyze historical and real-time data to detect anomalies.
- **FR-07:** The ML Model shall predict potential streetlight failures.
- **FR-08:** The system shall classify maintenance urgency levels (Low, Medium, High).

### 4.4 Web Application

- **FR-09:** Users shall log in securely using role-based authentication.
- **FR-10:** The dashboard shall display real-time streetlight status and map view.
- **FR-11:** Users shall receive alerts for faults and predictive failures.
- **FR-12:** Users shall generate reports on energy usage and maintenance history.

## 5. Non-Functional Requirements

### 5.1 Performance

- System shall support real-time data updates with minimal latency.
- Dashboard load time shall not exceed 3 seconds.

### 5.2 Scalability

- System shall support thousands of streetlight nodes.

### 5.3 Security

- Encrypted communication between IoT devices and server.
- Secure authentication and authorization.

### 5.4 Reliability

- System uptime of at least 99%.
- Automatic data backup and recovery.

## 6. User Roles and Permissions

| Role           | Permissions                         |
| :------------- | :---------------------------------- |
| **Admin**      | Full system access, user management |
| **Operator**   | Monitor and control streetlights    |
| **Technician** | View maintenance alerts and history |
| **Viewer**     | Read-only access                    |

## 7. User Stories

- **As an operator,** I want to monitor streetlight status in real time so that I can quickly detect outages.
- **As a technician,** I want to receive predictive alerts so that I can perform maintenance before failures occur.
- **As an admin,** I want to generate energy usage reports to evaluate system efficiency.

## 8. System Architecture Overview

- **IoT Layer:** Sensors, microcontrollers, communication modules
- **Backend Layer:** API server, database, ML engine
- **Frontend Layer:** Web dashboard and analytics

## 9. Assumptions and Constraints

### Assumptions

- Stable network connectivity is available.
- Sensors provide accurate readings.

### Constraints

- Budget limitations for hardware deployment.
- Environmental factors affecting sensor performance.

## 10. Risks and Mitigation

| Risk                   | Mitigation                           |
| :--------------------- | :----------------------------------- |
| Network Failure        | Local buffering and retry mechanisms |
| Inaccurate predictions | Continuous model retraining          |
| Hardware malfunction   | Redundant sensing and alerts         |

## 11. Future Enhancements

- Integration with renewable energy sources (solar-powered streetlights)
- Mobile application support
- AI-based traffic-aware lighting control

## 12. Approval

This PRD defines the requirements and scope of the Web-Based Smart Streetlight Automation and Predictive Maintenance System Using IoT and Machine Learning and serves as the baseline for design, development, and testing.
