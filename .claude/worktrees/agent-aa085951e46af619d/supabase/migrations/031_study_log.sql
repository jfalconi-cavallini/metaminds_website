-- Migration 031: Phase 2 — study log table + weekly goal column.
--
-- study_log tracks all student study sessions (auto-logged from homework
-- submissions and manually logged in future phases).
-- weekly_study_goal_minutes drives the goal progress bar on the dashboard.

create table if not exists study_log (
  id           serial primary key,
  student_id   integer      not null references students(id) on delete cascade,
  log_date     date         not null default current_date,
  minutes      integer      not null check (minutes >= 1 and minutes <= 600),
  category     text         not null default 'homework',
  note         text,
  homework_id  integer references homework(id) on delete set null,
  created_at   timestamptz  not null default now(),
  -- one log entry per homework assignment (upsert target)
  constraint study_log_homework_unique unique (homework_id)
);

create index if not exists study_log_student_date on study_log(student_id, log_date desc);

alter table students
  add column if not exists weekly_study_goal_minutes integer not null default 180;

-- RLS
alter table study_log enable row level security;

create policy "study_log_select" on study_log
  for select to authenticated
  using (
    is_admin()
    or (my_role() in ('student', 'parent') and student_id = my_linked_id())
    or (my_role() = 'tutor' and student_id = any(my_assigned_student_ids()))
  );

create policy "study_log_insert" on study_log
  for insert to authenticated
  with check (
    is_admin()
    or (my_role() in ('student', 'parent') and student_id = my_linked_id())
  );

create policy "study_log_update" on study_log
  for update to authenticated
  using (
    is_admin()
    or (my_role() in ('student', 'parent') and student_id = my_linked_id())
  )
  with check (
    is_admin()
    or (my_role() in ('student', 'parent') and student_id = my_linked_id())
  );
