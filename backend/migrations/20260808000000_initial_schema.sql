-- Initial Database Schema for Aircraft Component Verification Platform

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS aircraft (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aircraft_uuid TEXT UNIQUE NOT NULL,
    registration_number TEXT UNIQUE NOT NULL,
    model TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS components (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component_uuid TEXT UNIQUE NOT NULL,
    aircraft_id INTEGER REFERENCES aircraft(id) ON DELETE SET NULL,
    serial_number TEXT UNIQUE NOT NULL,
    component_type TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPERATIONAL',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS component_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component_id INTEGER NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    technology TEXT NOT NULL,
    identifier TEXT UNIQUE NOT NULL,
    security_type TEXT NOT NULL,
    tamper_status TEXT NOT NULL DEFAULT 'INTACT',
    registered_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS maintenance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component_id INTEGER NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    technician_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    maintenance_type TEXT NOT NULL,
    description TEXT NOT NULL,
    parts_replaced TEXT,
    inspection_result TEXT NOT NULL,
    record_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS verification_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component_id INTEGER REFERENCES components(id) ON DELETE SET NULL,
    tag_id INTEGER REFERENCES component_tags(id) ON DELETE SET NULL,
    authentication_result BOOLEAN NOT NULL,
    component_binding_result BOOLEAN NOT NULL,
    tamper_result BOOLEAN NOT NULL,
    blockchain_result BOOLEAN NOT NULL,
    final_result TEXT NOT NULL,
    failure_reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid);
CREATE INDEX IF NOT EXISTS idx_aircraft_uuid ON aircraft(aircraft_uuid);
CREATE INDEX IF NOT EXISTS idx_aircraft_reg ON aircraft(registration_number);
CREATE INDEX IF NOT EXISTS idx_components_uuid ON components(component_uuid);
CREATE INDEX IF NOT EXISTS idx_components_serial ON components(serial_number);
CREATE INDEX IF NOT EXISTS idx_components_aircraft ON components(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_tags_identifier ON component_tags(identifier);
CREATE INDEX IF NOT EXISTS idx_tags_component ON component_tags(component_id);
CREATE INDEX IF NOT EXISTS idx_maint_component ON maintenance_records(component_id);
CREATE INDEX IF NOT EXISTS idx_verification_component ON verification_logs(component_id);
