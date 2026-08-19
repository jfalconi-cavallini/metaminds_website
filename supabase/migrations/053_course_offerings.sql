-- ================================================================
-- Migration 053: Course Offerings — canonical enrollment layer
--
-- Product decision (2026-08-18): `courses` (019_curriculum_cms.sql) is reused
-- as the canonical "Course Offering" catalog rather than building a parallel
-- table. It already has exactly the right shape — id, subject, title,
-- description, grade_levels, status — and `modules`/`lessons` already hang
-- off it as the "Base Curriculum" branch. A course row is allowed to exist
-- with zero modules under it: that's an offering without curriculum built
-- yet, which is already how 51 of the 52 existing rows work today.
--
-- What's missing is the "Student Enrollments" branch — today that's just
-- students.programs (free-text strings from a hardcoded frontend list,
-- with no relationship to `courses` at all). This migration adds that
-- relationship as a real table and backfills the handful of real, verified
-- matches. students.programs is left in place, untouched, as a legacy/audit
-- field — nothing here is destructive.
-- ================================================================

-- ── 1. Loosen courses visibility ────────────────────────────────────────────
-- Previously only 'active' courses were visible to non-admins, which would
-- hide draft (curriculum-not-built-yet) offerings from tutors/students even
-- though a student can now be enrolled in one. Archived stays hidden.
drop policy if exists "courses_select" on courses;
create policy "courses_select" on courses
  for select to authenticated
  using (status in ('active', 'draft') or is_admin());


-- ── 2. Fill catalog gaps ─────────────────────────────────────────────────────
-- Offerings that were requested (3D Printing, C++, VEX IQ Robotics) or that
-- real students are already enrolled in via the legacy programs field but
-- never had a courses row (Data Science, Reading Comprehension, English/Writing).
insert into courses (subject, title, description, grade_levels, estimated_hours, status)
select v.subject, v.title, v.description, string_to_array(v.grade_levels, ','), v.estimated_hours, v.status
from (values
  ('STEM',     '3D Printing & Design',
   '3D modeling and printing: design software, slicing, materials, and hands-on builds.',
   '6,7,8,9,10,11,12', 20, 'draft'),
  ('Coding',   'C++ Programming',
   'Core C++: syntax, memory management, object-oriented design, and data structures.',
   '8,9,10,11,12', 25, 'draft'),
  ('Robotics', 'VEX IQ Robotics',
   'VEX IQ platform: robot building, sensors, and competition programming.',
   '4,5,6,7,8', 20, 'draft'),
  ('Coding',   'Data Science',
   'Data analysis and visualization fundamentals using real datasets.',
   '9,10,11,12', 20, 'draft'),
  ('English',  'Reading Comprehension',
   'Close reading, inference, and comprehension strategies across genres.',
   'K,1,2,3,4,5,6,7,8', 15, 'draft'),
  ('English',  'English / Writing',
   'Grammar, composition, and writing fundamentals.',
   'K,1,2,3,4,5,6,7,8', 15, 'draft')
) as v(subject, title, description, grade_levels, estimated_hours, status)
where not exists (select 1 from courses c where c.title = v.title);


-- ── 3. STUDENT_COURSE_ENROLLMENTS ───────────────────────────────────────────
-- The real Student <-> Course Offering relationship.
create table if not exists student_course_enrollments (
  id           integer      generated always as identity primary key,
  student_id   integer      not null references students(id) on delete cascade,
  course_id    integer      not null references courses(id)  on delete restrict,
  status       text         not null default 'active'
                            check (status in ('active', 'paused', 'completed', 'dropped')),
  enrolled_at  timestamptz  not null default now(),
  created_at   timestamptz  not null default now(),
  updated_at   timestamptz  not null default now(),
  unique (student_id, course_id)
);

alter table student_course_enrollments enable row level security;

create index if not exists idx_enrollments_student on student_course_enrollments(student_id);
create index if not exists idx_enrollments_course  on student_course_enrollments(course_id);

-- Reuses the trigger function created in 037_skill_nodes.sql
drop trigger if exists enrollments_updated_at on student_course_enrollments;
create trigger enrollments_updated_at
  before update on student_course_enrollments
  for each row execute function update_updated_at_column();

-- Admin: full access
create policy "enrollments_admin" on student_course_enrollments
  for all to authenticated
  using (is_admin())
  with check (is_admin());

-- Tutor: read-only, own assigned students (assignment stays an admin action)
create policy "enrollments_tutor_read" on student_course_enrollments
  for select to authenticated
  using (my_role() = 'tutor' and student_id = any (my_assigned_student_ids()));

-- Student: read own only
create policy "enrollments_student_read" on student_course_enrollments
  for select to authenticated
  using (my_role() = 'student' and student_id = my_linked_id());

-- Parent: read their linked student's only
create policy "enrollments_parent_read" on student_course_enrollments
  for select to authenticated
  using (my_role() = 'parent' and student_id = my_linked_id());


-- ── 4. Backfill known real enrollments from students.programs ──────────────
-- Only exact, verified string -> course-title matches are migrated (checked
-- against live data as of 2026-08-18: 3 students, 12 program strings total).
-- Ambiguous or unmapped strings (e.g. "AP Exam Prep", which doesn't name a
-- specific exam) are intentionally left unmigrated rather than guessed —
-- they remain visible only in the legacy students.programs array.
with mapping(old_name, course_title) as (
  values
    ('AP Calculus BC',         'AP Calculus BC'),
    ('AP Statistics',          'AP Statistics'),
    ('Java',                   'Java Programming'),
    ('Python',                 'Python Fundamentals'),
    ('Data Science',           'Data Science'),
    ('Geometry',               'Geometry'),
    ('Algebra II',             'Algebra 2'),
    ('Elementary School Math', 'Elementary Math'),
    ('Reading Comprehension',  'Reading Comprehension'),
    ('English / Writing',      'English / Writing')
)
insert into student_course_enrollments (student_id, course_id)
select distinct s.id, c.id
from students s
cross join lateral unnest(s.programs) as p(name)
join mapping m  on m.old_name = p.name
join courses c  on c.title = m.course_title
on conflict (student_id, course_id) do nothing;
