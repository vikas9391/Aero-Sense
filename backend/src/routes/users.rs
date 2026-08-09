use crate::{
    db::DbPool,
    errors::AppError,
    middleware::auth::{require_company_scope, require_role, AuthenticatedUser},
    models::{CreateUserRequest, UserResponse, UserRole},
    services::AuthService,
};
use axum::{extract::State, http::StatusCode, Json};

/// POST /api/users — Company Admin only. Creates a new user *inside the caller's
/// own company*. The company is always taken from the admin's authenticated
/// session, never from the request body, so a company admin can never place a
/// user into another company's tenant.
pub async fn create_user(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
    Json(req): Json<CreateUserRequest>,
) -> Result<(StatusCode, Json<UserResponse>), AppError> {
    require_role(&user, &[UserRole::CompanyAdmin])?;
    let company_id = require_company_scope(&user)?;
    let created = AuthService::create_user(&pool, company_id, req).await?;
    Ok((StatusCode::CREATED, Json(created)))
}

/// GET /api/users — Company Admin only. Lists accounts belonging to the
/// caller's own company (never another tenant's).
pub async fn list_users(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
) -> Result<Json<Vec<UserResponse>>, AppError> {
    require_role(&user, &[UserRole::CompanyAdmin])?;
    let company_id = require_company_scope(&user)?;
    let users = AuthService::list_users(&pool, company_id).await?;
    Ok(Json(users))
}
