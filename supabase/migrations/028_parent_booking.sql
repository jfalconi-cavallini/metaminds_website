-- Migration 028: Allow parents to book and cancel sessions on behalf of their child.
-- Parents have linked_id = child's student_id and share the student portal.

-- ── sessions: insert (booking) ────────────────────────────────────────────────
drop policy if exists "sessions_insert" on sessions;
create policy "sessions_insert" on sessions
  for insert to authenticated
  with check (
    is_admin()
    or (my_role() = 'tutor'
        and tutor_id   = my_linked_id()
        and student_id = any(my_assigned_student_ids()))
    or (my_role() in ('student', 'parent')
        and student_id = my_linked_id()
        and tutor_id   = my_assigned_tutor_id())
  );

-- ── sessions: update (cancellation / reschedule) ──────────────────────────────
drop policy if exists "sessions_update" on sessions;
create policy "sessions_update" on sessions
  for update to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor'                       and tutor_id   = my_linked_id())
    or (my_role() in ('student', 'parent') and student_id = my_linked_id())
  );

-- ── tutor_availability: select (calendar grid) ────────────────────────────────
drop policy if exists "tutor_availability_select" on tutor_availability;
create policy "tutor_availability_select" on tutor_availability
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor'                       and tutor_id = my_linked_id())
    or (my_role() in ('student', 'parent') and tutor_id = my_assigned_tutor_id())
  );

-- ── tutor_blocked_dates: select (blocked-out days) ────────────────────────────
drop policy if exists "tutor_blocked_dates_select" on tutor_blocked_dates;
create policy "tutor_blocked_dates_select" on tutor_blocked_dates
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor'                       and tutor_id = my_linked_id())
    or (my_role() in ('student', 'parent') and tutor_id = my_assigned_tutor_id())
  );

-- ── blocked_slots: select (slot-level blocks) ─────────────────────────────────
drop policy if exists "blocked_slots_select" on blocked_slots;
create policy "blocked_slots_select" on blocked_slots
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor'                       and tutor_id = my_linked_id())
    or (my_role() in ('student', 'parent') and tutor_id = my_assigned_tutor_id())
  );
