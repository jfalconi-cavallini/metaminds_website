-- ================================================================
-- Migration 043: Daily SAT Vocabulary assignment type
--
-- Adds two tables:
--   vocabulary_assignment_config  — word list the tutor creates
--   vocabulary_submission_entries — one row per word per student attempt
-- ================================================================

-- ── vocabulary_assignment_config ─────────────────────────────────

create table if not exists vocabulary_assignment_config (
  id           serial primary key,
  homework_id  integer not null references homework(id) on delete cascade,
  words        jsonb   not null default '[]',
  created_at   timestamptz not null default now(),
  constraint uq_vocab_config_homework unique (homework_id)
);

alter table vocabulary_assignment_config enable row level security;

-- Admin: full access
create policy "admin_all" on vocabulary_assignment_config for all to authenticated
  using   (is_admin())
  with check (is_admin());

-- Tutor: read/write their own assignments
create policy "tutor_select" on vocabulary_assignment_config for select to authenticated
  using (
    exists (
      select 1 from homework h
      where h.id = homework_id
        and h.tutor_id = my_linked_id()
        and my_role() = 'tutor'
    )
  );

create policy "tutor_insert" on vocabulary_assignment_config for insert to authenticated
  with check (
    exists (
      select 1 from homework h
      where h.id = homework_id
        and h.tutor_id = my_linked_id()
        and my_role() = 'tutor'
    )
  );

create policy "tutor_update" on vocabulary_assignment_config for update to authenticated
  using (
    exists (
      select 1 from homework h
      where h.id = homework_id
        and h.tutor_id = my_linked_id()
        and my_role() = 'tutor'
    )
  );

create policy "tutor_delete" on vocabulary_assignment_config for delete to authenticated
  using (
    exists (
      select 1 from homework h
      where h.id = homework_id
        and h.tutor_id = my_linked_id()
        and my_role() = 'tutor'
    )
  );

-- Student: read their own assignment config
create policy "student_select" on vocabulary_assignment_config for select to authenticated
  using (
    exists (
      select 1 from homework h
      where h.id = homework_id
        and h.student_id = my_linked_id()
        and my_role() = 'student'
    )
  );

-- Parent: read their child's assignment config
create policy "parent_select" on vocabulary_assignment_config for select to authenticated
  using (
    exists (
      select 1 from homework h
      join students s on s.id = h.student_id
      where h.id = homework_id
        and s.id = my_linked_id()
        and my_role() = 'parent'
    )
  );

-- ── vocabulary_submission_entries ────────────────────────────────

create table if not exists vocabulary_submission_entries (
  id             serial primary key,
  homework_id    integer not null references homework(id) on delete cascade,
  student_id     integer not null references students(id) on delete cascade,
  word_index     integer not null,
  word           text    not null,
  definition     text    not null default '',
  sentence       text    not null default '',
  confidence     text    check (confidence in ('low', 'medium', 'high')),
  tutor_status   text    not null default 'pending'
                         check (tutor_status in ('pending', 'correct', 'needs_revision')),
  tutor_feedback text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint uq_vocab_entry unique (homework_id, student_id, word_index)
);

alter table vocabulary_submission_entries enable row level security;

-- Admin: full access
create policy "admin_all" on vocabulary_submission_entries for all to authenticated
  using   (is_admin())
  with check (is_admin());

-- Tutor: read all entries for their assignments; update to add review feedback
create policy "tutor_select" on vocabulary_submission_entries for select to authenticated
  using (
    exists (
      select 1 from homework h
      where h.id = homework_id
        and h.tutor_id = my_linked_id()
        and my_role() = 'tutor'
    )
  );

create policy "tutor_update" on vocabulary_submission_entries for update to authenticated
  using (
    exists (
      select 1 from homework h
      where h.id = homework_id
        and h.tutor_id = my_linked_id()
        and my_role() = 'tutor'
    )
  );

-- Student: full access to their own entries
create policy "student_select" on vocabulary_submission_entries for select to authenticated
  using (student_id = my_linked_id() and my_role() = 'student');

create policy "student_insert" on vocabulary_submission_entries for insert to authenticated
  with check (student_id = my_linked_id() and my_role() = 'student');

create policy "student_update" on vocabulary_submission_entries for update to authenticated
  using (student_id = my_linked_id() and my_role() = 'student');

-- Parent: read their child's entries
create policy "parent_select" on vocabulary_submission_entries for select to authenticated
  using (student_id = my_linked_id() and my_role() = 'parent');

-- ── updated_at trigger ───────────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger vocab_entry_updated_at
  before update on vocabulary_submission_entries
  for each row execute function set_updated_at();
