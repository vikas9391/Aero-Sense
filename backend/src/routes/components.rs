use crate::{
    db::DbPool,
    errors::AppError,
    middleware::auth::{require_company_scope, require_role, AuthenticatedUser},
    models::{ComponentResponse, ComponentUpdateHistory, CreateComponentRequest, UpdateComponentRequest, UserRole},
    services::ComponentService,
};
use axum::{extract::{Path, State}, http::StatusCode, Json};

pub async fn create_component(State(pool): State<DbPool>, user: AuthenticatedUser, Json(req): Json<CreateComponentRequest>) -> Result<(StatusCode, Json<ComponentResponse>), AppError> {
    require_role(&user, &[UserRole::CompanyAdmin, UserRole::Manufacturer])?;
    let company_id = require_company_scope(&user)?;
    let component = ComponentService::create_component(&pool, company_id, req).await?;
    Ok((StatusCode::CREATED, Json(component)))
}

pub async fn list_components(State(pool): State<DbPool>, user: AuthenticatedUser) -> Result<Json<Vec<ComponentResponse>>, AppError> {
    let company_id = require_company_scope(&user)?;
    Ok(Json(ComponentService::list_components(&pool, company_id).await?))
}

pub async fn get_component(State(pool): State<DbPool>, user: AuthenticatedUser, Path(id): Path<i64>) -> Result<Json<ComponentResponse>, AppError> {
    let company_id = require_company_scope(&user)?;
    Ok(Json(ComponentService::get_component_by_id(&pool, company_id, id).await?))
}

pub async fn update_component(State(pool): State<DbPool>, user: AuthenticatedUser, Path(id): Path<i64>, Json(req): Json<UpdateComponentRequest>) -> Result<Json<ComponentResponse>, AppError> {
    require_role(&user, &[UserRole::CompanyAdmin, UserRole::Manufacturer])?;
    let company_id = require_company_scope(&user)?;
    Ok(Json(ComponentService::update_component(&pool, company_id, user.0.sub, id, req).await?))
}

pub async fn get_component_update_history(State(pool): State<DbPool>, user: AuthenticatedUser, Path(id): Path<i64>) -> Result<Json<Vec<ComponentUpdateHistory>>, AppError> {
    let company_id = require_company_scope(&user)?;
    Ok(Json(ComponentService::update_history(&pool, company_id, id).await?))
}
