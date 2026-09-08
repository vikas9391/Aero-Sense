-- Account lifecycle state for tenant users.
-- Suspend and delete are intentionally soft state changes so maintenance
-- and component history remain auditable and foreign-key safe.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
