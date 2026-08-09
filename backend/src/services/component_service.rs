use crate::{
    db::DbPool,
    errors::AppError,
    models::{
        Aircraft, AircraftWithComponents, Component, ComponentResponse, CreateAircraftRequest,
        CreateComponentRequest,
    },
};

pub struct ComponentService;

impl ComponentService {
    pub async fn create_aircraft(
        pool: &DbPool,
        company_id: i64,
        req: CreateAircraftRequest,
    ) -> Result<Aircraft, AppError> {
        let aircraft_uuid = uuid::Uuid::new_v4().to_string();
        let status = req.status.unwrap_or_else(|| "ACTIVE".to_string());

        let res = sqlx::query(
            "INSERT INTO aircraft (aircraft_uuid, registration_number, model, manufacturer, status, company_id) \
             VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(&aircraft_uuid)
        .bind(&req.registration_number)
        .bind(&req.model)
        .bind(&req.manufacturer)
        .bind(&status)
        .bind(company_id)
        .execute(pool)
        .await
        .map_err(|e| {
            if e.to_string().contains("UNIQUE constraint failed") {
                AppError::Conflict("Aircraft with this registration number already exists".to_string())
            } else {
                AppError::DatabaseError(e)
            }
        })?;

        let id = res.last_insert_rowid();

        let aircraft: Aircraft = sqlx::query_as("SELECT * FROM aircraft WHERE id = ? AND company_id = ?")
            .bind(id)
            .bind(company_id)
            .fetch_one(pool)
            .await?;

        Ok(aircraft)
    }

    pub async fn list_aircraft(pool: &DbPool, company_id: i64) -> Result<Vec<Aircraft>, AppError> {
        let list: Vec<Aircraft> = sqlx::query_as(
            "SELECT * FROM aircraft WHERE company_id = ? ORDER BY id DESC"
        )
        .bind(company_id)
        .fetch_all(pool)
        .await?;

        Ok(list)
    }

    pub async fn get_aircraft_by_id(
        pool: &DbPool,
        company_id: i64,
        id: i64,
    ) -> Result<AircraftWithComponents, AppError> {
        let aircraft: Aircraft = sqlx::query_as("SELECT * FROM aircraft WHERE id = ? AND company_id = ?")
            .bind(id)
            .bind(company_id)
            .fetch_optional(pool)
            .await?
            .ok_or_else(|| AppError::NotFound("Aircraft not found".to_string()))?;

        let components = Self::list_components_by_aircraft(pool, company_id, id).await?;

        Ok(AircraftWithComponents { aircraft, components })
    }

    pub async fn create_component(
        pool: &DbPool,
        company_id: i64,
        req: CreateComponentRequest,
    ) -> Result<ComponentResponse, AppError> {
        // If the caller is attaching this component to an aircraft, that aircraft
        // must belong to the same company — otherwise this would let a company
        // silently bind a component onto another tenant's aircraft.
        if let Some(aircraft_id) = req.aircraft_id {
            let owned: Option<(i64,)> = sqlx::query_as(
                "SELECT id FROM aircraft WHERE id = ? AND company_id = ?"
            )
            .bind(aircraft_id)
            .bind(company_id)
            .fetch_optional(pool)
            .await?;

            if owned.is_none() {
                return Err(AppError::NotFound("Aircraft not found".to_string()));
            }
        }

        let component_uuid = format!("ENG-{}", &uuid::Uuid::new_v4().to_string()[..8].to_uppercase());
        let status = req.status.unwrap_or_else(|| "OPERATIONAL".to_string());

        let res = sqlx::query(
            "INSERT INTO components (component_uuid, aircraft_id, serial_number, component_type, manufacturer, status, company_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&component_uuid)
        .bind(req.aircraft_id)
        .bind(&req.serial_number)
        .bind(&req.component_type)
        .bind(&req.manufacturer)
        .bind(&status)
        .bind(company_id)
        .execute(pool)
        .await
        .map_err(|e| {
            if e.to_string().contains("UNIQUE constraint failed") {
                AppError::Conflict("Component with this serial number already exists".to_string())
            } else {
                AppError::DatabaseError(e)
            }
        })?;

        let id = res.last_insert_rowid();
        Self::get_component_by_id(pool, company_id, id).await
    }

    pub async fn list_components(pool: &DbPool, company_id: i64) -> Result<Vec<ComponentResponse>, AppError> {
        let components: Vec<Component> = sqlx::query_as(
            "SELECT * FROM components WHERE company_id = ? ORDER BY id DESC"
        )
        .bind(company_id)
        .fetch_all(pool)
        .await?;

        let mut responses = Vec::new();
        for c in components {
            let aircraft_reg = if let Some(aid) = c.aircraft_id {
                let reg: Option<(String,)> = sqlx::query_as("SELECT registration_number FROM aircraft WHERE id = ?")
                    .bind(aid)
                    .fetch_optional(pool)
                    .await?;
                reg.map(|r| r.0)
            } else {
                None
            };

            responses.push(ComponentResponse {
                id: c.id,
                component_uuid: c.component_uuid,
                aircraft_id: c.aircraft_id,
                aircraft_registration: aircraft_reg,
                serial_number: c.serial_number,
                component_type: c.component_type,
                manufacturer: c.manufacturer,
                status: c.status,
                created_at: c.created_at,
                updated_at: c.updated_at,
            });
        }

        Ok(responses)
    }

    pub async fn list_components_by_aircraft(
        pool: &DbPool,
        company_id: i64,
        aircraft_id: i64,
    ) -> Result<Vec<ComponentResponse>, AppError> {
        let components: Vec<Component> = sqlx::query_as(
            "SELECT * FROM components WHERE aircraft_id = ? AND company_id = ? ORDER BY id DESC"
        )
        .bind(aircraft_id)
        .bind(company_id)
        .fetch_all(pool)
        .await?;

        let aircraft_reg: Option<(String,)> = sqlx::query_as(
            "SELECT registration_number FROM aircraft WHERE id = ? AND company_id = ?"
        )
        .bind(aircraft_id)
        .bind(company_id)
        .fetch_optional(pool)
        .await?;
        let reg_str = aircraft_reg.map(|r| r.0);

        let mut responses = Vec::new();
        for c in components {
            responses.push(ComponentResponse {
                id: c.id,
                component_uuid: c.component_uuid,
                aircraft_id: c.aircraft_id,
                aircraft_registration: reg_str.clone(),
                serial_number: c.serial_number,
                component_type: c.component_type,
                manufacturer: c.manufacturer,
                status: c.status,
                created_at: c.created_at,
                updated_at: c.updated_at,
            });
        }

        Ok(responses)
    }

    pub async fn get_component_by_id(
        pool: &DbPool,
        company_id: i64,
        id: i64,
    ) -> Result<ComponentResponse, AppError> {
        let c: Component = sqlx::query_as("SELECT * FROM components WHERE id = ? AND company_id = ?")
            .bind(id)
            .bind(company_id)
            .fetch_optional(pool)
            .await?
            .ok_or_else(|| AppError::ComponentNotFound)?;

        let aircraft_reg = if let Some(aid) = c.aircraft_id {
            let reg: Option<(String,)> = sqlx::query_as("SELECT registration_number FROM aircraft WHERE id = ?")
                .bind(aid)
                .fetch_optional(pool)
                .await?;
            reg.map(|r| r.0)
        } else {
            None
        };

        Ok(ComponentResponse {
            id: c.id,
            component_uuid: c.component_uuid,
            aircraft_id: c.aircraft_id,
            aircraft_registration: aircraft_reg,
            serial_number: c.serial_number,
            component_type: c.component_type,
            manufacturer: c.manufacturer,
            status: c.status,
            created_at: c.created_at,
            updated_at: c.updated_at,
        })
    }
}
