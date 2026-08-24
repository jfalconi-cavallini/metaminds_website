-- Extended student fields for full onboarding wizard
alter table students
  add column if not exists school          text,
  add column if not exists graduation_year text,
  add column if not exists status          text not null default 'active';
