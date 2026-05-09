from sqlalchemy import Column, Integer, String, DateTime, JSON
from app.core.database import Base
from datetime import datetime

class MLVersion(Base):
    """
    Tracks both Dataset snapshots and Trained Model versions stored on Hugging Face.
    """
    __tablename__ = "ml_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    version_type = Column(String, index=True) # "dataset" or "model"
    version_number = Column(Integer, index=True)
    file_name = Column(String)
    hf_url = Column(String)
    
    # Metadata
    row_count = Column(Integer, nullable=True) # For datasets
    metrics = Column(JSON, nullable=True)     # For models (accuracy, f1, etc.)
    base_name = Column(String, default="streetlight_dataset_augmented")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="active") # "active", "deprecated"
