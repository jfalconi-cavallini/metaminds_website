# Accountability and Learning Plan — Architecture and Implementation Plan

*Created: 2026-07-22*

---

## Current System Audit

### Homework table (as of migration 018)

```
id                  integer PK
student_id          integer FK → students
tutor_id            integer FK → tutors
task                text            — assignment description
assigned_date       date
due_date            date NULL
status              text            — 'pending' | 'submitted' | 'completed'
created_at          timestamptz
submission_url      text NULL       — storage path (student PDF)
submission_filename text NULL
submitted_at        timestamptz NULL
grade               text NULL       — free text: "A+", "95%", "9/10"
feedback            text NULL       — tutor feedback text
feedback_at         timestamptz NULL
attachment_url      text NULL       — storage path (tutor PDF)
attachment_filename text NULL
kami_link           text NULL
```

**Missing for Phase 1:**
- `estimated_minutes` (tutor sets)
- `assignment_type` (tutor sets)
- `instructions` (tutor sets; currently only `task` exists)
- `student_time_minutes` (student reports on submission)
- `student_note` (student optional note)
- `difficulty_rating` (student: easy/appropriate/difficult)

### Key API routes

| Route | Caller | Purpose |
|---|---|---|
| `POST /api/homework/upload` | Student | Upload PDF + mark submitted |
| `POST /api/homework/attach` | Tutor | Upload PDF attachment |
| `POST /api/homework/signed-url` | Student/Tutor | Get signed URL for stored PDF |

### Key components affected by Phase 1

| File | What changes |
|---|---|
| `lib/portal/types.ts` | Add 6 new optional fields to `Homework` interface |
| `lib/portal/db.ts` | Update `rowToHomework`, `insertHomework`, `submitHomework` |
| `app/api/homework/upload/route.ts` | Accept + write student time data |
| `app/portal/tutor/page.tsx` | Form state, `submitHomework()`, form UI, card display |
| `app/portal/student/page.tsx` | Form state, `handleHomeworkUpload()`, expand panel UI, table row |

### Inline mapping risk

`handleHomeworkUpload` in `student/page.tsx` (line 340) manually maps the raw DB row snake_case → camelCase without calling `rowToHomework`. Any new column added to the DB must be mapped here explicitly in addition to updating `rowToHomework` in `db.ts`.

---

## Implementation Phases

### Phase 1 — Assignment Time Estimates + Student-Reported Study Time ✅ (this session)

**Migration 030:** Add 6 columns to `homework`.

**Tutor form additions:**
- Assignment type dropdown (Problems / Reading / Practice Test / Review / Essay / Other)
- Estimated time in minutes (strongly encouraged, numeric input)
- Optional instructions textarea

**Student submission additions:**
- Time spent in minutes (required, 1–600)
- Difficulty rating (Easy / Appropriate / Difficult)
- Optional student note

**Display everywhere:**
- Estimated time chip on all homework rows/cards
- Student-reported time in tutor grading view
- Student's own reported time in submission history

### Phase 2 — Study Log + Weekly Goal + Accountability Dashboard

**New table:** `study_log`
```
id             integer PK
student_id     integer FK → students
log_date       date
minutes        integer (1–600)
category       text ('homework' | 'sat_practice' | 'act_practice' | 'practice_test' | 'reading' | 'math' | 'review' | 'other')
note           text NULL
homework_id    integer FK → homework NULL  — links auto-log from submission
created_at     timestamptz
```

**New column on `students`:** `weekly_study_goal_minutes integer default 180`

**Student UI:** Study time summary on dashboard (today/week/month), 7-day chart, streak, goal progress.

**Tutor UI:** Per-student accountability stats (study time this week, goal, completion rate, estimated vs actual).

### Phase 3 — SAT/ACT Learning Plan + Skill Mastery

**New tables:** `student_test_plans`, `test_skill_areas`, `student_skill_mastery`

**Student UI:** Learning Plan page with score goals, skill groups (expandable), mastery states.

**Tutor UI:** Per-student plan editor, skill mastery update, "Recommended Next Focus" area.

### Phase 4 — UX Polish, Responsive, QA

---

## Migration Risk Assessment

- Adding nullable columns (`ADD COLUMN IF NOT EXISTS ... NULL`) to `homework` is zero-downtime.
- No existing queries or policies change — all new columns default to NULL.
- The inline mapping in `student/page.tsx:handleHomeworkUpload` (lines 340–352) is the only place where raw DB fields are mapped outside `rowToHomework` — must be kept in sync manually.

---

## Pages/Components That Change in Phase 1

| Page | Section | Change |
|---|---|---|
| Tutor portal Homework tab | New assignment form | +3 fields: type, estimated mins, instructions |
| Tutor portal Homework tab | `renderCard` | Show estimated time chip + student-reported time |
| Tutor portal My Students panel | Homework sub-tab | Unchanged (simple quick-add form) |
| Student portal Homework tab | Table rows | Show estimated time chip |
| Student portal Homework tab | `mkExpandPanel` | Add time/difficulty/note reporting form |
| Student portal Homework tab | `handleHomeworkUpload` | Validate + send time data |
| `/api/homework/upload` | Route handler | Read + validate + write time data |
| `lib/portal/types.ts` | `Homework` interface | +6 fields |
| `lib/portal/db.ts` | Multiple | `rowToHomework`, `insertHomework`, `submitHomework` |
