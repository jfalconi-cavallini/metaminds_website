-- ================================================================
-- Migration 004: Tutor blocked dates
-- Run this in the Supabase SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS tutor_blocked_dates (
  id           serial PRIMARY KEY,
  tutor_id     integer NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  blocked_date date NOT NULL,
  reason       text,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (tutor_id, blocked_date)
);

ALTER TABLE tutor_blocked_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "phase1_allow_all" ON tutor_blocked_dates
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
