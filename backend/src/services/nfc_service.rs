use crate::{
    errors::AppError,
    models::{NfcAuthResult, NfcTagScanData},
};
use async_trait::async_trait;

#[async_trait]
pub trait NfcService: Send + Sync {
    async fn verify_tag_identity(&self, scan_data: &NfcTagScanData) -> Result<NfcAuthResult, AppError>;
}

pub struct MockNfcService;

impl MockNfcService {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl NfcService for MockNfcService {
    async fn verify_tag_identity(&self, scan_data: &NfcTagScanData) -> Result<NfcAuthResult, AppError> {
        if scan_data.identifier.trim().is_empty() {
            return Ok(NfcAuthResult {
                authenticated: false,
                identifier: scan_data.identifier.clone(),
                security_type: scan_data.security_type.clone(),
                message: "Empty NFC tag identifier".to_string(),
            });
        }

        if let Some(payload) = &scan_data.raw_payload {
            if payload == "INVALID_NFC_SIGNATURE" {
                return Ok(NfcAuthResult {
                    authenticated: false,
                    identifier: scan_data.identifier.clone(),
                    security_type: scan_data.security_type.clone(),
                    message: "Cryptographic signature validation failed".to_string(),
                });
            }
        }

        Ok(NfcAuthResult {
            authenticated: true,
            identifier: scan_data.identifier.clone(),
            security_type: scan_data.security_type.clone(),
            message: "NFC Tag Identity authenticated successfully".to_string(),
        })
    }
}
