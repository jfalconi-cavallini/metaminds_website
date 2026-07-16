# MetaMinds Database Schema

**Database:** PostgreSQL via Supabase  
**Version:** 1.0  
**Status:** Living Document — add new tables here before creating them in Supabase

---

## Naming Conventions

- Tables: `snake_case` plural (`students`, `session_notes`)
- Columns: `snake_case` (`assigned_tutor_id`, `created_at`)
- Foreign keys: `[referenced_table_singular]_id` (`student_id`, `tutor_id`)
- Boolean flags: `is_[adjective]` or `allow_[noun]` (`is_archived`, `allow_in_person`)
- Timestamps: `created_at`, `updated_at`, `completed_at`, `expires_at`
- Always include `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

---

## Current Schema

### `students`

```sql
CREATE TABLE students (
  id                  SERIAL PRIMARY KEY,
  name                TEXT NOT NULL,
  email               TEXT UNIQUE NOT NULL,
  grade               TEXT,                          -- "9th", "10th", etc.
  subjects            TEXT[] DEFAULT '{}',           -- ["SAT Math", "Python"]
  assigned_tutor_id   INTEGER REFERENCES tutors(id),
  archived            BOOLEAN NOT NULL DEFAULT false,
  phone               TEXT,
  parent_name         TEXT,
  parent_email        TEXT,
  parent_phone        TEXT,
  notes               TEXT,                          -- Admin notes only
  allow_in_person     BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `tutors`

```sql
CREATE TABLE tutors (
  id                   SERIAL PRIMARY KEY,
  name                 TEXT NOT NULL,
  email                TEXT UNIQUE NOT NULL,
  subjects             TEXT[] DEFAULT '{}',
  assigned_student_ids INTEGER[] DEFAULT '{}',
  booking_lead_hours   INTEGER NOT NULL DEFAULT 24,  -- 24 or 48
  archived             BOOLEAN NOT NULL DEFAULT false,
  phone                TEXT,
  bio                  TEXT,
  photo_url            TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `sessions`

```sql
CREATE TABLE sessions (
  id              SERIAL PRIMARY KEY,
  student_id      INTEGER NOT NULL REFERENCES students(id),
  tutor_id        INTEGER NOT NULL REFERENCES tutors(id),
  subject         TEXT NOT NULL,
  date            DATE NOT NULL,                     -- "2026-07-15"
  time            TEXT NOT NULL,                     -- "4:00 PM"
  duration_hours  NUMERIC(4,2) NOT NULL DEFAULT 1,
  status          TEXT NOT NULL DEFAULT 'upcoming',  -- upcoming | completed | cancelled
  session_type    TEXT NOT NULL DEFAULT 'online',    -- online | in-person
  zoom_link       TEXT,
  notes           TEXT,                              -- Tutor pre-session notes
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `homework`

```sql
CREATE TABLE homework (
  id                   SERIAL PRIMARY KEY,
  student_id           INTEGER NOT NULL REFERENCES students(id),
  tutor_id             INTEGER NOT NULL REFERENCES tutors(id),
  task                 TEXT NOT NULL,
  assigned_date        DATE NOT NULL,
  due_date             DATE,
  status               TEXT NOT NULL DEFAULT 'pending', -- pending | submitted | completed
  submission_url       TEXT,                            -- Supabase Storage URL
  submission_filename  TEXT,
  submitted_at         TIMESTAMPTZ,
  grade                TEXT,                            -- "A", "95%", "Excellent"
  feedback             TEXT,
  feedback_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `session_notes`

```sql
CREATE TABLE session_notes (
  id          SERIAL PRIMARY KEY,
  session_id  INTEGER REFERENCES sessions(id),
  tutor_id    INTEGER NOT NULL REFERENCES tutors(id),
  student_id  INTEGER NOT NULL REFERENCES students(id),
  topic       TEXT NOT NULL,                -- "_resource_" = attached link
  notes       TEXT NOT NULL,               -- For _resource_: the URL
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Note:** `topic = '_resource_'` is a special sentinel value used to attach resource links to a session. The `notes` field contains the URL. This pattern avoids a separate `session_resources` table but should be refactored in Phase 2 (see Planned Schema).

### `parent_updates`

```sql
CREATE TABLE parent_updates (
  id          SERIAL PRIMARY KEY,
  tutor_id    INTEGER NOT NULL REFERENCES tutors(id),
  student_id  INTEGER NOT NULL REFERENCES students(id),
  message     TEXT NOT NULL,
  session_ids INTEGER[] DEFAULT '{}',  -- Sessions this update covers
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `hours_packages`

```sql
CREATE TABLE hours_packages (
  id               SERIAL PRIMARY KEY,
  student_id       INTEGER NOT NULL REFERENCES students(id),
  total_purchased  NUMERIC(6,2) NOT NULL DEFAULT 0,
  total_used       NUMERIC(6,2) NOT NULL DEFAULT 0,
  remaining        NUMERIC(6,2) NOT NULL DEFAULT 0,
  expires_at       DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `tutor_availability`

```sql
CREATE TABLE tutor_availability (
  id           SERIAL PRIMARY KEY,
  tutor_id     INTEGER NOT NULL REFERENCES tutors(id),
  day_of_week  INTEGER NOT NULL,   -- 0=Sunday ... 6=Saturday
  start_time   TEXT NOT NULL,      -- "3:00 PM"
  end_time     TEXT NOT NULL,      -- "7:00 PM"
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `blocked_dates`

```sql
CREATE TABLE blocked_dates (
  id            SERIAL PRIMARY KEY,
  tutor_id      INTEGER NOT NULL REFERENCES tutors(id),
  blocked_date  DATE NOT NULL,
  reason        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `blocked_slots`

```sql
CREATE TABLE blocked_slots (
  id         SERIAL PRIMARY KEY,
  tutor_id   INTEGER NOT NULL REFERENCES tutors(id),
  slot_date  DATE NOT NULL,
  slot_time  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Planned Schema (Phase 2+)

These tables should be designed and added as the platform expands. Add migration SQL here before implementing.

### `learning_paths`

```sql
CREATE TABLE learning_paths (
  id                      SERIAL PRIMARY KEY,
  student_id              INTEGER NOT NULL REFERENCES students(id),
  subject                 TEXT NOT NULL,
  current_module_id       INTEGER REFERENCES curriculum_modules(id),
  current_lesson_id       INTEGER REFERENCES curriculum_lessons(id),
  started_at              DATE NOT NULL,
  target_completion_date  DATE,
  goal                    TEXT,                  -- "SAT 1400", "AP CSP exam"
  status                  TEXT NOT NULL DEFAULT 'active', -- active | completed | paused
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `skill_mastery`

```sql
CREATE TABLE skill_mastery (
  id           SERIAL PRIMARY KEY,
  student_id   INTEGER NOT NULL REFERENCES students(id),
  skill_id     TEXT NOT NULL,                    -- slug from knowledge base
  subject      TEXT NOT NULL,
  mastery_pct  INTEGER NOT NULL DEFAULT 0,       -- 0-100
  attempts     INTEGER NOT NULL DEFAULT 0,
  last_tested  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, skill_id)
);
```

### `curriculum_courses`

```sql
CREATE TABLE curriculum_courses (
  id             SERIAL PRIMARY KEY,
  subject        TEXT NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  level          TEXT NOT NULL,                  -- elementary | middle | high | college
  estimated_hours INTEGER,
  prerequisites  TEXT[] DEFAULT '{}',
  skills         TEXT[] DEFAULT '{}',
  created_by     INTEGER REFERENCES tutors(id),
  approved       BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `curriculum_modules`

```sql
CREATE TABLE curriculum_modules (
  id          SERIAL PRIMARY KEY,
  course_id   INTEGER NOT NULL REFERENCES curriculum_courses(id),
  title       TEXT NOT NULL,
  order_num   INTEGER NOT NULL,
  skills      TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `curriculum_lessons`

```sql
CREATE TABLE curriculum_lessons (
  id                   SERIAL PRIMARY KEY,
  module_id            INTEGER NOT NULL REFERENCES curriculum_modules(id),
  title                TEXT NOT NULL,
  content              TEXT,                     -- Markdown
  estimated_minutes    INTEGER,
  difficulty           INTEGER,                  -- 1-5
  skills               TEXT[] DEFAULT '{}',
  prerequisites        TEXT[] DEFAULT '{}',
  order_num            INTEGER NOT NULL,
  tutor_notes          TEXT,
  created_by           INTEGER REFERENCES tutors(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `session_resources`

Replaces the `_resource_` sentinel pattern in `session_notes`.

```sql
CREATE TABLE session_resources (
  id          SERIAL PRIMARY KEY,
  session_id  INTEGER NOT NULL REFERENCES sessions(id),
  tutor_id    INTEGER NOT NULL REFERENCES tutors(id),
  student_id  INTEGER NOT NULL REFERENCES students(id),
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  resource_type TEXT,                            -- pdf | video | article | tool
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `mentor_credits`

```sql
CREATE TABLE mentor_credits (
  id               SERIAL PRIMARY KEY,
  mentor_id        INTEGER NOT NULL REFERENCES tutors(id),
  credit_type      TEXT NOT NULL,                -- teaching | curriculum | review | bonus
  amount           INTEGER NOT NULL DEFAULT 1,
  session_id       INTEGER REFERENCES sessions(id),
  curriculum_id    INTEGER REFERENCES curriculum_lessons(id),
  note             TEXT,
  redeemed         BOOLEAN NOT NULL DEFAULT false,
  redeemed_at      TIMESTAMPTZ,
  redemption_type  TEXT,                         -- session | bootcamp | camp | cash
  earned_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `practice_attempts`

```sql
CREATE TABLE practice_attempts (
  id            SERIAL PRIMARY KEY,
  student_id    INTEGER NOT NULL REFERENCES students(id),
  skill_id      TEXT NOT NULL,
  question_id   TEXT NOT NULL,                   -- from knowledge base
  correct       BOOLEAN NOT NULL,
  time_spent_s  INTEGER,
  attempted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `achievements`

```sql
CREATE TABLE achievements (
  id           SERIAL PRIMARY KEY,
  student_id   INTEGER NOT NULL REFERENCES students(id),
  type         TEXT NOT NULL,                    -- slug: "junior_mentor", "first_session"
  earned_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata     JSONB DEFAULT '{}'
);
```

### `whiteboard_sessions`

```sql
CREATE TABLE whiteboard_sessions (
  id                     SERIAL PRIMARY KEY,
  homework_id            INTEGER NOT NULL REFERENCES homework(id),
  student_id             INTEGER NOT NULL REFERENCES students(id),
  pdf_url                TEXT NOT NULL,
  annotations            JSONB DEFAULT '[]',
  time_spent_seconds     INTEGER DEFAULT 0,
  page_time_distribution JSONB DEFAULT '{}',     -- { "1": 120, "2": 45, ... }
  submitted_at           TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Relationships Overview

```
students ─── many sessions ──── tutors
students ─── many homework ──── tutors
students ─── many session_notes ─ tutors
students ─── many parent_updates ─ tutors
students ─── 1 hours_package
tutors ───── many tutor_availability
tutors ───── many blocked_dates
tutors ───── many blocked_slots
```

---

## Migration Checklist

Before adding any new column or table:

1. Write the SQL here in this document
2. Add the TypeScript interface to `lib/portal/types.ts`
3. Add mapper function in `lib/portal/db.ts`
4. Run the migration in Supabase SQL Editor
5. Test with `npx tsc --noEmit`
6. Update CLAUDE.md if the change affects the data model summary

---

## Supabase Storage

**Buckets:**

| Bucket | Purpose | Access |
|--------|---------|--------|
| `homework-submissions` | Student homework file uploads | Authenticated only |
| `tutor-photos` | Tutor profile photos | Public |
| `resources` | Curriculum PDFs and materials | Authenticated only |

---

## Related Documents

- `docs/Architecture.md` — How the data layer is designed
- `lib/portal/types.ts` — TypeScript interfaces for all tables
- `lib/portal/db.ts` — All read/write functions
