-- ================================================================
-- Migration 016: Persist "Request Purchase" (Buy More Hours) requests
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Context: the student Hours tab's "Request Purchase" button only
-- set a local success toast — no database row, no notification, no
-- way for an admin to ever see that a student clicked it. This adds
-- a real table so the request is persisted and surfaced in the admin
-- dashboard, closing the gap between what the UI promises ("Admin
-- will confirm and send an invoice") and what actually happens.
-- ================================================================

create table if not exists purchase_requests (
  id            serial primary key,
  student_id    integer not null references students(id),
  package_label text not null,
  hours         numeric not null,
  price         numeric not null,
  status        text not null default 'pending'
                  check (status in ('pending', 'fulfilled', 'dismissed')),
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz
);

alter table purchase_requests enable row level security;

-- Student sees their own requests; admin sees all. Tutors have no
-- reason to see purchase requests, so they're intentionally excluded.
create policy "purchase_requests_select" on purchase_requests
  for select to authenticated
  using (
    is_admin()
    or (my_role() = 'student' and student_id = my_linked_id())
  );

-- A student may only file a request for themselves.
create policy "purchase_requests_insert" on purchase_requests
  for insert to authenticated
  with check (my_role() = 'student' and student_id = my_linked_id());

-- Only an admin resolves a request (fulfilled/dismissed).
create policy "purchase_requests_update_admin" on purchase_requests
  for update to authenticated
  using (is_admin())
  with check (is_admin());
