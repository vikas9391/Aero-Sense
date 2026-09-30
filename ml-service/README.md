# Aero-Sense RUL ML Service

A separate FastAPI inference service for the NASA C-MAPSS FD001 Remaining Useful Life (RUL) prototype.

## Important limitation

The Random Forest was trained on simulated engine degradation data, not Aero-Sense's real aircraft-component maintenance records. Its test metrics (with the training target capped at 125 cycles) were:

- MAE: 12.48 cycles
- RMSE: 16.88 cycles
- R²: 0.822

These are experimental dataset results only. Do not use this prototype for aircraft airworthiness, maintenance release, or safety-critical decisions. The service is not connected to the Aero-Sense Rust backend or app yet.

## 1. Add the model artifact

The trained `aerosense_rul_model.pkl` is intentionally not committed because it is approximately 112 MB. Download it from the training Colab session and place it beside `main.py`:

```
ml-service/
├── main.py
├── requirements.txt
├── README.md
└── aerosense_rul_model.pkl   # local only; ignored by Git
```

The artifact must be the one exported from the FD001 notebook and contain `model`, `feature_columns`, and `target_cap`.

## 2. Install and run (Windows PowerShell)

From the repository root:

```powershell
cd ml-service
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --reload
```

Open:

- http://127.0.0.1:8000/ — service status
- http://127.0.0.1:8000/health — model health
- http://127.0.0.1:8000/docs — interactive API docs

## 3. Make a prediction

Use `POST /predict` with a JSON body containing a `features` object. It must include every feature listed in the saved artifact's `feature_columns`, using the exact names and numeric values from one engine's latest sensor row. The API preserves the model's feature order and reports missing fields.

Do not use arbitrary zeroes as sensor readings. The model expects the same feature definitions and units as the FD001 training data.
