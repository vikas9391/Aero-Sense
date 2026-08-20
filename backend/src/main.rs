use backend::config::Config;
use backend::db::{connect_and_migrate, seed};
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

    // 3. Connect to the database and run migrations
    let pool = connect_and_migrate(&config).await?;

    // 4. Initialize Blockchain Service (needs the pool — it now persists
    //    on-chain hashes to a real table instead of an in-memory map)
    let blockchain_service = BlockchainService::new(pool.clone());

    // 5. Seed the Super Admin, and the demo tenant if DEMO_SEED=true
    seed(&pool, &config, &blockchain_service).await?;

    // 6. Build Router
    let app = create_router(pool, config.clone(), blockchain_service);

    // 7. Bind listener and start Axum server
    let bind_addr = format!("{}:{}", config.host, config.port);
    info!("Server listening on http://{}", bind_addr);

    let listener = tokio::net::TcpListener::bind(&bind_addr).await?;
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<std::net::SocketAddr>(),
    )
    .await?;

    Ok(())
}
