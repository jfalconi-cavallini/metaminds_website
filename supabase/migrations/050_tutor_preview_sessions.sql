-- ─────────────────────────────────────────────────────────────────────────────
-- 050 — Tutor Preview Sessions
--
-- Allows a tutor to open one of their assigned students' portal as a
-- read-only observer. Mirrors admin_preview_sessions (040) but scoped
-- to tutors and their assigned students only.
--
-- Tokens expire after 90 minutes. Only the creating tutor can validate
-- or end their own preview. All access is via service-role API routes.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tutor_preview_sessions (
  id          SERIAL       PRIMARY KEY,
  tutor_id    UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id  INT          NOT NULL REFERENCES students(id)   ON DELETE CASCADE,
  token       UUID         NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  started_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW() + INTERVAL '90 minutes',
  ended_at    TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS tutor_preview_token_idx ON tutor_preview_sessions(token);
CREATE INDEX IF NOT EXISTS tutor_preview_tutor_idx ON tutor_preview_sessions(tutor_id);

ALTER TABLE tutor_preview_sessions ENABLE ROW LEVEL SECURITY;

-- No permissive policies — service-role API routes are the only consumers.
-- Defense in depth: even if a grant were accidentally added, no policy = no access.
