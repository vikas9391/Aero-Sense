use rand::RngCore;
use std::env;
use std::fs;
use std::path::PathBuf;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub port: u16,
    pub host: String,
    pub jwt_secret: String,
    pub super_admin_email: String,
    pub super_admin_password: String,
    pub allow_verification_simulation: bool,
    pub allow_demo_super_admin_login: bool,
    pub demo_seed: bool,
    pub allowed_origins: Vec<String>,
    pub login_rate_limit_max_attempts: usize,
    pub login_rate_limit_window: std::time::Duration,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();
        let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set to a PostgreSQL connection string");
        let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string()).parse::<u16>().unwrap_or(8080);
        let host = env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
        let jwt_secret = Self::jwt_secret();
        let super_admin_email = env::var("SUPER_ADMIN_EMAIL").expect("SUPER_ADMIN_EMAIL must be set in the environment (see backend/.env.example)");
        let super_admin_password = env::var("SUPER_ADMIN_PASSWORD").expect("SUPER_ADMIN_PASSWORD must be set in the environment (see backend/.env.example)");
        assert!(super_admin_password.len() >= 8, "SUPER_ADMIN_PASSWORD must be at least 8 characters");
        let allow_verification_simulation = env::var("ALLOW_VERIFICATION_SIMULATION").map(|v| v.trim().eq_ignore_ascii_case("true") || v.trim() == "1").unwrap_or(false);
        // The passwordless Super Admin entry point is intentionally enabled for the
        // AeroSense hackathon/demo deployment. The environment variable can still
        // explicitly disable it by setting ALLOW_DEMO_SUPER_ADMIN_LOGIN=false.
        let allow_demo_super_admin_login = env::var("ALLOW_DEMO_SUPER_ADMIN_LOGIN").map(|v| v.trim().eq_ignore_ascii_case("true") || v.trim() == "1").unwrap_or(true);
        let demo_seed = env::var("DEMO_SEED").map(|v| v.trim().eq_ignore_ascii_case("true") || v.trim() == "1").unwrap_or(false);
        let allowed_origins = env::var("ALLOWED_ORIGINS").map(|v| v.split(',').map(|s| s.trim().to_string()).filter(|s| !s.is_empty()).collect()).unwrap_or_else(|_| vec!["http://localhost:5173".to_string(), "http://127.0.0.1:5173".to_string()]);
        let login_rate_limit_max_attempts = env::var("LOGIN_RATE_LIMIT_MAX_ATTEMPTS").ok().and_then(|v| v.parse::<usize>().ok()).unwrap_or(5);
        let login_rate_limit_window = env::var("LOGIN_RATE_LIMIT_WINDOW_SECS").ok().and_then(|v| v.parse::<u64>().ok()).map(std::time::Duration::from_secs).unwrap_or_else(|| std::time::Duration::from_secs(15 * 60));
        Self { database_url, port, host, jwt_secret, super_admin_email, super_admin_password, allow_verification_simulation, allow_demo_super_admin_login, demo_seed, allowed_origins, login_rate_limit_max_attempts, login_rate_limit_window }
    }

    fn jwt_secret() -> String {
        if let Ok(secret) = env::var("JWT_SECRET") { if !secret.trim().is_empty() { return secret; } }
        let path = PathBuf::from(".jwt_secret");
        if let Ok(existing) = fs::read_to_string(&path) { let existing = existing.trim().to_string(); if !existing.is_empty() { return existing; } }
        let mut bytes = [0u8; 32]; rand::thread_rng().fill_bytes(&mut bytes); let generated = hex::encode(bytes);
        if let Err(e) = fs::write(&path, &generated) { tracing::warn!("Could not persist generated JWT secret to {:?} ({}). Using an in-memory secret for this run only.", path, e); } else { tracing::info!("Generated and saved JWT secret to {:?}", path); }
        generated
    }
}
