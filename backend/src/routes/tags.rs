use crate::{
    db::DbPool,
    errors::AppError,
    middleware::auth::{require_company_scope, require_role, AuthenticatedUser},
    models::{ComponentTag, RegisterTagRequest, UserRole},
    services::TagService,
};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};

pub async fn register_tag(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
    Json(req): Json<RegisterTagRequest>,
) -> Result<(StatusCode, Json<ComponentTag>), AppError> {
    require_role(&user, &[UserRole::Manufacturer])?;
    let company_id = require_company_scope(&user)?;
    let tag = TagService::register_tag(&pool, company_id, req).await?;
    Ok((StatusCode::CREATED, Json(tag)))
}

pub async fn get_tag(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
    Path(id): Path<i64>,
) -> Result<Json<ComponentTag>, AppError> {
    let company_id = require_company_scope(&user)?;
    let tag = TagService::get_tag_by_id(&pool, company_id, id).await?;
    Ok(Json(tag))
}
