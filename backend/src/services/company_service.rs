use crate::{db::DbPool, errors::AppError, models::{Company, CompanySummary, CreateCompanyAdminRequest, CreateCompanyRequest, MaintenanceResultCount, UserResponse, UserRole, UserWorkCount, WorkAnalytics}, services::AuthService};

const VALID_COMPANY_STATUSES: [&str; 2] = ["ACTIVE", "SUSPENDED"];
pub struct CompanyService;

impl CompanyService {
    fn slugify(name: &str) -> String {
        let cleaned: String = name.trim().to_lowercase().chars().map(|c| if c.is_alphanumeric() { c } else { '-' }).collect();
        cleaned.split('-').filter(|s| !s.is_empty()).collect::<Vec<_>>().join("-")
    }

    pub async fn create_company(pool: &DbPool, req: CreateCompanyRequest) -> Result<Company, AppError> {
        let name = req.name.trim().to_string();
        if name.is_empty() { return Err(AppError::ValidationError("Company name is required".to_string())); }
        let requested_slug = req.slug.filter(|s| !s.trim().is_empty());
        let base_slug = Self::slugify(requested_slug.as_deref().unwrap_or(&name));
        let base_slug = if base_slug.is_empty() { "company".to_string() } else { base_slug };
        let mut slug = base_slug.clone(); let mut attempt = 1;
        loop {
            let existing: Option<(i64,)> = sqlx::query_as("SELECT id FROM companies WHERE slug = $1").bind(&slug).fetch_optional(pool).await?;
            if existing.is_none() { break; }
            attempt += 1; slug = format!("{}-{}", base_slug, attempt);
        }
        let company_uuid = uuid::Uuid::new_v4().to_string();
        let (id,): (i64,) = sqlx::query_as("INSERT INTO companies (uuid, name, slug, status) VALUES ($1, $2, $3, 'ACTIVE') RETURNING id")
            .bind(&company_uuid).bind(&name).bind(&slug).fetch_one(pool).await?;
        Ok(sqlx::query_as("SELECT * FROM companies WHERE id = $1").bind(id).fetch_one(pool).await?)
    }

    async fn stats_for(pool: &DbPool, company_id: i64) -> Result<(i64, i64, i64, i64, i64), AppError> {
        let user_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users WHERE company_id = $1").bind(company_id).fetch_one(pool).await?;
        let aircraft_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM aircraft WHERE company_id = $1").bind(company_id).fetch_one(pool).await?;
        let component_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM components WHERE company_id = $1").bind(company_id).fetch_one(pool).await?;
        let maintenance_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM maintenance_records WHERE company_id = $1").bind(company_id).fetch_one(pool).await?;
        let verification_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM verification_logs WHERE company_id = $1").bind(company_id).fetch_one(pool).await?;
        Ok((user_count.0, aircraft_count.0, component_count.0, maintenance_count.0, verification_count.0))
    }

    pub async fn list_companies_with_stats(pool: &DbPool) -> Result<Vec<CompanySummary>, AppError> {
        let companies: Vec<Company> = sqlx::query_as("SELECT * FROM companies ORDER BY id DESC").fetch_all(pool).await?;
        let mut out = Vec::with_capacity(companies.len());
        for company in companies {
            let (user_count, aircraft_count, component_count, maintenance_count, verification_count) = Self::stats_for(pool, company.id).await?;
            out.push(CompanySummary { company, user_count, aircraft_count, component_count, maintenance_count, verification_count });
        }
        Ok(out)
    }

    pub async fn get_company_with_stats(pool: &DbPool, id: i64) -> Result<CompanySummary, AppError> {
        let company: Company = sqlx::query_as("SELECT * FROM companies WHERE id = $1").bind(id).fetch_optional(pool).await?.ok_or_else(|| AppError::NotFound("Company not found".to_string()))?;
        let (user_count, aircraft_count, component_count, maintenance_count, verification_count) = Self::stats_for(pool, company.id).await?;
        Ok(CompanySummary { company, user_count, aircraft_count, component_count, maintenance_count, verification_count })
    }

    pub async fn create_company_admin(pool: &DbPool, company_id: i64, req: CreateCompanyAdminRequest) -> Result<UserResponse, AppError> {
        let existing: Option<(i64,)> = sqlx::query_as("SELECT id FROM companies WHERE id = $1").bind(company_id).fetch_optional(pool).await?;
        if existing.is_none() { return Err(AppError::NotFound("Company not found".to_string())); }
        let name = req.name.trim().to_string(); let email = req.email.trim().to_lowercase();
        if name.is_empty() { return Err(AppError::ValidationError("Name is required".to_string())); }
        if email.is_empty() || !email.contains('@') { return Err(AppError::ValidationError("A valid email is required".to_string())); }
        if req.password.len() < 8 { return Err(AppError::ValidationError("Password must be at least 8 characters".to_string())); }
        AuthService::insert_user(pool, Some(company_id), &name, &email, &req.password, UserRole::CompanyAdmin).await
    }

    pub async fn list_company_users(pool: &DbPool, company_id: i64) -> Result<Vec<UserResponse>, AppError> {
        let existing: Option<(i64,)> = sqlx::query_as("SELECT id FROM companies WHERE id = $1").bind(company_id).fetch_optional(pool).await?;
        if existing.is_none() { return Err(AppError::NotFound("Company not found".to_string())); }
        AuthService::list_users(pool, company_id).await
    }

    pub async fn update_company_status(pool: &DbPool, company_id: i64, status: &str) -> Result<Company, AppError> {
        let status = status.trim().to_uppercase();
        if !VALID_COMPANY_STATUSES.contains(&status.as_str()) { return Err(AppError::ValidationError(format!("Status must be one of: {}", VALID_COMPANY_STATUSES.join(", ")))); }
        let existing: Option<(i64,)> = sqlx::query_as("SELECT id FROM companies WHERE id = $1").bind(company_id).fetch_optional(pool).await?;
        if existing.is_none() { return Err(AppError::NotFound("Company not found".to_string())); }
        sqlx::query("UPDATE companies SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2").bind(&status).bind(company_id).execute(pool).await?;
        Ok(sqlx::query_as("SELECT * FROM companies WHERE id = $1").bind(company_id).fetch_one(pool).await?)
    }

    pub async fn get_work_analytics(pool: &DbPool, company_id: i64) -> Result<WorkAnalytics, AppError> {
        let (total_users, total_aircraft, total_components, total_maintenance_records, total_verifications) = Self::stats_for(pool, company_id).await?;
        let verifications_passed: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM verification_logs WHERE company_id = $1 AND final_result = 'AUTHENTIC'").bind(company_id).fetch_one(pool).await?;
        let maintenance_by_result: Vec<MaintenanceResultCount> = sqlx::query_as("SELECT inspection_result, COUNT(*) as count FROM maintenance_records WHERE company_id = $1 GROUP BY inspection_result").bind(company_id).fetch_all(pool).await?;
        let records_by_user: Vec<UserWorkCount> = sqlx::query_as("SELECT u.id as user_id, u.name as user_name, COUNT(m.id) as maintenance_count FROM users u LEFT JOIN maintenance_records m ON m.technician_id = u.id AND m.company_id = $1 WHERE u.company_id = $2 GROUP BY u.id, u.name ORDER BY maintenance_count DESC").bind(company_id).bind(company_id).fetch_all(pool).await?;
        Ok(WorkAnalytics { company_id, total_users, total_aircraft, total_components, total_maintenance_records, total_verifications, verifications_passed: verifications_passed.0, verifications_failed: total_verifications - verifications_passed.0, maintenance_by_result, records_by_user })
    }
}
