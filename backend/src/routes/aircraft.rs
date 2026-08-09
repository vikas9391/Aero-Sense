use crate::{
    db::DbPool,
    errors::AppError,
    middleware::auth::{require_company_scope, require_role, AuthenticatedUser},
    models::{Aircraft, AircraftWithComponents, CreateAircraftRequest, UserRole},
    services::ComponentService,
};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};

pub async fn create_aircraft(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
    Json(req): Json<CreateAircraftRequest>,
) -> Result<(StatusCode, Json<Aircraft>), AppError> {
    require_role(&user, &[UserRole::Manufacturer])?;
    let company_id = require_company_scope(&user)?;
    let aircraft = ComponentService::create_aircraft(&pool, company_id, req).await?;
    Ok((StatusCode::CREATED, Json(aircraft)))
}

pub async fn list_aircraft(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
) -> Result<Json<Vec<Aircraft>>, AppError> {
    let company_id = require_company_scope(&user)?;
    let list = ComponentService::list_aircraft(&pool, company_id).await?;
    Ok(Json(list))
}

pub async fn get_aircraft(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
    Path(id): Path<i64>,
) -> Result<Json<AircraftWithComponents>, AppError> {
    let company_id = require_company_scope(&user)?;
    let aircraft = ComponentService::get_aircraft_by_id(&pool, company_id, id).await?;
    Ok(Json(aircraft))
}
