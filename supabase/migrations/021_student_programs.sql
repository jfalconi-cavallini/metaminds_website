-- Migration 021: Dedicated programs column for students
-- Previously programs were stored in subjects[]; this adds a proper column
-- and backfills from subjects so existing records are preserved.

alter table students
  add column if not exists programs text[] not null default '{}';

-- Backfill: copy existing subjects data into programs for all students
update students
  set programs = subjects
  where array_length(subjects, 1) > 0
    and array_length(programs, 1) = 0;
