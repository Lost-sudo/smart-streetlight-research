from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth import router as auth_router
from app.routes.streetlight import router as streetlight_router
from app.routes.user import router as user_router
from app.routes.streetlight_log import router as streetlight_log_router
from app.routes.alert import router as alert_router
import uvicorn

app = FastAPI(
    title="Web-Based Smart Streetlight Automation and Predictive Maintenance System",
    description="Web-Based Smart Streetlight Automation and Predictive Maintenance System",
    version="1.0.0"
)

# CORS Middleware
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

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

@app.get("/")
def root():
    return {"message": "Welcome to Web-Based Smart Streetlight Automation and Predictive Maintenance System!"}

@app.get("/health")
def health():
    return {"message": "OK"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)