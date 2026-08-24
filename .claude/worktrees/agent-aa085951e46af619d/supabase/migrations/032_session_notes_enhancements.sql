-- ================================================================
-- Migration 032: Session notes enhancements
-- - Adds kami_link, note_date, attachment_url, attachment_filename
--   columns to session_notes (all nullable, zero-downtime)
-- - Create storage bucket: session-note-attachments
--   (do this manually in Supabase Dashboard → Storage → New bucket
--    Name: session-note-attachments  |  Public: false)
-- Run in: Supabase Dashboard → SQL Editor
-- ================================================================

ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS kami_link          text NULL;
ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS note_date          date NULL;
ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS attachment_url     text NULL;
ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS attachment_filename text NULL;

-- Storage RLS for session-note-attachments bucket
-- After creating the bucket, run the following in SQL Editor:
--
-- insert into storage.buckets (id, name, public) values
--   ('session-note-attachments', 'session-note-attachments', false)
-- on conflict (id) do nothing;
--
-- create policy "session_note_attachments_select" on storage.objects
--   for select to authenticated
--   using (
--     bucket_id = 'session-note-attachments'
--     and (
--       is_admin()
--       or my_role() = 'tutor'
--       or my_role() in ('student', 'parent')
--     )
--   );
--
-- create policy "session_note_attachments_insert" on storage.objects
--   for insert to authenticated
--   with check (
--     bucket_id = 'session-note-attachments'
--     and (is_admin() or my_role() = 'tutor')
--   );
--
-- create policy "session_note_attachments_delete" on storage.objects
--   for delete to authenticated
--   using (
--     bucket_id = 'session-note-attachments'
--     and (is_admin() or my_role() = 'tutor')
--   );
