-- 057: Per-student timezone for display purposes.
-- NULL means "use the platform default" (America/New_York) — see
-- lib/portal/timezone.ts. Sessions themselves are still stored as
-- platform-time date/time strings; this only affects how they're shown.

ALTER TABLE students ADD COLUMN IF NOT EXISTS timezone text;
