use crate::{
    errors::AppError,
    models::{NfcAuthResult, NfcTagScanData},
};
use async_trait::async_trait;

/// Validates NFC scan data received from a physical NFC-capable client.
///
/// The backend cannot access a phone's NFC radio directly: the Flutter app
/// performs the hardware read and sends the tag UID here. For UID-based tags
/// such as NTAG213, the UID is the hardware identity used for registry
/// binding. Cryptographic authentication is only possible when the client
/// supplies a supported signed/dynamic payload (for example NTAG424 DNA SUN).
#[async_trait]
pub trait NfcService: Send + Sync {
    async fn verify_tag_identity(&self, scan_data: &NfcTagScanData) -> Result<NfcAuthResult, AppError>;
}

pub struct DeviceNfcService;

impl DeviceNfcService {
    pub fn new() -> Self {
        Self
    }

    fn normalize_identifier(identifier: &str) -> String {
        identifier.trim().replace('-', ":").to_uppercase()
    }

    fn valid_uid(identifier: &str) -> bool {
        let parts: Vec<&str> = identifier.split(':').filter(|p| !p.is_empty()).collect();
        matches!(parts.len(), 4..=10)
            && parts.iter().all(|part| part.len() == 2 && part.chars().all(|c| c.is_ascii_hexdigit()))
    }
}

impl Default for DeviceNfcService {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl NfcService for DeviceNfcService {
    async fn verify_tag_identity(&self, scan_data: &NfcTagScanData) -> Result<NfcAuthResult, AppError> {
        let identifier = Self::normalize_identifier(&scan_data.identifier);

        if scan_data.technology.to_uppercase() != "NFC" {
            return Ok(NfcAuthResult {
                authenticated: false,
                identifier,
                security_type: scan_data.security_type.clone(),
                message: "Unsupported scan technology".to_string(),
            });
        }

        if !Self::valid_uid(&identifier) {
            return Ok(NfcAuthResult {
                authenticated: false,
                identifier,
                security_type: scan_data.security_type.clone(),
                message: "Invalid NFC hardware UID received from client".to_string(),
            });
        }

        let security_type = if scan_data.cmac_signature.is_some() || scan_data.dynamic_counter.is_some() {
            "SECURE_NFC_PAYLOAD".to_string()
        } else {
            "BASIC_UID".to_string()
        };

        Ok(NfcAuthResult {
            authenticated: true,
            identifier,
            security_type,
            message: "Physical NFC tag scan accepted".to_string(),
        })
    }
}
