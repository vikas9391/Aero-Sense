use crate::{
    db::DbPool,
    errors::AppError,
    models::{
        Component, ComponentTag, NfcTagScanData, NfcVerificationRequest, VerificationChecks,
        VerificationComponentInfo, VerificationResponse,
    },
    services::{blockchain_service::BlockchainService, nfc_service::NfcService},
};
use tracing::info;

pub struct VerificationService;

impl VerificationService {
    pub async fn verify_nfc_tag<N: NfcService>(
        pool: &DbPool,
        nfc_service: &N,
        blockchain_service: &BlockchainService,
        req: NfcVerificationRequest,
    ) -> Result<VerificationResponse, AppError> {
        info!("Running verification pipeline for tag identifier: {}", req.tag_identifier);

        // Handle simulation overrides if specified
        if let Some(scenario) = &req.simulate_scenario {
            match scenario.as_str() {
                "UNKNOWN_TAG" => {
                    let res = VerificationResponse {
                        verified: false,
                        status: "INVALID".to_string(),
                        component: None,
                        checks: VerificationChecks {
                            nfc_authentication: true,
                            component_binding: false,
                            tamper_status: false,
                            blockchain_integrity: false,
                        },
                        failure_reason: Some("NFC tag is not registered to any aircraft component".to_string()),
                    };
                    Self::log_verification(pool, None, None, &res).await.ok();
                    return Ok(res);
                }
                "INVALID_TAG" => {
                    let res = VerificationResponse {
                        verified: false,
                        status: "INVALID".to_string(),
                        component: None,
                        checks: VerificationChecks {
                            nfc_authentication: false,
                            component_binding: false,
                            tamper_status: false,
                            blockchain_integrity: false,
                        },
                        failure_reason: Some("NFC cryptographic authentication failed".to_string()),
                    };
                    Self::log_verification(pool, None, None, &res).await.ok();
                    return Ok(res);
                }
                "TAMPERED_TAG" => {
                    let tag_opt: Option<ComponentTag> = sqlx::query_as("SELECT * FROM component_tags WHERE identifier = ?")
                        .bind(&req.tag_identifier)
                        .fetch_optional(pool)
                        .await?;

                    let comp_info = if let Some(ref t) = tag_opt {
                        Self::fetch_component_info(pool, t.component_id).await.ok()
                    } else {
                        Some(VerificationComponentInfo {
                            id: "ENG-0001".to_string(),
                            aircraft: "A320-001".to_string(),
                            serial_number: "XZ928374".to_string(),
                        })
                    };

                    let res = VerificationResponse {
                        verified: false,
                        status: "SUSPICIOUS".to_string(),
                        component: comp_info,
                        checks: VerificationChecks {
                            nfc_authentication: true,
                            component_binding: true,
                            tamper_status: false,
                            blockchain_integrity: true,
                        },
                        failure_reason: Some("Unauthorized physical tamper condition detected on tag".to_string()),
                    };
                    Self::log_verification(pool, tag_opt.as_ref().map(|t| t.component_id), tag_opt.as_ref().map(|t| t.id), &res).await.ok();
                    return Ok(res);
                }
                "BLOCKCHAIN_MISMATCH" => {
                    let tag_opt: Option<ComponentTag> = sqlx::query_as("SELECT * FROM component_tags WHERE identifier = ?")
                        .bind(&req.tag_identifier)
                        .fetch_optional(pool)
                        .await?;

                    let comp_info = if let Some(ref t) = tag_opt {
                        Self::fetch_component_info(pool, t.component_id).await.ok()
                    } else {
                        Some(VerificationComponentInfo {
                            id: "ENG-0001".to_string(),
                            aircraft: "A320-001".to_string(),
                            serial_number: "XZ928374".to_string(),
                        })
                    };

                    let res = VerificationResponse {
                        verified: false,
                        status: "SUSPICIOUS".to_string(),
                        component: comp_info,
                        checks: VerificationChecks {
                            nfc_authentication: true,
                            component_binding: true,
                            tamper_status: true,
                            blockchain_integrity: false,
                        },
                        failure_reason: Some("Blockchain maintenance record hash mismatch detected (potential record tampering)".to_string()),
                    };
                    Self::log_verification(pool, tag_opt.as_ref().map(|t| t.component_id), tag_opt.as_ref().map(|t| t.id), &res).await.ok();
                    return Ok(res);
                }
                _ => {} // Fallthrough to real verification flow
            }
        }

        // Standard verification flow
        let scan_data = NfcTagScanData {
            identifier: req.tag_identifier.clone(),
            technology: "NFC".to_string(),
            security_type: "MOCK".to_string(),
            raw_payload: req.payload,
            dynamic_counter: None,
            cmac_signature: None,
        };

        // 1. NFC Authentication
        let auth_res = nfc_service.verify_tag_identity(&scan_data).await?;
        let nfc_auth_passed = auth_res.authenticated;

        // 2. Component Binding
        let tag_opt: Option<ComponentTag> = sqlx::query_as("SELECT * FROM component_tags WHERE identifier = ?")
            .bind(&req.tag_identifier)
            .fetch_optional(pool)
            .await?;

        let (component_binding_passed, tag_id, component_id, comp_info) = if let Some(tag) = &tag_opt {
            let info = Self::fetch_component_info(pool, tag.component_id).await.ok();
            (true, Some(tag.id), Some(tag.component_id), info)
        } else {
            (false, None, None, None)
        };

        // 3. Tamper Status
        let tamper_passed = if let Some(tag) = &tag_opt {
            tag.tamper_status.to_uppercase() == "INTACT"
        } else {
            false
        };

        // 4. Blockchain Integrity
        let blockchain_passed = if let Some(cid) = component_id {
            // Fetch latest maintenance record hash if exists
            let record_hash: Option<(String, i64)> = sqlx::query_as(
                "SELECT record_hash, id FROM maintenance_records WHERE component_id = ? ORDER BY id DESC LIMIT 1"
            )
            .bind(cid)
            .fetch_optional(pool)
            .await?;

            if let Some((hash, rid)) = record_hash {
                blockchain_service.verify_record_hash(rid, &hash).await.unwrap_or(true)
            } else {
                true // No maintenance records yet, integrity valid
            }
        } else {
            false
        };

        // Calculate final verdict
        let (verified, status, failure_reason) = if !nfc_auth_passed {
            (false, "INVALID".to_string(), Some("NFC authentication failed".to_string()))
        } else if !component_binding_passed {
            (false, "INVALID".to_string(), Some("NFC tag is not registered to any component".to_string()))
        } else if !tamper_passed {
            (false, "SUSPICIOUS".to_string(), Some("TagTamper seal reported physical compromise".to_string()))
        } else if !blockchain_passed {
            (false, "SUSPICIOUS".to_string(), Some("Blockchain maintenance record hash mismatch".to_string()))
        } else {
            (true, "AUTHENTIC".to_string(), None)
        };

        let response = VerificationResponse {
            verified,
            status,
            component: comp_info,
            checks: VerificationChecks {
                nfc_authentication: nfc_auth_passed,
                component_binding: component_binding_passed,
                tamper_status: tamper_passed,
                blockchain_integrity: blockchain_passed,
            },
            failure_reason,
        };

        Self::log_verification(pool, component_id, tag_id, &response).await.ok();

        Ok(response)
    }

    async fn fetch_component_info(pool: &DbPool, component_id: i64) -> Result<VerificationComponentInfo, AppError> {
        let comp: Component = sqlx::query_as("SELECT * FROM components WHERE id = ?")
            .bind(component_id)
            .fetch_one(pool)
            .await?;

        let aircraft_reg = if let Some(aid) = comp.aircraft_id {
            let reg: Option<(String,)> = sqlx::query_as("SELECT registration_number FROM aircraft WHERE id = ?")
                .bind(aid)
                .fetch_optional(pool)
                .await?;
            reg.map(|r| r.0).unwrap_or_else(|| "UNASSIGNED".to_string())
        } else {
            "UNASSIGNED".to_string()
        };

        Ok(VerificationComponentInfo {
            id: comp.component_uuid,
            aircraft: aircraft_reg,
            serial_number: comp.serial_number,
        })
    }

    async fn log_verification(
        pool: &DbPool,
        component_id: Option<i64>,
        tag_id: Option<i64>,
        response: &VerificationResponse,
    ) -> Result<(), AppError> {
        sqlx::query(
            "INSERT INTO verification_logs 
             (component_id, tag_id, authentication_result, component_binding_result, tamper_result, blockchain_result, final_result, failure_reason)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(component_id)
        .bind(tag_id)
        .bind(response.checks.nfc_authentication)
        .bind(response.checks.component_binding)
        .bind(response.checks.tamper_status)
        .bind(response.checks.blockchain_integrity)
        .bind(&response.status)
        .bind(&response.failure_reason)
        .execute(pool)
        .await?;

        Ok(())
    }
}
