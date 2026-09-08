ALTER TABLE component_update_history
    ADD COLUMN IF NOT EXISTS update_note TEXT;
