use crate::errors::AppError;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tracing::info;

#[derive(Clone)]
pub struct BlockchainService {
    // Simulated on-chain hash registry mapping record_id -> hash_proof
    hash_registry: Arc<Mutex<HashMap<i64, String>>>,
}

impl BlockchainService {
    pub fn new() -> Self {
        Self {
            hash_registry: Arc::new(Mutex::new(HashMap::new())),
        }
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
        let mut registry = self.hash_registry.lock().unwrap();
        registry.insert(record_id, record_hash.clone());
        Ok(record_hash)
    }

    pub async fn verify_record_hash(&self, record_id: i64, current_db_hash: &str) -> Result<bool, AppError> {
        let registry = self.hash_registry.lock().unwrap();
        if let Some(onchain_hash) = registry.get(&record_id) {
            Ok(onchain_hash == current_db_hash)
        } else {
            // For new/seeded records without explicit mock state, if hash exists, compare with hash
            Ok(!current_db_hash.is_empty())
        }
    }
}
