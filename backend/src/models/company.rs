use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Company {
    pub id: i64,
    pub uuid: String,
    pub name: String,
    pub slug: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateCompanyRequest {
    pub name: String,
    /// Optional URL-friendly identifier. Auto-generated from `name` when omitted.
    pub slug: Option<String>,
}

/// A company plus a lightweight headcount/work snapshot — what the Super Admin sees
/// when browsing the tenant list.
#[derive(Debug, Serialize)]
pub struct CompanySummary {
    #[serde(flatten)]
    pub company: Company,
    pub user_count: i64,
    pub aircraft_count: i64,
    pub component_count: i64,
    pub maintenance_count: i64,
    pub verification_count: i64,
}

#[derive(Debug, Deserialize)]
pub struct CreateCompanyAdminRequest {
    pub name: String,
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, FromRow)]
pub struct MaintenanceResultCount {
    pub inspection_result: String,
    pub count: i64,
}

#[derive(Debug, Serialize, FromRow)]
pub struct UserWorkCount {
    pub user_id: i64,
    pub user_name: String,
    pub maintenance_count: i64,
}

/// Detailed "overall work" breakdown for a single company. Used both by the Super
/// Admin's oversight view and by a Company Admin's own dashboard.
#[derive(Debug, Serialize)]
pub struct WorkAnalytics {
    pub company_id: i64,
    pub total_users: i64,
    pub total_aircraft: i64,
    pub total_components: i64,
    pub total_maintenance_records: i64,
    pub total_verifications: i64,
    pub verifications_passed: i64,
    pub verifications_failed: i64,
    pub maintenance_by_result: Vec<MaintenanceResultCount>,
    pub records_by_user: Vec<UserWorkCount>,
}
