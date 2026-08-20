use crate::{
    db::DbPool,
    errors::AppError,
    middleware::auth::{require_super_admin, AuthenticatedUser},
    models::{
        Company, CompanySummary, CreateCompanyAdminRequest, CreateCompanyRequest, UserResponse,
        UpdateCompanyStatusRequest, WorkAnalytics,
    },
    services::CompanyService,
};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};

/// POST /api/companies — Super Admin only. Onboards a new company onto the platform.
pub async fn create_company(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
    Json(req): Json<CreateCompanyRequest>,
) -> Result<(StatusCode, Json<Company>), AppError> {
    require_super_admin(&user)?;
    let company = CompanyService::create_company(&pool, req).await?;
    Ok((StatusCode::CREATED, Json(company)))
}

/// GET /api/companies — Super Admin only. Every company plus a work snapshot.
pub async fn list_companies(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
) -> Result<Json<Vec<CompanySummary>>, AppError> {
    require_super_admin(&user)?;
    let companies = CompanyService::list_companies_with_stats(&pool).await?;
    Ok(Json(companies))
}

/// GET /api/companies/:id — Super Admin only.
pub async fn get_company(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
    Path(id): Path<i64>,
) -> Result<Json<CompanySummary>, AppError> {
    require_super_admin(&user)?;
    let company = CompanyService::get_company_with_stats(&pool, id).await?;
    Ok(Json(company))
}

/// GET /api/companies/:id/analytics — Super Admin only. Detailed "overall work"
/// breakdown for oversight purposes (counts and pass/fail rates — not raw
/// maintenance record contents).
pub async fn get_company_analytics(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
    Path(id): Path<i64>,
) -> Result<Json<WorkAnalytics>, AppError> {
    require_super_admin(&user)?;
    let analytics = CompanyService::get_work_analytics(&pool, id).await?;
    Ok(Json(analytics))
}

/// POST /api/companies/:id/admins — Super Admin only. Provisions that company's
/// own admin account, who then manages their company's people independently —
/// the super admin never needs (or gets) further access into the company.
pub async fn create_company_admin(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
    Path(id): Path<i64>,
    Json(req): Json<CreateCompanyAdminRequest>,
) -> Result<(StatusCode, Json<UserResponse>), AppError> {
    require_super_admin(&user)?;
    let admin = CompanyService::create_company_admin(&pool, id, req).await?;
    Ok((StatusCode::CREATED, Json(admin)))
}

/// GET /api/companies/:id/users — Super Admin only. Every account belonging
/// to this one company, including name/email/role, for the tenant-detail
/// view. Still fully scoped to the single `:id` in the path — never a
/// cross-company listing.
pub async fn list_company_users(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
    Path(id): Path<i64>,
) -> Result<Json<Vec<UserResponse>>, AppError> {
    require_super_admin(&user)?;
    let users = CompanyService::list_company_users(&pool, id).await?;
    Ok(Json(users))
}

/// PUT /api/companies/:id/status — Super Admin only. Subscription/access
/// management: suspend a tenant (blocks that company's users from logging
/// in) or reactivate it. Never touches the company's users or operational
/// records.
pub async fn update_company_status(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
    Path(id): Path<i64>,
    Json(req): Json<UpdateCompanyStatusRequest>,
) -> Result<Json<Company>, AppError> {
    require_super_admin(&user)?;
    let company = CompanyService::update_company_status(&pool, id, &req.status).await?;
    Ok(Json(company))
}
