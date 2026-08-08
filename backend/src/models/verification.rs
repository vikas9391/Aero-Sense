use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NfcTagScanData {
    pub identifier: String,       // Hardware UID (e.g., "04:A3:91:XX")
    pub technology: String,       // "NFC" or "UHF_RFID"
    pub security_type: String,    // "MOCK", "BASIC_UID", "SECURE_NTAG424"
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

#[derive(Debug, Deserialize)]
pub struct NfcVerificationRequest {
    pub tag_identifier: String, // e.g. "04:A3:91:XX"
    pub payload: Option<String>,
    pub simulate_scenario: Option<String>, // "VALID", "UNKNOWN_TAG", "INVALID_TAG", "TAMPERED_TAG", "BLOCKCHAIN_MISMATCH"
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
    pub id: String, // Component UUID or ID (e.g. ENG-0001)
    pub aircraft: String,
    pub serial_number: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VerificationResponse {
    pub verified: bool,
    pub status: String, // "AUTHENTIC", "SUSPICIOUS", "INVALID"
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
