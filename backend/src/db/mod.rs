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

    seed_database(&pool).await?;
    seed_super_admin(&pool, config).await?;

    Ok(pool)
}

/// Ensures a default platform Super Admin account always exists, independent of
/// the one-time seed_database() run below (so it also gets created on databases
/// that were already seeded before this account existed). The Super Admin has
/// no `company_id` — it manages companies, not company data. Credentials come
/// from SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD in .env.
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

async fn seed_database(pool: &DbPool) -> Result<(), AppError> {
    // Check if any company already exists — the seed only ever runs once.
    let existing_companies: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM companies")
        .fetch_one(pool)
        .await?;

    if existing_companies.0 > 0 {
        info!("Database already seeded with initial data.");
        return Ok(());
    }

    info!("Seeding demo company, users, and demo aircraft components...");

    // 1. Seed a demo company (tenant) — everything else below belongs to it.
    let company_uuid = uuid::Uuid::new_v4().to_string();
    let company_res = sqlx::query(
        "INSERT INTO companies (uuid, name, slug, status) VALUES (?, ?, ?, 'ACTIVE')",
    )
    .bind(&company_uuid)
    .bind("Demo Aviation Co")
    .bind("demo-aviation-co")
    .execute(pool)
    .await?;

    let company_id = company_res.last_insert_rowid();

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(b"Password123!", &salt)
        .map_err(|e| AppError::InternalServerError(format!("Password hashing error: {}", e)))?
        .to_string();

    // 2. Seed Users — all scoped to the demo company.
    let users = vec![
        ("Demo Company Admin", "admin@aircraft.com", "COMPANY_ADMIN"),
        ("Airbus Manufacturer", "manufacturer@aircraft.com", "MANUFACTURER"),
        ("John Tech (Lead Tech)", "technician@aircraft.com", "MAINTENANCE_TECHNICIAN"),
        ("Sarah Inspector", "inspector@aircraft.com", "INSPECTOR"),
        ("Auditor Viewer", "viewer@aircraft.com", "VIEWER"),
    ];

    for (name, email, role) in users {
        let user_uuid = uuid::Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT INTO users (uuid, name, email, password_hash, role, company_id) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(&user_uuid)
        .bind(name)
        .bind(email)
        .bind(&password_hash)
        .bind(role)
        .bind(company_id)
        .execute(pool)
        .await?;
    }

    // 3. Seed Aircraft
    let aircraft_uuid = uuid::Uuid::new_v4().to_string();
    let aircraft_res = sqlx::query(
        "INSERT INTO aircraft (aircraft_uuid, registration_number, model, manufacturer, status, company_id) 
         VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&aircraft_uuid)
    .bind("A320-001")
    .bind("Airbus A320neo")
    .bind("Airbus Industrie")
    .bind("ACTIVE")
    .bind(company_id)
    .execute(pool)
    .await?;

    let aircraft_id = aircraft_res.last_insert_rowid();

    // 4. Seed Components
    let comp1_uuid = "ENG-0001".to_string(); // Component ID
    let comp1_res = sqlx::query(
        "INSERT INTO components (component_uuid, aircraft_id, serial_number, component_type, manufacturer, status, company_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&comp1_uuid)
    .bind(aircraft_id)
    .bind("XZ928374")
    .bind("Turbofan Engine (CFM LEAP-1A)")
    .bind("CFM International")
    .bind("OPERATIONAL")
    .bind(company_id)
    .execute(pool)
    .await?;

    let comp1_id = comp1_res.last_insert_rowid();

    let comp2_uuid = "AVN-0002".to_string();
    let comp2_res = sqlx::query(
        "INSERT INTO components (component_uuid, aircraft_id, serial_number, component_type, manufacturer, status, company_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&comp2_uuid)
    .bind(aircraft_id)
    .bind("AVN77391")
    .bind("Flight Management Computer")
    .bind("Honeywell Aerospace")
    .bind("OPERATIONAL")
    .bind(company_id)
    .execute(pool)
    .await?;

    let comp2_id = comp2_res.last_insert_rowid();

    // 5. Seed Component Tags (NFC)
    sqlx::query(
        "INSERT INTO component_tags (component_id, technology, identifier, security_type, tamper_status, company_id)
         VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(comp1_id)
    .bind("NFC")
    .bind("04:A3:91:XX")
    .bind("MOCK")
    .bind("INTACT")
    .bind(company_id)
    .execute(pool)
    .await?;

    sqlx::query(
        "INSERT INTO component_tags (component_id, technology, identifier, security_type, tamper_status, company_id)
         VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(comp2_id)
    .bind("NFC")
    .bind("04:B2:82:YY")
    .bind("MOCK")
    .bind("INTACT")
    .bind(company_id)
    .execute(pool)
    .await?;

    info!("Database seeding complete.");
    Ok(())
}
