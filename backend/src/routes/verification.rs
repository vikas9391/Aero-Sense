use crate::{
    config::Config,
    db::DbPool,
    errors::AppError,
    middleware::auth::{require_company_scope, require_role, AuthenticatedUser},
    models::{
        BlockchainVerifyRequest, BlockchainVerifyResponse, NfcVerificationRequest, UserRole,
        VerificationLog, VerificationResponse,
    },
    services::{
        blockchain_service::BlockchainService, nfc_service::MockNfcService,
        verification_service::VerificationService,
    },
};
use axum::{
    extract::{Path, State},
    Extension, Json,
};
use std::sync::Arc;

pub async fn verify_nfc(
    State(pool): State<DbPool>,
    Extension(blockchain): Extension<Arc<BlockchainService>>,
    Extension(config): Extension<Arc<Config>>,
    user: AuthenticatedUser,
    Json(mut req): Json<NfcVerificationRequest>,
) -> Result<Json<VerificationResponse>, AppError> {
    let company_id = require_company_scope(&user)?;

    // `simulate_scenario` fabricates verification outcomes (including audit
    // log entries) without touching real NFC/blockchain checks. It exists to
    // demo failure states, so it's off unless the deployment explicitly opts
    // in via ALLOW_VERIFICATION_SIMULATION, and even then only a Company
    // Admin can invoke it — never a regular technician account.
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

    let mock_nfc = MockNfcService::new();
    let res = VerificationService::verify_nfc_tag(&pool, company_id, &mock_nfc, &blockchain, req).await?;
    Ok(Json(res))
}

pub async fn get_component_verifications(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
    Path(component_id): Path<i64>,
) -> Result<Json<Vec<VerificationLog>>, AppError> {
    let company_id = require_company_scope(&user)?;

    let logs: Vec<VerificationLog> = sqlx::query_as(
        "SELECT * FROM verification_logs WHERE component_id = ? AND company_id = ? ORDER BY id DESC"
    )
    .bind(component_id)
    .bind(company_id)
    .fetch_all(&pool)
    .await?;

    Ok(Json(logs))
}

pub async fn verify_blockchain_record(
    State(pool): State<DbPool>,
    Extension(blockchain): Extension<Arc<BlockchainService>>,
    user: AuthenticatedUser,
    Json(req): Json<BlockchainVerifyRequest>,
) -> Result<Json<BlockchainVerifyResponse>, AppError> {
    let company_id = require_company_scope(&user)?;

    let record: Option<(String,)> = sqlx::query_as(
        "SELECT record_hash FROM maintenance_records WHERE id = ? AND company_id = ?"
    )
    .bind(req.record_id)
    .bind(company_id)
    .fetch_optional(&pool)
    .await?;

    let db_hash = record.map(|r| r.0).ok_or_else(|| AppError::NotFound("Maintenance record not found".to_string()))?;

    let matches = blockchain.verify_record_hash(req.record_id, &db_hash).await?;

    let match_status = if matches { "VALID" } else { "MISMATCH" };

    Ok(Json(BlockchainVerifyResponse {
        verified: matches,
        record_id: req.record_id,
        db_hash: db_hash.clone(),
        blockchain_hash: db_hash,
        match_status: match_status.to_string(),
    }))
}
