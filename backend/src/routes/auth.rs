use crate::{
    config::Config,
    db::DbPool,
    errors::AppError,
    middleware::auth::AuthenticatedUser,
    models::{AuthResponse, ChangePasswordRequest, LoginRequest, UserResponse},
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

/// PUT /api/auth/change-password — any authenticated user changes their own
/// password. Requires the current password to be resupplied and re-verified;
/// the target account always comes from the caller's own session.
pub async fn change_password(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
    Json(req): Json<ChangePasswordRequest>,
) -> Result<Json<UserResponse>, AppError> {
    let updated = AuthService::change_password(&pool, user.0.sub, req).await?;
    Ok(Json(updated))
}
