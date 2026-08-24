-- ─────────────────────────────────────────────────────────────────────────────
-- 040 — Admin Preview Sessions
--
-- Allows an admin to open a student's portal as a read-only observer.
-- The admin remains authenticated as themselves — no impersonation occurs.
--
-- Each preview is identified by a crypto-random UUID token (gen_random_uuid).
-- Tokens expire after 90 minutes and cannot be extended.
-- Only the creating admin can validate or end their own preview.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_preview_sessions (
  id          SERIAL       PRIMARY KEY,
  admin_id    UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id  INT          NOT NULL REFERENCES students(id)   ON DELETE CASCADE,
  token       UUID         NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  started_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW() + INTERVAL '90 minutes',
  ended_at    TIMESTAMPTZ
);

-- Token lookup is the hot path — must be unique and fast
CREATE UNIQUE INDEX IF NOT EXISTS admin_preview_token_idx ON admin_preview_sessions(token);
-- Admin audit queries
CREATE INDEX IF NOT EXISTS admin_preview_admin_idx ON admin_preview_sessions(admin_id);

ALTER TABLE admin_preview_sessions ENABLE ROW LEVEL SECURITY;

-- RLS is enabled with no permissive policies, which blocks all browser-client
-- access. The service-role API routes bypass RLS and are the only intended
-- consumers of this table. Defense in depth: even if a grant were accidentally
-- added, no policy means no access for anon/authenticated roles.
