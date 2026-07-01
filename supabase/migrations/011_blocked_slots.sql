-- Migration 011: Per-slot blocking for tutors
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS blocked_slots (
  id         serial      PRIMARY KEY,
  tutor_id   integer     NOT NULL REFERENCES tutors(id),
  slot_date  date        NOT NULL,
  slot_time  text        NOT NULL,   -- e.g. "4:00 PM"
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tutor_id, slot_date, slot_time)
);

ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_phase1" ON blocked_slots
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
