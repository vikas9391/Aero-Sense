use crate::{
    db::DbPool,
    errors::AppError,
    models::{ComponentTag, RegisterTagRequest},
};

pub struct TagService;

impl TagService {
    pub async fn register_tag(
        pool: &DbPool,
        company_id: i64,
        req: RegisterTagRequest,
    ) -> Result<ComponentTag, AppError> {
        // The component must belong to the caller's own company.
        let component_exists: Option<(i64,)> = sqlx::query_as(
            "SELECT id FROM components WHERE id = ? AND company_id = ?"
        )
        .bind(req.component_id)
        .bind(company_id)
        .fetch_optional(pool)
        .await?;

        if component_exists.is_none() {
            return Err(AppError::ComponentNotFound);
        }

        let security_type = req.security_type.unwrap_or_else(|| "MOCK".to_string());

        let res = sqlx::query(
            "INSERT INTO component_tags (component_id, technology, identifier, security_type, tamper_status, company_id)
             VALUES (?, ?, ?, ?, 'INTACT', ?)",
        )
        .bind(req.component_id)
        .bind(&req.technology)
        .bind(&req.identifier)
        .bind(&security_type)
        .bind(company_id)
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
        Self::get_tag_by_id(pool, company_id, id).await
    }

    pub async fn get_tag_by_id(pool: &DbPool, company_id: i64, id: i64) -> Result<ComponentTag, AppError> {
        let tag: ComponentTag = sqlx::query_as(
            "SELECT * FROM component_tags WHERE id = ? AND company_id = ?"
        )
        .bind(id)
        .bind(company_id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound("Component tag not found".to_string()))?;

        Ok(tag)
    }

    /// Used by the verification pipeline, which is itself scoped to the
    /// scanning user's company — a tag identifier belonging to another
    /// company is treated exactly like an unknown/unregistered tag.
    pub async fn get_tag_by_identifier(
        pool: &DbPool,
        company_id: i64,
        identifier: &str,
    ) -> Result<ComponentTag, AppError> {
        let tag: ComponentTag = sqlx::query_as(
            "SELECT * FROM component_tags WHERE identifier = ? AND company_id = ?"
        )
        .bind(identifier)
        .bind(company_id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NfcTagNotRegistered)?;

        Ok(tag)
    }
}
