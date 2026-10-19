-- ================================================================
-- Migration 071: SAT practice question bank.
--
-- Questions live here, not in the public git repo. The import script
-- writes with the service role, which bypasses RLS. Signed-in
-- students, tutors, and admins may read. Clients cannot insert,
-- update, or delete.
--
-- id examples: MM-001, CB-<questionId>
-- source: metaminds | college_board_test
-- format: text | html
-- ================================================================

create table if not exists public.sat_questions (
  id          text primary key,
  section     text not null,
  domain      text not null,
  skill       text not null,
  skill_code  text,
  difficulty  text not null,
  type        text not null,
  passage     text,
  question    text not null,
  choices     jsonb,
  answer      text not null,
  explanation text not null,
  format      text not null,
  source      text not null,
  source_ref  text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  constraint sat_questions_section_check
    check (section in ('math', 'reading_writing')),
  constraint sat_questions_difficulty_check
    check (difficulty in ('easy', 'medium', 'hard')),
  constraint sat_questions_type_check
    check (type in ('mcq', 'spr')),
  constraint sat_questions_format_check
    check (format in ('text', 'html')),
  constraint sat_questions_source_check
    check (source in ('metaminds', 'college_board_test'))
);

create index if not exists sat_questions_practice_filters_idx
  on public.sat_questions (section, domain, skill, difficulty);

create index if not exists sat_questions_source_idx
  on public.sat_questions (source);

alter table public.sat_questions enable row level security;

revoke all on table public.sat_questions from public, anon, authenticated;
grant select on table public.sat_questions to authenticated;

drop policy if exists "sat_questions_select_practice_roles" on public.sat_questions;
create policy "sat_questions_select_practice_roles"
  on public.sat_questions
  for select
  to authenticated
  using (public.my_role() in ('student', 'tutor', 'admin'));
