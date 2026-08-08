use crate::{
    config::Config,
    db::DbPool,
    errors::AppError,
    middleware::auth::AuthenticatedUser,
    models::{AuthResponse, LoginRequest, UserResponse},
    services::AuthService,
};
use axum::{extract::State, Extension, Json};
use std::sync::Arc;

pub async fn login(
    State(pool): State<DbPool>,
    Extension(config): Extension<Arc<Config>>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    let auth_res = AuthService::login(&pool, &config, req).await?;
    Ok(Json(auth_res))
}

pub async fn get_me(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
) -> Result<Json<UserResponse>, AppError> {
    let user_info = AuthService::get_user_by_id(&pool, user.0.sub).await?;
    Ok(Json(user_info))
}
