from fastapi import FastAPI
from app.routes.auth import router as auth_router
from app.routes.streetlight import router as streetlight_router
from app.routes.user import router as user_router
from app.routes.streetlight_log import router as streetlight_log_router
import uvicorn

app = FastAPI(
    title="Web-Based Smart Streetlight Automation and Predictive Maintenance System",
    description="Web-Based Smart Streetlight Automation and Predictive Maintenance System",
    version="1.0.0"
)

# Register routes from controllers
app.include_router(auth_router)
app.include_router(streetlight_router)
app.include_router(user_router)
app.include_router(streetlight_log_router)

@app.get("/")
def root():
    return {"message": "Welcome to Web-Based Smart Streetlight Automation and Predictive Maintenance System!"}

@app.get("/health")
def health():
    return {"message": "OK"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)