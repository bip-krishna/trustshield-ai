import numpy as np
from sklearn.ensemble import IsolationForest
from typing import List, Dict
import joblib
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "isolation_forest.pkl")

_isolation_forest = None


def _get_model():
    global _isolation_forest
    if _isolation_forest is None:
        if os.path.exists(MODEL_PATH):
            _isolation_forest = joblib.load(MODEL_PATH)
        else:
            _isolation_forest = IsolationForest(
                n_estimators=100,
                contamination=0.1,
                random_state=42,
            )
            dummy_data = np.array([
                [100, 0, 0, 0],
                [500, 2, 0, 0],
                [10000, 5, 1, 1],
                [50, 1, 0, 0],
                [2000, 3, 0, 0],
                [50000, 10, 1, 1],
                [250, 0, 0, 0],
                [75000, 8, 1, 1],
                [150, 4, 0, 0],
                [3000, 6, 1, 1],
            ])
            _isolation_forest.fit(dummy_data)
            joblib.dump(_isolation_forest, MODEL_PATH)
    return _isolation_forest


def calculate_anomaly_score(
    transaction_amount: float,
    login_hour: int,
    location_changes: int,
    device_changes: int,
) -> float:
    model = _get_model()
    features = np.array([[transaction_amount, login_hour, location_changes, device_changes]])
    anomaly_score = model.score_samples(features)[0]
    normalized = 1.0 - (anomaly_score + 0.5) / 1.5
    normalized = max(0.0, min(1.0, normalized))
    risk_points = normalized * 30
    return round(risk_points, 2)


def retrain_model(training_data: List[Dict]):
    model = _get_model()
    features = np.array([
        [d["amount"], d["login_hour"], d["location_changes"], d["device_changes"]]
        for d in training_data
    ])
    if len(features) >= 10:
        model.fit(features)
        joblib.dump(model, MODEL_PATH)
