-- ================================================================
-- Migration 014: Replace Phase-1 "allow all" RLS with real,
-- role-scoped policies.
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Context: every table since migration 001 has carried a policy
-- named "phase1_allow_all" / "allow_all_phase1" granting full
-- read/write to both `anon` and `authenticated`. That was a
-- deliberate placeholder for local development, but it means the
-- public anon key (shipped in the browser bundle by design) can
-- read or write any student's/tutor's data directly via the
-- Supabase client, bypassing every role check in the app's React
-- code. This migration closes that gap without changing any
-- app-level behavior — every access pattern below was reverse
-- engineered from the actual calls in lib/portal/db.ts so existing
-- features keep working exactly as they do today.
--
-- After this migration, `anon` (logged-out) has zero access to any
-- of these tables — the whole product requires a logged-in
-- Supabase Auth session. `authenticated` access is scoped through
-- the `profiles` table (role + linked_id) via the helper functions
-- below.
--
-- Known limitation (documented, not fixed here): RLS is row-level,
-- not column-level. A student can UPDATE their own `homework` row
-- (needed so they can submit an assignment) — nothing at the RLS
-- layer stops them from also rewriting that same row's `grade`/
-- `feedback` columns via a hand-crafted request. Closing that
-- requires a column-guard trigger, tracked as a fast follow-up.
-- ================================================================

-- ── HELPER FUNCTIONS ─────────────────────────────────────────────
-- SECURITY DEFINER so they read `profiles`/`students` bypassing RLS
-- internally — this is the standard Supabase pattern for avoiding
-- policy-recursion edge cases when a policy needs to look up the
-- caller's own role/assignment.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.my_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function public.my_linked_id()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select linked_id from profiles where id = auth.uid();
$$;

-- The tutor id assigned to the current user, when the current user is a student.
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

-- The student ids assigned to the current user, when the current user is a tutor.
create or replace function public.my_assigned_student_ids()
returns integer[]
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(array_agg(s.id), '{}')
  from students s
  join profiles p on p.role = 'tutor'
  where p.id = auth.uid() and s.assigned_tutor_id = p.linked_id;
$$;

-- ── PROFILES ──────────────────────────────────────────────────────
-- Client only ever needs to read its own row (lib/auth.ts). All
-- writes happen server-side via the service-role key in the
-- app/api/admin/* routes, which bypasses RLS entirely.

drop policy if exists "phase1_allow_all" on profiles;

create policy "profiles_select_own" on profiles
  for select to authenticated
  using (id = auth.uid());

-- ── STUDENTS ──────────────────────────────────────────────────────
-- select: a student sees their own row; a tutor sees their assigned
-- students; admin sees everyone.
-- write: admin only (createStudent / updateStudentProfile /
-- archiveStudent / restoreStudent / assignStudentToTutor are all
-- called only from the admin dashboard today).

drop policy if exists "phase1_allow_all" on students;

create policy "students_select" on students
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'student' and id = my_linked_id())
    or (my_role() = 'tutor' and assigned_tutor_id = my_linked_id())
  );

create policy "students_insert_admin" on students
  for insert to authenticated
  with check (is_admin());

create policy "students_update_admin" on students
  for update to authenticated
  using (is_admin())
  with check (is_admin());

-- ── TUTORS ────────────────────────────────────────────────────────
-- select: a tutor sees their own row; a student sees their assigned
-- tutor's row; admin sees everyone.
-- write: admin can create/edit/archive any tutor. A tutor can update
-- their own row (used today for booking_lead_hours).

drop policy if exists "phase1_allow_all" on tutors;

create policy "tutors_select" on tutors
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor' and id = my_linked_id())
    or (my_role() = 'student' and id = my_assigned_tutor_id())
  );

create policy "tutors_insert_admin" on tutors
  for insert to authenticated
  with check (is_admin());

create policy "tutors_update" on tutors
  for update to authenticated
  using (is_admin() or (my_role() = 'tutor' and id = my_linked_id()))
  with check (is_admin() or (my_role() = 'tutor' and id = my_linked_id()));

-- ── SESSIONS ──────────────────────────────────────────────────────
-- select: a student sees their own sessions AND their tutor's full
-- booked calendar (needed to render available/taken slots); a tutor
-- sees every session they teach; admin sees everything.
-- insert: a student can only book themselves with their own assigned
-- tutor; a tutor can only book their own assigned students; admin
-- unrestricted.
-- update: covers cancel / edit / zoom-link / auto-complete — scoped
-- to the same ownership as select.

drop policy if exists "phase1_allow_all" on sessions;

create policy "sessions_select" on sessions
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor' and tutor_id = my_linked_id())
    or (my_role() = 'student' and (
          student_id = my_linked_id()
          or tutor_id = my_assigned_tutor_id()
        ))
  );

create policy "sessions_insert" on sessions
  for insert to authenticated
  with check (
    is_admin()
    or (my_role() = 'tutor' and tutor_id = my_linked_id()
        and student_id = any (my_assigned_student_ids()))
    or (my_role() = 'student' and student_id = my_linked_id()
        and tutor_id = my_assigned_tutor_id())
  );

create policy "sessions_update" on sessions
  for update to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor' and tutor_id = my_linked_id())
    or (my_role() = 'student' and student_id = my_linked_id())
  )
  with check (
    is_admin()
    or (my_role() = 'tutor' and tutor_id = my_linked_id())
    or (my_role() = 'student' and student_id = my_linked_id())
  );

-- ── USER_PACKAGES (hours balance) ────────────────────────────────
-- select: a student sees their own balance; a tutor sees their
-- assigned students' balances (shown in the tutor's Students tab);
-- admin sees all.
-- insert: admin only (addPackageHours creating a first package).
-- update: hours get deducted/restored as a side effect of booking/
-- cancelling a session, triggered by whichever role made that
-- booking — so update follows the same ownership as sessions.

drop policy if exists "phase1_allow_all" on user_packages;

create policy "user_packages_select" on user_packages
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'student' and student_id = my_linked_id())
    or (my_role() = 'tutor' and student_id = any (my_assigned_student_ids()))
  );

create policy "user_packages_insert_admin" on user_packages
  for insert to authenticated
  with check (is_admin());

create policy "user_packages_update" on user_packages
  for update to authenticated
  using (
    is_admin()
    or (my_role() = 'student' and student_id = my_linked_id())
    or (my_role() = 'tutor' and student_id = any (my_assigned_student_ids()))
  )
  with check (
    is_admin()
    or (my_role() = 'student' and student_id = my_linked_id())
    or (my_role() = 'tutor' and student_id = any (my_assigned_student_ids()))
  );

-- ── SESSION_REQUESTS ──────────────────────────────────────────────
-- Confirmed dead: insertSessionRequest is defined in lib/portal/db.ts
-- but has no call site anywhere in the app, and nothing reads this
-- table. Fully locked down (no policy = no access for anon or
-- authenticated) rather than left open for a feature that doesn't
-- exist yet.

drop policy if exists "phase1_allow_all" on session_requests;

-- ── TUTOR_AVAILABILITY ────────────────────────────────────────────
-- select: a tutor sees their own weekly availability; a student sees
-- their assigned tutor's availability (booking calendar); admin all.
-- write: tutor manages their own (upsertTutorAvailability deletes +
-- re-inserts); admin can manage any.

drop policy if exists "phase1_allow_all" on tutor_availability;

create policy "tutor_availability_select" on tutor_availability
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor' and tutor_id = my_linked_id())
    or (my_role() = 'student' and tutor_id = my_assigned_tutor_id())
  );

create policy "tutor_availability_insert" on tutor_availability
  for insert to authenticated
  with check (is_admin() or (my_role() = 'tutor' and tutor_id = my_linked_id()));

create policy "tutor_availability_delete" on tutor_availability
  for delete to authenticated
  using (is_admin() or (my_role() = 'tutor' and tutor_id = my_linked_id()));

-- ── SESSION_NOTES ─────────────────────────────────────────────────
-- select: student sees notes written about them; tutor sees notes
-- they wrote; admin all.
-- insert/update/delete: tutor only, scoped to their own notes about
-- their own assigned students; admin unrestricted.

drop policy if exists "phase1_allow_all" on session_notes;

create policy "session_notes_select" on session_notes
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor' and tutor_id = my_linked_id())
    or (my_role() = 'student' and student_id = my_linked_id())
  );

create policy "session_notes_insert" on session_notes
  for insert to authenticated
  with check (
    is_admin()
    or (my_role() = 'tutor' and tutor_id = my_linked_id()
        and student_id = any (my_assigned_student_ids()))
  );

create policy "session_notes_update" on session_notes
  for update to authenticated
  using (is_admin() or (my_role() = 'tutor' and tutor_id = my_linked_id()))
  with check (is_admin() or (my_role() = 'tutor' and tutor_id = my_linked_id()));

create policy "session_notes_delete" on session_notes
  for delete to authenticated
  using (is_admin() or (my_role() = 'tutor' and tutor_id = my_linked_id()));

-- ── HOMEWORK ──────────────────────────────────────────────────────
-- select: student sees their own assignments; tutor sees homework
-- they assigned; admin all.
-- insert: tutor only, for their own assigned students.
-- update: tutor (grading/feedback) or the owning student (submission
-- fields) — see the column-level limitation noted at the top of
-- this file.

drop policy if exists "phase1_allow_all" on homework;

create policy "homework_select" on homework
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor' and tutor_id = my_linked_id())
    or (my_role() = 'student' and student_id = my_linked_id())
  );

create policy "homework_insert" on homework
  for insert to authenticated
  with check (
    is_admin()
    or (my_role() = 'tutor' and tutor_id = my_linked_id()
        and student_id = any (my_assigned_student_ids()))
  );

create policy "homework_update" on homework
  for update to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor' and tutor_id = my_linked_id())
    or (my_role() = 'student' and student_id = my_linked_id())
  )
  with check (
    is_admin()
    or (my_role() = 'tutor' and tutor_id = my_linked_id())
    or (my_role() = 'student' and student_id = my_linked_id())
  );

-- ── TUTOR_BLOCKED_DATES ───────────────────────────────────────────
-- select: tutor sees their own blocked dates; student sees their
-- tutor's (booking calendar needs to know these); admin all.
-- insert/delete: tutor manages their own; admin can manage any.

drop policy if exists "phase1_allow_all" on tutor_blocked_dates;

create policy "tutor_blocked_dates_select" on tutor_blocked_dates
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor' and tutor_id = my_linked_id())
    or (my_role() = 'student' and tutor_id = my_assigned_tutor_id())
  );

create policy "tutor_blocked_dates_insert" on tutor_blocked_dates
  for insert to authenticated
  with check (is_admin() or (my_role() = 'tutor' and tutor_id = my_linked_id()));

create policy "tutor_blocked_dates_delete" on tutor_blocked_dates
  for delete to authenticated
  using (is_admin() or (my_role() = 'tutor' and tutor_id = my_linked_id()));

-- ── PARENT_UPDATES ────────────────────────────────────────────────
-- select: student sees updates about them; tutor sees updates they
-- wrote; admin all.
-- insert: tutor only, for their own assigned students; admin also
-- allowed for parity with the rest of the admin dashboard.
-- No update/delete path exists in the app today, so none are added.

drop policy if exists "allow_all_phase1" on parent_updates;

create policy "parent_updates_select" on parent_updates
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor' and tutor_id = my_linked_id())
    or (my_role() = 'student' and student_id = my_linked_id())
  );

create policy "parent_updates_insert" on parent_updates
  for insert to authenticated
  with check (
    is_admin()
    or (my_role() = 'tutor' and tutor_id = my_linked_id()
        and student_id = any (my_assigned_student_ids()))
  );

-- ── BLOCKED_SLOTS ─────────────────────────────────────────────────
-- Only ever read/written by the owning tutor (or admin) today —
-- the student booking calendar does not currently consume this
-- table (confirmed: no fetchBlockedSlots call site in the student
-- portal), so no student-facing select policy is added here.

drop policy if exists "allow_all_phase1" on blocked_slots;

create policy "blocked_slots_select" on blocked_slots
  for select to authenticated
  using (is_admin() or (my_role() = 'tutor' and tutor_id = my_linked_id()));

create policy "blocked_slots_insert" on blocked_slots
  for insert to authenticated
  with check (is_admin() or (my_role() = 'tutor' and tutor_id = my_linked_id()));

create policy "blocked_slots_delete" on blocked_slots
  for delete to authenticated
  using (is_admin() or (my_role() = 'tutor' and tutor_id = my_linked_id()));
