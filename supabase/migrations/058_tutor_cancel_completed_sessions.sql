-- ================================================================
-- Migration 058: Let tutors/admins cancel a session that already
-- auto-completed.
--
-- Context: app/portal/tutor/page.tsx runs autoCompletePastSessions()
-- on every load, which flips any "upcoming" session whose date has
-- passed to "completed" -- even if the session never actually
-- happened (no-show, forgot to cancel in time, etc). cancel_session
-- (migration 015) then refused to touch anything but "upcoming"
-- sessions, so a tutor trying to clean up or reschedule one of these
-- got a silent failure with no way to fix it.
--
-- The 48-hour lock below was already scoped to students only,
-- specifically because "tutors/admins cancelling on someone's behalf
-- aren't held to it" -- the blanket status check contradicted that
-- intent for tutors/admins, so this loosens it the same way: a
-- student can still only cancel their own "upcoming" sessions, but a
-- tutor/admin can cancel "upcoming" or "completed" ones (hours are
-- refunded either way).
-- ================================================================

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

  if v_role = 'student' then
    if v_session.status <> 'upcoming' then
      raise exception 'Only upcoming sessions can be cancelled.';
    end if;

    -- The 48-hour lock is a courtesy for students cancelling their
    -- own session; tutors/admins cancelling on someone's behalf
    -- aren't held to it (matches how lead-time is scoped).
    v_session_ts := (v_session.session_date::text || ' ' || v_session.session_time)::timestamptz;
    if v_session_ts < now() + interval '48 hours' then
      raise exception 'Sessions can only be cancelled at least 48 hours in advance.';
    end if;
  else
    if v_session.status not in ('upcoming', 'completed') then
      raise exception 'This session has already been cancelled.';
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
