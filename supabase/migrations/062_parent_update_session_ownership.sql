-- ================================================================
-- Migration 062: A parent update may only tag sessions that belong
-- to that update's student and tutor.
--
-- Context: the tutor portal kept one shared list of ticked sessions
-- across every student composer. Sending one student's update wrote
-- every id still in that list into parent_updates.session_ids
-- (integer[]). The insert policy from migration 014 checks that the
-- tutor is allowed to write a row for that student; it cannot check
-- that each element of an integer array points at a session for the
-- same student and tutor.
--
-- A BEFORE INSERT/UPDATE trigger can. It runs for every writer,
-- including the service role, so a direct Supabase insert cannot
-- bypass it the way an API-only check could (the app inserts from
-- the browser client, then emails separately). Existing rows are
-- left as they are — this does not scan or rewrite them.
-- ================================================================

create or replace function public.enforce_parent_update_session_ownership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mismatch_count integer;
begin
  if new.session_ids is null or cardinality(new.session_ids) = 0 then
    return new;
  end if;

  select count(*) into v_mismatch_count
  from unnest(new.session_ids) as requested(session_id)
  where not exists (
    select 1
    from sessions s
    where s.id = requested.session_id
      and s.student_id = new.student_id
      and s.tutor_id = new.tutor_id
  );

  if v_mismatch_count > 0 then
    raise exception 'parent_updates.session_ids must all reference sessions for this student and tutor'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists parent_updates_session_ownership on parent_updates;

create trigger parent_updates_session_ownership
  before insert or update of session_ids, student_id, tutor_id
  on parent_updates
  for each row
  execute function public.enforce_parent_update_session_ownership();
