use crate::{config::Config, errors::AppError, models::UserRole};
use axum::{
    extract::FromRequestParts,
    http::{header, request::Parts, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: i64,       // User ID
    pub uuid: String,
    pub name: String,
    pub email: String,
    pub role: String,
    /// Tenant the user belongs to. `None` only for the platform Super Admin.
    /// This is the single source of truth used to scope every company-data
    /// query — it comes from the signed token, never from client input.
    pub company_id: Option<i64>,
    pub exp: usize,
}

#[allow(clippy::too_many_arguments)]
pub fn create_jwt(
    user_id: i64,
    uuid: &str,
    name: &str,
    email: &str,
    role: &str,
    company_id: Option<i64>,
    secret: &str,
) -> Result<String, AppError> {
    let expiration = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::hours(24))
        .expect("valid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        sub: user_id,
        uuid: uuid.to_string(),
        name: name.to_string(),
        email: email.to_string(),
        role: role.to_string(),
        company_id,
        exp: expiration,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| AppError::InternalServerError(format!("Token creation error: {}", e)))
}

pub struct AuthenticatedUser(pub Claims);

#[axum::async_trait]
impl<S> FromRequestParts<S> for AuthenticatedUser
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get(header::AUTHORIZATION)
            .and_then(|val| val.to_str().ok())
            .ok_or_else(|| AppError::Unauthorized("Missing Authorization header".to_string()))?;

        if !auth_header.starts_with("Bearer ") {
            return Err(AppError::Unauthorized(
                "Invalid Authorization header scheme. Expected Bearer token".to_string(),
            ));
        }

        let token = &auth_header[7..];
        let config = Config::from_env();

        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(config.jwt_secret.as_bytes()),
            &Validation::default(),
        )
        .map_err(|_| AppError::Unauthorized("Invalid or expired authentication token".to_string()))?;

        Ok(AuthenticatedUser(token_data.claims))
    }
}

/// Role check for company-scoped operations. `CompanyAdmin` always passes (an
/// admin can do anything inside their own company), matching every other role's
/// explicit allow-list otherwise. The Super Admin is deliberately **not** given
/// a blanket pass here — company operational routes additionally call
/// `require_company_scope`, which rejects the Super Admin outright since it has
/// no `company_id` to scope against.
pub fn require_role(user: &AuthenticatedUser, allowed_roles: &[UserRole]) -> Result<(), AppError> {
    let user_role = UserRole::from_str(&user.0.role);
    if allowed_roles.contains(&user_role) || user_role == UserRole::CompanyAdmin {
        Ok(())
    } else {
        Err(AppError::Forbidden(format!(
            "Role '{}' is not authorized to perform this operation",
            user.0.role
        )))
    }
}

/// Restricts an endpoint to the platform Super Admin only (company/tenant
/// management: creating companies and their first admin).
pub fn require_super_admin(user: &AuthenticatedUser) -> Result<(), AppError> {
    let user_role = UserRole::from_str(&user.0.role);
    if user_role == UserRole::SuperAdmin {
        Ok(())
    } else {
        Err(AppError::Forbidden(
            "Only the platform super admin can perform this operation".to_string(),
        ))
    }
}

/// Returns the caller's own `company_id`, or `403 Forbidden` if they don't have
/// one. Every handler that reads or writes company-owned data (aircraft,
/// components, tags, maintenance, verification, user management) must call
/// this and bind the returned id into its SQL — never trust a `company_id`
/// supplied by the client. This is also what keeps the Super Admin (who has no
/// company) out of every company's operational data by construction.
pub fn require_company_scope(user: &AuthenticatedUser) -> Result<i64, AppError> {
    user.0.company_id.ok_or_else(|| {
        AppError::Forbidden(
            "This account is not associated with a company and cannot access company data"
                .to_string(),
        )
    })
}
