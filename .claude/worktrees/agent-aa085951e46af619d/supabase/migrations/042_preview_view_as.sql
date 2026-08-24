alter table admin_preview_sessions
  add column if not exists view_as text not null default 'student'
  check (view_as in ('student', 'parent'));
