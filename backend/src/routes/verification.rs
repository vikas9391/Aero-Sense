use crate::{
    db::DbPool,
    errors::AppError,
    middleware::auth::{require_company_scope, AuthenticatedUser},
    models::{
        BlockchainVerifyRequest, BlockchainVerifyResponse, NfcVerificationRequest, VerificationLog,
        VerificationResponse,
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
    user: AuthenticatedUser,
    Json(req): Json<NfcVerificationRequest>,
) -> Result<Json<VerificationResponse>, AppError> {
    let company_id = require_company_scope(&user)?;
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
