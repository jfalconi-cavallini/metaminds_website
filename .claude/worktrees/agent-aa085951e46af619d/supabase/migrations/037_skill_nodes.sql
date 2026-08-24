-- ─────────────────────────────────────────────────────────────────────────────
-- 037 — Skill Nodes + Student Skills
--
-- Skill nodes are course-agnostic hierarchical entities that represent
-- learnable concepts. They are completely independent of lessons, homework,
-- and sessions — those links come later.
--
-- student_skills records one assessment row per (student, skill) pair.
-- Tutors update mastery scores over time; students and parents read only.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── SKILL NODES ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS skill_nodes (
  id            SERIAL      PRIMARY KEY,
  slug          TEXT        NOT NULL UNIQUE,       -- stable external key, used for seeding
  course        TEXT        NOT NULL,              -- "SAT", "ACT", "AP Calculus AB"
  category      TEXT        NOT NULL,              -- top-level grouping within the course
  parent_id     INT         REFERENCES skill_nodes(id) ON DELETE SET NULL,
  title         TEXT        NOT NULL,
  description   TEXT,
  display_order INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS skill_nodes_course_idx    ON skill_nodes(course);
CREATE INDEX IF NOT EXISTS skill_nodes_category_idx  ON skill_nodes(category);
CREATE INDEX IF NOT EXISTS skill_nodes_parent_idx    ON skill_nodes(parent_id);

-- ── STUDENT SKILLS ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS student_skills (
  id            SERIAL      PRIMARY KEY,
  student_id    INT         NOT NULL REFERENCES students(id)    ON DELETE CASCADE,
  skill_id      INT         NOT NULL REFERENCES skill_nodes(id) ON DELETE CASCADE,
  mastery_score SMALLINT    NOT NULL DEFAULT 0
                              CHECK (mastery_score >= 0 AND mastery_score <= 6),
  status        TEXT        NOT NULL DEFAULT 'not_assessed'
                              CHECK (status IN (
                                'not_assessed', 'needs_work', 'developing',
                                'proficient',   'strong'
                              )),
  tutor_notes   TEXT,
  last_assessed DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, skill_id)
);

CREATE INDEX IF NOT EXISTS student_skills_student_idx ON student_skills(student_id);
CREATE INDEX IF NOT EXISTS student_skills_skill_idx   ON student_skills(skill_id);

-- ── UPDATED_AT TRIGGERS ──────────────────────────────────────────────────────

-- Uses CREATE OR REPLACE so it is safe to run multiple times.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS skill_nodes_updated_at    ON skill_nodes;
DROP TRIGGER IF EXISTS student_skills_updated_at ON student_skills;

CREATE TRIGGER skill_nodes_updated_at
  BEFORE UPDATE ON skill_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER student_skills_updated_at
  BEFORE UPDATE ON student_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE skill_nodes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_skills ENABLE ROW LEVEL SECURITY;

-- ── skill_nodes policies ─────────────────────────────────────────────────────

-- Any authenticated user can read the full skill catalog.
DROP POLICY IF EXISTS skill_nodes_read ON skill_nodes;
CREATE POLICY skill_nodes_read ON skill_nodes
  FOR SELECT TO authenticated
  USING (true);

-- Only admins can insert / update / delete skill nodes.
DROP POLICY IF EXISTS skill_nodes_admin_insert ON skill_nodes;
CREATE POLICY skill_nodes_admin_insert ON skill_nodes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS skill_nodes_admin_update ON skill_nodes;
CREATE POLICY skill_nodes_admin_update ON skill_nodes
  FOR UPDATE TO authenticated
  USING   (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS skill_nodes_admin_delete ON skill_nodes;
CREATE POLICY skill_nodes_admin_delete ON skill_nodes
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── student_skills policies ──────────────────────────────────────────────────

-- Admin: full access.
DROP POLICY IF EXISTS student_skills_admin ON student_skills;
CREATE POLICY student_skills_admin ON student_skills
  FOR ALL TO authenticated
  USING   (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Students: read their own records only.
DROP POLICY IF EXISTS student_skills_student_read ON student_skills;
CREATE POLICY student_skills_student_read ON student_skills
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'student'
        AND linked_id = student_skills.student_id
    )
  );

-- Parents: read their linked student's records.
DROP POLICY IF EXISTS student_skills_parent_read ON student_skills;
CREATE POLICY student_skills_parent_read ON student_skills
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'parent'
        AND linked_id = student_skills.student_id
    )
  );

-- Tutors: full read/write for their assigned students.
DROP POLICY IF EXISTS student_skills_tutor ON student_skills;
CREATE POLICY student_skills_tutor ON student_skills
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN   students s ON s.assigned_tutor_id = p.linked_id
      WHERE  p.id   = auth.uid()
        AND  p.role = 'tutor'
        AND  s.id   = student_skills.student_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN   students s ON s.assigned_tutor_id = p.linked_id
      WHERE  p.id   = auth.uid()
        AND  p.role = 'tutor'
        AND  s.id   = student_skills.student_id
    )
  );
