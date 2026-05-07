from sqlalchemy import Column, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class StreetlightLog(Base):
    __tablename__ = "streetlight_logs"
    id = Column(Integer, primary_key=True, index=True)
    streetlight_id = Column(Integer, ForeignKey("streetlights.id"))
    voltage = Column(Float)
    current = Column(Float)
    power_consumption = Column(Float)
    light_intensity = Column(Float)
    is_on = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Advanced features for ML
    operating_hours = Column(Float, nullable=True)
    voltage_fluctuation = Column(Float, nullable=True)
    current_deviation = Column(Float, nullable=True)
    power_trend = Column(Float, nullable=True)
    fault_frequency = Column(Integer, nullable=True)
    
    # ML model features (aligned with training)
    d_voltage = Column(Float, nullable=True)
    d_current = Column(Float, nullable=True)
    d_power = Column(Float, nullable=True)
    std_voltage_5 = Column(Float, nullable=True)
    std_current_5 = Column(Float, nullable=True)

    streetlight = relationship("Streetlight", back_populates="logs")