-- ================================================================
-- Migration 046: SAT Practice Test structured assignment type
--
-- Adds three tables:
--   sat_practice_test_configs      — assignment-level config created by tutor per homework
--   sat_practice_test_submissions  — one per student per homework (draft until submitted)
--   sat_practice_test_answers      — one row per question
-- ================================================================

-- ── sat_practice_test_configs ────────────────────────────────────

CREATE TABLE sat_practice_test_configs (
  id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  homework_id          INT    NOT NULL REFERENCES homework(id) ON DELETE CASCADE,
  provider             TEXT   NOT NULL DEFAULT 'bluebook',
  assigned_test_name   TEXT,
  assigned_version     TEXT,
  rw_question_count    INT    NOT NULL DEFAULT 54,
  math_question_count  INT    NOT NULL DEFAULT 44,
  external_link        TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_pt_config_homework UNIQUE (homework_id)
);

ALTER TABLE sat_practice_test_configs ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_all" ON sat_practice_test_configs FOR ALL TO authenticated
  USING   (is_admin())
  WITH CHECK (is_admin());

-- Tutor: read/write/delete their own assignments
CREATE POLICY "tutor_select" ON sat_practice_test_configs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM homework h
      WHERE h.id = homework_id
        AND h.tutor_id = my_linked_id()
        AND my_role() = 'tutor'
    )
  );

CREATE POLICY "tutor_insert" ON sat_practice_test_configs FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM homework h
      WHERE h.id = homework_id
        AND h.tutor_id = my_linked_id()
        AND my_role() = 'tutor'
    )
  );

CREATE POLICY "tutor_update" ON sat_practice_test_configs FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM homework h
      WHERE h.id = homework_id
        AND h.tutor_id = my_linked_id()
        AND my_role() = 'tutor'
    )
  );

CREATE POLICY "tutor_delete" ON sat_practice_test_configs FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM homework h
      WHERE h.id = homework_id
        AND h.tutor_id = my_linked_id()
        AND my_role() = 'tutor'
    )
  );

-- Student: read their own assignment config
CREATE POLICY "student_select" ON sat_practice_test_configs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM homework h
      WHERE h.id = homework_id
        AND h.student_id = my_linked_id()
        AND my_role() = 'student'
    )
  );

-- Parent: read their child's assignment config
CREATE POLICY "parent_select" ON sat_practice_test_configs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM homework h
      JOIN students s ON s.id = h.student_id
      WHERE h.id = homework_id
        AND s.id = my_linked_id()
        AND my_role() = 'parent'
    )
  );

-- ── sat_practice_test_submissions ────────────────────────────────

CREATE TABLE sat_practice_test_submissions (
  id                           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  homework_id                  INT    NOT NULL REFERENCES homework(id) ON DELETE CASCADE,
  student_id                   INT    NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  submitted_provider           TEXT,
  submitted_test_name          TEXT,
  submitted_version            TEXT,
  completed_date               DATE,
  completion_scope             TEXT   NOT NULL DEFAULT 'full'
                                      CHECK (completion_scope IN ('full', 'partial')),
  total_score                  INT    CHECK (total_score BETWEEN 400 AND 1600),
  rw_score                     INT    CHECK (rw_score BETWEEN 200 AND 800),
  math_score                   INT    CHECK (math_score BETWEEN 200 AND 800),
  score_pending                BOOLEAN NOT NULL DEFAULT FALSE,
  active_minutes               INT,
  score_report_url             TEXT,
  score_report_filename        TEXT,
  reflection_difficult_section TEXT,
  reflection_ran_out_of_time   TEXT,
  reflection_trouble_topics    TEXT,
  reflection_review_requests   TEXT,
  category_breakdown           JSONB,
  category_score_format        TEXT   NOT NULL DEFAULT 'correct_total'
                                      CHECK (category_score_format IN ('bars', 'correct_total')),
  is_draft                     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_pt_submission UNIQUE (homework_id, student_id)
);

ALTER TABLE sat_practice_test_submissions ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_all" ON sat_practice_test_submissions FOR ALL TO authenticated
  USING   (is_admin())
  WITH CHECK (is_admin());

-- Tutor: read all submissions for their students
CREATE POLICY "tutor_select" ON sat_practice_test_submissions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM homework h
      WHERE h.id = homework_id
        AND h.tutor_id = my_linked_id()
        AND my_role() = 'tutor'
    )
  );

-- Student: select/insert/update own submissions
CREATE POLICY "student_select" ON sat_practice_test_submissions FOR SELECT TO authenticated
  USING (student_id = my_linked_id() AND my_role() = 'student');

CREATE POLICY "student_insert" ON sat_practice_test_submissions FOR INSERT TO authenticated
  WITH CHECK (student_id = my_linked_id() AND my_role() = 'student');

CREATE POLICY "student_update" ON sat_practice_test_submissions FOR UPDATE TO authenticated
  USING (student_id = my_linked_id() AND my_role() = 'student');

-- Parent: read-only
CREATE POLICY "parent_select" ON sat_practice_test_submissions FOR SELECT TO authenticated
  USING (student_id = my_linked_id() AND my_role() = 'parent');

-- ── sat_practice_test_answers ────────────────────────────────────

CREATE TABLE sat_practice_test_answers (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  submission_id    BIGINT NOT NULL REFERENCES sat_practice_test_submissions(id) ON DELETE CASCADE,
  section          TEXT   NOT NULL CHECK (section IN ('rw', 'math')),
  question_number  INT    NOT NULL,
  response_type    TEXT   NOT NULL DEFAULT 'choice'
                          CHECK (response_type IN ('choice', 'numeric', 'skipped')),
  selected_choice  TEXT   CHECK (selected_choice IN ('A', 'B', 'C', 'D')),
  numeric_response TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_pt_answer UNIQUE (submission_id, section, question_number)
);

ALTER TABLE sat_practice_test_answers ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_all" ON sat_practice_test_answers FOR ALL TO authenticated
  USING   (is_admin())
  WITH CHECK (is_admin());

-- Tutor: read via submission → homework → tutor_id
CREATE POLICY "tutor_select" ON sat_practice_test_answers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sat_practice_test_submissions sub
      JOIN homework h ON h.id = sub.homework_id
      WHERE sub.id = submission_id
        AND h.tutor_id = my_linked_id()
        AND my_role() = 'tutor'
    )
  );

-- Student: full access to their own answers (via submission.student_id)
CREATE POLICY "student_select" ON sat_practice_test_answers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sat_practice_test_submissions sub
      WHERE sub.id = submission_id
        AND sub.student_id = my_linked_id()
        AND my_role() = 'student'
    )
  );

CREATE POLICY "student_insert" ON sat_practice_test_answers FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sat_practice_test_submissions sub
      WHERE sub.id = submission_id
        AND sub.student_id = my_linked_id()
        AND my_role() = 'student'
    )
  );

CREATE POLICY "student_update" ON sat_practice_test_answers FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sat_practice_test_submissions sub
      WHERE sub.id = submission_id
        AND sub.student_id = my_linked_id()
        AND my_role() = 'student'
    )
  );

CREATE POLICY "student_delete" ON sat_practice_test_answers FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sat_practice_test_submissions sub
      WHERE sub.id = submission_id
        AND sub.student_id = my_linked_id()
        AND my_role() = 'student'
    )
  );

-- Parent: read-only
CREATE POLICY "parent_select" ON sat_practice_test_answers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sat_practice_test_submissions sub
      WHERE sub.id = submission_id
        AND sub.student_id = my_linked_id()
        AND my_role() = 'parent'
    )
  );

-- ── Indexes ──────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS sat_pt_cfg_hw_idx  ON sat_practice_test_configs(homework_id);
CREATE INDEX IF NOT EXISTS sat_pt_sub_hw_idx  ON sat_practice_test_submissions(homework_id);
CREATE INDEX IF NOT EXISTS sat_pt_sub_stu_idx ON sat_practice_test_submissions(student_id);
CREATE INDEX IF NOT EXISTS sat_pt_ans_sub_idx ON sat_practice_test_answers(submission_id);

-- ── updated_at triggers ──────────────────────────────────────────

-- Reuse or recreate the set_updated_at function (safe with CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER sat_pt_submission_updated_at
  BEFORE UPDATE ON sat_practice_test_submissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER sat_pt_answer_updated_at
  BEFORE UPDATE ON sat_practice_test_answers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
