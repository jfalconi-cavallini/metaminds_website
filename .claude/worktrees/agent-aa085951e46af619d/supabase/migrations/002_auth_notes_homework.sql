-- ================================================================
-- Migration 002: Auth profiles, session notes, homework, zoom link
-- Run this in the Supabase SQL Editor
-- ================================================================

-- ── PROFILES ─────────────────────────────────────────────────────
-- Links Supabase Auth users to portal roles + student/tutor records
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'tutor', 'student')),
  linked_id   integer,        -- tutor_id or student_id; null for admin
  full_name   text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "phase1_allow_all" ON profiles
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Auto-create profile when a new auth user is created
-- Pass role via user_metadata: { "role": "admin", "full_name": "Jose Falconi" }
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── SESSION NOTES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_notes (
  id          serial PRIMARY KEY,
  session_id  integer REFERENCES sessions(id) ON DELETE SET NULL,
  tutor_id    integer NOT NULL REFERENCES tutors(id),
  student_id  integer NOT NULL REFERENCES students(id),
  topic       text NOT NULL,
  notes       text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "phase1_allow_all" ON session_notes
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ── HOMEWORK ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS homework (
  id            serial PRIMARY KEY,
  student_id    integer NOT NULL REFERENCES students(id),
  tutor_id      integer NOT NULL REFERENCES tutors(id),
  task          text NOT NULL,
  assigned_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date      date,
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'submitted', 'completed')),
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
CREATE POLICY "phase1_allow_all" ON homework
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ── ZOOM LINK ON SESSIONS ─────────────────────────────────────────
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS zoom_link text;

-- ── DONE ──────────────────────────────────────────────────────────
-- After running this migration:
-- 1. Go to Supabase Auth → Users → "Add user" → "Create new user"
--    Email: falconicavallinijose@gmail.com  (set a password)
-- 2. Copy the UUID shown for that user
-- 3. Run this INSERT (replace <UUID> with the actual UUID):
--
-- INSERT INTO profiles (id, role, full_name, linked_id)
-- VALUES ('<UUID>', 'admin', 'Jose Falconi', null)
-- ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Jose Falconi';
