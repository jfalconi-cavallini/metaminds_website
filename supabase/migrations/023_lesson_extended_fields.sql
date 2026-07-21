-- Migration 023: Extended lesson fields + in_review status
-- Adds: tags, desmos_usage, prerequisites, follow_up, hw_minutes
-- Extends status to include in_review (Draft → In Review → Active → Archived)

alter table lessons
  add column if not exists tags          text[]  not null default '{}',
  add column if not exists desmos_usage  text,
  add column if not exists prerequisites text,
  add column if not exists follow_up     text,
  add column if not exists hw_minutes    integer;

-- Extend status check to include in_review
-- Drop any existing check constraint on status first
do $$
declare
  v_con text;
begin
  select constraint_name into v_con
  from information_schema.check_constraints cc
  join information_schema.constraint_column_usage cu
    on cu.constraint_name = cc.constraint_name
  where cu.table_name = 'lessons' and cu.column_name = 'status'
  limit 1;

  if v_con is not null then
    execute format('alter table lessons drop constraint %I', v_con);
  end if;
end $$;

alter table lessons
  add constraint lessons_status_check
  check (status in ('draft', 'in_review', 'active', 'archived'));
