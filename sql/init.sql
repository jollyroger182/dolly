BEGIN;

DROP TABLE IF EXISTS poll_response_answers;
DROP TABLE IF EXISTS poll_responses;
DROP TABLE IF EXISTS poll_choices;
DROP TABLE IF EXISTS polls;


CREATE TABLE polls (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    creator_user_id TEXT NOT NULL,
    question TEXT NOT NULL,
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

    UNIQUE (id, poll_id),
    UNIQUE (poll_id, position)
);

CREATE INDEX poll_choices_poll ON poll_choices (poll_id);


CREATE TABLE poll_responses (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (id, poll_id),
    UNIQUE (poll_id, user_id)
);

CREATE INDEX poll_responses_poll ON poll_responses (poll_id);
CREATE INDEX poll_responses_user ON poll_responses (user_id);


CREATE TABLE poll_response_answers (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    poll_id INTEGER NOT NULL,
    response_id INTEGER NOT NULL,
    choice_id INTEGER NOT NULL,

    FOREIGN KEY (response_id, poll_id) REFERENCES poll_responses(id, poll_id) ON DELETE CASCADE,
    FOREIGN KEY (choice_id, poll_id) REFERENCES poll_choices(id, poll_id) ON DELETE CASCADE
);

CREATE INDEX poll_response_answers_response ON poll_response_answers (response_id);
CREATE INDEX poll_response_answers_choice ON poll_response_answers (choice_id);

COMMIT;
