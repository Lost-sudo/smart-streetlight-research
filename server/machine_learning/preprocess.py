import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler

def preprocess_sensor_data(data: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans and preprocesses raw IoT sensor data.
    - Handles missing values
    - Normalizes numerical features
    """
    # Fill missing values with mean for now
    data = data.fillna(data.mean())
    
    # Feature scaling
    scaler = StandardScaler()
    numerical_cols = ['voltage', 'current', 'power_consumption', 'light_intensity']
    data[numerical_cols] = scaler.fit_transform(data[numerical_cols])
    
    return data

def engineer_features(data: pd.DataFrame) -> pd.DataFrame:
    """
    Generates engineered features for machine learning.
    - Power consumption rate of change
    - Voltage fluctuation rate
    """
    # Sample logic for feature engineering
    if 'timestamp' in data.columns:
        data['timestamp'] = pd.to_datetime(data['timestamp'])
        data = data.sort_values(by='timestamp')
        
    return data
