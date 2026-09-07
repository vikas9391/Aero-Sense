use crate::{db::DbPool, errors::AppError, models::{ComponentTag, RegisterTagRequest}};

pub struct TagService;
impl TagService {
    pub async fn register_tag(pool: &DbPool, company_id: i64, req: RegisterTagRequest) -> Result<ComponentTag, AppError> {
        let component_exists: Option<(i64,)> = sqlx::query_as("SELECT id FROM components WHERE id = $1 AND company_id = $2")
            .bind(req.component_id).bind(company_id).fetch_optional(pool).await?;
        if component_exists.is_none() { return Err(AppError::ComponentNotFound); }
        let identifier = req.identifier.trim().replace('-', ":").to_uppercase();
        if identifier.is_empty() { return Err(AppError::ValidationError("NFC tag identifier cannot be empty".to_string())); }
        let security_type = req.security_type.unwrap_or_else(|| "BASIC_UID".to_string());
        let (id,): (i64,) = sqlx::query_as("INSERT INTO component_tags (component_id, technology, identifier, security_type, tamper_status, company_id) VALUES ($1, $2, $3, $4, 'INTACT', $5) RETURNING id")
            .bind(req.component_id).bind(&req.technology).bind(&identifier).bind(&security_type).bind(company_id)
            .fetch_one(pool).await.map_err(|e| {
                if let sqlx::Error::Database(db) = &e { if db.code().as_deref() == Some("23505") { return AppError::Conflict("Tag with this identifier is already registered to a component".to_string()); } }
                AppError::DatabaseError(e)
            })?;
        Self::get_tag_by_id(pool, company_id, id).await
    }

    pub async fn get_tag_by_id(pool: &DbPool, company_id: i64, id: i64) -> Result<ComponentTag, AppError> {
        sqlx::query_as("SELECT * FROM component_tags WHERE id = $1 AND company_id = $2").bind(id).bind(company_id).fetch_optional(pool).await?.ok_or_else(|| AppError::NotFound("Component tag not found".to_string()))
    }

    pub async fn get_tag_by_identifier(pool: &DbPool, company_id: i64, identifier: &str) -> Result<ComponentTag, AppError> {
        let normalized = identifier.trim().replace('-', ":").to_uppercase();
        sqlx::query_as("SELECT * FROM component_tags WHERE identifier = $1 AND company_id = $2").bind(&normalized).bind(company_id).fetch_optional(pool).await?.ok_or_else(|| AppError::NfcTagNotRegistered)
    }
}
