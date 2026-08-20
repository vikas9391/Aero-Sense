use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use thiserror::Error;
use tracing::error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Invalid request parameters: {0}")]
    ValidationError(String),

    #[error("Authentication failed: {0}")]
    Unauthorized(String),

    #[error("Access forbidden: {0}")]
    Forbidden(String),

    #[error("Resource not found: {0}")]
    NotFound(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Invalid NFC tag payload: {0}")]
    InvalidNfc(String),

    #[error("NFC tag not registered to any component")]
    NfcTagNotRegistered,

    #[error("NFC authentication failed")]
    NfcAuthenticationFailed,

    #[error("Component not found")]
    ComponentNotFound,

    #[error("Component binding failed: {0}")]
    ComponentBindingFailed(String),

    #[error("Tamper state detected: {0}")]
    TamperDetected(String),

    #[error("Blockchain hash mismatch: {0}")]
    BlockchainMismatch(String),

    #[error("Too many requests: {0}")]
    TooManyRequests(String),

    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),

    #[error("Internal server error: {0}")]
    InternalServerError(String),
}

#[derive(Serialize)]
pub struct ErrorDetail {
    pub code: String,
    pub message: String,
}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub success: bool,
    pub error: ErrorDetail,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code, message) = match &self {
            AppError::ValidationError(msg) => (StatusCode::BAD_REQUEST, "VALIDATION_ERROR", msg.clone()),
            AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, "UNAUTHORIZED", msg.clone()),
            AppError::Forbidden(msg) => (StatusCode::FORBIDDEN, "FORBIDDEN", msg.clone()),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, "NOT_FOUND", msg.clone()),
            AppError::Conflict(msg) => (StatusCode::CONFLICT, "CONFLICT", msg.clone()),
            AppError::TooManyRequests(msg) => (StatusCode::TOO_MANY_REQUESTS, "TOO_MANY_REQUESTS", msg.clone()),
            AppError::InvalidNfc(msg) => (StatusCode::BAD_REQUEST, "INVALID_NFC", msg.clone()),
            AppError::NfcTagNotRegistered => (
                StatusCode::NOT_FOUND,
                "NFC_TAG_NOT_REGISTERED",
                "This NFC tag is not registered to any component.".to_string(),
            ),
            AppError::NfcAuthenticationFailed => (
                StatusCode::UNAUTHORIZED,
                "NFC_AUTHENTICATION_FAILED",
                "NFC cryptographic authentication failed.".to_string(),
            ),
            AppError::ComponentNotFound => (
                StatusCode::NOT_FOUND,
                "COMPONENT_NOT_FOUND",
                "Specified component could not be found.".to_string(),
            ),
            AppError::ComponentBindingFailed(msg) => (StatusCode::BAD_REQUEST, "COMPONENT_BINDING_FAILED", msg.clone()),
            AppError::TamperDetected(msg) => (StatusCode::UNPROCESSABLE_ENTITY, "TAMPER_DETECTED", msg.clone()),
            AppError::BlockchainMismatch(msg) => (StatusCode::UNPROCESSABLE_ENTITY, "BLOCKCHAIN_MISMATCH", msg.clone()),
            AppError::DatabaseError(err) => {
                // Log the real error server-side (may contain schema/query
                // details) but never hand it back to the client.
                error!("Database error: {}", err);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "DATABASE_ERROR",
                    "An internal database error occurred".to_string(),
                )
            }
            AppError::InternalServerError(msg) => {
                error!("Internal server error: {}", msg);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "INTERNAL_SERVER_ERROR",
                    "An internal server error occurred".to_string(),
                )
            }
        };

        let body = Json(ErrorResponse {
            success: false,
            error: ErrorDetail {
                code: code.to_string(),
                message,
            },
        });

        (status, body).into_response()
    }
}
