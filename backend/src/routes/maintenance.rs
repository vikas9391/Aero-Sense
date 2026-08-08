use crate::{
    db::DbPool,
    errors::AppError,
    middleware::auth::{require_role, AuthenticatedUser},
    models::{CreateMaintenanceRequest, MaintenanceRecord, MaintenanceRecordResponse, UserRole},
    services::blockchain_service::BlockchainService,
};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Extension, Json,
};
use std::sync::Arc;

pub async fn create_maintenance(
    State(pool): State<DbPool>,
    Extension(blockchain): Extension<Arc<BlockchainService>>,
    user: AuthenticatedUser,
    Json(req): Json<CreateMaintenanceRequest>,
) -> Result<(StatusCode, Json<MaintenanceRecordResponse>), AppError> {
    require_role(&user, &[UserRole::MaintenanceTechnician, UserRole::Admin])?;

    // Verify component exists
    let comp_exists: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM components WHERE id = ?")
        .bind(req.component_id)
        .fetch_one(&pool)
        .await?;

    if comp_exists.0 == 0 {
        return Err(AppError::ComponentNotFound);
    }

    let created_at = chrono::Utc::now().to_rfc3339();

    // Compute cryptographic hash digest of the maintenance record
    let record_hash = blockchain.compute_record_hash(
        req.component_id,
        user.0.sub,
        &req.maintenance_type,
        &req.description,
        &req.inspection_result,
        &created_at,
    );

    let res = sqlx::query(
        "INSERT INTO maintenance_records 
         (component_id, technician_id, maintenance_type, description, parts_replaced, inspection_result, record_hash, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(req.component_id)
    .bind(user.0.sub)
    .bind(&req.maintenance_type)
    .bind(&req.description)
    .bind(&req.parts_replaced)
    .bind(&req.inspection_result)
    .bind(&record_hash)
    .bind(&created_at)
    .execute(&pool)
    .await?;

    let record_id = res.last_insert_rowid();

    // Store hash proof on Blockchain
    blockchain.store_record_hash(record_id, record_hash.clone()).await?;

    let tech_name = user.0.name.clone();

    Ok((
        StatusCode::CREATED,
        Json(MaintenanceRecordResponse {
            id: record_id,
            component_id: req.component_id,
            technician_id: user.0.sub,
            technician_name: tech_name,
            maintenance_type: req.maintenance_type,
            description: req.description,
            parts_replaced: req.parts_replaced,
            inspection_result: req.inspection_result,
            record_hash,
            created_at,
        }),
    ))
}

pub async fn get_component_history(
    State(pool): State<DbPool>,
    _user: AuthenticatedUser,
    Path(component_id): Path<i64>,
) -> Result<Json<Vec<MaintenanceRecordResponse>>, AppError> {
    let records: Vec<MaintenanceRecord> = sqlx::query_as(
        "SELECT * FROM maintenance_records WHERE component_id = ? ORDER BY id DESC"
    )
    .bind(component_id)
    .fetch_all(&pool)
    .await?;

    let mut responses = Vec::new();
    for r in records {
        let tech_name: Option<(String,)> = sqlx::query_as("SELECT name FROM users WHERE id = ?")
            .bind(r.technician_id)
            .fetch_optional(&pool)
            .await?;

        responses.push(MaintenanceRecordResponse {
            id: r.id,
            component_id: r.component_id,
            technician_id: r.technician_id,
            technician_name: tech_name.map(|t| t.0).unwrap_or_else(|| "Unknown Tech".to_string()),
            maintenance_type: r.maintenance_type,
            description: r.description,
            parts_replaced: r.parts_replaced,
            inspection_result: r.inspection_result,
            record_hash: r.record_hash,
            created_at: r.created_at,
        });
    }

    Ok(Json(responses))
}
