use crate::{
    config::Config,
    db::DbPool,
    errors::AppError,
    middleware::auth::create_jwt,
    models::{AuthResponse, ChangePasswordRequest, Company, CreateUserRequest, LoginRequest, User, UserResponse, UserRole},
};
use argon2::{
    password_hash::{rand_core::OsRng, SaltString},
    Argon2, PasswordHash, PasswordHasher, PasswordVerifier,
};

pub const SUPER_ADMIN_COMPANY_NAME: &str = "Super Admin";

pub struct AuthService;

impl AuthService {
    pub async fn login(pool: &DbPool, config: &Config, req: LoginRequest) -> Result<AuthResponse, AppError> {
        let company_name = req.company_name.trim();
        let email = req.email.trim().to_lowercase();
        if company_name.is_empty() { return Err(AppError::ValidationError("Company name is required".to_string())); }
        if email.is_empty() { return Err(AppError::ValidationError("Email is required".to_string())); }
        let invalid = || AppError::Unauthorized("Invalid company name, email, or password".to_string());

        let user: Option<User> = sqlx::query_as("SELECT * FROM users WHERE email = $1")
            .bind(&email).fetch_optional(pool).await?;
        let user = user.ok_or_else(invalid)?;

        match user.company_id {
            None => {
                if !company_name.eq_ignore_ascii_case(SUPER_ADMIN_COMPANY_NAME) { return Err(invalid()); }
            }
            Some(company_id) => {
                let company: Option<Company> = sqlx::query_as("SELECT * FROM companies WHERE id = $1")
                    .bind(company_id).fetch_optional(pool).await?;
                let company = company.ok_or_else(invalid)?;
                if !company.name.eq_ignore_ascii_case(company_name) { return Err(invalid()); }
                if company.status != "ACTIVE" {
                    return Err(AppError::Forbidden("This company's access has been suspended. Contact the platform administrator.".to_string()));
                }
            }
        }

        let parsed_hash = PasswordHash::new(&user.password_hash)
            .map_err(|e| AppError::InternalServerError(format!("Invalid password hash format: {}", e)))?;
        Argon2::default().verify_password(req.password.as_bytes(), &parsed_hash).map_err(|_| invalid())?;

        let token = create_jwt(user.id, &user.uuid, &user.name, &user.email, &user.role, user.company_id, &config.jwt_secret)?;
        Ok(AuthResponse { success: true, token, user: UserResponse::from(user) })
    }

    pub async fn get_user_by_id(pool: &DbPool, user_id: i64) -> Result<UserResponse, AppError> {
        let user: User = sqlx::query_as("SELECT * FROM users WHERE id = $1")
            .bind(user_id).fetch_optional(pool).await?
            .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;
        Ok(UserResponse::from(user))
    }

    pub async fn create_user(pool: &DbPool, company_id: i64, req: CreateUserRequest) -> Result<UserResponse, AppError> {
        let name = req.name.trim().to_string();
        let email = req.email.trim().to_lowercase();
        if name.is_empty() { return Err(AppError::ValidationError("Name is required".to_string())); }
        if email.is_empty() || !email.contains('@') { return Err(AppError::ValidationError("A valid email is required".to_string())); }
        if req.password.len() < 8 { return Err(AppError::ValidationError("Password must be at least 8 characters".to_string())); }
        let role = UserRole::from_str(&req.role);
        if role == UserRole::SuperAdmin { return Err(AppError::Forbidden("Company admins cannot create super admin accounts".to_string())); }
        Self::insert_user(pool, Some(company_id), &name, &email, &req.password, role).await
    }

    pub(crate) async fn insert_user(pool: &DbPool, company_id: Option<i64>, name: &str, email: &str, password: &str, role: UserRole) -> Result<UserResponse, AppError> {
        let salt = SaltString::generate(&mut OsRng);
        let password_hash = Argon2::default().hash_password(password.as_bytes(), &salt)
            .map_err(|e| AppError::InternalServerError(format!("Password hashing error: {}", e)))?.to_string();
        let user_uuid = uuid::Uuid::new_v4().to_string();

        let (id,): (i64,) = sqlx::query_as(
            "INSERT INTO users (uuid, name, email, password_hash, role, company_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id"
        )
        .bind(&user_uuid).bind(name).bind(email).bind(&password_hash).bind(role.as_str()).bind(company_id)
        .fetch_one(pool).await.map_err(|e| {
            if let sqlx::Error::Database(db) = &e {
                if db.code().as_deref() == Some("23505") { return AppError::Conflict("A user with this email already exists".to_string()); }
            }
            AppError::DatabaseError(e)
        })?;
        Self::get_user_by_id(pool, id).await
    }

    pub async fn change_password(pool: &DbPool, user_id: i64, req: ChangePasswordRequest) -> Result<UserResponse, AppError> {
        if req.new_password.len() < 8 { return Err(AppError::ValidationError("New password must be at least 8 characters".to_string())); }
        let user: User = sqlx::query_as("SELECT * FROM users WHERE id = $1")
            .bind(user_id).fetch_optional(pool).await?
            .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;
        let parsed_hash = PasswordHash::new(&user.password_hash)
            .map_err(|e| AppError::InternalServerError(format!("Invalid password hash format: {}", e)))?;
        Argon2::default().verify_password(req.current_password.as_bytes(), &parsed_hash)
            .map_err(|_| AppError::Unauthorized("Current password is incorrect".to_string()))?;
        let salt = SaltString::generate(&mut OsRng);
        let new_hash = Argon2::default().hash_password(req.new_password.as_bytes(), &salt)
            .map_err(|e| AppError::InternalServerError(format!("Password hashing error: {}", e)))?.to_string();
        sqlx::query("UPDATE users SET password_hash = $1 WHERE id = $2")
            .bind(&new_hash).bind(user_id).execute(pool).await?;
        Self::get_user_by_id(pool, user_id).await
    }

    pub async fn list_users(pool: &DbPool, company_id: i64) -> Result<Vec<UserResponse>, AppError> {
        let users: Vec<User> = sqlx::query_as("SELECT * FROM users WHERE company_id = $1 ORDER BY id ASC")
            .bind(company_id).fetch_all(pool).await?;
        Ok(users.into_iter().map(UserResponse::from).collect())
    }
}
