-- 047: Add module column to sat_practice_test_answers
-- SAT sections are split into Module 1 and Module 2; question numbers restart from 1 per module.
-- Also updates the unique constraint to include module.

ALTER TABLE sat_practice_test_answers
  ADD COLUMN IF NOT EXISTS module INT NOT NULL DEFAULT 1
    CHECK (module IN (1, 2));

-- Drop old constraint and replace with one that includes module
ALTER TABLE sat_practice_test_answers DROP CONSTRAINT IF EXISTS uq_pt_answer;

ALTER TABLE sat_practice_test_answers
  ADD CONSTRAINT uq_pt_answer UNIQUE (submission_id, section, module, question_number);
