BEGIN;

ALTER TABLE poll_choices ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE poll_choices pc
SET created_at = p.created_at
FROM polls p
WHERE pc.poll_id = p.id;

COMMIT;
