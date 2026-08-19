use axum::Json;
use serde_json::{json, Value};

/// Unauthenticated liveness/readiness check. Intentionally returns no
/// database or config state — it only proves the process is up and
/// answering HTTP, which is what a load balancer, uptime monitor, or
/// someone sanity-checking the server before a demo actually needs.
pub async fn health_check() -> Json<Value> {
    Json(json!({
        "status": "ok",
        "service": "aero-sense-backend",
        "version": env!("CARGO_PKG_VERSION"),
    }))
}
