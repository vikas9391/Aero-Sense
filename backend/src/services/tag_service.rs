use crate::{
    db::DbPool,
    errors::AppError,
    models::{ComponentTag, RegisterTagRequest},
};

pub struct TagService;

impl TagService {
    pub async fn register_tag(pool: &DbPool, req: RegisterTagRequest) -> Result<ComponentTag, AppError> {
        // Verify component exists
        let component_exists: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM components WHERE id = ?")
            .bind(req.component_id)
            .fetch_one(pool)
            .await?;

        if component_exists.0 == 0 {
            return Err(AppError::ComponentNotFound);
        }

        let security_type = req.security_type.unwrap_or_else(|| "MOCK".to_string());

        let res = sqlx::query(
            "INSERT INTO component_tags (component_id, technology, identifier, security_type, tamper_status)
             VALUES (?, ?, ?, ?, 'INTACT')",
        )
        .bind(req.component_id)
        .bind(&req.technology)
        .bind(&req.identifier)
        .bind(&security_type)
        .execute(pool)
        .await
        .map_err(|e| {
            if e.to_string().contains("UNIQUE constraint failed") {
                AppError::Conflict("Tag with this identifier is already registered to a component".to_string())
            } else {
                AppError::DatabaseError(e)
            }
        })?;

        let id = res.last_insert_rowid();
        Self::get_tag_by_id(pool, id).await
    }

    pub async fn get_tag_by_id(pool: &DbPool, id: i64) -> Result<ComponentTag, AppError> {
        let tag: ComponentTag = sqlx::query_as("SELECT * FROM component_tags WHERE id = ?")
            .bind(id)
            .fetch_optional(pool)
            .await?
            .ok_or_else(|| AppError::NotFound("Component tag not found".to_string()))?;

        Ok(tag)
    }

    pub async fn get_tag_by_identifier(pool: &DbPool, identifier: &str) -> Result<ComponentTag, AppError> {
        let tag: ComponentTag = sqlx::query_as("SELECT * FROM component_tags WHERE identifier = ?")
            .bind(identifier)
            .fetch_optional(pool)
            .await?
            .ok_or_else(|| AppError::NfcTagNotRegistered)?;

        Ok(tag)
    }
}
