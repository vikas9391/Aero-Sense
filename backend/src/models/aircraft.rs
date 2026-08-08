use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Aircraft {
    pub id: i64,
    pub aircraft_uuid: String,
    pub registration_number: String,
    pub model: String,
    pub manufacturer: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateAircraftRequest {
    pub registration_number: String,
    pub model: String,
    pub manufacturer: String,
    pub status: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AircraftWithComponents {
    #[serde(flatten)]
    pub aircraft: Aircraft,
    pub components: Vec<super::component::ComponentResponse>,
}
