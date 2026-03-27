import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

from app.core.database import SessionLocal, engine
from app.models.user import User

# Disable echo for cleaner output
engine.echo = False

db = SessionLocal()
users = db.query(User).all()

with open("users_output.txt", "w") as f:
    if not users:
        f.write("No users found in the database.\n")
    else:
        f.write(f"Found {len(users)} users:\n")
        for user in users:
            f.write(f"ID: {user.id}, Username: {user.username}, Role: {user.role}\n")

db.close()
