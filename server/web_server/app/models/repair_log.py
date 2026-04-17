from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime


class RepairLog(Base):
    """
    Records the details of a completed repair.
    Created when a repair task is marked as 'completed'.
    """
    __tablename__ = "repair_logs"

    id = Column(Integer, primary_key=True, index=True)
    repair_task_id = Column(Integer, ForeignKey("repair_tasks.id"), nullable=False, unique=True)
    streetlight_id = Column(Integer, ForeignKey("streetlights.id"), nullable=False)
    technician_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    diagnosis = Column(String, nullable=True)
    action_taken = Column(Text, nullable=True)
    parts_replaced = Column(String, nullable=True)
    repair_duration_minutes = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    repair_task = relationship("RepairTask", back_populates="repair_log")
    streetlight = relationship("Streetlight", backref="repair_logs")
    technician = relationship("User", backref="repair_logs")
