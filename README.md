# Smart Streetlight Research System

Web-Based Smart Streetlight Automation and Predictive Maintenance System using IoT and Machine Learning.

## Overview

This project provides a complete platform for managing streetlights through:

- **IoT monitoring** (ESP32 + Wi-Fi + electrical sensors)
- **Automated and assisted control** for streetlight operations
- **Machine Learning** for anomaly detection and predictive maintenance
- **Web dashboard** for centralized monitoring, tasks, and reports

## System Components

- `server/`: FastAPI backend, business logic, database models, ML services
- `client/`: Next.js web dashboard
- `mobile-app-client/`: mobile client application
- `docs/`: project technical documentation

## High-Level Architecture

1. Streetlight IoT nodes send telemetry to backend APIs.
2. Backend validates and stores sensor data.
3. ML services analyze operational patterns and risk.
4. Alerts, maintenance tasks, and reports are generated.
5. Web/mobile users monitor and manage the system through role-based access.

## Technology Snapshot

- **IoT**: ESP32, Wi-Fi, voltage/current/light sensing
- **Backend**: FastAPI, Python, SQLAlchemy, Alembic
- **Database**: PostgreSQL
- **Frontend**: Next.js (TypeScript)
- **ML**: Scikit-learn, LSTM (TensorFlow/PyTorch workflows)
- **Deployment**: Docker-based backend workflow, modern web hosting stack

## Getting the Project

### Option A: Clone (for direct local use)

```bash
git clone <your-repository-url>
cd smart-streetlight-research
```

### Option B: Fork then Clone (recommended for contributors)

1. Fork this repository on GitHub to your account.
2. Clone your fork:

```bash
git clone https://github.com/<your-username>/smart-streetlight-research.git
cd smart-streetlight-research
```

3. Add the original repository as `upstream` to sync future updates:

```bash
git remote add upstream https://github.com/<original-owner>/smart-streetlight-research.git
git fetch upstream
```

## Local Installation and Setup

### 1. Backend (FastAPI)

```bash
cd server
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Set environment variables (example):

```bash
cp .env.example .env  # if available
```

Run backend:

```bash
cd web_server
uvicorn main:app --reload
```

### 2. Web Client (Next.js)

```bash
cd client
npm install
npm run dev
```

### 3. Mobile Client (optional)

```bash
cd mobile-app-client
npm install
npm run start
```

## Contributing Workflow

1. Create a feature branch:

```bash
git checkout -b feature/your-improvement-name
```

2. Commit your changes:

```bash
git add .
git commit -m "feat: improve <module>"
```

3. Push your branch:

```bash
git push origin feature/your-improvement-name
```

4. Open a Pull Request with clear summary, scope, and test notes.

## Documentation Index

Core documents:

- [Product Requirement Document](docs/product-requirement-document.md)
- [System Design Document](docs/system-design-document.md)
- [Technology Stack Document](docs/tech-stack-document.md)
- [UI/UX Design Document](docs/ui-and-ux-document.md)
- [Models Documentation](docs/models-documentation.md)

Machine Learning and IoT:

- [Machine Learning Design Document](docs/machine-learning-document.md)
- [Machine Learning Implementation Guide](docs/machine-learning-implementation-guide.md)
- [ML Retraining and Versioning Plan](docs/ml_retraining_plan.md)
- [IoT Data Specification](docs/iot-data-specification.md)

API specification:

- [API Specification (OpenAPI YAML)](docs/api-specification-document.yaml)
- [API Specification Guide](docs/api-specification-document.md)

Process documentation:

- [Agile SDLC Documentation](sdlc-docs/agile_sdlc_documentation.md)

## Notes

- The OpenAPI specification is maintained in `docs/api-specification-document.yaml`.
- When backend routes or schemas change, update related docs in `docs/` in the same change set.
