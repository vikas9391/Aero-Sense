use crate::config::Config;
use crate::errors::AppError;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
    Argon2,
};
use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};
use tracing::info;

pub type DbPool = Pool<Sqlite>;

pub async fn init_db(config: &Config) -> Result<DbPool, AppError> {
    info!("Connecting to database at {}", config.database_url);

    let pool = SqlitePoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await?;

    info!("Running database migrations...");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .map_err(|e| AppError::InternalServerError(format!("Migration failed: {}", e)))?;

    seed_super_admin(&pool, config).await?;

    Ok(pool)
}

/// Ensures the single platform Super Admin account always exists (idempotent —
/// checked by email on every startup). It's the *only* account this codebase
/// ever creates automatically; every company and every other user is created
/// through the API by the Super Admin or a Company Admin. The Super Admin has
/// no `company_id` — it manages companies, not company data. Credentials come
/// from SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD, which must be set in the
/// environment (see backend/.env.example) — there is no hardcoded fallback.
async fn seed_super_admin(pool: &DbPool, config: &Config) -> Result<(), AppError> {
    let existing: Option<(i64,)> = sqlx::query_as("SELECT id FROM users WHERE email = ?")
        .bind(&config.super_admin_email)
        .fetch_optional(pool)
        .await?;

    if existing.is_some() {
        return Ok(());
    }

    info!("Seeding default super admin account ({})...", config.super_admin_email);

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(config.super_admin_password.as_bytes(), &salt)
        .map_err(|e| AppError::InternalServerError(format!("Password hashing error: {}", e)))?
        .to_string();

    let user_uuid = uuid::Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO users (uuid, name, email, password_hash, role, company_id) VALUES (?, ?, ?, ?, ?, NULL)",
    )
    .bind(&user_uuid)
    .bind("Super Admin")
    .bind(&config.super_admin_email)
    .bind(&password_hash)
    .bind("SUPER_ADMIN")
    .execute(pool)
    .await?;

    info!("Super admin seeded successfully.");
    Ok(())
}
