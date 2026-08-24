-- Migration 006: Homework PDF submissions + Storage bucket
ALTER TABLE homework ADD COLUMN IF NOT EXISTS submission_url      text;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS submission_filename text;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS submitted_at        timestamptz;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS feedback            text;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS feedback_at         timestamptz;

-- Storage bucket for PDF uploads (public so signed URLs aren't required)
INSERT INTO storage.buckets (id, name, public)
VALUES ('homework-submissions', 'homework-submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anon + authenticated users to upload and read from this bucket
DROP POLICY IF EXISTS "hw_submissions_all" ON storage.objects;
CREATE POLICY "hw_submissions_all" ON storage.objects
  FOR ALL TO anon, authenticated
  USING  (bucket_id = 'homework-submissions')
  WITH CHECK (bucket_id = 'homework-submissions');
