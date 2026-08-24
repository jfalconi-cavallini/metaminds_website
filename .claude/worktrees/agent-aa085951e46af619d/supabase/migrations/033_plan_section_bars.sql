-- 033_plan_section_bars.sql
-- Adds per-category starting proficiency (bars, 0–4) to student plans.
-- Also adds a cascade delete so removing a plan removes its lessons.

ALTER TABLE student_plans
  ADD COLUMN IF NOT EXISTS section_bars jsonb DEFAULT '{}'::jsonb;

-- Ensure plan_lessons cascade on plan delete (may already exist, safe to re-run)
ALTER TABLE student_plan_lessons
  DROP CONSTRAINT IF EXISTS student_plan_lessons_plan_id_fkey;

ALTER TABLE student_plan_lessons
  ADD CONSTRAINT student_plan_lessons_plan_id_fkey
  FOREIGN KEY (plan_id) REFERENCES student_plans(id) ON DELETE CASCADE;
