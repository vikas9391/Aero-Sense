use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ComponentTag {
    pub id: i64,
    pub component_id: i64,
    pub technology: String,
    pub identifier: String,
    pub security_type: String,
    pub tamper_status: String,
    pub registered_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct RegisterTagRequest {
    pub component_id: i64,
    pub technology: String, // e.g. "NFC", "UHF_RFID"
    pub identifier: String, // e.g. "04:A3:91:XX"
    pub security_type: Option<String>, // e.g. "MOCK", "BASIC_UID", "SECURE_NTAG424"
}
