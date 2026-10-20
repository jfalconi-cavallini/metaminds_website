-- ================================================================
-- Migration 072: SAT practice attempts.
--
-- One row per submitted answer on /sat-practice. is_correct is
-- computed here, not accepted from the client: the BEFORE INSERT
-- trigger overwrites it from sat_questions. Students may insert
-- and read only their own rows. Tutors may read rows for students
-- assigned to them (students.assigned_tutor_id = the tutor's
-- profiles.linked_id, the same rule as my_assigned_student_ids).
-- Admins may read every row. Clients cannot update or delete.
--
-- Apply this in the Supabase SQL Editor. Do not run it from the app.
-- ================================================================

create or replace function public.sat_parse_numberish(raw text)
returns numeric
language plpgsql
immutable
as $$
declare
  compact text;
  numerator text;
  denominator text;
begin
  -- Keep this in step with parseNumberish in lib/sat/session.ts.
  if raw is null then
    return null;
  end if;
  compact := regexp_replace(btrim(raw), '\s+', '', 'g');
  if compact = '' then
    return null;
  end if;
  if compact ~ '^[+-]?[0-9]+(\.[0-9]+)?$' then
    return compact::numeric;
  end if;
  if compact ~ '^[+-]?[0-9]+/[0-9]+$' then
    numerator := split_part(compact, '/', 1);
    denominator := split_part(compact, '/', 2);
    if denominator::numeric = 0 then
      return null;
    end if;
    return numerator::numeric / denominator::numeric;
  end if;
  return null;
end;
$$;

create or replace function public.sat_response_matches(expected text, given text)
returns boolean
language plpgsql
immutable
as $$
declare
  left_text text := btrim(coalesce(expected, ''));
  right_text text := btrim(coalesce(given, ''));
  left_num numeric;
  right_num numeric;
begin
  -- Keep this in step with responsesMatch in lib/sat/session.ts.
  if right_text = '' then
    return false;
  end if;
  if left_text = right_text then
    return true;
  end if;
  left_num := public.sat_parse_numberish(left_text);
  right_num := public.sat_parse_numberish(right_text);
  if left_num is null or right_num is null then
    return false;
  end if;
  return abs(left_num - right_num) < 0.000000001;
end;
$$;

create or replace function public.sat_attempts_apply_grade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  q_answer text;
  q_type text;
  given text;
begin
  select answer, type into q_answer, q_type
  from public.sat_questions
  where id = new.question_id;

  if q_answer is null or q_type is null then
    raise exception 'sat_attempts.question_id does not match a question'
      using errcode = '23503';
  end if;

  given := btrim(coalesce(new.selected_answer, ''));
  if q_type = 'mcq' then
    new.is_correct := given <> '' and given = q_answer;
  else
    new.is_correct := public.sat_response_matches(q_answer, given);
  end if;

  return new;
end;
$$;

revoke all on function public.sat_parse_numberish(text) from public, anon, authenticated;
revoke all on function public.sat_response_matches(text, text) from public, anon, authenticated;
revoke all on function public.sat_attempts_apply_grade() from public, anon, authenticated;
grant execute on function public.sat_attempts_apply_grade() to authenticated;

create table if not exists public.sat_attempts (
  id                  uuid primary key default gen_random_uuid(),
  student_id          integer not null references public.students(id),
  question_id         text not null references public.sat_questions(id),
  selected_answer     text,
  is_correct          boolean not null,
  time_spent_seconds  integer,
  practice_set_id     uuid,
  created_at          timestamptz not null default now(),
  constraint sat_attempts_time_check
    check (time_spent_seconds is null or (time_spent_seconds >= 0 and time_spent_seconds <= 86400)),
  constraint sat_attempts_answer_len_check
    check (selected_answer is null or char_length(selected_answer) <= 200)
);

create index if not exists sat_attempts_student_created_idx
  on public.sat_attempts (student_id, created_at);

create index if not exists sat_attempts_question_id_idx
  on public.sat_attempts (question_id);

drop trigger if exists sat_attempts_apply_grade on public.sat_attempts;
create trigger sat_attempts_apply_grade
  before insert on public.sat_attempts
  for each row
  execute function public.sat_attempts_apply_grade();

alter table public.sat_attempts enable row level security;

revoke all on table public.sat_attempts from public, anon, authenticated;
grant select, insert on table public.sat_attempts to authenticated;

drop policy if exists "sat_attempts_insert_own" on public.sat_attempts;
create policy "sat_attempts_insert_own"
  on public.sat_attempts
  for insert
  to authenticated
  with check (
    public.my_role() = 'student'
    and student_id = public.my_linked_id()
  );

drop policy if exists "sat_attempts_select_own" on public.sat_attempts;
create policy "sat_attempts_select_own"
  on public.sat_attempts
  for select
  to authenticated
  using (
    public.my_role() = 'student'
    and student_id = public.my_linked_id()
  );

drop policy if exists "sat_attempts_select_tutor" on public.sat_attempts;
create policy "sat_attempts_select_tutor"
  on public.sat_attempts
  for select
  to authenticated
  using (
    public.my_role() = 'tutor'
    and student_id = any (public.my_assigned_student_ids())
  );

drop policy if exists "sat_attempts_select_admin" on public.sat_attempts;
create policy "sat_attempts_select_admin"
  on public.sat_attempts
  for select
  to authenticated
  using (public.is_admin());
