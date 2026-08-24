-- Migration 036: Replace text-based success plan with PDF upload
-- Adds success_plan_url column; keeps success_plan column for legacy data.

alter table students add column if not exists success_plan_url text;

-- Create private storage bucket for success plan PDFs
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'student-success-plans',
  'student-success-plans',
  false,
  10485760,           -- 10 MB
  array['application/pdf']
)
on conflict (id) do nothing;
