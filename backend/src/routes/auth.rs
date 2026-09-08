use crate::{
    config::Config,
    db::DbPool,
    errors::AppError,
    middleware::auth::AuthenticatedUser,
    middleware::LoginRateLimiter,
    models::{AuthResponse, ChangePasswordRequest, LoginRequest, UserResponse},
    services::AuthService,
};
use axum::{
    extract::{ConnectInfo, State},
    http::HeaderMap,
    Extension, Json,
};
use std::net::SocketAddr;
use std::sync::Arc;

/// POST /api/auth/login — rate limited per `ip:email` (see `LoginRateLimiter`)
pub async fn login(
    State(pool): State<DbPool>,
    Extension(config): Extension<Arc<Config>>,
    Extension(limiter): Extension<LoginRateLimiter>,
    connect_info: Option<ConnectInfo<SocketAddr>>,
    headers: HeaderMap,
    Json(req): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    let client_ip = headers
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.split(',').next())
        .map(|s| s.trim().to_string())
        .or_else(|| connect_info.map(|ConnectInfo(addr)| addr.ip().to_string()))
        .unwrap_or_else(|| "unknown".to_string());

    let rate_limit_key = format!("{}:{}", client_ip, req.email.trim().to_lowercase());
    limiter.check(&rate_limit_key)?;

    match AuthService::login(&pool, &config, req).await {
        Ok(auth_res) => { limiter.record_success(&rate_limit_key); Ok(Json(auth_res)) }
        Err(e) => { limiter.record_failure(&rate_limit_key); Err(e) }
    }
}

/// POST /api/auth/demo-super-admin — temporary hackathon convenience login.
/// The actual credential remains server-side in SUPER_ADMIN_EMAIL/PASSWORD.
/// This route is disabled unless ALLOW_DEMO_SUPER_ADMIN_LOGIN=true.
pub async fn demo_super_admin_login(
    State(pool): State<DbPool>,
    Extension(config): Extension<Arc<Config>>,
    Extension(limiter): Extension<LoginRateLimiter>,
    connect_info: Option<ConnectInfo<SocketAddr>>,
    headers: HeaderMap,
) -> Result<Json<AuthResponse>, AppError> {
    if !config.allow_demo_super_admin_login {
        return Err(AppError::NotFound("Demo login is disabled".to_string()));
    }

    let client_ip = headers
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.split(',').next())
        .map(|s| s.trim().to_string())
        .or_else(|| connect_info.map(|ConnectInfo(addr)| addr.ip().to_string()))
        .unwrap_or_else(|| "unknown".to_string());
    let rate_limit_key = format!("{}:demo-super-admin", client_ip);
    limiter.check(&rate_limit_key)?;

    let req = LoginRequest {
        company_name: crate::services::auth_service::SUPER_ADMIN_COMPANY_NAME.to_string(),
        email: config.super_admin_email.clone(),
        password: config.super_admin_password.clone(),
    };

    match AuthService::login(&pool, &config, req).await {
        Ok(auth_res) => { limiter.record_success(&rate_limit_key); Ok(Json(auth_res)) }
        Err(e) => { limiter.record_failure(&rate_limit_key); Err(e) }
    }
}

pub async fn get_me(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
) -> Result<Json<UserResponse>, AppError> {
    let user_info = AuthService::get_user_by_id(&pool, user.0.sub).await?;
    Ok(Json(user_info))
}

pub async fn change_password(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
    Json(req): Json<ChangePasswordRequest>,
) -> Result<Json<UserResponse>, AppError> {
    let updated = AuthService::change_password(&pool, user.0.sub, req).await?;
    Ok(Json(updated))
}
