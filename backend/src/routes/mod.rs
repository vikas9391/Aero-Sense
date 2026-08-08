pub mod aircraft;
pub mod auth;
pub mod components;
pub mod maintenance;
pub mod tags;
pub mod users;
pub mod verification;

use crate::{config::Config, db::DbPool, services::blockchain_service::BlockchainService};
use axum::{
    routing::{get, post},
    Extension, Router,
};
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

pub fn create_router(pool: DbPool, config: Config, blockchain: BlockchainService) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let config_arc = Arc::new(config);
    let blockchain_arc = Arc::new(blockchain);

    Router::new()
        // Auth routes
        .route("/api/auth/login", post(auth::login))
        .route("/api/auth/me", get(auth::get_me))
        // User management routes (admin only)
        .route("/api/users", post(users::create_user))
        .route("/api/users", get(users::list_users))
        // Aircraft routes
        .route("/api/aircraft", post(aircraft::create_aircraft))
        .route("/api/aircraft", get(aircraft::list_aircraft))
        .route("/api/aircraft/:id", get(aircraft::get_aircraft))
        // Components routes
        .route("/api/components", post(components::create_component))
        .route("/api/components", get(components::list_components))
        .route("/api/components/:id", get(components::get_component))
        // Tags routes
        .route("/api/tags/register", post(tags::register_tag))
        .route("/api/tags/:id", get(tags::get_tag))
        // Maintenance routes
        .route("/api/maintenance", post(maintenance::create_maintenance))
        .route("/api/components/:id/history", get(maintenance::get_component_history))
        // Verification routes
        .route("/api/verification/nfc", post(verification::verify_nfc))
        .route("/api/components/:id/verification", get(verification::get_component_verifications))
        .route("/api/blockchain/verify", post(verification::verify_blockchain_record))
        // State & Extensions
        .layer(Extension(config_arc))
        .layer(Extension(blockchain_arc))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(pool)
}
