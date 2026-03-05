from fastapi import FastAPI
from app.routes.auth import router as auth_router

app = FastAPI(
    title="Web-Based Smart Streetlight Automation and Predictive Maintenance System",
    description="Web-Based Smart Streetlight Automation and Predictive Maintenance System",
    version="1.0.0"
)

# Register routes from controllers
app.include_router(auth_router)


@app.get("/")
def root():
    return {"message": "Welcome to Web-Based Smart Streetlight Automation and Predictive Maintenance System!"}

@app.get("/health")
def health():
    return {"message": "OK"}