use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub port: u16,
    pub host: String,
    pub jwt_secret: String,
    pub nfc_mode: String,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();

        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| "sqlite://aircraft_verification.db?mode=rwc".to_string());
        let port = env::var("PORT")
            .unwrap_or_else(|_| "8080".to_string())
            .parse::<u16>()
            .unwrap_or(8080);
        let host = env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
        let jwt_secret = env::var("JWT_SECRET")
            .unwrap_or_else(|_| "super_secret_aircraft_verification_jwt_key_2026!".to_string());
        let nfc_mode = env::var("NFC_MODE").unwrap_or_else(|_| "mock".to_string());

        Self {
            database_url,
            port,
            host,
            jwt_secret,
            nfc_mode,
        }
    }
}
