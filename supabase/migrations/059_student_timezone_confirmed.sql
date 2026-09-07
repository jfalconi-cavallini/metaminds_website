-- 059: Distinguish a family's own admin-entered timezone guess from a
-- confirmed one (auto-detected on dashboard login, or manually corrected
-- in Settings).
--
-- Context: migration 057 added students.timezone, auto-detected on first
-- dashboard visit (app/portal/student/page.tsx) and used to localize
-- session-confirmation emails (lib/portal/timezone.ts). But a session can
-- be booked and its confirmation email sent before the family has ever
-- logged in, while timezone is still null — falling back to the
-- platform's Eastern time, which is wrong for families elsewhere.
--
-- The admin onboarding wizard now lets the admin set an initial guess at
-- student creation (from the family's stated location). This flag marks
-- that guess as unconfirmed so the dashboard's auto-detect effect still
-- overwrites it with the family's real browser timezone on first login,
-- instead of treating the presence of *any* timezone value as final.
-- Once a value is confirmed (by auto-detect or a manual Settings edit),
-- it's never silently overwritten again.

ALTER TABLE students ADD COLUMN IF NOT EXISTS timezone_confirmed boolean NOT NULL DEFAULT false;

-- Existing non-null timezones were only ever set by the auto-detect flow
-- (there was no other way to set one before this migration) — treat them
-- as already confirmed so this change doesn't cause a redetect/reshuffle
-- for families already using the portal.
UPDATE students SET timezone_confirmed = true WHERE timezone IS NOT NULL;
