-- NFC hardware UIDs are immutable identities. Keep them normalized and
-- globally unique so the same physical tag cannot be bound twice.
UPDATE component_tags
SET identifier = UPPER(REPLACE(TRIM(identifier), '-', ':'))
WHERE identifier IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_component_tags_identifier
    ON component_tags(identifier);
