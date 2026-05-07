import sys
import os

# Ensure the app can find the web_server modules
sys.path.append(os.path.join(os.path.dirname(__file__), "web_server"))

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password

def seed_admin():
    db = SessionLocal()
    try:
        # Check if ANY admin already exists in the database
        admin_exists = db.query(User).filter(User.role == UserRole.admin).first()
        
        if not admin_exists:
            print("Creating initial admin user...")
            new_admin = User(
                username="admin",
                role=UserRole.admin,
                hashed_password=hash_password("admin123"),
                is_active=True
            )
            db.add(new_admin)
            db.commit()
            print("Successfully created initial admin!")
            print("Username: admin")
            print("Password: admin123")
        else:
            print("Admin user already exists. Skipping seed.")
            
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
