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
/// so a brute-force attempt against one or many accounts gets throttled
/// before it can grind through Argon2 verification thousands of times.
///
/// Client IP prefers `X-Forwarded-For` (first hop) when present, since a
/// real deployment usually sits behind a reverse proxy; otherwise falls back
/// to the TCP peer address. `ConnectInfo` is optional here rather than a hard
/// requirement — if it's ever missing (e.g. a test harness that doesn't wire
/// up `into_make_service_with_connect_info`), we still rate-limit by email
/// alone rather than failing the request outright.
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
        Ok(auth_res) => {
            limiter.record_success(&rate_limit_key);
            Ok(Json(auth_res))
        }
        Err(e) => {
            limiter.record_failure(&rate_limit_key);
            Err(e)
        }
    }
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
