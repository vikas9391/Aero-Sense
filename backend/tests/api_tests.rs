use backend::config::Config;
use backend::db::{connect_and_migrate, seed};
use backend::routes::create_router;
use backend::services::blockchain_service::BlockchainService;
use serde_json::{json, Value};

#[tokio::test]
async fn test_record_hash_length() {
    use sha2::{Digest, Sha256};
    let payload = "comp:1;tech:3;type:INSPECTION;desc:Standard maintenance;result:PASSED;time:2026-08-08T16:00:00Z";
    let mut hasher = Sha256::new();
    hasher.update(payload.as_bytes());
    let hash_result = format!("{:x}", hasher.finalize());
    assert_eq!(hash_result.len(), 64);
}

/// PostgreSQL integration test. Set TEST_DATABASE_URL to a dedicated throwaway
/// Neon/PostgreSQL database before running this test. It intentionally does not
/// fall back to SQLite because the production backend is PostgreSQL-only.
#[tokio::test]
async fn test_multi_tenant_isolation() {
    let database_url = std::env::var("TEST_DATABASE_URL")
        .expect("TEST_DATABASE_URL must point to a dedicated throwaway PostgreSQL database");
    assert!(database_url.starts_with("postgres://") || database_url.starts_with("postgresql://"));

    std::env::set_var("DATABASE_URL", &database_url);
    std::env::set_var("JWT_SECRET", "test-only-jwt-secret");
    std::env::set_var("SUPER_ADMIN_EMAIL", "super@test-aero.local");
    std::env::set_var("SUPER_ADMIN_PASSWORD", "SuperSecret123!");

    let config = Config::from_env();
    let pool = connect_and_migrate(&config).await.expect("db init should succeed");
    let blockchain = BlockchainService::new(pool.clone());
    seed(&pool, &config, &blockchain).await.expect("seeding should succeed");
    let app = create_router(pool, config.clone(), blockchain);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.expect("failed to bind test listener");
    let addr = listener.local_addr().expect("listener should have a local addr");
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap(); });
    let base = format!("http://{}", addr);
    let client = reqwest::Client::new();

    async fn login(client:&reqwest::Client,base:&str,company_name:&str,email:&str,password:&str)->String{
        let res=client.post(format!("{}/api/auth/login",base)).json(&json!({"company_name":company_name,"email":email,"password":password})).send().await.expect("login request should succeed");
        assert_eq!(res.status(),200,"login should succeed for {}",email);
        let body:Value=res.json().await.expect("login response should be JSON"); body["token"].as_str().expect("token present").to_string()
    }
    async fn assert_login_rejected(client:&reqwest::Client,base:&str,company_name:&str,email:&str,password:&str){
        let res=client.post(format!("{}/api/auth/login",base)).json(&json!({"company_name":company_name,"email":email,"password":password})).send().await.expect("login request should succeed");
        assert_eq!(res.status(),401,"login with the wrong company name must be rejected for {}",email);
    }

    let super_token=login(&client,&base,"Super Admin","super@test-aero.local","SuperSecret123!").await;
    let create_company=|name:&'static str|{let client=client.clone();let base=base.clone();let super_token=super_token.clone();async move{let res=client.post(format!("{}/api/companies",base)).bearer_auth(&super_token).json(&json!({"name":name})).send().await.unwrap();assert_eq!(res.status(),201);let body:Value=res.json().await.unwrap();body["id"].as_i64().unwrap()}};
    let company_a_id=create_company("Falcon Airlines").await; let company_b_id=create_company("Condor Aviation").await; assert_ne!(company_a_id,company_b_id);
    let create_admin=|company_id:i64,email:&'static str|{let client=client.clone();let base=base.clone();let super_token=super_token.clone();async move{let res=client.post(format!("{}/api/companies/{}/admins",base,company_id)).bearer_auth(&super_token).json(&json!({"name":"Company Admin","email":email,"password":"AdminPass123!"})).send().await.unwrap();assert_eq!(res.status(),201)}};
    create_admin(company_a_id,"admin-a@test-aero.local").await; create_admin(company_b_id,"admin-b@test-aero.local").await;
    let token_a=login(&client,&base,"Falcon Airlines","admin-a@test-aero.local","AdminPass123!").await;
    let token_b=login(&client,&base,"Condor Aviation","admin-b@test-aero.local","AdminPass123!").await;
    assert_login_rejected(&client,&base,"Condor Aviation","admin-a@test-aero.local","AdminPass123!").await;
    assert_login_rejected(&client,&base,"Falcon Airlines","super@test-aero.local","SuperSecret123!").await;

    let create_aircraft=|token:String,reg:&'static str|{let client=client.clone();let base=base.clone();async move{let res=client.post(format!("{}/api/aircraft",base)).bearer_auth(&token).json(&json!({"registration_number":reg,"model":"A320neo","manufacturer":"Airbus"})).send().await.unwrap();assert_eq!(res.status(),201);let body:Value=res.json().await.unwrap();body["id"].as_i64().unwrap()}};
    let aircraft_a_id=create_aircraft(token_a.clone(),"AF-TEST-001").await; let _aircraft_b_id=create_aircraft(token_b.clone(),"CA-TEST-001").await;
    let list_res=client.get(format!("{}/api/aircraft",base)).bearer_auth(&token_b).send().await.unwrap(); assert_eq!(list_res.status(),200); let list_body:Value=list_res.json().await.unwrap(); let regs:Vec<&str>=list_body.as_array().unwrap().iter().map(|a|a["registration_number"].as_str().unwrap()).collect(); assert!(regs.contains(&"CA-TEST-001")); assert!(!regs.contains(&"AF-TEST-001"));
    let cross_tenant_get=client.get(format!("{}/api/aircraft/{}",base,aircraft_a_id)).bearer_auth(&token_b).send().await.unwrap(); assert_eq!(cross_tenant_get.status(),404);
    let users_res=client.get(format!("{}/api/users",base)).bearer_auth(&token_b).send().await.unwrap(); assert_eq!(users_res.status(),200); let users_body:Value=users_res.json().await.unwrap(); let emails:Vec<&str>=users_body.as_array().unwrap().iter().map(|u|u["email"].as_str().unwrap()).collect(); assert!(emails.contains(&"admin-b@test-aero.local")); assert!(!emails.contains(&"admin-a@test-aero.local"));
    let overview_res=client.get(format!("{}/api/analytics/overview",base)).bearer_auth(&token_b).send().await.unwrap(); assert_eq!(overview_res.status(),200); let overview:Value=overview_res.json().await.unwrap(); assert_eq!(overview["total_aircraft"],1);
    let super_aircraft_res=client.get(format!("{}/api/aircraft",base)).bearer_auth(&super_token).send().await.unwrap(); assert_eq!(super_aircraft_res.status(),403);
    let admin_companies_res=client.get(format!("{}/api/companies",base)).bearer_auth(&token_a).send().await.unwrap(); assert_eq!(admin_companies_res.status(),403);
    let company_a_analytics=client.get(format!("{}/api/companies/{}/analytics",base,company_a_id)).bearer_auth(&super_token).send().await.unwrap(); assert_eq!(company_a_analytics.status(),200); let analytics_a:Value=company_a_analytics.json().await.unwrap(); assert_eq!(analytics_a["total_aircraft"],1);
}
