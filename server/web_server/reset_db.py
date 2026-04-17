import os
import sys
from datetime import datetime

# Add current directory to path so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from sqlalchemy import create_engine
import bcrypt
from app.core.database import Base, engine

# Import all models to ensure they are registered with Base.metadata
from app.models.user import User, UserRole, TechnicianAvailability
from app.models.streetlight import Streetlight, StreetlightLog, Alert, MaintenanceLog, PredictiveMaintenance, StreetlightStatus
from app.models.repair_task import RepairTask
from sqlalchemy.orm import sessionmaker

def reset_database():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    
    print("Creating all tables with new schema...")
    Base.metadata.create_all(bind=engine)
    
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        print("Seeding default admin user...")
        pwd_hash = bcrypt.hashpw(b"password123", bcrypt.gensalt()).decode()
        admin_user = User(
            username="admin",
            role=UserRole.admin,
            hashed_password=pwd_hash,
            is_active=True,
            created_at=datetime.utcnow()
        )
        session.add(admin_user)
        
        print("Seeding sample streetlights...")
        sample_lights = [
            Streetlight(device_id="SL-001", name="Main St - North", latitude=14.5995, longitude=120.9842, status=StreetlightStatus.active, is_on=True, installation_date=datetime(2023, 1, 15)),
            Streetlight(device_id="SL-002", name="Main St - South", latitude=14.6010, longitude=120.9850, status=StreetlightStatus.active, is_on=True, installation_date=datetime(2023, 1, 15)),
            Streetlight(device_id="SL-003", name="Oak Avenue", latitude=14.6025, longitude=120.9865, status=StreetlightStatus.faulty, is_on=False, installation_date=datetime(2023, 2, 10)),
            Streetlight(device_id="SL-004", name="Pine St Corner", latitude=14.6040, longitude=120.9880, status=StreetlightStatus.active, is_on=True, installation_date=datetime(2023, 3, 5)),
            Streetlight(device_id="SL-005", name="Bridge Entry", latitude=14.6055, longitude=120.9895, status=StreetlightStatus.maintenance, is_on=False, installation_date=datetime(2023, 3, 20)),
        ]
        session.add_all(sample_lights)
        
        session.commit()
        print("Database reset and seeding completed successfully!")
        print("\nDefault Admin: admin / password123")
        
    except Exception as e:
        print(f"Error during seeding: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    reset_database()
