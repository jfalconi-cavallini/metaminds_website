-- 054: Let tutors "unsubmit" a homework submission — send it back to the
-- student with a note and a new due date, instead of grading unfinished work.

ALTER TABLE homework ADD COLUMN IF NOT EXISTS returned_note text;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS returned_at   timestamptz;
