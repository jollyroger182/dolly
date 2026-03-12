BEGIN;

CREATE TABLE poll_responses_new (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    choice_id INTEGER NOT NULL REFERENCES poll_choices(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX poll_responses_new_poll ON poll_responses_new (poll_id);
CREATE INDEX poll_responses_new_user ON poll_responses_new (user_id);
CREATE INDEX poll_responses_new_choice ON poll_responses_new (choice_id);
CREATE INDEX poll_responses_new_user_choice ON poll_responses_new (user_id, choice_id);

INSERT INTO poll_responses_new (poll_id, choice_id, user_id, created_at, updated_at)
SELECT pra.poll_id, pra.choice_id, pr.user_id, pr.created_at, pr.updated_at
FROM poll_response_answers pra
JOIN poll_responses pr ON pr.id = pra.response_id;

DROP TABLE poll_response_answers;
DROP TABLE poll_responses;

ALTER TABLE poll_responses_new RENAME TO poll_responses;
ALTER INDEX poll_responses_new_poll RENAME TO poll_responses_poll;
ALTER INDEX poll_responses_new_user RENAME TO poll_responses_user;
ALTER INDEX poll_responses_new_choice RENAME TO poll_responses_choice;
ALTER INDEX poll_responses_new_user_choice RENAME TO poll_responses_user_choice;

ALTER TABLE poll_responses ADD UNIQUE (poll_id, user_id, choice_id);

COMMIT;
