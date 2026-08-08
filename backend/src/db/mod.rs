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

    Ok(pool)
}

async fn seed_database(pool: &DbPool) -> Result<(), AppError> {
    // Check if admin user already exists
    let existing_users: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
        .fetch_one(pool)
        .await?;

    if existing_users.0 > 0 {
        info!("Database already seeded with initial data.");
        return Ok(());
    }

    info!("Seeding initial users and demo aircraft components...");

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(b"Password123!", &salt)
        .map_err(|e| AppError::InternalServerError(format!("Password hashing error: {}", e)))?
        .to_string();

    // 1. Seed Users
    let users = vec![
        ("Admin User", "admin@aircraft.com", "ADMIN"),
        ("Airbus Manufacturer", "manufacturer@aircraft.com", "MANUFACTURER"),
        ("John Tech (Lead Tech)", "technician@aircraft.com", "MAINTENANCE_TECHNICIAN"),
        ("Sarah Inspector", "inspector@aircraft.com", "INSPECTOR"),
        ("Auditor Viewer", "viewer@aircraft.com", "VIEWER"),
    ];

    for (name, email, role) in users {
        let user_uuid = uuid::Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT INTO users (uuid, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)"
        )
        .bind(&user_uuid)
        .bind(name)
        .bind(email)
        .bind(&password_hash)
        .bind(role)
        .execute(pool)
        .await?;
    }

    // 2. Seed Aircraft
    let aircraft_uuid = uuid::Uuid::new_v4().to_string();
    let aircraft_res = sqlx::query(
        "INSERT INTO aircraft (aircraft_uuid, registration_number, model, manufacturer, status) 
         VALUES (?, ?, ?, ?, ?)"
    )
    .bind(&aircraft_uuid)
    .bind("A320-001")
    .bind("Airbus A320neo")
    .bind("Airbus Industrie")
    .bind("ACTIVE")
    .execute(pool)
    .await?;

    let aircraft_id = aircraft_res.last_insert_rowid();

    // 3. Seed Components
    let comp1_uuid = "ENG-0001".to_string(); // Component ID
    let comp1_res = sqlx::query(
        "INSERT INTO components (component_uuid, aircraft_id, serial_number, component_type, manufacturer, status)
         VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&comp1_uuid)
    .bind(aircraft_id)
    .bind("XZ928374")
    .bind("Turbofan Engine (CFM LEAP-1A)")
    .bind("CFM International")
    .bind("OPERATIONAL")
    .execute(pool)
    .await?;

    let comp1_id = comp1_res.last_insert_rowid();

    let comp2_uuid = "AVN-0002".to_string();
    let comp2_res = sqlx::query(
        "INSERT INTO components (component_uuid, aircraft_id, serial_number, component_type, manufacturer, status)
         VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&comp2_uuid)
    .bind(aircraft_id)
    .bind("AVN77391")
    .bind("Flight Management Computer")
    .bind("Honeywell Aerospace")
    .bind("OPERATIONAL")
    .execute(pool)
    .await?;

    let comp2_id = comp2_res.last_insert_rowid();

    // 4. Seed Component Tags (NFC)
    sqlx::query(
        "INSERT INTO component_tags (component_id, technology, identifier, security_type, tamper_status)
         VALUES (?, ?, ?, ?, ?)"
    )
    .bind(comp1_id)
    .bind("NFC")
    .bind("04:A3:91:XX")
    .bind("MOCK")
    .bind("INTACT")
    .execute(pool)
    .await?;

    sqlx::query(
        "INSERT INTO component_tags (component_id, technology, identifier, security_type, tamper_status)
         VALUES (?, ?, ?, ?, ?)"
    )
    .bind(comp2_id)
    .bind("NFC")
    .bind("04:B2:82:YY")
    .bind("MOCK")
    .bind("INTACT")
    .execute(pool)
    .await?;

    info!("Database seeding complete.");
    Ok(())
}
