# API Specification Document

## 1. Standard

This API specification follows **OpenAPI 3.0.3**.

## 2. Source of Truth

The formal machine-readable specification is:

- `docs/api-specification-document.yaml`

## 3. Coverage

The OpenAPI file covers all current backend endpoints from:

- `server/web_server/main.py` (`/`, `/health`)
- `server/web_server/app/routes/auth.py`
- `server/web_server/app/routes/user.py`
- `server/web_server/app/routes/streetlight.py`
- `server/web_server/app/routes/streetlight_log.py`
- `server/web_server/app/routes/alert.py`
- `server/web_server/app/routes/predictive_alert.py`
- `server/web_server/app/routes/predictive_maintenance_log.py`
- `server/web_server/app/routes/maintenance_log.py`
- `server/web_server/app/routes/maintenance_task.py`
- `server/web_server/app/routes/repair_task.py`
- `server/web_server/app/routes/repair_log.py`
- `server/web_server/app/routes/report.py`
- `server/web_server/app/routes/ml_management.py`

## 4. Security Model

- `bearerAuth` (JWT bearer token) is defined globally.
- Public endpoints are explicitly marked with `security: []` where applicable.

## 5. Notes

- Schema definitions are aligned to current Pydantic schemas in `server/web_server/app/schemas/`.
- Endpoint authorization roles are described in route implementation and should be enforced by backend RBAC dependencies.
- If route behavior or schema changes, update `docs/api-specification-document.yaml` in the same commit.
