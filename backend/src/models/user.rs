use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum UserRole {
    SuperAdmin,
    CompanyAdmin,
    Manufacturer,
    MaintenanceTechnician,
    Inspector,
    Viewer,
}

impl UserRole {
    pub fn as_str(&self) -> &'static str {
        match self {
            UserRole::SuperAdmin => "SUPER_ADMIN",
            UserRole::CompanyAdmin => "COMPANY_ADMIN",
            UserRole::Manufacturer => "MANUFACTURER",
            UserRole::MaintenanceTechnician => "MAINTENANCE_TECHNICIAN",
            UserRole::Inspector => "INSPECTOR",
            UserRole::Viewer => "VIEWER",
        }
    }

    #[allow(clippy::should_implement_trait)]
    pub fn from_str(s: &str) -> Self {
        match s.to_uppercase().as_str() {
            "SUPER_ADMIN" | "SUPERADMIN" => UserRole::SuperAdmin,
            "COMPANY_ADMIN" | "ADMIN" => UserRole::CompanyAdmin,
            "MANUFACTURER" => UserRole::Manufacturer,
            "MAINTENANCE_TECHNICIAN" | "TECHNICIAN" => UserRole::MaintenanceTechnician,
            "INSPECTOR" => UserRole::Inspector,
            _ => UserRole::Viewer,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: i64,
    pub uuid: String,
    pub name: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub role: String,
    pub company_id: Option<i64>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: i64,
    pub uuid: String,
    pub name: String,
    pub email: String,
    pub role: String,
    pub company_id: Option<i64>,
    pub created_at: String,
}

impl From<User> for UserResponse {
    fn from(u: User) -> Self {
        Self {
            id: u.id,
            uuid: u.uuid,
            name: u.name,
            email: u.email,
            role: u.role,
            company_id: u.company_id,
            created_at: u.created_at,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub company_name: String,
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub success: bool,
    pub token: String,
    pub user: UserResponse,
}

#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub name: String,
    pub email: String,
    pub password: String,
    pub role: String,
}

#[derive(Debug, Deserialize)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}
