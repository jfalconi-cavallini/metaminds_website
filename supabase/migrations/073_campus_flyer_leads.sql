-- ================================================================
-- Migration 073: Campus flyer leads.
--
-- One row per TCU or SMU flyer form submission. The API route
-- writes with the service role, which bypasses RLS. Signed-in
-- admins may read. There are no insert, update, or delete
-- policies — clients cannot write this table.
--
-- Apply this in the Supabase SQL Editor. Do not run it from the app.
-- Additive only, and safe to re-run.
-- ================================================================

create table if not exists public.campus_flyer_leads (
  id serial primary key,
  created_at timestamptz not null default now(),
  name text not null,
  email text,
  phone text,
  course text not null,
  session_format text,
  parent_helping boolean,
  utm_source text not null,
  utm_medium text not null,
  constraint campus_flyer_leads_contact_chk check (coalesce(length(trim(email)),0) > 0 or coalesce(length(trim(phone)),0) > 0),
  constraint campus_flyer_leads_format_chk check (session_format is null or session_format in ('online','in_person')),
  constraint campus_flyer_leads_source_chk check (utm_source in ('tcu','smu'))
);
create index if not exists campus_flyer_leads_created_at_idx on public.campus_flyer_leads (created_at desc);
create index if not exists campus_flyer_leads_utm_source_idx on public.campus_flyer_leads (utm_source);
alter table public.campus_flyer_leads enable row level security;
drop policy if exists "campus_flyer_leads_admin_select" on public.campus_flyer_leads;
create policy "campus_flyer_leads_admin_select" on public.campus_flyer_leads for select to authenticated using (is_admin());
-- No insert/update/delete policies: writes are service-role only.
