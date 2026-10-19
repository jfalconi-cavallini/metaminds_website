-- ================================================================
-- Migration 069: Parents can file hour purchase requests
-- Run this in: Supabase Dashboard → SQL Editor
-- Do not apply this from the pull request. Jose applies it.
--
-- Number: the highest file in supabase/migrations is
-- 062_parent_update_session_ownership.sql. 063 exists in production
-- but is not in this repo. 064 through 068 are reserved. 069 is the
-- next free number.
--
-- Context: purchase_requests_insert (migration 016) only allows
-- role 'student' and student_id = my_linked_id(). A parent account
-- is linked to one or more children through parent_students, so
-- that insert is rejected. The portal inserts with .select(), which
-- also needs a SELECT policy that can see the new row.
--
-- Parents may insert and read requests only for their own linked
-- children. Students stay limited to themselves. Tutors stay out.
-- Only the three catalog packages can be inserted.
-- ================================================================

drop policy if exists "purchase_requests_select" on purchase_requests;
create policy "purchase_requests_select" on purchase_requests
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'student' and student_id = my_linked_id())
    or (my_role() = 'parent' and student_id = any(my_parent_student_ids()))
  );

drop policy if exists "purchase_requests_insert" on purchase_requests;
create policy "purchase_requests_insert" on purchase_requests
  for insert to authenticated
  with check (
    (
      (my_role() = 'student' and student_id = my_linked_id())
      or (my_role() = 'parent' and student_id = any(my_parent_student_ids()))
    )
    and (
      (package_label = '1 Hour' and hours = 1 and price = 70)
      or (package_label = '4 Hours' and hours = 4 and price = 260)
      or (package_label = '8 Hours' and hours = 8 and price = 480)
    )
  );
