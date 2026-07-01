-- Migration 010: Parent updates table + enable Supabase Realtime
CREATE TABLE IF NOT EXISTS parent_updates (
  id         serial      PRIMARY KEY,
  tutor_id   integer     NOT NULL REFERENCES tutors(id),
  student_id integer     NOT NULL REFERENCES students(id),
  message    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE parent_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_phase1" ON parent_updates
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Enable Supabase Realtime for live updates in both portals
-- These must be run as the database owner (available in Supabase SQL Editor)
ALTER PUBLICATION supabase_realtime ADD TABLE homework;
ALTER PUBLICATION supabase_realtime ADD TABLE parent_updates;
