import os
import sys

# Add current directory to path so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from sqlalchemy import text
from app.core.database import Base, engine

# Ensure models are imported
from app.models.user import User
from app.models.streetlight import Streetlight, StreetlightLog, Alert, MaintenanceLog, PredictiveMaintenance, PredictiveAlert
from app.models.repair_task import RepairTask

print("Creating missing tables...")
Base.metadata.create_all(bind=engine)

print("Altering repair_tasks to add predictive_alert_id if it doesn't exist...")
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE repair_tasks ADD COLUMN predictive_alert_id INTEGER UNIQUE"))
        conn.execute(text("ALTER TABLE repair_tasks ADD CONSTRAINT fk_repair_task_predictive_alerts FOREIGN KEY (predictive_alert_id) REFERENCES predictive_alerts(id)"))
        conn.commit()
        print("Column added successfully.")
    except Exception as e:
        print(f"Skipped adding column, it may already exist or error occurred: {e}")

print("Done.")
