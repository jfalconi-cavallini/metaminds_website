-- ================================================================
-- Migration 005: Extended profile fields for students and tutors
-- Run this in the Supabase SQL Editor
-- ================================================================

ALTER TABLE students ADD COLUMN IF NOT EXISTS phone        text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_name  text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_email text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_phone text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS notes        text;

ALTER TABLE tutors ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS bio   text;
