use crate::{
    db::DbPool,
    errors::AppError,
    middleware::auth::{require_role, AuthenticatedUser},
    models::{CreateUserRequest, UserResponse, UserRole},
    services::AuthService,
};
use axum::{extract::State, http::StatusCode, Json};

/// POST /api/users — Admin only. Creates a new user with any role, id (auto-assigned),
/// and password chosen by the admin.
pub async fn create_user(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
    Json(req): Json<CreateUserRequest>,
) -> Result<(StatusCode, Json<UserResponse>), AppError> {
    require_role(&user, &[UserRole::Admin])?;
    let created = AuthService::create_user(&pool, req).await?;
    Ok((StatusCode::CREATED, Json(created)))
}

/// GET /api/users — Admin only. Lists all users with their ids, emails, and roles.
pub async fn list_users(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
) -> Result<Json<Vec<UserResponse>>, AppError> {
    require_role(&user, &[UserRole::Admin])?;
    let users = AuthService::list_users(&pool).await?;
    Ok(Json(users))
}
