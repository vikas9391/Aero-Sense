use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Component {
    pub id: i64,
    pub component_uuid: String,
    pub aircraft_id: Option<i64>,
    pub serial_number: String,
    pub component_type: String,
    pub manufacturer: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateComponentRequest {
    pub aircraft_id: Option<i64>,
    pub serial_number: String,
    pub component_type: String,
    pub manufacturer: String,
    pub status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ComponentResponse {
    pub id: i64,
    pub component_uuid: String,
    pub aircraft_id: Option<i64>,
    pub aircraft_registration: Option<String>,
    pub serial_number: String,
    pub component_type: String,
    pub manufacturer: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}
