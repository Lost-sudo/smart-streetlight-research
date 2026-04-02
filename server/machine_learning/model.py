import joblib
import pandas as pd
import os
from sklearn.ensemble import RandomForestClassifier

# Define the model directory path
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')

def load_failure_prediction_model(model_filename: str = 'failure_predictor.pkl'):
    """
    Loads a trained machine learning model from the 'models/' directory using joblib.
    """
    model_path = os.path.join(MODELS_DIR, model_filename)
    if os.path.exists(model_path):
        model = joblib.load(model_path)
        print(f"Model loaded from {model_path}")
        return model
    else:
        print(f"Model file {model_path} not found.")
        return None

def predict_failure_status(model, sensor_data: pd.DataFrame):
    """
    Predicts the failure status (Normal / Faulty) using the loaded model.
    """
    if model:
        predictions = model.predict(sensor_data)
        probabilities = model.predict_proba(sensor_data)
        return predictions, probabilities
    else:
        return None, None
