use crate::db::DbPool;
use crate::errors::AppError;
use sha2::{Digest, Sha256};
use tracing::info;

/// Simulated blockchain: this is still not a real distributed ledger (it's
/// a plain SQLite table, `blockchain_records`), but unlike the original
/// in-memory `HashMap` version, hashes now survive a server restart. That
/// matters because every other piece of verification state (components,
/// tags, maintenance records) is already durable — an in-memory-only
/// integrity registry meant a restart could silently turn every previously
/// AUTHENTIC record into a false BLOCKCHAIN_MISMATCH with no real tampering
/// having occurred.
#[derive(Clone)]
pub struct BlockchainService {
    pool: DbPool,
}

impl BlockchainService {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    pub fn compute_record_hash(
        &self,
        component_id: i64,
        technician_id: i64,
        maintenance_type: &str,
        description: &str,
        inspection_result: &str,
        created_at: &str,
    ) -> String {
        let payload = format!(
            "comp:{};tech:{};type:{};desc:{};result:{};time:{}",
            component_id, technician_id, maintenance_type, description, inspection_result, created_at
        );
        let mut hasher = Sha256::new();
        hasher.update(payload.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    pub async fn store_record_hash(&self, record_id: i64, record_hash: String) -> Result<String, AppError> {
        info!("Storing proof hash on Blockchain for maintenance record #{}", record_id);

        sqlx::query(
            "INSERT INTO blockchain_records (record_id, onchain_hash) VALUES (?, ?) \
             ON CONFLICT(record_id) DO UPDATE SET onchain_hash = excluded.onchain_hash, \
             stored_at = datetime('now')",
        )
        .bind(record_id)
        .bind(&record_hash)
        .execute(&self.pool)
        .await?;

        Ok(record_hash)
    }

    /// Fails **closed**: a record with no matching entry in the on-chain
    /// registry is treated as unverifiable, not automatically valid.
    pub async fn verify_record_hash(&self, record_id: i64, current_db_hash: &str) -> Result<bool, AppError> {
        let row: Option<(String,)> = sqlx::query_as(
            "SELECT onchain_hash FROM blockchain_records WHERE record_id = ?",
        )
        .bind(record_id)
        .fetch_optional(&self.pool)
        .await?;

        match row {
            Some((onchain_hash,)) => Ok(onchain_hash == current_db_hash),
            None => Ok(false),
        }
    }
}
