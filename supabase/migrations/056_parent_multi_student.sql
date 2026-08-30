-- ================================================================
-- Migration 056: Multi-child parent accounts
--
-- Until now, a parent login mapped to exactly one student via
-- profiles.linked_id, and every "parent can see X" RLS policy in
-- the schema checked `student_id = my_linked_id()`. Onboarding a
-- second child under the same parent email silently overwrote that
-- parent's linked_id, breaking access to the first child.
--
-- This migration adds a parent_students join table (one parent
-- profile -> many students) and rewrites every existing parent-role
-- RLS policy to use it instead of the single-valued linked_id.
-- ================================================================

-- ── PARENT_STUDENTS ──────────────────────────────────────────────
-- Internal linking table only — no client ever queries it directly
-- (the child list is read via the `students` table, scoped by the
-- rewritten students_select policy below). RLS enabled with zero
-- policies, same treatment migration 014 gave session_requests:
-- accessible only via SECURITY DEFINER helper functions or the
-- service-role key (admin API routes).

create table if not exists parent_students (
  id                serial primary key,
  parent_profile_id uuid    not null references profiles(id) on delete cascade,
  student_id        integer not null references students(id) on delete cascade,
  created_at        timestamptz default now(),
  unique (parent_profile_id, student_id)
);

alter table parent_students enable row level security;

-- Backfill every existing single-child parent so nothing breaks.
insert into parent_students (parent_profile_id, student_id)
select id, linked_id from profiles
where role = 'parent' and linked_id is not null
on conflict do nothing;

-- ── HELPER FUNCTIONS ─────────────────────────────────────────────

create or replace function public.my_parent_student_ids()
returns integer[]
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(array_agg(student_id), '{}')
  from parent_students
  where parent_profile_id = auth.uid();
$$;

create or replace function public.my_parent_tutor_ids()
returns integer[]
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(array_agg(distinct s.assigned_tutor_id), '{}')
  from students s
  join parent_students ps on ps.student_id = s.id
  where ps.parent_profile_id = auth.uid()
    and s.assigned_tutor_id is not null;
$$;

-- my_assigned_tutor_id() was widened to cover 'parent' in migration
-- 026/027 (single-valued, via profiles.linked_id). A parent's two
-- kids can now have two different tutors, so that no longer holds —
-- revert to student-only; every parent call site below moves to
-- my_parent_tutor_ids() instead.
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
  where p.id = auth.uid() and p.role = 'student';
$$;

-- ── STUDENTS ──────────────────────────────────────────────────────
drop policy if exists "students_select" on students;
create policy "students_select" on students
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor'   and assigned_tutor_id = my_linked_id())
    or (my_role() = 'student' and id = my_linked_id())
    or (my_role() = 'parent'  and id = any(my_parent_student_ids()))
  );

-- ── TUTORS ────────────────────────────────────────────────────────
drop policy if exists "tutors_select" on tutors;
create policy "tutors_select" on tutors
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor'   and id = my_linked_id())
    or (my_role() = 'student' and id = my_assigned_tutor_id())
    or (my_role() = 'parent'  and id = any(my_parent_tutor_ids()))
  );

-- ── SESSIONS ──────────────────────────────────────────────────────
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
          student_id = any(my_parent_student_ids())
          or tutor_id = any(my_parent_tutor_ids())
        ))
  );

-- sessions_insert is NOT a pure substitution: the parent branch must
-- tie the booked tutor to *that specific* student's assigned tutor,
-- not "any of my kids' tutors" — otherwise a parent could book Child
-- A's slot against Child B's tutor.
drop policy if exists "sessions_insert" on sessions;
create policy "sessions_insert" on sessions
  for insert to authenticated
  with check (
    is_admin()
    or (my_role() = 'tutor'
        and tutor_id   = my_linked_id()
        and student_id = any(my_assigned_student_ids()))
    or (my_role() = 'student'
        and student_id = my_linked_id()
        and tutor_id   = my_assigned_tutor_id())
    or (my_role() = 'parent'
        and student_id = any(my_parent_student_ids())
        and tutor_id = (select assigned_tutor_id from students where id = sessions.student_id))
  );

drop policy if exists "sessions_update" on sessions;
create policy "sessions_update" on sessions
  for update to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor'   and tutor_id = my_linked_id())
    or (my_role() = 'student' and student_id = my_linked_id())
    or (my_role() = 'parent'  and student_id = any(my_parent_student_ids()))
  );

-- ── USER_PACKAGES (hours balance) ────────────────────────────────
drop policy if exists "user_packages_select" on user_packages;
create policy "user_packages_select" on user_packages
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'student' and student_id = my_linked_id())
    or (my_role() = 'parent'  and student_id = any(my_parent_student_ids()))
    or (my_role() = 'tutor'   and student_id = any(my_assigned_student_ids()))
  );

drop policy if exists "user_packages_update" on user_packages;
create policy "user_packages_update" on user_packages
  for update to authenticated
  using (
    is_admin()
    or (my_role() = 'student' and student_id = my_linked_id())
    or (my_role() = 'parent'  and student_id = any(my_parent_student_ids()))
    or (my_role() = 'tutor'   and student_id = any(my_assigned_student_ids()))
  )
  with check (
    is_admin()
    or (my_role() = 'student' and student_id = my_linked_id())
    or (my_role() = 'parent'  and student_id = any(my_parent_student_ids()))
    or (my_role() = 'tutor'   and student_id = any(my_assigned_student_ids()))
  );

-- ── SESSION_NOTES ─────────────────────────────────────────────────
drop policy if exists "session_notes_select" on session_notes;
create policy "session_notes_select" on session_notes
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor'   and tutor_id   = my_linked_id())
    or (my_role() = 'student' and student_id = my_linked_id())
    or (my_role() = 'parent'  and student_id = any(my_parent_student_ids()))
  );

-- ── HOMEWORK ──────────────────────────────────────────────────────
drop policy if exists "homework_select" on homework;
create policy "homework_select" on homework
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor'   and tutor_id   = my_linked_id())
    or (my_role() = 'student' and student_id = my_linked_id())
    or (my_role() = 'parent'  and student_id = any(my_parent_student_ids()))
  );

-- ── PARENT_UPDATES ────────────────────────────────────────────────
drop policy if exists "parent_updates_select" on parent_updates;
create policy "parent_updates_select" on parent_updates
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor'   and tutor_id   = my_linked_id())
    or (my_role() = 'student' and student_id = my_linked_id())
    or (my_role() = 'parent'  and student_id = any(my_parent_student_ids()))
  );

-- ── TUTOR_AVAILABILITY / TUTOR_BLOCKED_DATES / BLOCKED_SLOTS ─────
drop policy if exists "tutor_availability_select" on tutor_availability;
create policy "tutor_availability_select" on tutor_availability
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor'   and tutor_id = my_linked_id())
    or (my_role() = 'student' and tutor_id = my_assigned_tutor_id())
    or (my_role() = 'parent'  and tutor_id = any(my_parent_tutor_ids()))
  );

drop policy if exists "tutor_blocked_dates_select" on tutor_blocked_dates;
create policy "tutor_blocked_dates_select" on tutor_blocked_dates
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor'   and tutor_id = my_linked_id())
    or (my_role() = 'student' and tutor_id = my_assigned_tutor_id())
    or (my_role() = 'parent'  and tutor_id = any(my_parent_tutor_ids()))
  );

drop policy if exists "blocked_slots_select" on blocked_slots;
create policy "blocked_slots_select" on blocked_slots
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor'   and tutor_id = my_linked_id())
    or (my_role() = 'student' and tutor_id = my_assigned_tutor_id())
    or (my_role() = 'parent'  and tutor_id = any(my_parent_tutor_ids()))
  );

-- ── STUDENT_PLANS / STUDENT_PLAN_LESSONS ─────────────────────────
alter policy "student_plans_select" on student_plans
  using (
    is_admin()
    or (my_role() = 'student' and student_id = my_linked_id())
    or (my_role() = 'parent'  and student_id = any(my_parent_student_ids()))
    or (my_role() = 'tutor'   and tutor_id   = my_linked_id())
  );

drop policy if exists "plan_lessons_select" on student_plan_lessons;
create policy "plan_lessons_select" on student_plan_lessons
  for select to authenticated
  using (
    is_admin()
    or exists (
      select 1 from student_plans sp
      where sp.id = plan_id
        and (
          (my_role() = 'student' and sp.student_id = my_linked_id())
          or (my_role() = 'parent'  and sp.student_id = any(my_parent_student_ids()))
          or (my_role() = 'tutor'   and sp.tutor_id   = my_linked_id())
        )
    )
  );

-- ── STUDY_LOG ─────────────────────────────────────────────────────
drop policy if exists "study_log_select" on study_log;
create policy "study_log_select" on study_log
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'student' and student_id = my_linked_id())
    or (my_role() = 'parent'  and student_id = any(my_parent_student_ids()))
    or (my_role() = 'tutor'   and student_id = any(my_assigned_student_ids()))
  );

drop policy if exists "study_log_insert" on study_log;
create policy "study_log_insert" on study_log
  for insert to authenticated
  with check (
    is_admin()
    or (my_role() = 'student' and student_id = my_linked_id())
    or (my_role() = 'parent'  and student_id = any(my_parent_student_ids()))
  );

drop policy if exists "study_log_update" on study_log;
create policy "study_log_update" on study_log
  for update to authenticated
  using (
    is_admin()
    or (my_role() = 'student' and student_id = my_linked_id())
    or (my_role() = 'parent'  and student_id = any(my_parent_student_ids()))
  )
  with check (
    is_admin()
    or (my_role() = 'student' and student_id = my_linked_id())
    or (my_role() = 'parent'  and student_id = any(my_parent_student_ids()))
  );

-- ── STUDENT_SKILLS ────────────────────────────────────────────────
drop policy if exists student_skills_parent_read on student_skills;
create policy student_skills_parent_read on student_skills
  for select to authenticated
  using (
    my_role() = 'parent' and student_id = any(my_parent_student_ids())
  );

-- ── HOMEWORK_ASSIGNMENT_SKILLS ───────────────────────────────────
drop policy if exists has_parent_read on homework_assignment_skills;
create policy has_parent_read on homework_assignment_skills
  for select to authenticated
  using (
    my_role() = 'parent'
    and student_id = any(my_parent_student_ids())
  );

-- ── SESSION_NOTE_SKILLS ──────────────────────────────────────────
drop policy if exists sns_parent_read on session_note_skills;
create policy sns_parent_read on session_note_skills
  for select to authenticated
  using (
    my_role() = 'parent'
    and student_id = any(my_parent_student_ids())
  );

-- ── PRACTICE_TEST_RESULTS ─────────────────────────────────────────
drop policy if exists "ptr_parent_select" on practice_test_results;
create policy "ptr_parent_select" on practice_test_results
  for select using (
    my_role() = 'parent'
    and student_id = any(my_parent_student_ids())
  );

-- ── VOCABULARY_ASSIGNMENT_CONFIG / VOCABULARY_SUBMISSION_ENTRIES ─
drop policy if exists "parent_select" on vocabulary_assignment_config;
create policy "parent_select" on vocabulary_assignment_config for select to authenticated
  using (
    exists (
      select 1 from homework h
      join students s on s.id = h.student_id
      where h.id = homework_id
        and s.id = any(my_parent_student_ids())
        and my_role() = 'parent'
    )
  );

drop policy if exists "parent_select" on vocabulary_submission_entries;
create policy "parent_select" on vocabulary_submission_entries for select to authenticated
  using (student_id = any(my_parent_student_ids()) and my_role() = 'parent');

-- ── SAT_PRACTICE_TEST_CONFIGS / SUBMISSIONS / ANSWERS ────────────
drop policy if exists "parent_select" on sat_practice_test_configs;
create policy "parent_select" on sat_practice_test_configs for select to authenticated
  using (
    exists (
      select 1 from homework h
      join students s on s.id = h.student_id
      where h.id = homework_id
        and s.id = any(my_parent_student_ids())
        and my_role() = 'parent'
    )
  );

drop policy if exists "parent_select" on sat_practice_test_submissions;
create policy "parent_select" on sat_practice_test_submissions for select to authenticated
  using (student_id = any(my_parent_student_ids()) and my_role() = 'parent');

drop policy if exists "parent_select" on sat_practice_test_answers;
create policy "parent_select" on sat_practice_test_answers for select to authenticated
  using (
    exists (
      select 1 from sat_practice_test_submissions sub
      where sub.id = submission_id
        and sub.student_id = any(my_parent_student_ids())
        and my_role() = 'parent'
    )
  );

-- ── STUDENT_COURSE_ENROLLMENTS ────────────────────────────────────
drop policy if exists "enrollments_parent_read" on student_course_enrollments;
create policy "enrollments_parent_read" on student_course_enrollments
  for select to authenticated
  using (my_role() = 'parent' and student_id = any(my_parent_student_ids()));
