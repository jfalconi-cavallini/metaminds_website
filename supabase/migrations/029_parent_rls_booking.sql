-- Migration 029: Fix two RLS gaps that break session booking for parents.
--
-- Gap 1 — sessions SELECT: parents could only see their child's sessions,
--   not all sessions for the child's tutor. The booking calendar needs the
--   tutor's full schedule to mark already-taken slots as unavailable.
--   Without this a parent sees all slots as open even when they're booked.
--
-- Gap 2 — user_packages UPDATE: book_session and cancel_session are
--   SECURITY INVOKER functions, so they run under the caller's RLS.
--   The existing update policy had no parent arm, causing hours deduction
--   to fail with an RLS violation every time a parent booked or cancelled.
--
-- Both functions are also patched to enforce the same lead-time and 48-hour
-- cancel lock for parents as for students — without the fix parents could
-- bypass those rules by calling the functions directly.

-- ── sessions: allow parents to see full tutor calendar ────────────────────────
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
    or (my_role() = 'parent' and (
          student_id = my_linked_id()
          or tutor_id = my_assigned_tutor_id()
        ))
  );

-- ── user_packages: allow parents to update (hours deduction/restore) ──────────
drop policy if exists "user_packages_update" on user_packages;
create policy "user_packages_update" on user_packages
  for update to authenticated
  using (
    is_admin()
    or (my_role() in ('student', 'parent') and student_id = my_linked_id())
    or (my_role() = 'tutor' and student_id = any(my_assigned_student_ids()))
  )
  with check (
    is_admin()
    or (my_role() in ('student', 'parent') and student_id = my_linked_id())
    or (my_role() = 'tutor' and student_id = any(my_assigned_student_ids()))
  );

-- ── book_session: enforce lead time for parents same as students ──────────────
create or replace function public.book_session(
  p_student_id integer,
  p_tutor_id integer,
  p_subject text,
  p_session_date date,
  p_session_time text,
  p_duration_hours numeric,
  p_session_type text,
  p_notes text default null
)
returns sessions
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_role text := my_role();
  v_lead_hours integer;
  v_session_ts timestamptz;
  v_package user_packages;
  v_new_session sessions;
begin
  if v_role in ('student', 'parent') then
    select booking_lead_hours into v_lead_hours from tutors where id = p_tutor_id;
    v_session_ts := (p_session_date::text || ' ' || p_session_time)::timestamptz;
    if v_session_ts < now() + make_interval(hours => coalesce(v_lead_hours, 24)) then
      raise exception 'Sessions must be booked at least % hours in advance.', coalesce(v_lead_hours, 24);
    end if;
  end if;

  select * into v_package
    from user_packages
    where student_id = p_student_id
    order by created_at desc
    limit 1
    for update;

  if v_package is null or (v_package.total_hours - v_package.hours_used) < p_duration_hours then
    raise exception 'Not enough hours remaining to book this session.';
  end if;

  begin
    insert into sessions (
      student_id, tutor_id, subject, session_date, session_time,
      duration_hours, status, session_type, notes
    ) values (
      p_student_id, p_tutor_id, p_subject, p_session_date, p_session_time,
      p_duration_hours, 'upcoming', p_session_type, p_notes
    )
    returning * into v_new_session;
  exception when unique_violation then
    raise exception 'That time slot was just booked by someone else. Please pick another.';
  end;

  update user_packages
    set hours_used = hours_used + p_duration_hours
    where id = v_package.id;

  return v_new_session;
end;
$$;

-- ── cancel_session: enforce 48-hour lock for parents same as students ─────────
create or replace function public.cancel_session(p_session_id integer)
returns sessions
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_role text := my_role();
  v_session sessions;
  v_session_ts timestamptz;
  v_package user_packages;
begin
  select * into v_session from sessions where id = p_session_id for update;
  if v_session is null then
    raise exception 'Session not found.';
  end if;
  if v_session.status <> 'upcoming' then
    raise exception 'Only upcoming sessions can be cancelled.';
  end if;

  if v_role in ('student', 'parent') then
    v_session_ts := (v_session.session_date::text || ' ' || v_session.session_time)::timestamptz;
    if v_session_ts < now() + interval '48 hours' then
      raise exception 'Sessions can only be cancelled at least 48 hours in advance.';
    end if;
  end if;

  update sessions set status = 'cancelled' where id = p_session_id
    returning * into v_session;

  select * into v_package
    from user_packages
    where student_id = v_session.student_id
    order by created_at desc
    limit 1
    for update;

  if v_package is not null then
    update user_packages
      set hours_used = greatest(0, hours_used - v_session.duration_hours)
      where id = v_package.id;
  end if;

  return v_session;
end;
$$;
