-- 034_plan_extended_fields.sql
-- Extends student_plans with richer intake data for the multi-step plan wizard.

ALTER TABLE student_plans
  ADD COLUMN IF NOT EXISTS starting_score     integer,         -- baseline at plan creation (immutable)
  ADD COLUMN IF NOT EXISTS section_scores     jsonb DEFAULT '{}'::jsonb,  -- { rw, math } or { english, math, reading, science }
  ADD COLUMN IF NOT EXISTS skill_baseline     jsonb DEFAULT '{}'::jsonb,  -- categoryId → { score 0-6, note, assessedAt, subskills }
  ADD COLUMN IF NOT EXISTS consultation_notes jsonb DEFAULT '{}'::jsonb,  -- { strengths, weaknesses, scheduleConstraints, … }
  ADD COLUMN IF NOT EXISTS sessions_per_week  integer,
  ADD COLUMN IF NOT EXISTS study_minutes_per_week integer;

-- Back-fill starting_score from current_score for existing plans
UPDATE student_plans SET starting_score = current_score WHERE starting_score IS NULL AND current_score IS NOT NULL;
