-- 049: Remap pre-module-split SAT practice test answers to Module 1 / Module 2
--
-- Migration 047 added module column defaulting to 1. Any answers submitted
-- before that change were stored as question_number 1..N with module=1.
-- The UI now shows two grids per section (M1: Q1..ceil(N/2), M2: Q1..floor(N/2)).
-- Answers for the second half of each section (question_number > ceil(N/2))
-- need to become module=2 with question_number restarting from 1.
--
-- Uses the per-submission config to get the correct question counts.

WITH splits AS (
  SELECT
    s.id                                              AS submission_id,
    CEIL(c.rw_question_count::float / 2)::int        AS rw_m1_count,
    CEIL(c.math_question_count::float / 2)::int      AS math_m1_count
  FROM sat_practice_test_submissions s
  JOIN sat_practice_test_configs c ON c.homework_id = s.homework_id
)

-- R&W: move second half to module 2
UPDATE sat_practice_test_answers a
SET
  module          = 2,
  question_number = a.question_number - sp.rw_m1_count
FROM splits sp
WHERE a.submission_id = sp.submission_id
  AND a.section       = 'rw'
  AND a.module        = 1
  AND a.question_number > sp.rw_m1_count;

-- Math: move second half to module 2
WITH splits AS (
  SELECT
    s.id                                              AS submission_id,
    CEIL(c.math_question_count::float / 2)::int      AS math_m1_count
  FROM sat_practice_test_submissions s
  JOIN sat_practice_test_configs c ON c.homework_id = s.homework_id
)

UPDATE sat_practice_test_answers a
SET
  module          = 2,
  question_number = a.question_number - sp.math_m1_count
FROM splits sp
WHERE a.submission_id = sp.submission_id
  AND a.section       = 'math'
  AND a.module        = 1
  AND a.question_number > sp.math_m1_count;
