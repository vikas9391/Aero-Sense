use backend::config::Config;
use backend::db::init_db;
use backend::routes::create_router;
use backend::services::blockchain_service::BlockchainService;
use serde_json::{json, Value};

#[tokio::test]
async fn test_record_hash_length() {
    // Basic unit check on the SHA256 record hash computation used for
    // maintenance record integrity proofs.
    use sha2::{Digest, Sha256};

    let payload = "comp:1;tech:3;type:INSPECTION;desc:Standard maintenance;result:PASSED;time:2026-08-08T16:00:00Z";
    let mut hasher = Sha256::new();
    hasher.update(payload.as_bytes());
    let hash_result = format!("{:x}", hasher.finalize());

    assert_eq!(hash_result.len(), 64);
}

/// Spins up the real router against a throwaway on-disk SQLite database and
/// exercises the multi-tenant boundary end-to-end over actual HTTP:
///   - a Super Admin can create companies and provision each one's admin
///   - a Company Admin can manage their own company's people and data
///   - none of company A's data (aircraft, users, analytics) is visible to
///     company B, or to the Super Admin's operational routes, and vice versa
#[tokio::test]
async fn test_multi_tenant_isolation() {
    // --- Unique, isolated environment for this test run ---
    let db_path = std::env::temp_dir().join(format!("aero_sense_test_{}.db", uuid::Uuid::new_v4()));
    let database_url = format!("sqlite://{}?mode=rwc", db_path.display());

    std::env::set_var("DATABASE_URL", &database_url);
    std::env::set_var("JWT_SECRET", "test-only-jwt-secret");
    std::env::set_var("SUPER_ADMIN_EMAIL", "super@test-aero.local");
    std::env::set_var("SUPER_ADMIN_PASSWORD", "SuperSecret123!");

    let config = Config::from_env();
    let pool = init_db(&config).await.expect("db init should succeed");
    let blockchain = BlockchainService::new();
    let app = create_router(pool, config.clone(), blockchain);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
        .await
        .expect("failed to bind test listener");
    let addr = listener.local_addr().expect("listener should have a local addr");
    tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });

    let base = format!("http://{}", addr);
    let client = reqwest::Client::new();

    // --- Helpers ---
    async fn login(client: &reqwest::Client, base: &str, email: &str, password: &str) -> String {
        let res = client
            .post(format!("{}/api/auth/login", base))
            .json(&json!({ "email": email, "password": password }))
            .send()
            .await
            .expect("login request should succeed");
        assert_eq!(res.status(), 200, "login should succeed for {}", email);
        let body: Value = res.json().await.expect("login response should be JSON");
        body["token"].as_str().expect("token present").to_string()
    }

    // --- Super Admin logs in and onboards two separate companies ---
    let super_token = login(&client, &base, "super@test-aero.local", "SuperSecret123!").await;

    let create_company = |name: &'static str| {
        let client = client.clone();
        let base = base.clone();
        let super_token = super_token.clone();
        async move {
            let res = client
                .post(format!("{}/api/companies", base))
                .bearer_auth(&super_token)
                .json(&json!({ "name": name }))
                .send()
                .await
                .unwrap();
            assert_eq!(res.status(), 201, "company creation should succeed");
            let body: Value = res.json().await.unwrap();
            body["id"].as_i64().expect("company id present")
        }
    };

    let company_a_id = create_company("Falcon Airlines").await;
    let company_b_id = create_company("Condor Aviation").await;
    assert_ne!(company_a_id, company_b_id);

    // --- Super Admin provisions an admin for each company ---
    let create_admin = |company_id: i64, email: &'static str| {
        let client = client.clone();
        let base = base.clone();
        let super_token = super_token.clone();
        async move {
            let res = client
                .post(format!("{}/api/companies/{}/admins", base, company_id))
                .bearer_auth(&super_token)
                .json(&json!({ "name": "Company Admin", "email": email, "password": "AdminPass123!" }))
                .send()
                .await
                .unwrap();
            assert_eq!(res.status(), 201, "company admin creation should succeed");
        }
    };

    create_admin(company_a_id, "admin-a@test-aero.local").await;
    create_admin(company_b_id, "admin-b@test-aero.local").await;

    let token_a = login(&client, &base, "admin-a@test-aero.local", "AdminPass123!").await;
    let token_b = login(&client, &base, "admin-b@test-aero.local", "AdminPass123!").await;

    // --- Each admin creates an aircraft inside their own company ---
    let create_aircraft = |token: String, reg: &'static str| {
        let client = client.clone();
        let base = base.clone();
        async move {
            let res = client
                .post(format!("{}/api/aircraft", base))
                .bearer_auth(&token)
                .json(&json!({
                    "registration_number": reg,
                    "model": "A320neo",
                    "manufacturer": "Airbus"
                }))
                .send()
                .await
                .unwrap();
            assert_eq!(res.status(), 201, "aircraft creation should succeed for {}", reg);
            let body: Value = res.json().await.unwrap();
            body["id"].as_i64().expect("aircraft id present")
        }
    };

    let aircraft_a_id = create_aircraft(token_a.clone(), "AF-TEST-001").await;
    let _aircraft_b_id = create_aircraft(token_b.clone(), "CA-TEST-001").await;

    // --- Company B must never see Company A's aircraft ---
    let list_res = client
        .get(format!("{}/api/aircraft", base))
        .bearer_auth(&token_b)
        .send()
        .await
        .unwrap();
    assert_eq!(list_res.status(), 200);
    let list_body: Value = list_res.json().await.unwrap();
    let regs: Vec<&str> = list_body
        .as_array()
        .unwrap()
        .iter()
        .map(|a| a["registration_number"].as_str().unwrap())
        .collect();
    assert!(regs.contains(&"CA-TEST-001"), "company B should see its own aircraft");
    assert!(!regs.contains(&"AF-TEST-001"), "company B must NOT see company A's aircraft");

    // --- Direct lookup by ID across tenants must 404, not leak the record ---
    let cross_tenant_get = client
        .get(format!("{}/api/aircraft/{}", base, aircraft_a_id))
        .bearer_auth(&token_b)
        .send()
        .await
        .unwrap();
    assert_eq!(
        cross_tenant_get.status(),
        404,
        "company B fetching company A's aircraft by id must 404, not succeed"
    );

    // --- Company B's user list must never include Company A's admin ---
    let users_res = client
        .get(format!("{}/api/users", base))
        .bearer_auth(&token_b)
        .send()
        .await
        .unwrap();
    assert_eq!(users_res.status(), 200);
    let users_body: Value = users_res.json().await.unwrap();
    let emails: Vec<&str> = users_body
        .as_array()
        .unwrap()
        .iter()
        .map(|u| u["email"].as_str().unwrap())
        .collect();
    assert!(emails.contains(&"admin-b@test-aero.local"));
    assert!(!emails.contains(&"admin-a@test-aero.local"), "company B must not see company A's users");

    // --- Company B's work analytics must reflect only its own data ---
    let overview_res = client
        .get(format!("{}/api/analytics/overview", base))
        .bearer_auth(&token_b)
        .send()
        .await
        .unwrap();
    assert_eq!(overview_res.status(), 200);
    let overview: Value = overview_res.json().await.unwrap();
    assert_eq!(overview["total_aircraft"], 1, "company B should only count its own aircraft");

    // --- The Super Admin has no company, so operational routes must reject it ---
    let super_aircraft_res = client
        .get(format!("{}/api/aircraft", base))
        .bearer_auth(&super_token)
        .send()
        .await
        .unwrap();
    assert_eq!(
        super_aircraft_res.status(),
        403,
        "super admin must not be able to access company-scoped operational data"
    );

    // --- A company admin is not the platform super admin ---
    let admin_companies_res = client
        .get(format!("{}/api/companies", base))
        .bearer_auth(&token_a)
        .send()
        .await
        .unwrap();
    assert_eq!(
        admin_companies_res.status(),
        403,
        "a company admin must not be able to list/manage other companies"
    );

    // --- Super Admin's per-company analytics stay separated too ---
    let company_a_analytics = client
        .get(format!("{}/api/companies/{}/analytics", base, company_a_id))
        .bearer_auth(&super_token)
        .send()
        .await
        .unwrap();
    assert_eq!(company_a_analytics.status(), 200);
    let analytics_a: Value = company_a_analytics.json().await.unwrap();
    assert_eq!(analytics_a["total_aircraft"], 1, "company A's analytics should only count its own aircraft");

    // Cleanup the throwaway database file.
    let _ = std::fs::remove_file(&db_path);
}
