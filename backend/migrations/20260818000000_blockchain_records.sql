-- Persists the simulated on-chain hash registry across server restarts.
CREATE TABLE IF NOT EXISTS blockchain_records (
    record_id BIGINT PRIMARY KEY REFERENCES maintenance_records(id) ON DELETE CASCADE,
    onchain_hash TEXT NOT NULL,
    stored_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
