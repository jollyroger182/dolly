BEGIN;

ALTER TABLE poll_choices ADD COLUMN creator_user_id TEXT;

UPDATE poll_choices pc
SET creator_user_id = p.creator_user_id
FROM polls p
WHERE pc.poll_id = p.id;

ALTER TABLE poll_choices ALTER COLUMN creator_user_id SET NOT NULL;

COMMIT;
