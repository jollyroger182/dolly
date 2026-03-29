CREATE TYPE poll_add_choice_setting AS ENUM ('no_one', 'creator', 'anyone');

ALTER TABLE polls ADD COLUMN add_choice_setting poll_add_choice_setting NOT NULL DEFAULT 'no_one';
