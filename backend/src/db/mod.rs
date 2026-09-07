use crate::config::Config;
use crate::errors::AppError;
use crate::services::blockchain_service::BlockchainService;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
    Argon2,
};
use sqlx::{postgres::PgPoolOptions, PgPool};
use tracing::info;

pub type DbPool = PgPool;

/// Connects to PostgreSQL and runs migrations. Does not seed anything —
/// seeding needs a `BlockchainService`, which itself needs this pool, so
/// callers build the pool first, then the blockchain service, then call `seed`.
pub async fn connect_and_migrate(config: &Config) -> Result<DbPool, AppError> {
    info!("Connecting to PostgreSQL database");

    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await?;

    info!("Running database migrations...");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .map_err(|e| AppError::InternalServerError(format!("Migration failed: {}", e)))?;

    Ok(pool)
}

/// Seeds the Super Admin (always) and, if `config.demo_seed` is set, the demo tenant.
pub async fn seed(pool: &DbPool, config: &Config, blockchain: &BlockchainService) -> Result<(), AppError> {
    seed_super_admin(pool, config).await?;

    if config.demo_seed {
        seed_demo_data(pool, blockchain).await?;
    }

    Ok(())
}

async fn seed_super_admin(pool: &DbPool, config: &Config) -> Result<(), AppError> {
    let existing: Option<(i64,)> = sqlx::query_as("SELECT id FROM users WHERE email = $1")
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
        "INSERT INTO users (uuid, name, email, password_hash, role, company_id) VALUES ($1, $2, $3, $4, $5, NULL)",
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

async fn seed_demo_data(pool: &DbPool, blockchain: &BlockchainService) -> Result<(), AppError> {
    let existing_company: Option<(i64,)> = sqlx::query_as("SELECT id FROM companies LIMIT 1")
        .fetch_optional(pool)
        .await?;

    if existing_company.is_some() {
        return Ok(());
    }

    info!("DEMO_SEED=true and no companies exist yet — seeding a demo tenant...");

    let hash_password = |password: &str| -> Result<String, AppError> {
        let salt = SaltString::generate(&mut OsRng);
        Argon2::default()
            .hash_password(password.as_bytes(), &salt)
            .map(|h| h.to_string())
            .map_err(|e| AppError::InternalServerError(format!("Password hashing error: {}", e)))
    };

    let company_uuid = uuid::Uuid::new_v4().to_string();
    let (company_id,): (i64,) = sqlx::query_as(
        "INSERT INTO companies (uuid, name, slug, status) VALUES ($1, $2, $3, 'ACTIVE') RETURNING id",
    )
    .bind(&company_uuid)
    .bind("Skyline Aviation Group")
    .bind("skyline-aviation")
    .fetch_one(pool)
    .await?;

    const DEMO_PASSWORD: &str = "DemoPass123!";
    let demo_users: [(&str, &str, &str); 4] = [
        ("Ava Martinez", "admin@skyline-demo.test", "COMPANY_ADMIN"),
        ("Raj Patel", "manufacturer@skyline-demo.test", "MANUFACTURER"),
        ("Lena Novak", "tech@skyline-demo.test", "MAINTENANCE_TECHNICIAN"),
        ("Owen Brooks", "inspector@skyline-demo.test", "INSPECTOR"),
    ];

    let mut technician_id: Option<i64> = None;
    for (name, email, role) in demo_users {
        let password_hash = hash_password(DEMO_PASSWORD)?;
        let user_uuid = uuid::Uuid::new_v4().to_string();
        let (user_id,): (i64,) = sqlx::query_as(
            "INSERT INTO users (uuid, name, email, password_hash, role, company_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        )
        .bind(&user_uuid)
        .bind(name)
        .bind(email)
        .bind(&password_hash)
        .bind(role)
        .bind(company_id)
        .fetch_one(pool)
        .await?;

        if role == "MAINTENANCE_TECHNICIAN" {
            technician_id = Some(user_id);
        }
    }
    let technician_id = technician_id
        .ok_or_else(|| AppError::InternalServerError("demo seed: technician not created".into()))?;

    let aircraft_defs = [
        ("N101SK", "A320-200", "Airbus"),
        ("N202SK", "737-800", "Boeing"),
    ];
    let mut aircraft_ids = Vec::with_capacity(aircraft_defs.len());
    for (reg, model, manufacturer) in aircraft_defs {
        let aircraft_uuid = uuid::Uuid::new_v4().to_string();
        let (aircraft_id,): (i64,) = sqlx::query_as(
            "INSERT INTO aircraft (aircraft_uuid, registration_number, model, manufacturer, status, company_id) VALUES ($1, $2, $3, $4, 'ACTIVE', $5) RETURNING id",
        )
        .bind(&aircraft_uuid)
        .bind(reg)
        .bind(model)
        .bind(manufacturer)
        .bind(company_id)
        .fetch_one(pool)
        .await?;
        aircraft_ids.push(aircraft_id);
    }

    let component_defs = [
        (aircraft_ids[0], "ENG-SN-88213", "Turbofan Engine", "CFM International"),
        (aircraft_ids[0], "APU-SN-44190", "Auxiliary Power Unit", "Honeywell"),
        (aircraft_ids[1], "ENG-SN-99042", "Turbofan Engine", "CFM International"),
        (aircraft_ids[1], "LGR-SN-77310", "Landing Gear Assembly", "Safran"),
    ];
    let mut component_ids = Vec::with_capacity(component_defs.len());
    for (aircraft_id, serial, component_type, manufacturer) in component_defs {
        let component_uuid = uuid::Uuid::new_v4().to_string();
        let (component_id,): (i64,) = sqlx::query_as(
            "INSERT INTO components (component_uuid, aircraft_id, serial_number, component_type, manufacturer, status, company_id) VALUES ($1, $2, $3, $4, $5, 'OPERATIONAL', $6) RETURNING id",
        )
        .bind(&component_uuid)
        .bind(aircraft_id)
        .bind(serial)
        .bind(component_type)
        .bind(manufacturer)
        .bind(company_id)
        .fetch_one(pool)
        .await?;
        component_ids.push(component_id);
    }

    let tag_identifiers = [
        "04:A3:91:00:00:01",
        "04:A3:91:00:00:02",
        "04:A3:91:00:00:03",
        "04:A3:91:00:00:04",
    ];
    for (component_id, identifier) in component_ids.iter().zip(tag_identifiers.iter()) {
        sqlx::query(
            "INSERT INTO component_tags (component_id, technology, identifier, security_type, tamper_status, company_id) VALUES ($1, 'NFC', $2, 'BASIC_UID', 'INTACT', $3)",
        )
        .bind(component_id)
        .bind(identifier)
        .bind(company_id)
        .execute(pool)
        .await?;
    }

    for &component_id in &component_ids[0..2] {
        let created_at = chrono::Utc::now().to_rfc3339();
        let record_hash = blockchain.compute_record_hash(
            component_id,
            technician_id,
            "Scheduled Inspection",
            "100-hour inspection completed, no defects found",
            "PASS",
            &created_at,
        );

        let (record_id,): (i64,) = sqlx::query_as(
            "INSERT INTO maintenance_records (component_id, technician_id, maintenance_type, description, parts_replaced, inspection_result, record_hash, created_at, company_id) VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, $8) RETURNING id",
        )
        .bind(component_id)
        .bind(technician_id)
        .bind("Scheduled Inspection")
        .bind("100-hour inspection completed, no defects found")
        .bind("PASS")
        .bind(&record_hash)
        .bind(&created_at)
        .bind(company_id)
        .fetch_one(pool)
        .await?;

        blockchain.store_record_hash(record_id, record_hash).await?;
    }

    info!("Demo tenant seeded (company_id={}). Log in as Company Admin: admin@skyline-demo.test / {}", company_id, DEMO_PASSWORD);
    info!("Demo NFC registry identifiers: {:?} (seed data only; use a physical UID for real scans)", tag_identifiers);

    Ok(())
}
