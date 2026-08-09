-- Multi-tenant support.
--
-- Adds a `companies` table (tenants) and a `company_id` on every table that holds
-- company-owned data. The Super Admin account has `company_id IS NULL` — it is the
-- only role allowed to operate outside of a single company's boundary (creating
-- companies + their first admin). Every other role always belongs to exactly one
-- company, and every application query that reads or writes tenant data is scoped
-- with `WHERE company_id = ?` bound from the caller's own JWT — never from
-- client-supplied input — so one company's records can never be read, listed, or
-- modified by another company's users.

CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

ALTER TABLE users ADD COLUMN company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE aircraft ADD COLUMN company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE components ADD COLUMN company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE component_tags ADD COLUMN company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE maintenance_records ADD COLUMN company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE verification_logs ADD COLUMN company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_aircraft_company ON aircraft(company_id);
CREATE INDEX IF NOT EXISTS idx_components_company ON components(company_id);
CREATE INDEX IF NOT EXISTS idx_tags_company ON component_tags(company_id);
CREATE INDEX IF NOT EXISTS idx_maint_company ON maintenance_records(company_id);
CREATE INDEX IF NOT EXISTS idx_verification_company ON verification_logs(company_id);
