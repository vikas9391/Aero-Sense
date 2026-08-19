-- Persists the simulated on-chain hash registry that BlockchainService
-- previously kept in an in-memory HashMap. That map was wiped on every
-- server restart, which meant maintenance records verified as AUTHENTIC
-- before a restart would silently fail the blockchain_integrity check
-- afterward, with no data change having actually occurred. This table
-- makes the "chain" (still simulated — this is a plain table, not a real
-- distributed ledger) durable across restarts, matching how every other
-- piece of verification state already behaves.
CREATE TABLE IF NOT EXISTS blockchain_records (
    record_id INTEGER PRIMARY KEY REFERENCES maintenance_records(id) ON DELETE CASCADE,
    onchain_hash TEXT NOT NULL,
    stored_at TEXT NOT NULL DEFAULT (datetime('now'))
);
