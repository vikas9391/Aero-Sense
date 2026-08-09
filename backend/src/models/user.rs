use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum UserRole {
    /// Platform owner. Not part of any company (`company_id` is always `None`).
    /// Can create companies and provision each company's first admin, but has
    /// no access to any company's operational data.
    SuperAdmin,
    /// Owns and manages a single company: adds/removes that company's own
    /// admins and employees, and sees that company's full work analytics.
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

    pub fn from_str(s: &str) -> Self {
        match s.to_uppercase().as_str() {
            "SUPER_ADMIN" | "SUPERADMIN" => UserRole::SuperAdmin,
            // "ADMIN" kept as a legacy alias so any pre-existing accounts/tokens
            // still resolve to the equivalent modern role.
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
    /// `None` only for the platform Super Admin. Every other user belongs to
    /// exactly one company and every query is scoped by this value.
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
    /// The company the account belongs to. Must be exactly "Super Admin" for
    /// the platform Super Admin, or the exact company name for everyone else.
    /// This is only ever used to *validate* against the server-side record —
    /// the account's real `company_id`/role always come from the database,
    /// never from this field.
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
