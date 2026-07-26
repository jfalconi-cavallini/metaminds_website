-- 048: Add missing DELETE policy on homework table
-- Without this, tutors' deleteHomework() calls silently do nothing
-- (Supabase returns success with 0 rows when RLS blocks a DELETE).

CREATE POLICY "homework_delete" ON homework
  FOR DELETE TO authenticated
  USING (
    is_admin()
    OR (my_role() = 'tutor' AND tutor_id = my_linked_id())
  );
