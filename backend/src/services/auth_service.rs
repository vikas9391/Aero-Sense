use crate::{
    config::Config,
    db::DbPool,
    errors::AppError,
    middleware::auth::create_jwt,
    models::{AuthResponse, CreateUserRequest, LoginRequest, User, UserResponse, UserRole},
};
use argon2::{
    password_hash::{rand_core::OsRng, SaltString},
    Argon2, PasswordHash, PasswordHasher, PasswordVerifier,
};

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

    /// Admin-only: create a new user with a chosen role, id (assigned by DB), and password.
    pub async fn create_user(pool: &DbPool, req: CreateUserRequest) -> Result<UserResponse, AppError> {
        let name = req.name.trim().to_string();
        let email = req.email.trim().to_lowercase();

        if name.is_empty() {
            return Err(AppError::ValidationError("Name is required".to_string()));
        }
        if email.is_empty() || !email.contains('@') {
            return Err(AppError::ValidationError("A valid email is required".to_string()));
        }
        if req.password.len() < 8 {
            return Err(AppError::ValidationError(
                "Password must be at least 8 characters".to_string(),
            ));
        }

        let role = UserRole::from_str(&req.role);

        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let password_hash = argon2
            .hash_password(req.password.as_bytes(), &salt)
            .map_err(|e| AppError::InternalServerError(format!("Password hashing error: {}", e)))?
            .to_string();

        let user_uuid = uuid::Uuid::new_v4().to_string();

        let res = sqlx::query(
            "INSERT INTO users (uuid, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
        )
        .bind(&user_uuid)
        .bind(&name)
        .bind(&email)
        .bind(&password_hash)
        .bind(role.as_str())
        .execute(pool)
        .await
        .map_err(|e| {
            if e.to_string().contains("UNIQUE constraint failed") {
                AppError::Conflict("A user with this email already exists".to_string())
            } else {
                AppError::DatabaseError(e)
            }
        })?;

        let id = res.last_insert_rowid();
        Self::get_user_by_id(pool, id).await
    }

    /// Admin-only: list all users with their ids and roles (password hashes never included).
    pub async fn list_users(pool: &DbPool) -> Result<Vec<UserResponse>, AppError> {
        let users: Vec<User> = sqlx::query_as("SELECT * FROM users ORDER BY id ASC")
            .fetch_all(pool)
            .await?;

        Ok(users.into_iter().map(UserResponse::from).collect())
    }
}
