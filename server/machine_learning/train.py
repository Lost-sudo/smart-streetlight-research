import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import os

# Define the models directory path
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')

def train_failure_prediction_model(data: pd.DataFrame):
    """
    Trains a Random Forest classifier to predict streetlight failures.
    Saves the model to the 'models/' directory.
    """
    X = data.drop(columns=['failure_status'])
    y = data['failure_status']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42)
    
    # Random Forest Classifier (as per ML design document)
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    print(f"Model trained with accuracy: {accuracy:.4f}")
    
    # Save model artifact
    model_path = os.path.join(MODELS_DIR, 'failure_predictor.pkl')
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")
    
    return model, accuracy
