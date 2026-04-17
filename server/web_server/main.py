from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth import router as auth_router
from app.routes.streetlight import router as streetlight_router
from app.routes.user import router as user_router
from app.routes.streetlight_log import router as streetlight_log_router
from app.routes.alert import router as alert_router
from app.routes.maintenance_log import router as maintenance_log_router
from app.routes.repair_task import router as repair_task_router
from app.routes.predictive_maintenance_log import router as predictive_maintenance_router
from app.routes.predictive_alert import router as predictive_alert_router
from app.routes.repair_log import router as repair_log_router
from app.routes.maintenance_task import router as maintenance_task_router
from app.core.config import settings
import uvicorn

app = FastAPI(
    title="Web-Based Smart Streetlight Automation and Predictive Maintenance System",
    description="Web-Based Smart Streetlight Automation and Predictive Maintenance System",
    version="1.0.0"
)

# CORS Middleware
origins = settings.CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes from controllers

app.include_router(auth_router)
app.include_router(streetlight_router)
app.include_router(user_router)
app.include_router(streetlight_log_router)
app.include_router(alert_router)
app.include_router(maintenance_log_router)
app.include_router(repair_task_router)
app.include_router(predictive_maintenance_router)
app.include_router(predictive_alert_router)
app.include_router(repair_log_router)
app.include_router(maintenance_task_router)

@app.get("/")
def root():
    return {"message": "Welcome to Web-Based Smart Streetlight Automation and Predictive Maintenance System!"}

@app.get("/health")
def health():
    return {"message": "OK"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )