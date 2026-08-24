-- Migration 030: Phase 1 — assignment time estimates and student-reported study time.
--
-- Tutor sets: estimated_minutes, assignment_type, instructions
-- Student reports on submission: student_time_minutes, student_note, difficulty_rating
--
-- All columns are nullable so existing rows and all existing queries are unaffected.

alter table homework
  add column if not exists estimated_minutes    integer,
  add column if not exists assignment_type      text,
  add column if not exists instructions         text,
  add column if not exists student_time_minutes integer,
  add column if not exists student_note         text,
  add column if not exists difficulty_rating    text
    check (difficulty_rating in ('easy', 'appropriate', 'difficult'));
