use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NfcTagScanData {
    pub identifier: String,
    pub technology: String,
    pub security_type: String,
    pub raw_payload: Option<String>,
    pub dynamic_counter: Option<u32>,
    pub cmac_signature: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NfcAuthResult {
    pub authenticated: bool,
    pub identifier: String,
    pub security_type: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct VerificationLog {
    pub id: i64,
    pub component_id: Option<i64>,
    pub tag_id: Option<i64>,
    pub authentication_result: bool,
    pub component_binding_result: bool,
    pub tamper_result: bool,
    pub blockchain_result: bool,
    pub final_result: String,
    pub failure_reason: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct VerificationLogWithComponent {
    pub id: i64,
    pub component_id: Option<i64>,
    pub component_serial_number: Option<String>,
    pub component_type: Option<String>,
    pub tag_id: Option<i64>,
    pub authentication_result: bool,
    pub component_binding_result: bool,
    pub tamper_result: bool,
    pub blockchain_result: bool,
    pub final_result: String,
    pub failure_reason: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct NfcVerificationRequest {
    pub tag_identifier: String,
    pub payload: Option<String>,
    pub company_id: Option<i64>,
    pub simulate_scenario: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VerificationChecks {
    pub nfc_authentication: bool,
    pub component_binding: bool,
    pub tamper_status: bool,
    pub blockchain_integrity: bool,
}

/// Component and physical-tag data returned with every successful binding lookup.
/// The extra fields let mobile clients render the component passport immediately
/// after an NFC scan instead of only showing the three legacy identity fields.
#[derive(Debug, Serialize, Deserialize)]
pub struct VerificationComponentInfo {
    pub database_id: i64,
    pub id: String,
    pub aircraft: String,
    pub serial_number: String,
    pub component_type: String,
    pub manufacturer: String,
    pub status: String,
    pub tag_identifier: String,
    pub tag_technology: String,
    pub tag_security_type: String,
    pub tag_tamper_status: String,
    pub tag_registered_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VerificationResponse {
    pub verified: bool,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub component: Option<VerificationComponentInfo>,
    pub checks: VerificationChecks,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub failure_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct BlockchainVerifyRequest {
    pub record_id: i64,
}

#[derive(Debug, Serialize)]
pub struct BlockchainVerifyResponse {
    pub verified: bool,
    pub record_id: i64,
    pub db_hash: String,
    pub blockchain_hash: String,
    pub match_status: String,
}
