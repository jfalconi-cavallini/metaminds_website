-- Migration 025: Add 'parent' as a valid role in profiles
-- Parents log in to see a read-only view of their child's portal.
-- linked_id on a parent profile points to the child's student ID.

-- Drop the inline check constraint (auto-named by PostgreSQL)
alter table profiles drop constraint if exists profiles_role_check;

-- Re-add with 'parent' included
alter table profiles
  add constraint profiles_role_check
  check (role in ('admin', 'tutor', 'student', 'parent'));

-- Update the handle_new_user trigger function to accept 'parent' as a valid role
-- (no change needed — it already uses COALESCE(raw_user_meta_data->>'role', 'student')
--  so passing role='parent' in user metadata will work automatically)
