use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NfcTagScanData {
    pub identifier: String,       // Hardware UID (e.g., "04:A3:91:XX")
    pub technology: String,       // NFC
    pub security_type: String,    // BASIC_UID or SECURE_NFC_PAYLOAD
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
    /// Required only for a platform Super Admin, who has no tenant in their JWT.
    /// Company users must leave this unset; their JWT company scope is authoritative.
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

#[derive(Debug, Serialize, Deserialize)]
pub struct VerificationComponentInfo {
    pub id: String,
    pub aircraft: String,
    pub serial_number: String,
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
