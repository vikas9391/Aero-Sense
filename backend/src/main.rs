use backend::config::Config;
use backend::db::init_db;
use backend::routes::create_router;
use backend::services::blockchain_service::BlockchainService;
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Initialize logging
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!("Starting Secure Aircraft Component Verification Backend...");

    // 2. Load Configuration
    let config = Config::from_env();

    // 3. Initialize Database & Run Migrations
    let pool = init_db(&config).await?;

    // 4. Initialize Blockchain Service
    let blockchain_service = BlockchainService::new();

    // 5. Build Router
    let app = create_router(pool, config.clone(), blockchain_service);

    // 6. Bind listener and start Axum server
    let bind_addr = format!("{}:{}", config.host, config.port);
    info!("Server listening on http://{}", bind_addr);

    let listener = tokio::net::TcpListener::bind(&bind_addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
