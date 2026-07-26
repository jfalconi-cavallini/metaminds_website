# MetaMinds STEM Academy — Platform Architecture Reference

> **Purpose:** This document describes the entire MetaMinds platform in enough depth that a developer could understand how to build a system like it from scratch. It covers every technical decision, every data model, every UI pattern, and every feature — built and planned.

---

## 1. What Is MetaMinds?

MetaMinds STEM Academy is not a tutoring website. It is an **Educational Operating System** — four products in one:

| Product | What it is |
|---------|-----------|
| **Student LMS** | A personalized learning portal where students access lessons, submit homework, track progress, book sessions, and follow a learning path |
| **Tutor OS** | A teaching dashboard where tutors manage students, assign work, write session notes, send parent updates, and build learning plans |
| **Curriculum CMS** | A structured content management system for building, reviewing, and publishing lesson packages in a strict 8-slot format |
| **Admin Portal** | Full platform control — manage students, tutors, sessions, billing, analytics, and system configuration |

**Mission:** Personalized learning journeys that grow with every student, forever.

**Founder:** Jose Falconi-Cavallini, CEO

**The long-term differentiator:** Students who join young can stay in the MetaMinds ecosystem through high school, college, and return as paid tutors and mentors. The platform compounds — every tutor contributes curriculum, every session generates analytics, every student who becomes a mentor makes the next generation better.

---

## 2. The Learning Flow Pipeline

Every feature in the platform maps to this pipeline:

```
Admin creates student account → assigns to tutor
  ↓
Tutor creates Learning Plan → selects lessons from curriculum catalog
  ↓
Tutor runs sessions → writes session notes → assigns homework
  ↓
Student completes homework → tutor grades → system records score
  ↓
Tutor logs practice test results → platform tracks score journey
  ↓
Tutor sends parent updates → parent reads in their portal
  ↓
System awards milestones → student sees progress on learning path
  ↓
Data accumulates → AI can eventually adapt the path automatically
```

When every engineer understands this pipeline, every page built reinforces the same workflow.

---

## 3. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 15 (App Router, Turbopack) | Server + client in one repo, fast dev experience, Vercel-native deployment |
| **Language** | TypeScript (strict mode) | Required for a multi-developer codebase; catches bugs at compile time |
| **Styling** | Tailwind CSS v4 | Utility-first, consistent design tokens, no CSS file sprawl |
| **Animation** | Framer Motion | Smooth tab transitions, modal overlays, interactive micro-animations |
| **Icons** | lucide-react | Consistent icon system, tree-shakeable, works well with Tailwind sizing |
| **Database** | Supabase (PostgreSQL) | Managed Postgres with built-in auth, Row Level Security, realtime, and storage |
| **Auth** | Supabase Auth | Email/password auth with JWT sessions; role stored in user metadata |
| **File Storage** | Supabase Storage | Homework file uploads, session note attachments, profile photos |
| **Email** | Resend | Transactional email for notifications |
| **Deployment** | Vercel | Zero-config Next.js deployment, preview branches, env var management |
| **Payments** | Stripe (planned) | Hours package purchases |

---

## 4. Project File Structure

```
metaminds_website/
├── app/
│   ├── portal/
│   │   ├── student/page.tsx       # Student portal — single large client component
│   │   ├── tutor/page.tsx         # Tutor portal — single large client component
│   │   └── admin/page.tsx         # Admin portal — single large client component
│   ├── api/
│   │   ├── homework/upload/       # POST: upload student homework to Supabase Storage
│   │   ├── send-email/            # POST: send email via Resend
│   │   └── test-email/            # GET: verify Resend config (debug only)
│   └── login/page.tsx             # Email/password login page
│
├── components/
│   ├── DashboardShell.tsx         # Sidebar + layout wrapper (all portals share this)
│   └── portal/
│       ├── WeeklyCalendar.tsx     # Complex booking calendar (self-contained component)
│       ├── Modal.tsx              # Generic modal overlay wrapper
│       ├── Badge.tsx              # Status badge (color by status string)
│       └── StatCard.tsx           # Reusable stat display card
│
├── lib/
│   ├── auth.ts                    # useAuth hook; signOut helper
│   ├── supabase.ts                # Supabase browser client (singleton)
│   └── portal/
│       ├── types.ts               # ALL shared TypeScript interfaces (single source of truth)
│       ├── db.ts                  # ALL database reads/writes (no portal imports Supabase directly)
│       └── utils.ts               # Pure utility functions: formatDate, resolveZoomUrl, purchaseOptions
│
├── public/
│   └── images/
│       ├── template/              # Design reference PNGs — read before implementing any new tab
│       └── dashboard_Logo.png     # Active logo
│
├── supabase/
│   └── migrations/                # 45+ numbered SQL migration files (migration history = schema history)
│
├── docs/                          # Architecture, strategy, and design documentation
├── knowledge/                     # Curriculum knowledge base (Markdown with YAML frontmatter)
├── CLAUDE.md                      # Session guide for AI coding tools
└── PRODUCT_BIBLE.md               # Mission, philosophy, AI roadmap, business model
```

---

## 5. Authentication & Role System

### How It Works

Supabase Auth handles all authentication. Login is email + password at `/login`.

After login, the system determines the user's role by checking which table the email belongs to:

```typescript
// lib/auth.ts (simplified)
const { data: { user } } = await supabase.auth.getUser();
// Check admin env var → tutors table → students table → parents table
```

### Role Hierarchy

| Role | Portal | Access |
|------|--------|--------|
| **Admin** | `/portal/admin` | Full platform control — all students, tutors, sessions, billing |
| **Tutor** | `/portal/tutor` | Only their assigned students and sessions |
| **Student** | `/portal/student` | Only their own data |
| **Parent** | `/portal/student` (read-only view) | Their child's data — no writes |

Admin emails are stored in an environment variable, not in the database. This means admin access cannot be granted from the UI — it requires a code/config change.

### Auth Flow

```
User visits /portal/student
  → useAuth() checks Supabase session
  → No session → redirect to /login
  → Session exists → look up student row by email
  → Not found → redirect to /login with error message
  → Found → render portal, all data loads from student's ID
```

### Row Level Security (RLS)

Every table has RLS enabled. Helper functions are defined once and reused across policies:

```sql
-- Who am I?
CREATE FUNCTION my_role() RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb ->> 'role',
    'anon'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- What's my linked ID in the students/tutors table?
CREATE FUNCTION my_linked_id() RETURNS INTEGER AS $$
  SELECT (current_setting('request.jwt.claims', true)::jsonb ->> 'linked_id')::int
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Admins bypass everything
CREATE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT my_role() = 'admin'
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

Example policy:
```sql
CREATE POLICY "student own data" ON homework
  FOR SELECT USING (
    is_admin()
    OR (my_role() = 'tutor' AND tutor_id = my_linked_id())
    OR (my_role() = 'student' AND student_id = my_linked_id())
  );
```

---

## 6. Portal Architecture Pattern

All three portals use the same architecture pattern:

```
/portal/[role]/page.tsx
  ├── "use client"  — all portals are client components
  ├── useAuth()     — loads user, redirects if unauthenticated
  ├── useEffect()   — single effect that loads ALL data for the portal on mount
  ├── useState()    — tab state, modal state, all form state (top-level only)
  └── Tab rendering via IIFE pattern (see Section 9)
```

**Why a single large file per portal?** Keeps bundle simple, avoids unnecessary route changes for tab navigation, and gives a single place to reason about portal-level state. The tradeoff: files get large (~2000–4000 lines). This is accepted.

---

## 7. Data Layer

### `lib/portal/db.ts` — The Only Database Layer

No portal component imports Supabase directly for data. All reads and writes go through `db.ts`.

**Naming conventions:**
- `fetch[Entity]By[Field]()` — read one entity
- `fetch[Entity]sFor[Context]()` — read a list
- `insert[Entity]()` — create
- `update[Entity]()` — modify
- `cancel[Entity]()` — soft delete or status change
- `rowTo[Entity]()` — convert a raw DB row to a TypeScript type

```typescript
// Example DB function
export async function fetchHomeworkForStudent(studentId: number): Promise<Homework[]> {
  const { data, error } = await supabase
    .from("homework")
    .select("*")
    .eq("student_id", studentId)
    .order("assigned_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToHomework);
}
```

### `lib/portal/types.ts` — TypeScript Interfaces

All domain types live here. Never define domain types inside component files. Key interfaces:

```typescript
Student       // name, email, grade, subjects[], programs[], assignedTutorId
Tutor         // name, email, subjects[], assignedStudentIds[], bookingLeadHours
Session       // studentId, tutorId, subject, date, time, durationHours, status, sessionType
Homework      // task, assignedDate, dueDate, status, submissionUrl, grade, feedback,
              //   estimatedMinutes, assignmentType, studentTimeMinutes, difficultyRating
SessionNote   // sessionId, topic, notes, kamiLink, attachmentUrl, noteDate
ParentUpdate  // message, sessionIds[], createdAt
HoursBalance  // totalPurchased, totalUsed, remaining, expiresAt

// CMS types
Course        // subject, title, gradeLevels, status
Module        // courseId, parentId (null=section, set=category), title, position
Lesson        // moduleId, title, difficulty 1-5, estimatedMinutes, tags[], learningObjectives[]
LessonResource // lessonId, type (8 slots), url, storagePath
StudentPlan   // studentId, tutorId, courseId, startingScore, currentScore, targetScore, targetDate
StudentPlanLesson // planId, lessonId, status (pending|in_progress|completed|skipped)

// Assessment types
PracticeTestResult  // studentId, planId, testDate, overallScore, rwScore, mathScore
VocabularyWord      // word, hintDefinition, hintSentence
VocabularyAssignmentConfig  // homeworkId, words[]
VocabularySubmissionEntry   // word, definition, sentence, confidence, tutorStatus

// Skill tracking
SkillNode     // slug, course, category, parentId, title (forms a tree)
StudentSkill  // studentId, skillId, masteryScore 0-6, status (needs_work|developing|proficient|strong)
```

---

## 8. Database Schema & Migrations

### Schema Evolution Strategy

Every schema change is a numbered SQL migration file in `supabase/migrations/`. There is no ORM — raw SQL. Migration history is the schema history.

**Migration naming:** `001_initial_schema.sql`, `002_auth_notes_homework.sql`, etc.
**Numbering gaps** exist — that's fine. The files are applied in alphabetical/numeric order.

### Current Table List (45 migrations applied)

| Table | Purpose |
|-------|---------|
| `students` | Student profiles, contact info, tutor assignment |
| `tutors` | Tutor profiles, subjects, Zoom link, booking config |
| `sessions` | Individual tutoring sessions with status and type |
| `homework` | Assignments with submission tracking, grading, time estimates |
| `session_notes` | Tutor notes per session with Kami and PDF attachment support |
| `parent_updates` | Tutor → parent messages covering one or more sessions |
| `hours_packages` | Hours purchases: totalPurchased, totalUsed, remaining, expiresAt |
| `purchase_requests` | Student-initiated hour purchase requests (pending → fulfilled) |
| `tutor_availability` | Day-of-week availability slots per tutor |
| `blocked_dates` | Full days when tutor is unavailable |
| `blocked_slots` | Individual time slots blocked per date |
| `courses` | Top-level curriculum courses (SAT Prep, AP Calc, etc.) |
| `modules` | Sections and categories within courses (hierarchical, self-referencing) |
| `lessons` | Individual lessons with difficulty, objectives, tags |
| `lesson_resources` | 8 resource slots per lesson (deck, practice, homework L1/L2/L3, etc.) |
| `skills` | Legacy skill records (being migrated to skill_nodes) |
| `skill_nodes` | First-class skill tree nodes: course→category→skill hierarchy |
| `student_skills` | Per-student mastery scores on each skill node (0–6 scale) |
| `student_plans` | Learning plans linking a student to a course with score targets |
| `student_plan_lessons` | Which lessons are in a student's plan and their completion status |
| `session_note_skills` | Join: which skills a session note covered |
| `homework_skills` | Join: which skills a homework assignment targets |
| `study_log` | Student-reported study time (date, minutes, category) |
| `vocabulary_assignments` | Config for vocabulary homework type (list of words) |
| `vocabulary_submissions` | Student responses to vocabulary assignments |
| `practice_test_results` | SAT/ACT practice test scores with section breakdown |
| `admin_preview_sessions` | Admin "View as Student" tokens with permissions |

---

## 9. Key Coding Patterns

### IIFE Tab Rendering

Tabs use an Immediately Invoked Function Expression. This allows local variable scoping per tab without creating separate components.

**Critical rule: NEVER use `useState` or `useEffect` inside an IIFE.** All state lives at the top-level component.

```tsx
{tab === "homework" && (() => {
  // Local computed values from top-level state — FINE
  const filtered = homeworkList.filter(h => h.status === "pending");
  
  // Local helper functions (no hooks) — FINE
  const mkBadge = (h: Homework) => (
    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
      {h.status}
    </span>
  );
  
  return (
    <div className="space-y-4">
      {filtered.map(h => mkBadge(h))}
    </div>
  );
})()}
```

### Fragment for Expandable Table Row Pairs

When a table row expands to show a detail row, use `React.Fragment` with a key:

```tsx
import { Fragment } from "react";

{items.map((item) => (
  <Fragment key={item.id}>
    <tr onClick={() => setExpanded(item.id === expanded ? null : item.id)}>
      <td>{item.name}</td>
    </tr>
    {expanded === item.id && (
      <tr>
        <td colSpan={5} className="bg-gray-50 p-4">
          {/* Detail panel */}
        </td>
      </tr>
    )}
  </Fragment>
))}
```

### `as const` for Stat Arrays

Prevents TypeScript inference from widening literal types in inline arrays:

```tsx
{([
  { label: "Total Sessions", value: 24, Icon: CalendarDays, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
  { label: "Hours Used",     value: 18, Icon: Clock,        iconBg: "bg-violet-50", iconColor: "text-violet-600" },
] as const).map(({ label, value, Icon, iconBg, iconColor }) => (
  <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg} mb-2`}>
      <Icon className={`w-4 h-4 ${iconColor}`} />
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
  </div>
))}
```

### Two-Column Full-Bleed Layout

Used in Session Notes, Updates, and similar master/detail tabs:

```tsx
<div className="-mx-6 -mb-6 flex h-[calc(100vh-140px)]">
  {/* Left: scrollable list */}
  <div className="w-80 border-r border-gray-100 overflow-y-auto">
    {items.map(item => (
      <button key={item.id} onClick={() => setSelected(item.id)}
        className={`w-full text-left px-4 py-3 border-b border-gray-50
          ${selected === item.id ? "bg-blue-50 border-l-2 border-l-blue-500" : "hover:bg-gray-50"}`}>
        {item.title}
      </button>
    ))}
  </div>
  {/* Right: detail panel */}
  <div className="flex-1 overflow-y-auto p-6">
    {selectedItem ? <DetailPanel item={selectedItem} /> : <EmptyState />}
  </div>
</div>
```

### Section Label Pattern

Used for all section headers inside cards:

```tsx
<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
  Upcoming Sessions
</p>
```

### Pure CSS Bar Chart (No Library)

Admin analytics uses inline-style height percentages for vertical bars:

```tsx
const maxCount = Math.max(...chartMonths.map(m => m.count), 1);

<div className="flex items-end gap-2 h-32">
  {chartMonths.map(({ label, count }) => {
    const barPct = Math.max(4, Math.round((count / maxCount) * 100));
    return (
      <div key={label} className="flex-1 flex flex-col items-center gap-1">
        <span className="text-[10px] text-gray-500">{count}</span>
        <div
          className="w-full bg-blue-500 rounded-t-sm"
          style={{ height: `${barPct}%` }}
        />
        <span className="text-[10px] text-gray-400">{label}</span>
      </div>
    );
  })}
</div>
```

---

## 10. Design System

### Core Tokens

| Token | Value | Use |
|-------|-------|-----|
| Card radius | `rounded-2xl` | All card containers |
| Input radius | `rounded-xl` | Inputs, badges, buttons |
| Card shadow | `shadow-sm` | Default; `shadow-md` on hover |
| Card structure | `bg-white border border-gray-100 shadow-sm` | All white cards |
| Section label | `text-[10px] font-bold text-gray-400 uppercase tracking-widest` | Section headers |

### Color System

| Color | Meaning | Usage |
|-------|---------|-------|
| `blue-600` | Primary action | CTAs, active nav, links |
| `violet-600` | Premium / in-person | In-person sessions, premium features |
| `emerald-600` | Success / completion | Completed items, achievements |
| `amber-600` | Warning / pending | Due soon, pending review |
| `red-600` | Danger / urgent | Overdue, errors, low hours |
| `slate-900` | Sidebar background | DashboardShell sidebar |
| `gray-400/500` | Meta text | Timestamps, secondary labels |

### Typography Scale

| Class | Size | Use |
|-------|------|-----|
| `text-2xl font-bold` | 24px | Page title |
| `text-base font-semibold` | 16px | Card title |
| `text-sm` | 14px | Body text |
| `text-xs` | 12px | Meta, timestamps |
| `text-[10px]` | 10px | Section labels, micro-labels |

### Avatar Colors

Student and tutor avatars use an index-based color system so each person gets a consistent color:

```typescript
const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-teal-500",
];
const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
```

---

## 11. Student Portal — Feature by Feature

**Route:** `/portal/student`

Data loaded on mount: student profile, sessions, homework, session notes, parent updates, hours balance, learning plan, practice test results, study log.

Realtime subscriptions: `homework` table changes and `parent_updates` INSERTs for the student's ID.

### Tab: Dashboard (Overview)
- Stat cards: upcoming sessions, pending homework, hours remaining, days until goal test date
- Assigned tutor card with Zoom link
- Upcoming sessions list (next 3)
- Homework alerts (overdue and due today)

### Tab: Schedule
- `WeeklyCalendar` component showing a 7-day grid of available slots
- Horizontal session cards for upcoming/past sessions
- Book session modal: picks subject, date, time slot (filtered by tutor availability and booking lead time)
- Session type toggle: Online or In-Person (only if student has `allowInPerson = true`)

### Tab: Homework
- 3-tab filter: To Do / Submitted / Graded
- Table view with expand-on-click detail panel
- File upload (PDF/image to Supabase Storage via `/api/homework/upload`)
- Student can log time spent (`studentTimeMinutes`), note (`studentNote`), and difficulty rating
- **Vocabulary homework type:** When `assignmentType === "vocabulary"`, the expand panel shows a card-flip-style word definition form. Student writes definition + example sentence + confidence level for each word.

### Tab: Session Notes
- Two-column full-bleed layout
- Left: searchable list of notes with date and topic
- Right: detail panel — full notes, Kami whiteboard link, PDF attachment, linked homework

### Tab: Updates (Parent Updates)
- Two-column full-bleed layout
- Left: list of updates by date
- Right: full update text with message parser (detects timestamps, bullets, subject headings)
- Reply to Tutor button (sends email via Resend)

### Tab: Progress
- SVG ring stat cards (sessions completed, homework completed, hours used)
- Subject mastery bars (colored by subject)
- Monthly session chart (pure CSS bars, 6 months)
- Achievements panel (badges for milestones)

### Tab: Hours
- Package balance card: purchased, used, remaining, expiration
- Purchase options modal: 4h, 8h, 12h, 20h packages at tiered pricing
- Creates a `purchase_request` record; admin fulfills it manually

### Tab: Learning Path

This is the most data-intensive student tab. It shows:

**Score Journey Cards:**
- Starting Score (from `plan.startingScore`)
- Current Score (latest practice test composite)
- Goal Score (from `plan.targetScore`)
- Sessions Completed / Target Date

**Practice Test Score Trend:**
- Lists all `practiceTestResults` with date, section scores, and composite
- Section-only tests (math only / RW only) show partial data without composite

**Milestone System:**
- Milestone 1: "First Practice Test Taken" — unlocked when `practiceTests.length > 0`
- Milestones 2–5: Score checkpoints evenly spaced between starting score and goal score
  - Example: start=900, goal=1300 → checkpoints at 1000, 1100, 1200, 1300
  - A milestone is achieved when the current composite score ≥ that checkpoint
  - Current score = estimated composite from latest RW + latest Math (even from different tests)
- Score checkpoints only appear if both `startingScore` and `goalScore` are set

**SAT Skills Roadmap Tree:**
- Tree structure: Reading & Writing + Math → categories → individual skills
- Each skill shows a status dot: not_assessed (gray), needs_work (red), developing (amber), proficient (blue), strong (emerald)
- Clicking a skill expands a detail panel with mastery score, tutor notes, and linked session notes

**Lesson Plan:**
- Lists all lessons in the student's plan with status (pending/in_progress/completed/skipped)
- Progress bar showing completion percentage
- Expandable lesson detail with linked resources

### Tab: MetaMinds Lab
- Stub ("Coming soon") — planned AI-powered practice environment

---

## 12. Tutor Portal — Feature by Feature

**Route:** `/portal/tutor`

Data loaded on mount: tutor profile, assigned students, all sessions, all homework, session notes, parent updates, tutor availability, blocked dates, blocked slots, course catalog, student plans.

### Tab: Overview
- Section-label header with today's date
- 4 icon stat cards: total students, sessions this week, pending homework to grade, unread updates
- Today's agenda: upcoming sessions with avatar, subject chip, Zoom/In-Person chip, and action chips (Join, Add Note, Assign HW)
- Action items: overdue homework to grade, students without sessions this month
- Coming-up list: next 5 sessions across all students

### Tab: My Students
- 4 top stat cards: active students, this-week sessions, pending grading, unread updates
- Per-student expandable cards (ChevronDown rotation on expand)
- Student card header: colored avatar, name/grade/subjects, homework/session/hours chips
- Expanded: homework list, session list, quick-assign homework form
- Subject filter pill group

### Tab: Session Notes
- Full session-note CRUD
- List view with count badge
- Create note: subject, topic, full notes text, Kami link, PDF attachment, date picker
- Notes are linked to sessions when a session is selected

### Tab: Parent Updates
- Draft parent updates covering multiple sessions
- Message preview before sending
- History of sent updates per student

### Tab: Schedule
- Tutor availability editor: add/remove day-of-week time slots
- Blocked dates: specific dates when tutor is fully unavailable
- Blocked slots: individual time slots blocked within an available day
- All use `rounded-2xl shadow-sm border-gray-100` card style

### Tab: Plan Builder (Learning Plan)
- Select a student and active plan
- Browse course catalog (sections → categories → lessons)
- Add lessons to the student's plan with drag-to-reorder
- Mark lessons complete as teaching progresses
- Add practice test results (date, RW score, Math score, overall)
- Skill baseline editor: set 0–6 scores per skill category and subskill

### Tab: Settings
- Edit tutor bio, phone, Zoom link, meeting ID
- Notification preferences
- All fields use section-label headers and `rounded-2xl` cards

---

## 13. Admin Portal — Feature by Feature

**Route:** `/portal/admin`

Data loaded on mount: all students, all tutors, all sessions, all homework, all hours packages.

### Tab: Analytics

All analytics are computed from already-loaded state — no additional fetches.

**6 Metric Cards:**
- Active Students (non-archived)
- Active Tutors (non-archived)
- Sessions This Month
- Total Hours Sold (all packages)
- Total Hours Used
- Utilization % (used/sold)

**6-Month Sessions Bar Chart:**
```typescript
const chartMonths = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i));
  const pfx = d.toISOString().slice(0, 7);      // "2026-07"
  const label = d.toLocaleString("en-US", { month: "short" });
  const count = sessions.filter(s => s.date.startsWith(pfx)).length;
  const hrs = sessions.filter(s => s.date.startsWith(pfx)).reduce((sum, s) => sum + s.durationHours, 0);
  return { label, count, hrs };
});
```

**Hours Economy:**
- Aggregate utilization bar
- Per-student bars sorted by remaining hours (red <3h, amber <6h, emerald ≥6h)

**Student Watchlist:**
- Flags: inactive >30 days, low hours <3, unassigned tutor
- Sorted by flag count (most urgent first)

**Session Type Split:** Online vs In-Person count/percentage

**Top Subjects:** Completed sessions by subject (top 5)

**Tutor Workload Table:** Sessions completed, hours delivered, upcoming sessions, student count

### Tab: Students
- Full CRUD: create, edit, archive student accounts
- Profile fields: name, email, grade, subjects, programs, phone, parent info, school, graduation year
- Toggle `allowInPerson` per student
- Assign/reassign tutor
- View student's hours balance

### Tab: Tutors
- Full CRUD: create, edit, archive tutor accounts
- Profile fields: name, email, subjects, bio, Zoom link, booking lead hours
- View assigned students list

### Tab: Sessions
- Full session history with filters (student, tutor, status, date range)
- Manually create sessions
- Update session status (upcoming → completed → cancelled)

### Tab: Hours
- View all hours packages
- Manually add hours to a student
- Fulfill purchase requests

---

## 14. Practice Test Tracking System

### Data Model

```typescript
interface PracticeTestResult {
  id: number;
  studentId: number;
  planId: number | null;      // which learning plan this belongs to
  testDate: string;           // ISO date
  overallScore: number | null; // null = section-only test
  rwScore?: number;           // 200-800
  mathScore?: number;         // 200-800
  tutorNotes?: string;
}
```

### Score Journey Logic

The system tracks three scores on the student's plan:
- `startingScore` — captured at plan creation, **never updated**
- `currentScore` — updated from practice test results
- `targetScore` — the goal

**Current composite estimation:** The system takes the latest RW score from any test + the latest Math score from any test, even if they come from different test sessions. This handles section-only tests (e.g., a student who took math only on one date).

```typescript
const latestRW   = [...practiceTests].sort(...).find(t => t.rwScore != null)?.rwScore;
const latestMath = [...practiceTests].sort(...).find(t => t.mathScore != null)?.mathScore;
const curScore   = latestRW != null && latestMath != null ? latestRW + latestMath : null;
```

### Milestone System

- **Milestone 1 (First Practice Test):** Unlocked when `practiceTests.length > 0` — independent of score
- **Milestones 2–5 (Score Checkpoints):** Computed from start→goal range, evenly spaced

```typescript
const scoreCheckpoints = (startScore && goalScore && goalScore > startScore)
  ? [1, 2, 3, 4].map(n => ({
      n: n + 1,
      score: Math.round((startScore + ((goalScore - startScore) * n) / 4) / 10) * 10
    }))
  : null;
```

This design means a student who takes a math-only practice test still earns Milestone 1 immediately.

---

## 15. Vocabulary Homework Type

Standard homework has a `task` text field. Vocabulary homework adds a structured config:

```typescript
interface VocabularyAssignmentConfig {
  id: number;
  homeworkId: number;
  words: VocabularyWord[];   // [{word, hintDefinition?, hintSentence?}]
}

interface VocabularySubmissionEntry {
  homeworkId: number;
  studentId: number;
  wordIndex: number;
  word: string;
  definition: string;          // student writes this
  sentence: string;            // student writes this
  confidence: "low"|"medium"|"high";
  tutorStatus: "pending"|"correct"|"needs_revision";
  tutorFeedback?: string;
}
```

**Student UX:** Card-flip style form. One word at a time. Student writes definition + example sentence + selects confidence level.

**Tutor UX:** Grades each word submission individually — marks correct or needs revision, can add per-word feedback.

---

## 16. Study Time Tracking

Students can log study time independent of sessions:

```typescript
interface StudyLog {
  id: number;
  studentId: number;
  logDate: string;
  minutes: number;
  category: string;   // "homework" | "reading" | "practice" | "review" | "other"
  note?: string;
  homeworkId?: number; // optional link to a homework item
}
```

When a student submits homework, they can report `studentTimeMinutes` on the homework itself. The system also supports free-form study log entries for independent study.

Weekly study goal is stored on the student record (`weeklyStudyGoalMinutes`) and set by the tutor in the plan builder.

---

## 17. Curriculum CMS

### Hierarchy

```
Course  (e.g. "SAT Math Prep — Full Program")
  └─ Section  (e.g. "Algebra")
       └─ Category  (e.g. "Linear Equations")
            └─ Lesson  (e.g. "Slope-Intercept Form")
                 └─ 8 Resource Slots  (auto-created on lesson insert)
```

Sections and categories are both stored in the `modules` table with a `parent_id` column. Top-level modules (parent_id = null) are sections; child modules are categories.

### The 8-Slot Lesson Package

Every lesson has exactly 8 resource slots, created automatically:

| Slot | Type | Purpose |
|------|------|---------|
| Lesson Deck | `lesson_deck` | Main teaching slides |
| Guided Practice | `guided_practice` | Worked examples with tutor |
| Tutor Guide | `tutor_guide` | Teaching notes, pacing, common mistakes |
| Homework L1 | `homework_l1` | Easy tier — builds confidence |
| Homework L2 | `homework_l2` | Medium tier — consolidates learning |
| Homework L3 | `homework_l3` | Hard tier — stretches ability |
| Answer Key | `answer_key` | Answers for all homework tiers |
| Mastery Check | `mastery_check` | End-of-lesson quiz |

### Lesson Fields (beyond title)

```typescript
interface Lesson {
  difficulty: number;           // 1–5
  estimatedMinutes: number;     // class time
  hwMinutes?: number;           // homework time (separate)
  tags: string[];
  learningObjectives: string[];
  commonMistakes?: string;
  tutorNotes?: string;
  desmosUsage?: string;
  prerequisites?: string;
  followUp?: string;
  status: "draft" | "in_review" | "active" | "archived";
}
```

### Approval Workflow

```
Draft → In Review → Active → Archived
```

Only `active` lessons appear in the tutor's course library and can be assigned to students.

### Knowledge Base

Curriculum content lives in `knowledge/` as Markdown files with YAML frontmatter:

```yaml
---
id: sat-algebra-linear-equations
subject: SAT
module: Algebra
lesson: Linear Equations
skills: [slope-intercept-form, solving-for-x]
difficulty: 2
estimated_minutes: 45
prerequisites: [basic-algebra, variables]
grade_level: [9, 10, 11, 12]
---
```

**Why Markdown?** Human-readable (tutors can contribute), AI-parseable (agents can assemble curriculum), version-controlled (git tracks every change), and searchable.

**Critical rule:** AI assembles from `knowledge/` — it never invents curriculum.

---

## 18. Skill Tracking System

### Skill Nodes (Tree Structure)

Skills form a 3-level tree: course → category → skill

```typescript
interface SkillNode {
  id: number;
  slug: string;      // "sat-math-algebra-linear-equations"
  course: string;    // "SAT"
  category: string;  // "Math"
  parentId: number | null;   // null = top-level node
  title: string;
}
```

### Student Skill Mastery

```typescript
interface StudentSkill {
  studentId: number;
  skillId: number;
  masteryScore: number;          // 0–6 (within-status precision)
  status: StudentSkillStatus;    // not_assessed | needs_work | developing | proficient | strong
  tutorNotes?: string;
  lastAssessed?: string;
}
```

### Skill Tagging

Session notes can be tagged with skills: `session_note_skills` join table.
Homework assignments can be tagged with skills: `homework_skills` join table.

This enables future features: "show me all notes where we covered slope-intercept form" and "which skills does this student's homework cover?"

---

## 19. API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/homework/upload` | POST | Multipart upload to Supabase Storage. Returns public URL. |
| `/api/send-email` | POST | Send email via Resend. Body: `{to, subject, html}` |
| `/api/test-email` | GET | Verify Resend config is working (debug only) |

### File Upload Pattern

```typescript
// app/api/homework/upload/route.ts
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File;
  const studentId = form.get("studentId") as string;
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const filename = `${studentId}/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from("homework-submissions")
    .upload(filename, buffer, { contentType: file.type });
  
  if (error) return Response.json({ error: error.message }, { status: 500 });
  
  const { data: { publicUrl } } = supabase.storage
    .from("homework-submissions")
    .getPublicUrl(data.path);
  
  return Response.json({ url: publicUrl, filename: file.name });
}
```

---

## 20. DashboardShell Component

All portals share a single `DashboardShell` layout component:

```typescript
interface DashboardShellProps {
  role: string;
  userName: string;
  navItems: { id: string; label: string; icon: LucideIcon }[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}
```

The shell renders:
- `bg-slate-900` left sidebar with nav items
- `bg-blue-600` active nav item highlight
- Logo at top of sidebar
- User name and sign-out button at bottom of sidebar
- Right content area for tab content

---

## 21. Realtime Architecture

Supabase channels keep the student portal live without polling:

```typescript
const channel = supabase
  .channel(`student-live-${sid}`)
  .on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "homework",
    filter: `student_id=eq.${sid}`
  }, () => {
    fetchHomeworkForStudent(sid).then(setHomeworkList);
  })
  .on("postgres_changes", {
    event: "INSERT",
    schema: "public",
    table: "parent_updates",
    filter: `student_id=eq.${sid}`
  }, () => {
    fetchParentUpdatesForStudent(sid).then(setUpdates);
  })
  .subscribe();

return () => { supabase.removeChannel(channel); };
```

---

## 22. Engineering Standards

### Non-Negotiable Rules

| Rule | Reason |
|------|--------|
| `npx tsc --noEmit` must pass with zero errors before every commit | Strict TypeScript prevents runtime bugs; the build will also fail on Vercel |
| Never commit `.env` files | Secret exposure in git history is permanent |
| Never use `useState` or `useEffect` inside an IIFE tab renderer | React hooks rules; hooks must be called at the top level of a component |
| Never hardcode curriculum content | Curriculum belongs in `knowledge/` for AI-parseability and version control |
| Never invent curriculum with AI | AI assembles from `knowledge/` — it reads, it doesn't create |
| Check `public/images/template/` before implementing any new tab | Design reference images define the expected layout |
| All domain types in `lib/portal/types.ts` | Single source of truth for types; no duplicates in component files |
| All DB access through `lib/portal/db.ts` | No Supabase imports in portal components |

### Migration Standards

- Every schema change = a new numbered migration file
- Never edit applied migrations
- Always include `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` on every table
- Wrap multi-statement migrations in a transaction: `BEGIN; ... COMMIT;`
- Test RLS policies before shipping — RLS is enforced at the database level, not the application level

### Component Decision Rule

**Create a separate component when:**
- Used in more than one place
- Needs its own hooks
- Complex enough to benefit from independent testing

**Use IIFE tab rendering when:**
- Only used in one tab of one portal
- Only needs computed values from parent state
- No hooks required

---

## 23. The Mentor Pipeline (Long-Term Vision)

This is the biggest differentiator — what separates MetaMinds from every other tutoring platform.

```
Student joins at age 7–8
  ↓
Scratch → Python → Java / SAT Prep → Strong performance
  ↓
Junior Mentor (age 15–18)
  • Assists tutors in sessions with younger students
  • Earns MetaMinds Credits toward their own tutoring
  • Builds a real teaching portfolio
  ↓
College Student
  • Returns as a College Tutor (paid)
  • Stays connected to the ecosystem
  • Builds resume, references, and teaching experience
  ↓
Graduate / Professional
  • Returns as a Graduate Mentor
  • Contributes curriculum to the platform
  • Mentors the next generation of Junior Mentors
```

**This is the flywheel:** Revenue compounds. Curriculum compounds. Talent compounds.

The platform is named the **MetaMinds Leadership Program** — never "kids teaching kids."

### Credits System (Planned)

```typescript
interface MentorCredit {
  mentorId: number;
  creditType: "teaching" | "curriculum" | "review" | "bonus";
  amount: number;
  sessionId?: number;
  curriculumId?: number;
  earnedAt: string;
  redeemedAt?: string;
  redemptionType?: string;  // "tutoring_hours" | "course_access"
}
```

---

## 24. AI Roadmap

AI in MetaMinds is a tool for tutors, not a replacement for them. All AI output is grounded in `knowledge/` content.

### Phase 1 — Automation (reduce tutor admin time)
- AI-drafted parent updates (tutor reviews and approves before sending)
- AI homework suggestions based on lesson taught that day
- AI session note summary from tutor voice input or transcript
- Automatic skill tagging from session notes

### Phase 2 — Adaptation (personalize the path)
- AI Curriculum Builder: tutor selects a topic, AI assembles a lesson package from `knowledge/`
- Adaptive homework difficulty based on submission history
- Skill gap detection from grades and mastery check scores
- Recommended next lesson based on current skill map

### Phase 3 — Intelligence (the long-term learning model)
- Per-student learning model that persists across years
- Predictive analytics ("This student is likely to struggle with quadratics next week — here's why")
- Whiteboard / image analysis for in-person sessions
- AI Study Companion for students between sessions
- Automatic achievement detection and milestone recognition

---

## 25. Business Model

Every feature built should support at least one revenue stream:

| Revenue Stream | Stage | Notes |
|---------------|-------|-------|
| **Private Tutoring** | Now | Core — 1:1 sessions, hours packages |
| **Group Classes** | Near-term | Small groups, same curriculum, lower cost per student |
| **Bootcamps** | Near-term | Intensive SAT or coding programs |
| **Summer Camps** | Seasonal | Same infrastructure as group classes |
| **Monthly Membership** | Mid-term | Platform access + curriculum for independent learners |
| **Course Marketplace** | Mid-term | Tutors and curriculum managers sell lesson packages |
| **School Partnerships** | Long-term | Institutional licenses, district-level contracts |

---

## 26. Feature Status Summary

### Student Portal
| Tab | Status |
|-----|--------|
| Dashboard (Overview) | ✅ Built |
| Schedule | ✅ Built |
| Homework | ✅ Built |
| Session Notes | ✅ Built |
| Updates | ✅ Built |
| Progress | ✅ Built |
| Hours | ✅ Built |
| Learning Path | ✅ Built |
| MetaMinds Lab | 🔜 Stub |
| Resources | 🔜 Planned |
| Courses | 🔜 Planned |
| Projects | 🔜 Planned |
| Achievements | 🔜 Planned |

### Tutor Portal
| Feature | Status |
|---------|--------|
| Overview | ✅ Built |
| My Students | ✅ Built |
| Session Notes | ✅ Built |
| Parent Updates | ✅ Built |
| Schedule / Availability | ✅ Built |
| Plan Builder (Learning Plan) | ✅ Built |
| Settings | ✅ Built |
| AI Curriculum Builder | 🔜 Planned |

### Admin Portal
| Feature | Status |
|---------|--------|
| Analytics Dashboard | ✅ Built |
| Student CRUD | ✅ Built |
| Tutor CRUD | ✅ Built |
| Session Oversight | ✅ Built |
| Hours Management | ✅ Built |
| Allow In-Person Toggle | ✅ Built |
| Email Sync (Supabase Auth) | ✅ Built |
| Course Catalog CMS | 🔜 Planned |
| Advanced Analytics | 🔜 Planned |

### Platform Infrastructure
| Feature | Status |
|---------|--------|
| Supabase Auth with roles | ✅ Built |
| Row Level Security (all tables) | ✅ Built |
| File upload (Supabase Storage) | ✅ Built |
| Email notifications (Resend) | ✅ Built |
| Realtime homework/updates | ✅ Built |
| Practice test tracking | ✅ Built |
| Vocabulary homework type | ✅ Built |
| Study time tracking | ✅ Built |
| Skill node tree | ✅ Built |
| Skill tagging (notes, homework) | ✅ Built |
| Admin preview mode ("View as Student") | 🔜 Designed, not implemented |
| Stripe payments | 🔜 Planned |
| Parent portal (full) | 🔜 Planned |
| Junior Mentor portal | 🔜 Planned |
| AI curriculum assembly | 🔜 Planned |

---

## 27. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Supabase anonymous/public key
RESEND_API_KEY                  # Resend email API key
NEXT_PUBLIC_ADMIN_EMAIL         # Comma-separated admin emails (or single)
```

---

## 28. Deployment

| Environment | URL | Branch |
|------------|-----|--------|
| Production | Vercel (auto-deploy) | `main` |
| Preview | Vercel (auto-generated URL) | Any PR |

**Before every deploy:**
```bash
npx tsc --noEmit   # must return zero output (zero errors)
```

**Build command:** `next build`  
**Node version:** 20+  
**Framework preset:** Next.js (Vercel detects automatically)

---

## Key Architectural Decisions Summary

| Decision | Rationale |
|----------|-----------|
| Single client component per portal | Simpler bundle, no route changes for tab nav, single location for portal-level state |
| IIFE tab rendering | Local variable scoping per tab without separate components; tradeoff is no hooks inside |
| All DB in db.ts | Prevents scattered Supabase imports; single place to add auth, caching, error handling |
| All types in types.ts | Single source of truth; prevents type drift between portals |
| Migrations in SQL files | No ORM abstraction; full control; migration history = schema history |
| RLS everywhere | Security enforced at DB level regardless of application bugs |
| Knowledge base in Markdown | AI-parseable, human-editable, version-controlled, searchable |
| No charting library | Pure CSS bar charts are simpler, faster to load, and sufficient for current analytics |
| Supabase for everything | Auth + DB + Storage + Realtime in one system; reduces operational complexity |
