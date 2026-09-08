use crate::{
    db::DbPool,
    errors::AppError,
    middleware::auth::{require_company_scope, require_role, require_super_admin, AuthenticatedUser},
    models::{CreateUserRequest, UpdateUserStatusRequest, UserResponse, UserRole},
    services::AuthService,
};
use axum::{extract::{Path, State}, http::StatusCode, Json};

/// Company Admin creates a user inside their own company.
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

/// Company Admin lists accounts belonging to the caller's own company.
pub async fn list_users(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
) -> Result<Json<Vec<UserResponse>>, AppError> {
    require_role(&user, &[UserRole::CompanyAdmin])?;
    let company_id = require_company_scope(&user)?;
    let users = AuthService::list_users(&pool, company_id).await?;
    Ok(Json(users))
}

/// Profile/work summary for a manageable user. Super Admin can inspect any
/// tenant user; Company Admin is restricted to the same company.
pub async fn get_user_profile(
    State(pool): State<DbPool>,
    actor: AuthenticatedUser,
    Path(id): Path<i64>,
) -> Result<Json<crate::models::UserProfileResponse>, AppError> {
    let target = AuthService::get_user_by_id(&pool, id).await?;
    authorize_target(&actor, &target)?;
    Ok(Json(AuthService::get_user_profile(&pool, id).await?))
}

/// Suspend/reactivate/delete a user without destroying their work history.
/// "DELETED" is a soft-delete state so audit/maintenance records remain safe.
pub async fn update_user_status(
    State(pool): State<DbPool>,
    actor: AuthenticatedUser,
    Path(id): Path<i64>,
    Json(req): Json<UpdateUserStatusRequest>,
) -> Result<Json<UserResponse>, AppError> {
    let target = AuthService::get_user_by_id(&pool, id).await?;
    authorize_target(&actor, &target)?;
    if actor.0.sub == id {
        return Err(AppError::Forbidden("You cannot suspend or delete your own account.".to_string()));
    }
    if target.role == UserRole::SuperAdmin.as_str() {
        return Err(AppError::Forbidden("A platform super admin account cannot be managed from tenant user management.".to_string()));
    }
    Ok(Json(AuthService::update_user_status(&pool, id, &req.status).await?))
}

/// DELETE is exposed for the UI's "Delete account" action, but intentionally
/// performs a soft delete to preserve all historical work and foreign keys.
pub async fn delete_user(
    State(pool): State<DbPool>,
    actor: AuthenticatedUser,
    Path(id): Path<i64>,
) -> Result<Json<UserResponse>, AppError> {
    let target = AuthService::get_user_by_id(&pool, id).await?;
    authorize_target(&actor, &target)?;
    if actor.0.sub == id {
        return Err(AppError::Forbidden("You cannot delete your own account.".to_string()));
    }
    if target.role == UserRole::SuperAdmin.as_str() {
        return Err(AppError::Forbidden("A platform super admin account cannot be deleted from tenant user management.".to_string()));
    }
    Ok(Json(AuthService::update_user_status(&pool, id, "DELETED").await?))
}

fn authorize_target(actor: &AuthenticatedUser, target: &UserResponse) -> Result<(), AppError> {
    if actor.0.role == UserRole::SuperAdmin.as_str() {
        if target.company_id.is_none() {
            return Err(AppError::Forbidden("The platform super admin account is outside tenant user management.".to_string()));
        }
        require_super_admin(actor)?;
        return Ok(());
    }

    require_role(actor, &[UserRole::CompanyAdmin])?;
    let company_id = require_company_scope(actor)?;
    if target.company_id != Some(company_id) {
        return Err(AppError::Forbidden("You can only manage users in your own company.".to_string()));
    }
    Ok(())
}