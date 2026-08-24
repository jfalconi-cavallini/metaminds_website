-- ================================================================
-- Migration 015: Atomic session booking/cancellation + server-side
-- enforcement of lead-time, cancel-lock, and hours-balance rules.
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Context: lib/portal/db.ts's insertSession/cancelSession/
-- bulkInsertSessions each write the `sessions` row and adjust
-- `user_packages.hours_used` as two (or many) separate, unchecked
-- Supabase calls. A failure between them silently desyncs a
-- student's hours balance from their actual session history.
-- Separately, the 48-hour cancel lock, each tutor's booking lead
-- time, and "can't book past your remaining hours" were all only
-- enforced by disabling buttons in the React UI — nothing stopped a
-- direct API call from booking/cancelling outside those rules, and
-- nothing stopped two students from booking the same slot at once
-- (no uniqueness constraint existed on tutor_id/session_date/
-- session_time).
--
-- This migration moves book/cancel/bulk-book into Postgres functions
-- so the session write and the hours adjustment commit together in
-- one transaction, adds a partial unique index so a double-booked
-- slot fails at the database level instead of racing, and re-checks
-- lead-time/cancel-lock/remaining-hours inside the functions so they
-- can't be bypassed by calling the API directly.
--
-- These functions are SECURITY INVOKER (the default) — they run with
-- the calling user's own privileges, so every read/write inside them
-- is still governed by the RLS policies from migration 014. The
-- functions only add the business rules RLS can't express (lead
-- time, cancel lock, sufficient balance, no double-booking); they do
-- not add any new authorization path.
-- ================================================================

-- ── DOUBLE-BOOKING GUARD ──────────────────────────────────────────
-- Only "upcoming" sessions block a slot — a cancelled session must
-- not prevent someone else from booking that time.
-- NOTE: if this fails with a uniqueness violation, the existing data
-- already has two "upcoming" sessions in the same tutor/date/time —
-- resolve that conflict manually before re-running.

create unique index if not exists sessions_no_double_book
  on sessions (tutor_id, session_date, session_time)
  where status = 'upcoming';

-- ── BOOK SESSION ──────────────────────────────────────────────────

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
  -- Lead-time is a courtesy for students booking themselves; tutors
  -- and admins scheduling on someone's behalf aren't held to it.
  if v_role = 'student' then
    select booking_lead_hours into v_lead_hours from tutors where id = p_tutor_id;
    v_session_ts := (p_session_date::text || ' ' || p_session_time)::timestamptz;
    if v_session_ts < now() + make_interval(hours => coalesce(v_lead_hours, 24)) then
      raise exception 'Sessions must be booked at least % hours in advance.', coalesce(v_lead_hours, 24);
    end if;
  end if;

  -- Lock the student's active package so two concurrent bookings
  -- can't both read the same "hours remaining" and overdraw it.
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

-- ── CANCEL SESSION ────────────────────────────────────────────────

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

  -- The 48-hour lock is a courtesy for students cancelling their own
  -- session; tutors/admins cancelling on someone's behalf aren't
  -- held to it (matches how lead-time above is scoped).
  if v_role = 'student' then
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

-- ── BULK BOOK SESSIONS (admin recurring scheduling) ───────────────
-- p_sessions: jsonb array of objects with studentId, tutorId,
-- subject, sessionDate, sessionTime, durationHours, sessionType,
-- and optional zoomLink. Slots that lose the race to
-- sessions_no_double_book are silently skipped (not inserted, hours
-- not deducted) rather than aborting the whole batch.

create or replace function public.bulk_book_sessions(p_sessions jsonb)
returns setof sessions
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_item jsonb;
  v_new_session sessions;
  v_package user_packages;
begin
  for v_item in select * from jsonb_array_elements(p_sessions)
  loop
    v_new_session := null;
    begin
      insert into sessions (
        student_id, tutor_id, subject, session_date, session_time,
        duration_hours, status, session_type, zoom_link
      ) values (
        (v_item->>'studentId')::integer,
        (v_item->>'tutorId')::integer,
        v_item->>'subject',
        (v_item->>'sessionDate')::date,
        v_item->>'sessionTime',
        (v_item->>'durationHours')::numeric,
        'upcoming',
        v_item->>'sessionType',
        nullif(v_item->>'zoomLink', '')
      )
      returning * into v_new_session;
    exception when unique_violation then
      v_new_session := null;
    end;

    if v_new_session is not null then
      return next v_new_session;

      select * into v_package
        from user_packages
        where student_id = v_new_session.student_id
        order by created_at desc
        limit 1
        for update;

      if v_package is not null then
        update user_packages
          set hours_used = hours_used + v_new_session.duration_hours
          where id = v_package.id;
      end if;
    end if;
  end loop;
  return;
end;
$$;
