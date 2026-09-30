CREATE TABLE IF NOT EXISTS component_rul_records (
    component_id BIGINT PRIMARY KEY REFERENCES components(id) ON DELETE CASCADE,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    features JSONB NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text
);
CREATE INDEX IF NOT EXISTS idx_component_rul_company ON component_rul_records(company_id);
