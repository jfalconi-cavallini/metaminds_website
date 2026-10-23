-- ================================================================
-- Migration 074: Parents can read SAT practice attempts.
--
-- sat_attempts already lets a student read their own rows, a tutor
-- read assigned students, and an admin read every row. Parents were
-- omitted. This adds a select policy that matches the other portal
-- tables: a parent may read rows whose student_id is in
-- my_parent_student_ids() (the parent_students link).
--
-- No table changes, no backfill, no update or delete.
-- Apply this in the Supabase SQL Editor. Do not run it from the app.
-- ================================================================

drop policy if exists "sat_attempts_select_parent" on public.sat_attempts;
create policy "sat_attempts_select_parent"
  on public.sat_attempts
  for select
  to authenticated
  using (
    public.my_role() = 'parent'
    and student_id = any (public.my_parent_student_ids())
  );
