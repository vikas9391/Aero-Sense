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
    pub exp: usize,
}

pub fn create_jwt(
    user_id: i64,
    uuid: &str,
    name: &str,
    email: &str,
    role: &str,
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

pub fn require_role(user: &AuthenticatedUser, allowed_roles: &[UserRole]) -> Result<(), AppError> {
    let user_role = UserRole::from_str(&user.0.role);
    if allowed_roles.contains(&user_role) || user_role == UserRole::Admin {
        Ok(())
    } else {
        Err(AppError::Forbidden(format!(
            "Role '{}' is not authorized to perform this operation",
            user.0.role
        )))
    }
}
