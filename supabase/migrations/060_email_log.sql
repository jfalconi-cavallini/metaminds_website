-- 060: Record every outbound email the platform sends, so admins/tutors
-- can confirm one actually went out, see when, and preview exactly what
-- the recipient received.
--
-- Rows are written only by API routes using the service-role client
-- (which bypasses RLS), right after a Resend send attempt succeeds or
-- fails — never from the browser.

CREATE TABLE IF NOT EXISTS email_log (
  id                 serial      PRIMARY KEY,
  email_type         text        NOT NULL,   -- 'session_confirmation' | 'session_reminder' | 'homework_reminder' | 'parent_update' | 'welcome_student' | 'welcome_parent' | 'test'
  recipients         text[]      NOT NULL,
  subject            text        NOT NULL,
  html               text        NOT NULL,
  related_student_id integer     REFERENCES students(id) ON DELETE SET NULL,
  related_tutor_id   integer     REFERENCES tutors(id)   ON DELETE SET NULL,
  status             text        NOT NULL DEFAULT 'sent',  -- 'sent' | 'failed'
  error              text,
  sent_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_log_sent_at_idx    ON email_log (sent_at DESC);
CREATE INDEX IF NOT EXISTS email_log_student_idx    ON email_log (related_student_id);
CREATE INDEX IF NOT EXISTS email_log_tutor_idx      ON email_log (related_tutor_id);

ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

-- Admins see every sent email; tutors see only the ones tied to their own
-- tutor_id (their students' confirmations/reminders/updates/welcomes).
-- No insert/update/delete policy for `authenticated` — every write goes
-- through a service-role client in an API route, which bypasses RLS.
CREATE POLICY "email_log_select" ON email_log
  FOR SELECT TO authenticated
  USING (
    is_admin()
    OR (my_role() = 'tutor' AND related_tutor_id = my_linked_id())
  );
