//! Library target so integration tests (and anything else) can build the
//! router and hit it directly, instead of only being able to run the
//! compiled binary. `main.rs` is a thin wrapper around this.

pub mod config;
pub mod db;
pub mod errors;
pub mod middleware;
pub mod models;
pub mod routes;
pub mod services;
