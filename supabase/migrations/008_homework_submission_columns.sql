-- Migration 008: Add homework submission columns that were in 006 but never run.
-- Run this in: Supabase Dashboard → SQL Editor
--
-- NOTE: Do NOT re-run the storage bucket / policy parts of 006 — the
-- homework-submissions bucket already exists as private with its own policies.

ALTER TABLE homework ADD COLUMN IF NOT EXISTS submission_url      text;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS submission_filename text;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS submitted_at        timestamptz;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS feedback            text;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS feedback_at         timestamptz;
