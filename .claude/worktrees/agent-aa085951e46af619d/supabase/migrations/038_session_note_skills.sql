-- ─────────────────────────────────────────────────────────────────────────────
-- 038 — Session Note Skills (join table)
--
-- Connects session notes to the skill_nodes catalog.
-- One session note may cover many skills; one skill may appear across many
-- session notes. student_id is denormalized for efficient RLS evaluation.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS session_note_skills (
  id              SERIAL      PRIMARY KEY,
  session_note_id INT         NOT NULL REFERENCES session_notes(id) ON DELETE CASCADE,
  skill_id        INT         NOT NULL REFERENCES skill_nodes(id)   ON DELETE CASCADE,
  student_id      INT         NOT NULL REFERENCES students(id)      ON DELETE CASCADE,
  created_by      INT                  REFERENCES tutors(id)        ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_note_id, skill_id)
);

CREATE INDEX IF NOT EXISTS sns_note_idx    ON session_note_skills(session_note_id);
CREATE INDEX IF NOT EXISTS sns_skill_idx   ON session_note_skills(skill_id);
CREATE INDEX IF NOT EXISTS sns_student_idx ON session_note_skills(student_id);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE session_note_skills ENABLE ROW LEVEL SECURITY;

-- Admin: full access.
DROP POLICY IF EXISTS sns_admin ON session_note_skills;
CREATE POLICY sns_admin ON session_note_skills
  FOR ALL TO authenticated
  USING   (is_admin())
  WITH CHECK (is_admin());

-- Tutors: full read/write for their assigned students.
DROP POLICY IF EXISTS sns_tutor ON session_note_skills;
CREATE POLICY sns_tutor ON session_note_skills
  FOR ALL TO authenticated
  USING (
    my_role() = 'tutor'
    AND student_id = ANY(my_assigned_student_ids())
  )
  WITH CHECK (
    my_role() = 'tutor'
    AND student_id = ANY(my_assigned_student_ids())
  );

-- Students: read their own records.
DROP POLICY IF EXISTS sns_student_read ON session_note_skills;
CREATE POLICY sns_student_read ON session_note_skills
  FOR SELECT TO authenticated
  USING (
    my_role() = 'student'
    AND student_id = my_linked_id()
  );

-- Parents: read their linked student's records.
DROP POLICY IF EXISTS sns_parent_read ON session_note_skills;
CREATE POLICY sns_parent_read ON session_note_skills
  FOR SELECT TO authenticated
  USING (
    my_role() = 'parent'
    AND student_id = my_linked_id()
  );
