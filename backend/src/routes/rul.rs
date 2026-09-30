use crate::{db::DbPool, errors::AppError, middleware::auth::{require_company_scope, require_role, AuthenticatedUser}, models::UserRole};
use axum::{extract::{Path, State}, http::StatusCode, Json};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::collections::BTreeMap;

const REQUIRED: [&str; 18] = ["cycle", "setting_1", "setting_2", "sensor_2", "sensor_3", "sensor_4", "sensor_6", "sensor_7", "sensor_8", "sensor_9", "sensor_11", "sensor_12", "sensor_13", "sensor_14", "sensor_15", "sensor_17", "sensor_20", "sensor_21"];
#[derive(Debug, Serialize, Deserialize)]
pub struct RulPredictionRequest { pub features: BTreeMap<String, f64> }
#[derive(Debug, Serialize, Deserialize)]
pub struct RulPredictionResponse { pub predicted_rul_cycles: f64, pub unit: String, pub model: String, pub dataset: String, pub prototype: bool, pub notice: String }
#[derive(Debug, Deserialize)]
pub struct SaveRulRecordRequest { pub features: Map<String, Value> }
#[derive(Debug, Serialize)]
pub struct RulRecordResponse { pub component_id: i64, pub features: Map<String, Value>, pub updated_at: String }

fn validate(features: &Map<String, Value>) -> Result<(), String> {
    let missing: Vec<_> = REQUIRED.iter().filter(|k| !features.contains_key(**k)).copied().collect();
    if !missing.is_empty() { return Err(format!("Missing required features: {}", missing.join(", "))); }
    for key in REQUIRED { if !features.get(key).and_then(Value::as_f64).map(f64::is_finite).unwrap_or(false) { return Err(format!("{key} must be a finite number")); } }
    Ok(())
}
pub async fn get_component_rul_record(State(pool): State<DbPool>, user: AuthenticatedUser, Path(id): Path<i64>) -> Result<Json<RulRecordResponse>, AppError> {
    let company_id = require_company_scope(&user)?;
    let row = sqlx::query_as::<_, (Value, String)>("SELECT r.features, r.updated_at FROM component_rul_records r JOIN components c ON c.id = r.component_id WHERE r.component_id = $1 AND r.company_id = $2 AND c.company_id = $2").bind(id).bind(company_id).fetch_optional(&pool).await?;
    match row { Some((features, updated_at)) => Ok(Json(RulRecordResponse { component_id: id, features: features.as_object().cloned().unwrap_or_default(), updated_at })), None => Err(AppError::NotFound("RUL sensor record not found for this component".into())) }
}
pub async fn save_component_rul_record(State(pool): State<DbPool>, user: AuthenticatedUser, Path(id): Path<i64>, Json(req): Json<SaveRulRecordRequest>) -> Result<(StatusCode, Json<RulRecordResponse>), AppError> {
    require_role(&user, &[UserRole::CompanyAdmin, UserRole::Manufacturer, UserRole::MaintenanceTechnician])?;
    let company_id = require_company_scope(&user)?;
    validate(&req.features).map_err(AppError::ValidationError)?;
    let exists: bool = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM components WHERE id = $1 AND company_id = $2)").bind(id).bind(company_id).fetch_one(&pool).await?;
    if !exists { return Err(AppError::NotFound("Component not found".into())); }
    let row = sqlx::query_as::<_, (Value, String)>("INSERT INTO component_rul_records (component_id, company_id, features) VALUES ($1, $2, $3) ON CONFLICT (component_id) DO UPDATE SET company_id = EXCLUDED.company_id, features = EXCLUDED.features, updated_at = CURRENT_TIMESTAMP::text RETURNING features, updated_at").bind(id).bind(company_id).bind(Value::Object(req.features)).fetch_one(&pool).await?;
    Ok((StatusCode::OK, Json(RulRecordResponse { component_id: id, features: row.0.as_object().cloned().unwrap_or_default(), updated_at: row.1 })))
}
pub async fn predict_rul(Json(payload): Json<RulPredictionRequest>) -> Result<Json<RulPredictionResponse>, (StatusCode, String)> {
    if payload.features.values().any(|v| !v.is_finite()) { return Err((StatusCode::BAD_REQUEST, "All feature values must be finite numbers".into())); }
    let map: Map<String, Value> = payload.features.iter().map(|(k,v)| (k.clone(), Value::from(*v))).collect();
    validate(&map).map_err(|e| (StatusCode::BAD_REQUEST, e))?;
    let base = std::env::var("RUL_ML_API_URL").unwrap_or_else(|_| "https://aero-sense-ml-model.onrender.com".into());
    let client = reqwest::Client::builder().timeout(std::time::Duration::from_secs(90)).build().map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Could not create ML client: {e}")))?;
    let response = client.post(format!("{}/predict", base.trim_end_matches('/'))).json(&payload).send().await.map_err(|e| (StatusCode::BAD_GATEWAY, format!("ML service unavailable: {e}")))?;
    let status = response.status();
    if !status.is_success() { let detail = response.text().await.unwrap_or_default(); return Err((StatusCode::BAD_GATEWAY, format!("ML service returned {status}: {detail}"))); }
    let result = response.json::<RulPredictionResponse>().await.map_err(|e| (StatusCode::BAD_GATEWAY, format!("Invalid ML response: {e}")))?;
    Ok(Json(result))
}