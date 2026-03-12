BEGIN;

DROP TABLE IF EXISTS poll_response_answers;
DROP TABLE IF EXISTS poll_responses;
DROP TABLE IF EXISTS poll_choices;
DROP TABLE IF EXISTS polls;


CREATE TABLE polls (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    creator_user_id TEXT NOT NULL,
    question TEXT NOT NULL,
    anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX polls_creator ON polls (creator_user_id);
CREATE INDEX polls_creator_created ON polls (creator_user_id, created_at);


CREATE TABLE poll_choices (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    position INTEGER NOT NULL,

    UNIQUE (id, poll_id)
);

CREATE INDEX poll_choices_poll ON poll_choices (poll_id);
CREATE UNIQUE INDEX poll_choices_poll_position ON poll_choices (poll_id, position);


CREATE TABLE poll_responses (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    choice_id INTEGER NOT NULL REFERENCES poll_choices(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (poll_id, user_id, choice_id)
);

CREATE INDEX poll_responses_poll ON poll_responses (poll_id);
CREATE INDEX poll_responses_user ON poll_responses (user_id);
CREATE INDEX poll_responses_choice ON poll_responses (choice_id);
CREATE INDEX poll_responses_user_choice ON poll_responses (user_id, choice_id);

COMMIT;
