use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MaintenanceRecord {
    pub id: i64,
    pub component_id: i64,
    pub technician_id: i64,
    pub maintenance_type: String,
    pub description: String,
    pub parts_replaced: Option<String>,
    pub inspection_result: String,
    pub record_hash: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateMaintenanceRequest {
    pub component_id: i64,
    pub maintenance_type: String,
    pub description: String,
    pub parts_replaced: Option<String>,
    pub inspection_result: String, // e.g. "PASSED", "FAILED", "WARNING"
}

#[derive(Debug, Serialize)]
pub struct MaintenanceRecordResponse {
    pub id: i64,
    pub component_id: i64,
    pub technician_id: i64,
    pub technician_name: String,
    pub maintenance_type: String,
    pub description: String,
    pub parts_replaced: Option<String>,
    pub inspection_result: String,
    pub record_hash: String,
    pub created_at: String,
}
