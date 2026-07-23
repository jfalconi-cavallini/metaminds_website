-- ─────────────────────────────────────────────────────────────────────────────
-- 039 — Homework Assignment Skills (join table)
--
-- Connects homework assignments to the skill_nodes catalog.
-- One assignment may reinforce multiple skills; one skill may appear across
-- many assignments. student_id is denormalized for efficient RLS evaluation.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS homework_assignment_skills (
  id            SERIAL      PRIMARY KEY,
  assignment_id INT         NOT NULL REFERENCES homework(id)      ON DELETE CASCADE,
  skill_id      INT         NOT NULL REFERENCES skill_nodes(id)   ON DELETE CASCADE,
  student_id    INT         NOT NULL REFERENCES students(id)      ON DELETE CASCADE,
  created_by    INT                  REFERENCES tutors(id)        ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assignment_id, skill_id)
);

CREATE INDEX IF NOT EXISTS has_assignment_idx ON homework_assignment_skills(assignment_id);
CREATE INDEX IF NOT EXISTS has_skill_idx      ON homework_assignment_skills(skill_id);
CREATE INDEX IF NOT EXISTS has_student_idx    ON homework_assignment_skills(student_id);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE homework_assignment_skills ENABLE ROW LEVEL SECURITY;

-- Admin: full access.
DROP POLICY IF EXISTS has_admin ON homework_assignment_skills;
CREATE POLICY has_admin ON homework_assignment_skills
  FOR ALL TO authenticated
  USING   (is_admin())
  WITH CHECK (is_admin());

-- Tutors: full read/write for their assigned students.
DROP POLICY IF EXISTS has_tutor ON homework_assignment_skills;
CREATE POLICY has_tutor ON homework_assignment_skills
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
DROP POLICY IF EXISTS has_student_read ON homework_assignment_skills;
CREATE POLICY has_student_read ON homework_assignment_skills
  FOR SELECT TO authenticated
  USING (
    my_role() = 'student'
    AND student_id = my_linked_id()
  );

-- Parents: read their linked student's records.
DROP POLICY IF EXISTS has_parent_read ON homework_assignment_skills;
CREATE POLICY has_parent_read ON homework_assignment_skills
  FOR SELECT TO authenticated
  USING (
    my_role() = 'parent'
    AND student_id = my_linked_id()
  );
