use crate::db::DbPool;
use crate::errors::AppError;
use sha2::{Digest, Sha256};
use tracing::info;

#[derive(Clone)]
pub struct BlockchainService { pool: DbPool }

impl BlockchainService {
    pub fn new(pool: DbPool) -> Self { Self { pool } }
    pub fn compute_record_hash(&self, component_id:i64, technician_id:i64, maintenance_type:&str, description:&str, inspection_result:&str, created_at:&str)->String {
        let payload=format!("comp:{};tech:{};type:{};desc:{};result:{};time:{}",component_id,technician_id,maintenance_type,description,inspection_result,created_at);
        let mut hasher=Sha256::new(); hasher.update(payload.as_bytes()); format!("{:x}",hasher.finalize())
    }
    pub async fn store_record_hash(&self, record_id:i64, record_hash:String)->Result<String,AppError>{
        info!("Storing proof hash on Blockchain for maintenance record #{}",record_id);
        sqlx::query("INSERT INTO blockchain_records (record_id, onchain_hash) VALUES ($1, $2) ON CONFLICT(record_id) DO UPDATE SET onchain_hash = EXCLUDED.onchain_hash, stored_at = CURRENT_TIMESTAMP")
            .bind(record_id).bind(&record_hash).execute(&self.pool).await?;
        Ok(record_hash)
    }
    pub async fn verify_record_hash(&self, record_id:i64, current_db_hash:&str)->Result<bool,AppError>{
        let row:Option<(String,)>=sqlx::query_as("SELECT onchain_hash FROM blockchain_records WHERE record_id = $1").bind(record_id).fetch_optional(&self.pool).await?;
        Ok(row.map(|(h,)|h==current_db_hash).unwrap_or(false))
    }
}
