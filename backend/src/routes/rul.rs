use axum::{http::StatusCode, Json};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

const DEFAULT_ML_URL: &str = "https://aero-sense-ml-model.onrender.com";

#[derive(Debug, Serialize, Deserialize)]
pub struct RulPredictionRequest {
    pub features: BTreeMap<String, f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RulPredictionResponse {
    pub predicted_rul_cycles: f64,
    pub unit: String,
    pub model: String,
    pub dataset: String,
    pub prototype: bool,
    pub notice: String,
}

pub async fn predict_rul(
    Json(payload): Json<RulPredictionRequest>,
) -> Result<Json<RulPredictionResponse>, (StatusCode, String)> {
    const REQUIRED: [&str; 18] = [
        "cycle", "setting_1", "setting_2", "sensor_2", "sensor_3", "sensor_4",
        "sensor_6", "sensor_7", "sensor_8", "sensor_9", "sensor_11", "sensor_12",
        "sensor_13", "sensor_14", "sensor_15", "sensor_17", "sensor_20", "sensor_21",
    ];

    let missing: Vec<&str> = REQUIRED.iter().copied()
        .filter(|key| !payload.features.contains_key(*key)).collect();
    if !missing.is_empty() {
        return Err((StatusCode::BAD_REQUEST, format!("Missing required features: {}", missing.join(", "))));
    }
    if payload.features.values().any(|value| !value.is_finite()) {
        return Err((StatusCode::BAD_REQUEST, "All feature values must be finite numbers".into()));
    }

    let base = std::env::var("RUL_ML_API_URL").unwrap_or_else(|_| DEFAULT_ML_URL.into());
    let url = format!("{}/predict", base.trim_end_matches('/'));
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(90))
        .build()
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Could not create ML client: {e}")))?;

    let response = client.post(url).json(&payload).send().await
        .map_err(|e| (StatusCode::BAD_GATEWAY, format!("ML service unavailable: {e}")))?;
    let status = response.status();
    if !status.is_success() {
        let detail = response.text().await.unwrap_or_default();
        return Err((StatusCode::BAD_GATEWAY, format!("ML service returned {status}: {detail}")));
    }
    let result = response.json::<RulPredictionResponse>().await
        .map_err(|e| (StatusCode::BAD_GATEWAY, format!("Invalid ML response: {e}")))?;
    Ok(Json(result))
}
