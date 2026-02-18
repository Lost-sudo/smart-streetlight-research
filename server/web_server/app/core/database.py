from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# Engine
engine = create_engine(settings.DATABASE_URL, echo=True)

# Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()