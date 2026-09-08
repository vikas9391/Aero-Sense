pub mod aircraft;
pub mod analytics;
pub mod auth;
pub mod companies;
pub mod components;
pub mod health;
pub mod maintenance;
pub mod tags;
pub mod users;
pub mod verification;

use crate::{config::Config, db::DbPool, middleware::LoginRateLimiter, services::blockchain_service::BlockchainService};
use axum::http::{HeaderValue, Method};
use axum::{routing::{get, post, put}, Extension, Router};
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

pub fn create_router(pool: DbPool, config: Config, blockchain: BlockchainService) -> Router {
    let origins: Vec<HeaderValue> = config.allowed_origins.iter().filter_map(|o| o.parse().ok()).collect();
    let cors = CorsLayer::new().allow_origin(origins).allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE]).allow_headers(tower_http::cors::Any);
    let login_rate_limiter = LoginRateLimiter::new(config.login_rate_limit_max_attempts, config.login_rate_limit_window);
    crate::middleware::rate_limit::spawn_cleanup_task(login_rate_limiter.clone());
    let config_arc = Arc::new(config);
    let blockchain_arc = Arc::new(blockchain);
    Router::new()
        .route("/health", get(health::health_check))
        .route("/api/auth/login", post(auth::login))
        .route("/api/auth/me", get(auth::get_me))
        .route("/api/auth/change-password", put(auth::change_password))
        .route("/api/companies", post(companies::create_company))
        .route("/api/companies", get(companies::list_companies))
        .route("/api/companies/:id", get(companies::get_company))
        .route("/api/companies/:id/analytics", get(companies::get_company_analytics))
        .route("/api/companies/:id/admins", post(companies::create_company_admin))
        .route("/api/companies/:id/users", get(companies::list_company_users))
        .route("/api/companies/:id/status", put(companies::update_company_status))
        .route("/api/analytics/overview", get(analytics::get_overview))
        .route("/api/users", post(users::create_user))
        .route("/api/users", get(users::list_users))
        .route("/api/users/:id", get(users::get_user_profile).delete(users::delete_user))
        .route("/api/users/:id/status", put(users::update_user_status))
        .route("/api/users/:id/role", put(users::update_user_role))
        .route("/api/aircraft", post(aircraft::create_aircraft))
        .route("/api/aircraft", get(aircraft::list_aircraft))
        .route("/api/aircraft/:id", get(aircraft::get_aircraft))
        .route("/api/components", post(components::create_component))
        .route("/api/components", get(components::list_components))
        .route("/api/components/:id", get(components::get_component).put(components::update_component))
        .route("/api/components/:id/update-history", get(components::get_component_update_history))
        .route("/api/tags/register", post(tags::register_tag))
        .route("/api/tags/:id", get(tags::get_tag))
        .route("/api/maintenance", post(maintenance::create_maintenance))
        .route("/api/maintenance", get(maintenance::list_maintenance))
        .route("/api/components/:id/history", get(maintenance::get_component_history))
        .route("/api/verification/nfc", post(verification::verify_nfc))
        .route("/api/verification/logs", get(verification::list_verifications))
        .route("/api/components/:id/verification", get(verification::get_component_verifications))
        .route("/api/blockchain/verify", post(verification::verify_blockchain_record))
        .layer(Extension(config_arc)).layer(Extension(blockchain_arc)).layer(Extension(login_rate_limiter)).layer(cors).layer(TraceLayer::new_for_http()).with_state(pool)
}