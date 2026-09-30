"""Aero-Sense RUL inference API (NASA C-MAPSS FD001 prototype)."""
from pathlib import Path
from typing import Dict
import math

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "aerosense_rul_model.pkl"

app = FastAPI(
    title="Aero-Sense RUL Prediction API",
    description=(
        "Research prototype using a Random Forest trained on NASA C-MAPSS FD001. "
        "It is not an aircraft maintenance or airworthiness decision system."
    ),
    version="0.1.0",
)

model = None
feature_columns = []
target_cap = 125


@app.on_event("startup")
def load_model() -> None:
    global model, feature_columns, target_cap
    if not MODEL_PATH.is_file():
        raise RuntimeError(
            f"Model artifact not found at {MODEL_PATH}. "
            "Place aerosense_rul_model.pkl in the ml-service directory."
        )
    artifact = joblib.load(MODEL_PATH)
    required = {"model", "feature_columns", "target_cap"}
    if not isinstance(artifact, dict) or not required.issubset(artifact):
        raise RuntimeError("Model artifact is missing required keys.")
    model = artifact["model"]
    feature_columns = list(artifact["feature_columns"])
    target_cap = float(artifact["target_cap"])


class PredictionRequest(BaseModel):
    features: Dict[str, float] = Field(
        ..., description="Feature-name/value map from one engine's latest cycle."
    )


@app.get("/")
def root():
    return {
        "service": "Aero-Sense RUL Prediction API",
        "status": "running",
        "model_loaded": model is not None,
        "required_feature_count": len(feature_columns),
    }


@app.get("/health")
def health():
    return {"status": "ok" if model is not None else "model_not_loaded"}


@app.post("/predict")
def predict(request: PredictionRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded.")

    missing = [name for name in feature_columns if name not in request.features]
    if missing:
        raise HTTPException(
            status_code=422,
            detail={"message": "Missing required features.", "missing": missing},
        )

    values = [request.features[name] for name in feature_columns]
    if not all(math.isfinite(value) for value in values):
        raise HTTPException(status_code=422, detail="Feature values must be finite.")

    input_frame = pd.DataFrame([dict(zip(feature_columns, values))])
    prediction = float(model.predict(input_frame)[0])
    prediction = max(0.0, min(prediction, target_cap))

    return {
        "predicted_rul_cycles": round(prediction, 2),
        "unit": "cycles",
        "model": "RandomForestRegressor",
        "dataset": "NASA C-MAPSS FD001",
        "prototype": True,
        "notice": (
            "Research prototype on simulated engine data; not validated for real "
            "aircraft components and not for airworthiness decisions."
        ),
    }
