use crate::{
    config::Config,
    db::DbPool,
    errors::AppError,
    middleware::auth::{
        require_company_scope, require_role, require_super_admin, AuthenticatedUser,
    },
    models::{
        BlockchainVerifyRequest, BlockchainVerifyResponse, NfcVerificationRequest, UserRole,
        VerificationLog, VerificationResponse,
    },
    services::{
        blockchain_service::BlockchainService, nfc_service::DeviceNfcService,
        verification_service::VerificationService,
    },
};
use axum::{extract::{Path, State}, Extension, Json};
use std::sync::Arc;

const VERIFICATION_ROLES: [UserRole; 4] = [
    UserRole::CompanyAdmin,
    UserRole::Manufacturer,
    UserRole::MaintenanceTechnician,
    UserRole::Inspector,
];

pub async fn verify_nfc(
    State(pool): State<DbPool>,
    Extension(blockchain): Extension<Arc<BlockchainService>>,
    Extension(config): Extension<Arc<Config>>,
    user: AuthenticatedUser,
    Json(mut req): Json<NfcVerificationRequest>,
) -> Result<Json<VerificationResponse>, AppError> {
    // Match the web permission matrix: company users who can execute NFC
    // verification are Company Admin, Manufacturer, Maintenance Technician,
    // and Inspector. Viewer is read-only. Super Admin is handled separately
    // because it has no tenant in the JWT and is allowed platform-wide lookup.
    if user.0.company_id.is_some() {
        require_role(&user, &VERIFICATION_ROLES)?;
    }

    // Company users are always scoped by the company_id in their JWT. A platform
    // Super Admin has no tenant in the JWT. For the normal mobile scan flow, the
    // backend resolves the registered tag to exactly one company, so the app does
    // not need a separate tenant-selection screen. An explicit company_id is also
    // accepted for future platform-admin UI, but is never trusted for company users.
    let company_id = match user.0.company_id {
        Some(company_id) => {
            req.company_id = None;
            company_id
        }
        None => {
            require_super_admin(&user)?;

            let company_ids: Vec<(i64,)> = sqlx::query_as(
                "SELECT DISTINCT company_id FROM component_tags WHERE identifier = $1 AND company_id IS NOT NULL",
            )
            .bind(&req.tag_identifier)
            .fetch_all(&pool)
            .await?;

            let selected_company_id = match req.company_id {
                Some(id) if company_ids.iter().any(|(candidate,)| *candidate == id) => id,
                Some(_) => {
                    return Err(AppError::Forbidden(
                        "The selected company does not own this NFC tag".to_string(),
                    ))
                }
                None if company_ids.len() == 1 => company_ids[0].0,
                None if company_ids.is_empty() => {
                    return Err(AppError::NotFound(
                        "NFC tag is not registered to any company".to_string(),
                    ))
                }
                None => {
                    return Err(AppError::ValidationError(
                        "This NFC identifier is registered to multiple companies; select a company before verifying".to_string(),
                    ))
                }
            };

            let company: Option<(i64, String)> = sqlx::query_as(
                "SELECT id, status FROM companies WHERE id = $1",
            )
            .bind(selected_company_id)
            .fetch_optional(&pool)
            .await?;

            match company {
                Some((_, status)) if status == "ACTIVE" => selected_company_id,
                Some(_) => {
                    return Err(AppError::Forbidden(
                        "The selected company is suspended".to_string(),
                    ))
                }
                None => return Err(AppError::NotFound("Company not found".to_string())),
            }
        }
    };

    if req.simulate_scenario.is_some() {
        if !config.allow_verification_simulation {
            return Err(AppError::Forbidden(
                "Verification simulation is disabled on this deployment".to_string(),
            ));
        }
        require_role(&user, &[UserRole::CompanyAdmin])?;
    } else {
        req.simulate_scenario = None;
    }
    let nfc = DeviceNfcService::new();
    Ok(Json(
        VerificationService::verify_nfc_tag(&pool, company_id, &nfc, &blockchain, req).await?,
    ))
}

pub async fn list_verifications(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
) -> Result<Json<Vec<VerificationLog>>, AppError> {
    require_role(&user, &VERIFICATION_ROLES)?;
    let company_id = require_company_scope(&user)?;
    Ok(Json(
        sqlx::query_as(
            "SELECT * FROM verification_logs WHERE company_id = $1 ORDER BY id DESC",
        )
        .bind(company_id)
        .fetch_all(&pool)
        .await?,
    ))
}

pub async fn get_component_verifications(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
    Path(component_id): Path<i64>,
) -> Result<Json<Vec<VerificationLog>>, AppError> {
    require_role(&user, &VERIFICATION_ROLES)?;
    let company_id = require_company_scope(&user)?;
    Ok(Json(
        sqlx::query_as(
            "SELECT * FROM verification_logs WHERE component_id = $1 AND company_id = $2 ORDER BY id DESC",
        )
        .bind(component_id)
        .bind(company_id)
        .fetch_all(&pool)
        .await?,
    ))
}

pub async fn verify_blockchain_record(
    State(pool): State<DbPool>,
    Extension(blockchain): Extension<Arc<BlockchainService>>,
    user: AuthenticatedUser,
    Json(req): Json<BlockchainVerifyRequest>,
) -> Result<Json<BlockchainVerifyResponse>, AppError> {
    require_role(&user, &[UserRole::CompanyAdmin, UserRole::Inspector])?;
    let company_id = require_company_scope(&user)?;
    let record: Option<(String,)> = sqlx::query_as(
        "SELECT record_hash FROM maintenance_records WHERE id = $1 AND company_id = $2",
    )
    .bind(req.record_id)
    .bind(company_id)
    .fetch_optional(&pool)
    .await?;
    let db_hash = record
        .map(|r| r.0)
        .ok_or_else(|| AppError::NotFound("Maintenance record not found".to_string()))?;
    let matches = blockchain.verify_record_hash(req.record_id, &db_hash).await?;
    Ok(Json(BlockchainVerifyResponse {
        verified: matches,
        record_id: req.record_id,
        db_hash: db_hash.clone(),
        blockchain_hash: db_hash,
        match_status: if matches { "VALID" } else { "MISMATCH" }.to_string(),
    }))
}
