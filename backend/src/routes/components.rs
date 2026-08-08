use crate::{
    db::DbPool,
    errors::AppError,
    middleware::auth::{require_role, AuthenticatedUser},
    models::{ComponentResponse, CreateComponentRequest, UserRole},
    services::ComponentService,
};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};

pub async fn create_component(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
    Json(req): Json<CreateComponentRequest>,
) -> Result<(StatusCode, Json<ComponentResponse>), AppError> {
    require_role(&user, &[UserRole::Admin, UserRole::Manufacturer])?;
    let component = ComponentService::create_component(&pool, req).await?;
    Ok((StatusCode::CREATED, Json(component)))
}

pub async fn list_components(
    State(pool): State<DbPool>,
    _user: AuthenticatedUser,
) -> Result<Json<Vec<ComponentResponse>>, AppError> {
    let list = ComponentService::list_components(&pool).await?;
    Ok(Json(list))
}

pub async fn get_component(
    State(pool): State<DbPool>,
    _user: AuthenticatedUser,
    Path(id): Path<i64>,
) -> Result<Json<ComponentResponse>, AppError> {
    let component = ComponentService::get_component_by_id(&pool, id).await?;
    Ok(Json(component))
}
