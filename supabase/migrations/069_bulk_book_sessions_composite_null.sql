-- ================================================================
-- Migration 069: bulk_book_sessions must return inserted rows and
-- deduct hours when some session columns are null.
--
-- Number: 069. The highest file in supabase/migrations is
-- 062_parent_update_session_ownership.sql. 063 is already applied
-- in production and is not in this repo. 064 through 068 are
-- reserved for planned work. This file is the next number after
-- that reserved range. Do not renumber it into 063–068.
--
-- Context: recurring bookings call public.bulk_book_sessions
-- (migration 015) from lib/portal/db.ts bulkInsertSessions. The
-- INSERT succeeds, but the function then does
-- `if v_new_session is not null`. v_new_session is a `sessions`
-- composite. In Postgres, `IS NOT NULL` on a composite is true only
-- when every column is non-null; a row that mixes null and non-null
-- columns makes both `IS NULL` and `IS NOT NULL` false. The INSERT
-- never writes notes, and reminder_sent_at (migration 055) is left
-- null too, so the check fails for every inserted row. RETURN NEXT
-- is skipped (the UI gets no sessions back) and hours_used is not
-- increased. A unique-violation still assigns the variable null and
-- must keep skipping that slot.
--
-- Fix: test the row value itself with `IS DISTINCT FROM NULL`.
-- Signature, SECURITY INVOKER, search_path, and existing grants are
-- unchanged. CREATE OR REPLACE keeps the current privileges; this
-- migration does not GRANT or REVOKE.
--
-- No data backfill. Sessions already inserted by the old function
-- are left as they are. A read-only audit query for students whose
-- hours_used may be short lives in the pull request, not here.
-- ================================================================

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

    -- IS NOT NULL is false when any column is null (notes,
    -- reminder_sent_at, and often zoom_link). IS DISTINCT FROM NULL
    -- is false only when the row value itself is null, which is the
    -- unique-violation path above.
    if v_new_session is distinct from null then
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
