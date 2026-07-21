-- ================================================================
-- Migration 019: MetaMinds Curriculum Management System (CMS)
-- Three-layer LMS: Course Catalog → Curriculum Builder → Student Plans
--
-- Run this in: Supabase Dashboard → SQL Editor
-- ================================================================

-- ── COURSES ──────────────────────────────────────────────────────
-- Top-level learning programs (SAT Math Prep, Python Fundamentals, etc.)
create table if not exists courses (
  id              integer      generated always as identity primary key,
  subject         text         not null,                    -- 'SAT', 'Python', 'Scratch', 'Algebra 1'
  title           text         not null,
  description     text,
  grade_levels    text[]       not null default '{}',       -- ['9','10','11','12']
  estimated_hours integer,
  status          text         not null default 'draft'
                               check (status in ('draft','active','archived')),
  created_at      timestamptz  not null default now(),
  updated_at      timestamptz  not null default now()
);

alter table courses enable row level security;

-- All authenticated users can read active courses
create policy "courses_select" on courses
  for select to authenticated
  using (status = 'active' or is_admin());

-- Only admin can create/edit/archive courses
create policy "courses_insert" on courses
  for insert to authenticated
  with check (is_admin());

create policy "courses_update" on courses
  for update to authenticated
  using (is_admin())
  with check (is_admin());


-- ── MODULES ──────────────────────────────────────────────────────
-- Thematic groupings of lessons within a course (e.g. "Algebra & Linear Equations")
create table if not exists modules (
  id               integer      generated always as identity primary key,
  course_id        integer      not null references courses(id) on delete cascade,
  title            text         not null,
  description      text,
  position         integer      not null default 0,         -- order within course
  estimated_weeks  integer,
  created_at       timestamptz  not null default now()
);

alter table modules enable row level security;

create policy "modules_select" on modules
  for select to authenticated
  using (
    is_admin()
    or exists (
      select 1 from courses c
      where c.id = course_id and c.status = 'active'
    )
  );

create policy "modules_insert" on modules
  for insert to authenticated
  with check (is_admin());

create policy "modules_update" on modules
  for update to authenticated
  using (is_admin())
  with check (is_admin());

create policy "modules_delete" on modules
  for delete to authenticated
  using (is_admin());


-- ── LESSONS ──────────────────────────────────────────────────────
-- One lesson ≈ one tutoring session (≈60 min). Reusable across student plans.
create table if not exists lessons (
  id                   integer      generated always as identity primary key,
  module_id            integer      not null references modules(id) on delete cascade,
  title                text         not null,
  description          text,
  difficulty           integer      not null default 2 check (difficulty between 1 and 5),
  estimated_minutes    integer      not null default 60,
  learning_objectives  text[]       not null default '{}',
  common_mistakes      text,
  tutor_notes          text,
  ai_notes             text,
  status               text         not null default 'draft'
                                    check (status in ('draft','active','archived')),
  position             integer      not null default 0,     -- order within module
  created_at           timestamptz  not null default now(),
  updated_at           timestamptz  not null default now()
);

alter table lessons enable row level security;

-- Tutors and students can read active lessons; admin sees all
create policy "lessons_select" on lessons
  for select to authenticated
  using (
    is_admin()
    or (status = 'active' and my_role() in ('tutor', 'student'))
  );

create policy "lessons_insert" on lessons
  for insert to authenticated
  with check (is_admin());

create policy "lessons_update" on lessons
  for update to authenticated
  using (is_admin())
  with check (is_admin());

create policy "lessons_delete" on lessons
  for delete to authenticated
  using (is_admin());


-- ── LESSON_RESOURCES ─────────────────────────────────────────────
-- Files and links attached to a lesson (slides, PDFs, videos, Kami links)
create table if not exists lesson_resources (
  id            integer      generated always as identity primary key,
  lesson_id     integer      not null references lessons(id) on delete cascade,
  type          text         not null
                             check (type in (
                               'slides','worksheet','homework_pdf',
                               'answer_key','video','kami_link','external'
                             )),
  label         text         not null,
  url           text,                                       -- external URL
  storage_path  text,                                       -- Supabase Storage path if uploaded
  position      integer      not null default 0,
  created_at    timestamptz  not null default now()
);

alter table lesson_resources enable row level security;

create policy "lesson_resources_select" on lesson_resources
  for select to authenticated
  using (
    is_admin()
    or my_role() in ('tutor', 'student')
  );

create policy "lesson_resources_insert" on lesson_resources
  for insert to authenticated
  with check (is_admin());

create policy "lesson_resources_update" on lesson_resources
  for update to authenticated
  using (is_admin())
  with check (is_admin());

create policy "lesson_resources_delete" on lesson_resources
  for delete to authenticated
  using (is_admin());


-- ── SKILLS ───────────────────────────────────────────────────────
-- Atomic competencies. Everything traces back to skills.
create table if not exists skills (
  id            integer      generated always as identity primary key,
  slug          text         not null unique,               -- 'sat-algebra-linear-systems-substitution'
  name          text         not null,                      -- 'Linear Systems: Substitution'
  subject       text         not null,                      -- 'SAT'
  module_id     integer      references modules(id) on delete set null,
  difficulty    integer      not null default 2 check (difficulty between 1 and 5),
  prerequisites text[]       not null default '{}',         -- other skill slugs
  created_at    timestamptz  not null default now()
);

alter table skills enable row level security;

create policy "skills_select" on skills
  for select to authenticated
  using (true);                                             -- all roles can read skills

create policy "skills_insert" on skills
  for insert to authenticated
  with check (is_admin());

create policy "skills_update" on skills
  for update to authenticated
  using (is_admin())
  with check (is_admin());

create policy "skills_delete" on skills
  for delete to authenticated
  using (is_admin());


-- ── LESSON_SKILLS ────────────────────────────────────────────────
-- Many-to-many: which skills does a lesson teach?
create table if not exists lesson_skills (
  lesson_id   integer  not null references lessons(id) on delete cascade,
  skill_id    integer  not null references skills(id)  on delete cascade,
  primary key (lesson_id, skill_id)
);

alter table lesson_skills enable row level security;

create policy "lesson_skills_select" on lesson_skills
  for select to authenticated
  using (true);

create policy "lesson_skills_insert" on lesson_skills
  for insert to authenticated
  with check (is_admin());

create policy "lesson_skills_delete" on lesson_skills
  for delete to authenticated
  using (is_admin());


-- ── STUDENT_PLANS ────────────────────────────────────────────────
-- A personalized curriculum for one student, built from a course by their tutor.
create table if not exists student_plans (
  id             integer      generated always as identity primary key,
  student_id     integer      not null references students(id) on delete cascade,
  tutor_id       integer      not null references tutors(id)   on delete cascade,
  course_id      integer      not null references courses(id)  on delete restrict,
  title          text         not null,                     -- e.g. "Romir's Road to 1350"
  current_score  integer,                                   -- baseline, e.g. 1280
  target_score   integer,                                   -- goal, e.g. 1350
  target_date    date,                                      -- e.g. October SAT date
  status         text         not null default 'active'
                              check (status in ('draft','active','completed','archived')),
  notes          text,
  created_at     timestamptz  not null default now(),
  updated_at     timestamptz  not null default now()
);

alter table student_plans enable row level security;

-- Student sees their own plans; tutor sees plans they created; admin all
create policy "student_plans_select" on student_plans
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'student' and student_id = my_linked_id())
    or (my_role() = 'tutor'   and tutor_id   = my_linked_id())
  );

-- Tutor creates plans for their own assigned students; admin unrestricted
create policy "student_plans_insert" on student_plans
  for insert to authenticated
  with check (
    is_admin()
    or (my_role() = 'tutor'
        and tutor_id = my_linked_id()
        and student_id = any (my_assigned_student_ids()))
  );

create policy "student_plans_update" on student_plans
  for update to authenticated
  using (is_admin() or (my_role() = 'tutor' and tutor_id = my_linked_id()))
  with check (is_admin() or (my_role() = 'tutor' and tutor_id = my_linked_id()));

create policy "student_plans_delete" on student_plans
  for delete to authenticated
  using (is_admin() or (my_role() = 'tutor' and tutor_id = my_linked_id()));


-- ── STUDENT_PLAN_LESSONS ─────────────────────────────────────────
-- Individual lessons assigned within a student plan, with ordering and status.
create table if not exists student_plan_lessons (
  id              integer      generated always as identity primary key,
  plan_id         integer      not null references student_plans(id) on delete cascade,
  lesson_id       integer      not null references lessons(id)       on delete restrict,
  position        integer      not null default 0,          -- order within the plan
  status          text         not null default 'pending'
                               check (status in ('pending','in_progress','completed','skipped')),
  scheduled_date  date,
  completed_at    timestamptz,
  tutor_notes     text,
  created_at      timestamptz  not null default now()
);

alter table student_plan_lessons enable row level security;

-- Access follows the parent plan's ownership rules
create policy "plan_lessons_select" on student_plan_lessons
  for select to authenticated
  using (
    is_admin()
    or exists (
      select 1 from student_plans sp
      where sp.id = plan_id
        and (
          (my_role() = 'student' and sp.student_id = my_linked_id())
          or (my_role() = 'tutor'   and sp.tutor_id   = my_linked_id())
        )
    )
  );

create policy "plan_lessons_insert" on student_plan_lessons
  for insert to authenticated
  with check (
    is_admin()
    or exists (
      select 1 from student_plans sp
      where sp.id = plan_id and my_role() = 'tutor' and sp.tutor_id = my_linked_id()
    )
  );

create policy "plan_lessons_update" on student_plan_lessons
  for update to authenticated
  using (
    is_admin()
    or exists (
      select 1 from student_plans sp
      where sp.id = plan_id and my_role() = 'tutor' and sp.tutor_id = my_linked_id()
    )
  )
  with check (
    is_admin()
    or exists (
      select 1 from student_plans sp
      where sp.id = plan_id and my_role() = 'tutor' and sp.tutor_id = my_linked_id()
    )
  );

create policy "plan_lessons_delete" on student_plan_lessons
  for delete to authenticated
  using (
    is_admin()
    or exists (
      select 1 from student_plans sp
      where sp.id = plan_id and my_role() = 'tutor' and sp.tutor_id = my_linked_id()
    )
  );


-- ── SKILL_MASTERY ────────────────────────────────────────────────
-- Tracks each student's mastery percentage per skill. Updated after sessions/homework.
create table if not exists skill_mastery (
  student_id     integer      not null references students(id) on delete cascade,
  skill_id       integer      not null references skills(id)   on delete cascade,
  mastery_pct    integer      not null default 0
                              check (mastery_pct between 0 and 100),
  last_assessed  timestamptz,
  primary key (student_id, skill_id)
);

alter table skill_mastery enable row level security;

create policy "skill_mastery_select" on skill_mastery
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'student' and student_id = my_linked_id())
    or (my_role() = 'tutor'   and student_id = any (my_assigned_student_ids()))
  );

create policy "skill_mastery_insert" on skill_mastery
  for insert to authenticated
  with check (
    is_admin()
    or (my_role() = 'tutor' and student_id = any (my_assigned_student_ids()))
  );

create policy "skill_mastery_update" on skill_mastery
  for update to authenticated
  using (
    is_admin()
    or (my_role() = 'tutor' and student_id = any (my_assigned_student_ids()))
  )
  with check (
    is_admin()
    or (my_role() = 'tutor' and student_id = any (my_assigned_student_ids()))
  );


-- ── INDEXES ──────────────────────────────────────────────────────
create index if not exists idx_modules_course_id          on modules(course_id);
create index if not exists idx_lessons_module_id          on lessons(module_id);
create index if not exists idx_lesson_resources_lesson_id on lesson_resources(lesson_id);
create index if not exists idx_lesson_skills_lesson_id    on lesson_skills(lesson_id);
create index if not exists idx_lesson_skills_skill_id     on lesson_skills(skill_id);
create index if not exists idx_skills_subject             on skills(subject);
create index if not exists idx_student_plans_student_id   on student_plans(student_id);
create index if not exists idx_student_plans_tutor_id     on student_plans(tutor_id);
create index if not exists idx_plan_lessons_plan_id       on student_plan_lessons(plan_id);
create index if not exists idx_plan_lessons_position      on student_plan_lessons(plan_id, position);
create index if not exists idx_skill_mastery_student_id   on skill_mastery(student_id);
