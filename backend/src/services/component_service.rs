use crate::{
    db::DbPool,
    errors::AppError,
    models::{
        Aircraft, AircraftWithComponents, Component, ComponentResponse, ComponentUpdateHistory,
        CreateAircraftRequest, CreateComponentRequest, UpdateComponentRequest,
    },
};

pub struct ComponentService;

impl ComponentService {
    pub async fn create_aircraft(pool: &DbPool, company_id: i64, req: CreateAircraftRequest) -> Result<Aircraft, AppError> {
        let aircraft_uuid = uuid::Uuid::new_v4().to_string();
        let status = req.status.unwrap_or_else(|| "ACTIVE".to_string());
        let (id,): (i64,) = sqlx::query_as("INSERT INTO aircraft (aircraft_uuid, registration_number, model, manufacturer, status, company_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id")
            .bind(&aircraft_uuid).bind(&req.registration_number).bind(&req.model).bind(&req.manufacturer).bind(&status).bind(company_id)
            .fetch_one(pool).await.map_err(|e| {
                if let sqlx::Error::Database(db) = &e { if db.code().as_deref() == Some("23505") { return AppError::Conflict("Aircraft with this registration number already exists".to_string()); } }
                AppError::DatabaseError(e)
            })?;
        Ok(sqlx::query_as("SELECT * FROM aircraft WHERE id = $1 AND company_id = $2").bind(id).bind(company_id).fetch_one(pool).await?)
    }

    pub async fn list_aircraft(pool: &DbPool, company_id: i64) -> Result<Vec<Aircraft>, AppError> {
        Ok(sqlx::query_as("SELECT * FROM aircraft WHERE company_id = $1 ORDER BY id DESC").bind(company_id).fetch_all(pool).await?)
    }

    pub async fn get_aircraft_by_id(pool: &DbPool, company_id: i64, id: i64) -> Result<AircraftWithComponents, AppError> {
        let aircraft: Aircraft = sqlx::query_as("SELECT * FROM aircraft WHERE id = $1 AND company_id = $2").bind(id).bind(company_id).fetch_optional(pool).await?.ok_or_else(|| AppError::NotFound("Aircraft not found".to_string()))?;
        let components = Self::list_components_by_aircraft(pool, company_id, id).await?;
        Ok(AircraftWithComponents { aircraft, components })
    }

    pub async fn create_component(pool: &DbPool, company_id: i64, req: CreateComponentRequest) -> Result<ComponentResponse, AppError> {
        if let Some(aircraft_id) = req.aircraft_id {
            let owned: Option<(i64,)> = sqlx::query_as("SELECT id FROM aircraft WHERE id = $1 AND company_id = $2").bind(aircraft_id).bind(company_id).fetch_optional(pool).await?;
            if owned.is_none() { return Err(AppError::NotFound("Aircraft not found".to_string())); }
        }
        let component_uuid = format!("ENG-{}", uuid::Uuid::new_v4().to_string()[..8].to_uppercase());
        let status = req.status.unwrap_or_else(|| "OPERATIONAL".to_string());
        let (id,): (i64,) = sqlx::query_as("INSERT INTO components (component_uuid, aircraft_id, serial_number, component_type, manufacturer, status, company_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id")
            .bind(&component_uuid).bind(req.aircraft_id).bind(&req.serial_number).bind(&req.component_type).bind(&req.manufacturer).bind(&status).bind(company_id)
            .fetch_one(pool).await.map_err(|e| {
                if let sqlx::Error::Database(db) = &e { if db.code().as_deref() == Some("23505") { return AppError::Conflict("Component with this serial number already exists".to_string()); } }
                AppError::DatabaseError(e)
            })?;
        Self::get_component_by_id(pool, company_id, id).await
    }

    pub async fn update_component(pool: &DbPool, company_id: i64, user_id: i64, id: i64, req: UpdateComponentRequest) -> Result<ComponentResponse, AppError> {
        if let Some(aircraft_id) = req.aircraft_id {
            let owned: Option<(i64,)> = sqlx::query_as("SELECT id FROM aircraft WHERE id = $1 AND company_id = $2").bind(aircraft_id).bind(company_id).fetch_optional(pool).await?;
            if owned.is_none() { return Err(AppError::NotFound("Aircraft not found".to_string())); }
        }
        let updated = sqlx::query_as::<_, Component>("UPDATE components SET aircraft_id = $1, serial_number = $2, component_type = $3, manufacturer = $4, status = $5, updated_at = CURRENT_TIMESTAMP::text WHERE id = $6 AND company_id = $7 RETURNING *")
            .bind(req.aircraft_id).bind(&req.serial_number).bind(&req.component_type).bind(&req.manufacturer).bind(&req.status).bind(id).bind(company_id)
            .fetch_optional(pool).await.map_err(|e| {
                if let sqlx::Error::Database(db) = &e { if db.code().as_deref() == Some("23505") { return AppError::Conflict("Component with this serial number already exists".to_string()); } }
                AppError::DatabaseError(e)
            })?.ok_or(AppError::ComponentNotFound)?;

        sqlx::query("INSERT INTO component_update_history (component_id, user_id, serial_number, component_type, manufacturer, status, aircraft_id, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP::text)")
            .bind(id).bind(user_id).bind(&updated.serial_number).bind(&updated.component_type).bind(&updated.manufacturer).bind(&updated.status).bind(updated.aircraft_id)
            .execute(pool).await?;

        Self::get_component_by_id(pool, company_id, id).await
    }

    pub async fn update_history(pool: &DbPool, company_id: i64, id: i64) -> Result<Vec<ComponentUpdateHistory>, AppError> {
        let exists: Option<(i64,)> = sqlx::query_as("SELECT id FROM components WHERE id = $1 AND company_id = $2").bind(id).bind(company_id).fetch_optional(pool).await?;
        if exists.is_none() { return Err(AppError::ComponentNotFound); }
        Ok(sqlx::query_as("SELECT h.* FROM component_update_history h JOIN components c ON c.id = h.component_id WHERE h.component_id = $1 AND c.company_id = $2 ORDER BY h.id DESC")
            .bind(id).bind(company_id).fetch_all(pool).await?)
    }

    pub async fn list_components(pool: &DbPool, company_id: i64) -> Result<Vec<ComponentResponse>, AppError> {
        let components: Vec<Component> = sqlx::query_as("SELECT * FROM components WHERE company_id = $1 ORDER BY id DESC").bind(company_id).fetch_all(pool).await?;
        let mut responses = Vec::new();
        for c in components {
            let aircraft_reg = if let Some(aid) = c.aircraft_id {
                let reg: Option<(String,)> = sqlx::query_as("SELECT registration_number FROM aircraft WHERE id = $1 AND company_id = $2").bind(aid).bind(company_id).fetch_optional(pool).await?;
                reg.map(|r| r.0)
            } else { None };
            responses.push(ComponentResponse { id: c.id, component_uuid: c.component_uuid, aircraft_id: c.aircraft_id, aircraft_registration: aircraft_reg, serial_number: c.serial_number, component_type: c.component_type, manufacturer: c.manufacturer, status: c.status, created_at: c.created_at, updated_at: c.updated_at });
        }
        Ok(responses)
    }

    pub async fn list_components_by_aircraft(pool: &DbPool, company_id: i64, aircraft_id: i64) -> Result<Vec<ComponentResponse>, AppError> {
        let components: Vec<Component> = sqlx::query_as("SELECT * FROM components WHERE aircraft_id = $1 AND company_id = $2 ORDER BY id DESC").bind(aircraft_id).bind(company_id).fetch_all(pool).await?;
        let aircraft_reg: Option<(String,)> = sqlx::query_as("SELECT registration_number FROM aircraft WHERE id = $1 AND company_id = $2").bind(aircraft_id).bind(company_id).fetch_optional(pool).await?;
        let reg_str = aircraft_reg.map(|r| r.0);
        Ok(components.into_iter().map(|c| ComponentResponse { id: c.id, component_uuid: c.component_uuid, aircraft_id: c.aircraft_id, aircraft_registration: reg_str.clone(), serial_number: c.serial_number, component_type: c.component_type, manufacturer: c.manufacturer, status: c.status, created_at: c.created_at, updated_at: c.updated_at }).collect())
    }

    pub async fn get_component_by_id(pool: &DbPool, company_id: i64, id: i64) -> Result<ComponentResponse, AppError> {
        let c: Component = sqlx::query_as("SELECT * FROM components WHERE id = $1 AND company_id = $2").bind(id).bind(company_id).fetch_optional(pool).await?.ok_or_else(|| AppError::ComponentNotFound)?;
        let aircraft_reg = if let Some(aid) = c.aircraft_id {
            let reg: Option<(String,)> = sqlx::query_as("SELECT registration_number FROM aircraft WHERE id = $1 AND company_id = $2").bind(aid).bind(company_id).fetch_optional(pool).await?;
            reg.map(|r| r.0)
        } else { None };
        Ok(ComponentResponse { id: c.id, component_uuid: c.component_uuid, aircraft_id: c.aircraft_id, aircraft_registration: aircraft_reg, serial_number: c.serial_number, component_type: c.component_type, manufacturer: c.manufacturer, status: c.status, created_at: c.created_at, updated_at: c.updated_at })
    }
}
