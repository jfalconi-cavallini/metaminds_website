-- ─────────────────────────────────────────────────────────────────────────────
-- 044 — Practice Test Results
--
-- Records each scored practice test a student takes.
-- Tutors create/delete; students and parents read only.
-- When a test is logged, the tutor also updates currentScore on the plan.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS practice_test_results (
  id            BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id    INT         NOT NULL REFERENCES students(id)      ON DELETE CASCADE,
  plan_id       INT                  REFERENCES student_plans(id) ON DELETE SET NULL,
  test_date     DATE        NOT NULL,
  overall_score INT         NOT NULL CHECK (overall_score >= 400 AND overall_score <= 1600),
  rw_score      INT                  CHECK (rw_score  >= 200 AND rw_score  <= 800),
  math_score    INT                  CHECK (math_score >= 200 AND math_score <= 800),
  tutor_notes   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ptr_student_idx ON practice_test_results(student_id);
CREATE INDEX IF NOT EXISTS ptr_plan_idx    ON practice_test_results(plan_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE practice_test_results ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "ptr_admin_all" ON practice_test_results
  FOR ALL USING (is_admin());

-- Tutor: select / insert / delete for their assigned students
CREATE POLICY "ptr_tutor_select" ON practice_test_results
  FOR SELECT USING (
    my_role() = 'tutor'
    AND student_id IN (
      SELECT id FROM students WHERE assigned_tutor_id = my_linked_id()
    )
  );

CREATE POLICY "ptr_tutor_insert" ON practice_test_results
  FOR INSERT WITH CHECK (
    my_role() = 'tutor'
    AND student_id IN (
      SELECT id FROM students WHERE assigned_tutor_id = my_linked_id()
    )
  );

CREATE POLICY "ptr_tutor_delete" ON practice_test_results
  FOR DELETE USING (
    my_role() = 'tutor'
    AND student_id IN (
      SELECT id FROM students WHERE assigned_tutor_id = my_linked_id()
    )
  );

-- Student: read own results
CREATE POLICY "ptr_student_select" ON practice_test_results
  FOR SELECT USING (
    my_role() = 'student'
    AND student_id = my_linked_id()
  );

-- Parent: read own child's results
CREATE POLICY "ptr_parent_select" ON practice_test_results
  FOR SELECT USING (
    my_role() = 'parent'
    AND student_id = my_linked_id()
  );
