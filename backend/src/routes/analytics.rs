use crate::{
    db::DbPool,
    errors::AppError,
    middleware::auth::{require_company_scope, require_role, AuthenticatedUser},
    models::{UserRole, WorkAnalytics},
    services::CompanyService,
};
use axum::{extract::State, Json};

/// GET /api/analytics/overview — Company Admin only. "Analysis of overall work"
/// for the caller's own company: headcount, fleet/component counts, maintenance
/// activity by result, verification pass/fail rates, and per-user output.
pub async fn get_overview(
    State(pool): State<DbPool>,
    user: AuthenticatedUser,
) -> Result<Json<WorkAnalytics>, AppError> {
    require_role(&user, &[UserRole::CompanyAdmin])?;
    let company_id = require_company_scope(&user)?;
    let analytics = CompanyService::get_work_analytics(&pool, company_id).await?;
    Ok(Json(analytics))
}
