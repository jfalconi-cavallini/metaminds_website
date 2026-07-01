-- Migration 007: Soft-delete (archive) for students and tutors
ALTER TABLE students ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
ALTER TABLE tutors   ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
