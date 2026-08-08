use crate::{
    db::DbPool,
    errors::AppError,
    middleware::auth::{require_role, AuthenticatedUser},
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
    require_role(&user, &[UserRole::Admin, UserRole::Manufacturer])?;
    let aircraft = ComponentService::create_aircraft(&pool, req).await?;
    Ok((StatusCode::CREATED, Json(aircraft)))
}

pub async fn list_aircraft(
    State(pool): State<DbPool>,
    _user: AuthenticatedUser,
) -> Result<Json<Vec<Aircraft>>, AppError> {
    let list = ComponentService::list_aircraft(&pool).await?;
    Ok(Json(list))
}

pub async fn get_aircraft(
    State(pool): State<DbPool>,
    _user: AuthenticatedUser,
    Path(id): Path<i64>,
) -> Result<Json<AircraftWithComponents>, AppError> {
    let aircraft = ComponentService::get_aircraft_by_id(&pool, id).await?;
    Ok(Json(aircraft))
}
