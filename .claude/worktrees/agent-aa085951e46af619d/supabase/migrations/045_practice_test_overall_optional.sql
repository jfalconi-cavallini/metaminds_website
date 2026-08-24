-- 045: Make overall_score optional on practice_test_results.
-- Allows logging section-only test results (e.g. Math only) without a composite score.
-- The CHECK constraint still validates non-null values; NULL passes by default in PostgreSQL.

ALTER TABLE practice_test_results ALTER COLUMN overall_score DROP NOT NULL;
