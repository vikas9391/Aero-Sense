-- NFC hardware UIDs are immutable identities. The application normalizes
-- every UID before storage; this index is the database-level final guard
-- against registering the same physical tag twice.
CREATE UNIQUE INDEX IF NOT EXISTS uq_component_tags_identifier
    ON component_tags(identifier);
