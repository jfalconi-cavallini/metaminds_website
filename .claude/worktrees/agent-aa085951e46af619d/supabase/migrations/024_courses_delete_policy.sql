-- Migration 024: Allow admins to delete courses
-- The courses table was missing a DELETE RLS policy.

create policy "courses_delete" on courses
  for delete to authenticated
  using (is_admin());
