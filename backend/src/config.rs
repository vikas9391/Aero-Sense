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
    pub nfc_mode: String,
    pub super_admin_email: String,
    pub super_admin_password: String,
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

        let jwt_secret = Self::jwt_secret();

        let nfc_mode = env::var("NFC_MODE").unwrap_or_else(|_| "mock".to_string());

        // Same reasoning as the JWT secret: the platform Super Admin is a
        // real, privileged account, so its credentials must be provided by
        // whoever deploys this instance rather than shipped as a default in
        // source control.
        let super_admin_email = env::var("SUPER_ADMIN_EMAIL").expect(
            "SUPER_ADMIN_EMAIL must be set in the environment (see backend/.env.example) — \
             refusing to start with no configured super admin account",
        );
        let super_admin_password = env::var("SUPER_ADMIN_PASSWORD").expect(
            "SUPER_ADMIN_PASSWORD must be set in the environment (see backend/.env.example) — \
             refusing to start with no configured super admin password",
        );
        assert!(
            super_admin_password.len() >= 8,
            "SUPER_ADMIN_PASSWORD must be at least 8 characters"
        );

        Self {
            database_url,
            port,
            host,
            jwt_secret,
            nfc_mode,
            super_admin_email,
            super_admin_password,
        }
    }

    /// Resolves the JWT signing secret.
    ///
    /// - If `JWT_SECRET` is set in the environment, that value is used as-is
    ///   (the right choice for production / multi-instance deployments, so
    ///   every instance signs and verifies with the same secret).
    /// - Otherwise a random 256-bit secret is generated on first run and
    ///   persisted to `.jwt_secret` next to the database, then reused on
    ///   every subsequent startup — so restarting the server doesn't log
    ///   everyone out. This file is machine-generated, gitignored, and never
    ///   contains a hardcoded or predictable value.
    fn jwt_secret() -> String {
        if let Ok(secret) = env::var("JWT_SECRET") {
            if !secret.trim().is_empty() {
                return secret;
            }
        }

        let path = PathBuf::from(".jwt_secret");

        if let Ok(existing) = fs::read_to_string(&path) {
            let existing = existing.trim().to_string();
            if !existing.is_empty() {
                return existing;
            }
        }

        let mut bytes = [0u8; 32];
        rand::thread_rng().fill_bytes(&mut bytes);
        let generated = hex::encode(bytes);

        if let Err(e) = fs::write(&path, &generated) {
            // Fall back to an in-memory-only secret rather than failing to
            // start; every existing session will simply need to log in
            // again on the next restart.
            tracing::warn!(
                "Could not persist generated JWT secret to {:?} ({}). \
                 Using an in-memory secret for this run only — set JWT_SECRET \
                 explicitly to avoid this.",
                path,
                e
            );
        } else {
            tracing::info!(
                "No JWT_SECRET set — generated and saved a new signing secret to {:?}",
                path
            );
        }

        generated
    }
}
