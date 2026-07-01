-- ============================================================
-- MetaMinds Portal — Phase 1 Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- TABLES -------------------------------------------------------

create table tutors (
  id           integer generated always as identity primary key,
  name         text        not null,
  email        text        not null unique,
  subjects     text[]      not null default '{}',
  created_at   timestamptz not null default now()
);

create table students (
  id                 integer generated always as identity primary key,
  name               text        not null,
  email              text        not null unique,
  grade              text        not null,
  subjects           text[]      not null default '{}',
  assigned_tutor_id  integer     references tutors(id),
  created_at         timestamptz not null default now()
);


create table sessions (
  id              integer     generated always as identity primary key,
  student_id      integer     not null references students(id),
  tutor_id        integer     not null references tutors(id),
  subject         text        not null,
  session_date    date        not null,
  session_time    text        not null,      -- e.g. "4:00 PM"
  duration_hours  numeric(4,2) not null default 1,
  status          text        not null default 'upcoming'
                              check (status in ('upcoming','completed','cancelled')),
  notes           text,
  created_at      timestamptz not null default now()
);

-- Tracks purchased hour blocks per student.
-- hours_remaining is derived: total_hours - hours_used (no stored computed column needed).
create table user_packages (
  id            integer     generated always as identity primary key,
  student_id    integer     not null references students(id),
  total_hours   numeric(6,2) not null,
  hours_used    numeric(6,2) not null default 0,
  expires_at    date         not null,
  created_at    timestamptz  not null default now()
);

-- Student-initiated booking requests (not yet confirmed by tutor/admin).
create table session_requests (
  id              integer     generated always as identity primary key,
  student_id      integer     not null references students(id),
  subject         text        not null,
  requested_date  date        not null,
  requested_time  text        not null,
  notes           text,
  status          text        not null default 'pending'
                              check (status in ('pending','confirmed','rejected')),
  created_at      timestamptz not null default now()
);

-- Weekly recurring availability blocks set by tutors.
-- Phase 2 can add one-off overrides on top of this.
create table tutor_availability (
  id           integer     generated always as identity primary key,
  tutor_id     integer     not null references tutors(id),
  day_of_week  integer     not null check (day_of_week between 0 and 6), -- 0=Sun … 6=Sat
  start_time   text        not null,   -- e.g. "9:00 AM"
  end_time     text        not null,   -- e.g. "5:00 PM"
  created_at   timestamptz not null default now()
);


-- RLS -----------------------------------------------------------
-- Phase 1: wide-open policies so the anon key works without auth.
-- Replace with user-scoped policies when real auth is added.

alter table tutors             enable row level security;
alter table students           enable row level security;
alter table sessions           enable row level security;
alter table user_packages      enable row level security;
alter table session_requests   enable row level security;
alter table tutor_availability enable row level security;

create policy "phase1_allow_all" on tutors             for all to anon using (true) with check (true);
create policy "phase1_allow_all" on students           for all to anon using (true) with check (true);
create policy "phase1_allow_all" on sessions           for all to anon using (true) with check (true);
create policy "phase1_allow_all" on user_packages      for all to anon using (true) with check (true);
create policy "phase1_allow_all" on session_requests   for all to anon using (true) with check (true);
create policy "phase1_allow_all" on tutor_availability for all to anon using (true) with check (true);


-- SEED DATA -----------------------------------------------------

insert into tutors (name, email, subjects) values
  ('Ms. Rivera',   'rivera@metamindsstemacademy.com',   array['Algebra','Geometry']),
  ('Mr. Patel',    'patel@metamindsstemacademy.com',    array['Physics','Chemistry']),
  ('Ms. Thompson', 'thompson@metamindsstemacademy.com', array['Reading','Writing']);

insert into students (name, email, grade, subjects, assigned_tutor_id) values
  ('Alex Johnson',    'alex@example.com',   '7th', array['Algebra','Geometry'],  1),
  ('Mia Chen',        'mia@example.com',    '9th', array['Physics'],             2),
  ('Jayden Williams', 'jayden@example.com', '5th', array['Reading','Writing'],   1);

insert into sessions (student_id, tutor_id, subject, session_date, session_time, duration_hours, status, notes) values
  (1, 1, 'Algebra',  '2026-06-20', '4:00 PM', 1,   'completed', 'Covered linear equations. Alex grasped slope-intercept form.'),
  (2, 2, 'Physics',  '2026-06-21', '5:00 PM', 1.5, 'completed', null),
  (1, 1, 'Algebra',  '2026-06-24', '4:00 PM', 1,   'upcoming',  null),
  (3, 1, 'Geometry', '2026-06-26', '3:30 PM', 1,   'upcoming',  null);

insert into user_packages (student_id, total_hours, hours_used, expires_at) values
  (1, 10, 2, '2026-08-01'),
  (2,  5, 1, '2026-07-15'),
  (3, 20, 8, '2026-09-01');

-- Seed Ms. Rivera availability (Mon/Wed/Fri 3-7pm, Sat 10am-2pm)
insert into tutor_availability (tutor_id, day_of_week, start_time, end_time) values
  (1, 1, '3:00 PM', '7:00 PM'),
  (1, 3, '3:00 PM', '7:00 PM'),
  (1, 5, '3:00 PM', '7:00 PM'),
  (1, 6, '10:00 AM', '2:00 PM');
