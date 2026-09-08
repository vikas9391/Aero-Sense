ALTER TABLE component_update_history
    ADD COLUMN IF NOT EXISTS previous_serial_number TEXT,
    ADD COLUMN IF NOT EXISTS previous_component_type TEXT,
    ADD COLUMN IF NOT EXISTS previous_manufacturer TEXT,
    ADD COLUMN IF NOT EXISTS previous_status TEXT,
    ADD COLUMN IF NOT EXISTS previous_aircraft_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_component_update_history_component_id_id
    ON component_update_history(component_id, id DESC);
