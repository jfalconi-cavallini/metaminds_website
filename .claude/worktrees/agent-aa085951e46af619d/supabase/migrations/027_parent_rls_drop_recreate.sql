-- Migration 027: Drop and recreate SELECT policies with parent role support
-- More reliable than ALTER POLICY — removes any stale cached plans.
-- Parents have linked_id = their child's student_id (same as student accounts, read-only).

-- ── my_assigned_tutor_id(): ensure it includes 'parent' ───────────────────────
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

-- ── students ──────────────────────────────────────────────────────────────────
drop policy if exists "students_select" on students;
create policy "students_select" on students
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor'   and assigned_tutor_id = my_linked_id())
    or (my_role() in ('student', 'parent') and id = my_linked_id())
  );

-- ── tutors ────────────────────────────────────────────────────────────────────
drop policy if exists "tutors_select" on tutors;
create policy "tutors_select" on tutors
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor'                      and id = my_linked_id())
    or (my_role() in ('student', 'parent') and id = my_assigned_tutor_id())
  );

-- ── sessions ──────────────────────────────────────────────────────────────────
drop policy if exists "sessions_select" on sessions;
create policy "sessions_select" on sessions
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor' and tutor_id = my_linked_id())
    or (my_role() = 'student' and (
          student_id = my_linked_id()
          or tutor_id = my_assigned_tutor_id()
        ))
    or (my_role() = 'parent' and student_id = my_linked_id())
  );

-- ── user_packages (hours balance) ─────────────────────────────────────────────
drop policy if exists "user_packages_select" on user_packages;
create policy "user_packages_select" on user_packages
  for select to authenticated
  using (
    is_admin()
    or (my_role() in ('student', 'parent') and student_id = my_linked_id())
    or (my_role() = 'tutor' and student_id = any(my_assigned_student_ids()))
  );

-- ── session_notes ─────────────────────────────────────────────────────────────
drop policy if exists "session_notes_select" on session_notes;
create policy "session_notes_select" on session_notes
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor'                       and tutor_id   = my_linked_id())
    or (my_role() in ('student', 'parent') and student_id = my_linked_id())
  );

-- ── homework ──────────────────────────────────────────────────────────────────
drop policy if exists "homework_select" on homework;
create policy "homework_select" on homework
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor'                       and tutor_id   = my_linked_id())
    or (my_role() in ('student', 'parent') and student_id = my_linked_id())
  );

-- ── parent_updates ────────────────────────────────────────────────────────────
drop policy if exists "parent_updates_select" on parent_updates;
create policy "parent_updates_select" on parent_updates
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor'                       and tutor_id   = my_linked_id())
    or (my_role() in ('student', 'parent') and student_id = my_linked_id())
  );
