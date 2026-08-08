use crate::{
    config::Config,
    db::DbPool,
    errors::AppError,
    middleware::auth::create_jwt,
    models::{AuthResponse, LoginRequest, User, UserResponse},
};
use argon2::{Argon2, PasswordHash, PasswordVerifier};

pub struct AuthService;

impl AuthService {
    pub async fn login(pool: &DbPool, config: &Config, req: LoginRequest) -> Result<AuthResponse, AppError> {
        let user: Option<User> = sqlx::query_as("SELECT * FROM users WHERE email = ?")
            .bind(&req.email)
            .fetch_optional(pool)
            .await?;

        let user = user.ok_or_else(|| {
            AppError::Unauthorized("Invalid email or password".to_string())
        })?;

        // Verify password hash
        let parsed_hash = PasswordHash::new(&user.password_hash)
            .map_err(|e| AppError::InternalServerError(format!("Invalid password hash format: {}", e)))?;

        Argon2::default()
            .verify_password(req.password.as_bytes(), &parsed_hash)
            .map_err(|_| AppError::Unauthorized("Invalid email or password".to_string()))?;

        // Generate JWT token (Role is determined by backend DB record)
        let token = create_jwt(
            user.id,
            &user.uuid,
            &user.name,
            &user.email,
            &user.role,
            &config.jwt_secret,
        )?;

        Ok(AuthResponse {
            success: true,
            token,
            user: UserResponse::from(user),
        })
    }

    pub async fn get_user_by_id(pool: &DbPool, user_id: i64) -> Result<UserResponse, AppError> {
        let user: User = sqlx::query_as("SELECT * FROM users WHERE id = ?")
            .bind(user_id)
            .fetch_optional(pool)
            .await?
            .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

        Ok(UserResponse::from(user))
    }
}
