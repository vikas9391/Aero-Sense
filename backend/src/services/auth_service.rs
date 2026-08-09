use crate::{
    config::Config,
    db::DbPool,
    errors::AppError,
    middleware::auth::create_jwt,
    models::{AuthResponse, Company, CreateUserRequest, LoginRequest, User, UserResponse, UserRole},
};
use argon2::{
    password_hash::{rand_core::OsRng, SaltString},
    Argon2, PasswordHash, PasswordHasher, PasswordVerifier,
};

/// The fixed "company name" value the platform Super Admin must submit at
/// login (it has no real company). Matched case-insensitively.
pub const SUPER_ADMIN_COMPANY_NAME: &str = "Super Admin";

pub struct AuthService;

impl AuthService {
    pub async fn login(pool: &DbPool, config: &Config, req: LoginRequest) -> Result<AuthResponse, AppError> {
        let company_name = req.company_name.trim();
        let email = req.email.trim().to_lowercase();

        if company_name.is_empty() {
            return Err(AppError::ValidationError("Company name is required".to_string()));
        }
        if email.is_empty() {
            return Err(AppError::ValidationError("Email is required".to_string()));
        }

        // Deliberately generic error for every failure branch below (unknown
        // email, wrong company name, wrong password) so a bad actor can't use
        // the response to enumerate which part of the triple was wrong.
        let invalid = || AppError::Unauthorized("Invalid company name, email, or password".to_string());

        let user: Option<User> = sqlx::query_as("SELECT * FROM users WHERE email = ?")
            .bind(&email)
            .fetch_optional(pool)
            .await?;

        let user = user.ok_or_else(invalid)?;

        // Validate the submitted company name against the account's real,
        // server-side company — this is a credential check, not a selector.
        // The role/company_id actually used for the session always come from
        // `user` (the DB row), never from the request.
        match user.company_id {
            None => {
                if !company_name.eq_ignore_ascii_case(SUPER_ADMIN_COMPANY_NAME) {
                    return Err(invalid());
                }
            }
            Some(company_id) => {
                let company: Option<Company> = sqlx::query_as("SELECT * FROM companies WHERE id = ?")
                    .bind(company_id)
                    .fetch_optional(pool)
                    .await?;
                let company = company.ok_or_else(invalid)?;
                if !company.name.eq_ignore_ascii_case(company_name) {
                    return Err(invalid());
                }
            }
        }

        // Verify password hash
        let parsed_hash = PasswordHash::new(&user.password_hash)
            .map_err(|e| AppError::InternalServerError(format!("Invalid password hash format: {}", e)))?;

        Argon2::default()
            .verify_password(req.password.as_bytes(), &parsed_hash)
            .map_err(|_| invalid())?;

        // Generate JWT token (role + tenant are determined solely by the backend DB record)
        let token = create_jwt(
            user.id,
            &user.uuid,
            &user.name,
            &user.email,
            &user.role,
            user.company_id,
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

    /// Company Admin only: create a new user *inside the caller's own company*.
    /// `company_id` must come from the authenticated admin's session — never
    /// from the request body — so an admin can never place an account into a
    /// company that isn't theirs.
    pub async fn create_user(pool: &DbPool, company_id: i64, req: CreateUserRequest) -> Result<UserResponse, AppError> {
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
        if role == UserRole::SuperAdmin {
            return Err(AppError::Forbidden(
                "Company admins cannot create super admin accounts".to_string(),
            ));
        }

        Self::insert_user(pool, Some(company_id), &name, &email, &req.password, role).await
    }

    /// Shared insert path used by both company-scoped user creation and the
    /// Super Admin's company-admin provisioning (see `CompanyService`).
    /// `company_id` is `None` only when seeding the platform Super Admin itself.
    pub(crate) async fn insert_user(
        pool: &DbPool,
        company_id: Option<i64>,
        name: &str,
        email: &str,
        password: &str,
        role: UserRole,
    ) -> Result<UserResponse, AppError> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt)
            .map_err(|e| AppError::InternalServerError(format!("Password hashing error: {}", e)))?
            .to_string();

        let user_uuid = uuid::Uuid::new_v4().to_string();

        let res = sqlx::query(
            "INSERT INTO users (uuid, name, email, password_hash, role, company_id) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(&user_uuid)
        .bind(name)
        .bind(email)
        .bind(&password_hash)
        .bind(role.as_str())
        .bind(company_id)
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

    /// Company Admin only: list users belonging to the caller's own company.
    pub async fn list_users(pool: &DbPool, company_id: i64) -> Result<Vec<UserResponse>, AppError> {
        let users: Vec<User> = sqlx::query_as(
            "SELECT * FROM users WHERE company_id = ? ORDER BY id ASC"
        )
        .bind(company_id)
        .fetch_all(pool)
        .await?;

        Ok(users.into_iter().map(UserResponse::from).collect())
    }
}
