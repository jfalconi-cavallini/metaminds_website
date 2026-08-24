-- Migration 026: Extend RLS SELECT policies to allow 'parent' role
-- Parents have linked_id = their child's student_id (same as student accounts).
-- Parents are read-only — no INSERT/UPDATE/DELETE policies are added.
-- This migration only uses ALTER POLICY so existing policy names are unchanged.

-- ── Fix my_assigned_tutor_id() ────────────────────────────────────
-- This helper was hardcoded to role = 'student'. Parents need it too
-- to resolve which tutor row they're allowed to see.

create or replace function public.my_assigned_tutor_id()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select s.assigned_tutor_id
  from students s
  join profiles p on p.linked_id = s.id
  where p.id = auth.uid() and p.role in ('student', 'parent');
$$;

-- ── students ──────────────────────────────────────────────────────
alter policy "students_select" on students
  using (
    is_admin()
    or (my_role() = 'student' and id = my_linked_id())
    or (my_role() = 'parent'  and id = my_linked_id())
    or (my_role() = 'tutor'   and assigned_tutor_id = my_linked_id())
  );

-- ── tutors ────────────────────────────────────────────────────────
alter policy "tutors_select" on tutors
  using (
    is_admin()
    or (my_role() = 'tutor'   and id = my_linked_id())
    or (my_role() = 'student' and id = my_assigned_tutor_id())
    or (my_role() = 'parent'  and id = my_assigned_tutor_id())
  );

-- ── sessions ──────────────────────────────────────────────────────
alter policy "sessions_select" on sessions
  using (
    is_admin()
    or (my_role() = 'tutor'   and tutor_id = my_linked_id())
    or (my_role() = 'student' and (
          student_id = my_linked_id()
          or tutor_id = my_assigned_tutor_id()
        ))
    or (my_role() = 'parent'  and student_id = my_linked_id())
  );

-- ── user_packages (hours balance) ────────────────────────────────
alter policy "user_packages_select" on user_packages
  using (
    is_admin()
    or (my_role() = 'student' and student_id = my_linked_id())
    or (my_role() = 'parent'  and student_id = my_linked_id())
    or (my_role() = 'tutor'   and student_id = any (my_assigned_student_ids()))
  );

-- ── session_notes ─────────────────────────────────────────────────
alter policy "session_notes_select" on session_notes
  using (
    is_admin()
    or (my_role() = 'tutor'   and tutor_id = my_linked_id())
    or (my_role() = 'student' and student_id = my_linked_id())
    or (my_role() = 'parent'  and student_id = my_linked_id())
  );

-- ── homework ──────────────────────────────────────────────────────
alter policy "homework_select" on homework
  using (
    is_admin()
    or (my_role() = 'tutor'   and tutor_id = my_linked_id())
    or (my_role() = 'student' and student_id = my_linked_id())
    or (my_role() = 'parent'  and student_id = my_linked_id())
  );

-- ── parent_updates ────────────────────────────────────────────────
alter policy "parent_updates_select" on parent_updates
  using (
    is_admin()
    or (my_role() = 'tutor'   and tutor_id = my_linked_id())
    or (my_role() = 'student' and student_id = my_linked_id())
    or (my_role() = 'parent'  and student_id = my_linked_id())
  );
