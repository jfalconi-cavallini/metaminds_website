-- Add photo_url column to tutors table
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS photo_url TEXT;
