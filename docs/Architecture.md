# MetaMinds System Architecture

**Version:** 1.0  
**Status:** Living Document

---

## Architectural Philosophy

MetaMinds is an Educational Operating System. Every architectural decision should ask:

1. Does this serve the student's long-term learning journey?
2. Does this make curriculum easier to compound?
3. Does this give tutors better tools to teach?
4. Does this scale from 10 students to 100,000 students?
5. Can an AI agent use this data to make intelligent decisions?

---

## High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    MetaMinds Platform                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Student    │  │    Tutor     │  │     Admin        │  │
│  │   Portal     │  │   Portal     │  │     Portal       │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│          │                │                    │            │
│          └────────────────┴────────────────────┘            │
│                           │                                 │
│                    ┌──────▼──────┐                          │
│                    │  App Router │                          │
│                    │  (Next.js)  │                          │
│                    └──────┬──────┘                          │
│                           │                                 │
│           ┌───────────────┼───────────────┐                 │
│           │               │               │                 │
│    ┌──────▼─────┐  ┌──────▼────┐  ┌──────▼──────┐         │
│    │  lib/portal│  │  API      │  │  Components  │         │
│    │  (db.ts)   │  │  Routes   │  │  (shared)    │         │
│    └──────┬─────┘  └──────┬────┘  └─────────────┘         │
│           │               │                                 │
│    ┌──────▼───────────────▼──────┐                          │
│    │          Supabase           │                          │
│    │  PostgreSQL + Auth + Storage│                          │
│    └─────────────────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Portal Architecture

### Role-Based Access

Three portals, one auth system (Supabase Auth).

| Portal | Route | Role Check |
|--------|-------|-----------|
| Student | `/portal/student` | `user.email` matches `students.email` |
| Tutor | `/portal/tutor` | `user.email` matches `tutors.email` |
| Admin | `/portal/admin` | `user.email` in admin whitelist (env var) |

Each portal is a single large client component that manages all tab state locally. This is intentional: it keeps the bundle simple and avoids unnecessary route changes for tab navigation.

### Portal Component Pattern

```
/portal/[role]/page.tsx
├── useAuth() — loads user, redirects if unauthenticated
├── useEffect() — loads all data for the portal on mount
├── useState() — manages tab state, modal state, form state
└── Tab rendering via IIFE pattern:
    {tab === "X" && (() => {
      // local computed values
      // local helper functions (no hooks!)
      return <JSX />;
    })()}
```

**Why IIFEs?** They allow local variable scoping per tab without creating separate components for each tab. The tradeoff is that hooks cannot be used inside them — all useState/useEffect must be at the top of the portal component. This is an explicit, understood constraint.

---

## Data Layer Architecture

### `lib/portal/db.ts` — The Single Source of Truth

All database reads and writes go through `lib/portal/db.ts`. No portal component should import Supabase directly for data operations.

**Naming conventions:**
- `fetch[Entity]By[Field]()` — reads
- `insert[Entity]()` — creates
- `update[Entity]()` — updates
- `cancel[Entity]()` — soft deletes or status changes
- `rowTo[Entity]()` — DB row to TypeScript type mapper

**Example:**
```typescript
export async function fetchStudentById(id: number): Promise<Student> {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return rowToStudent(data);
}
```

### `lib/portal/types.ts` — Shared Type Definitions

All TypeScript interfaces for domain objects live here. Never define domain types inside component files.

### `lib/portal/utils.ts` — Pure Utility Functions

Date formatting, URL parsing, purchase options. No Supabase imports. All functions must be pure (no side effects).

---

## API Routes

Current API routes under `app/api/`:

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/homework/upload` | POST | Upload student homework file to Supabase Storage |
| `/api/send-email` | POST | Send email via Resend |
| `/api/test-email` | GET | Debug Resend configuration |

### Planned API Routes (Phase 2+)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/curriculum/generate` | POST | AI curriculum assembly from knowledge base |
| `/api/practice/question` | GET | Fetch adaptive practice question |
| `/api/practice/submit` | POST | Submit answer, update skill mastery |
| `/api/analytics/skills` | GET | Skill mastery data for a student |
| `/api/credits/award` | POST | Award MetaMinds Credits to a Junior Mentor |
| `/api/whiteboard/save` | POST | Save PDF annotation session |

---

## Component Architecture

### Shared Components (`components/`)

```
components/
├── DashboardShell.tsx     # Sidebar + layout for all portals
│                          # Props: role, userName, navItems, activeTab, onTabChange, children
└── portal/
    ├── WeeklyCalendar.tsx # Booking calendar (complex, self-contained)
    ├── Modal.tsx          # Generic modal wrapper
    ├── Badge.tsx          # Status badge
    └── StatCard.tsx       # Reusable stat display card
```

### Design Rule: Components vs. IIFE

**Use a separate component when:**
- The UI element is used in more than one place
- The logic is complex enough to need its own hooks
- It has meaningful props and can be tested independently

**Use IIFE tab rendering when:**
- The UI is only used in one tab of one portal
- It only needs computed values from parent state
- No hooks are required

---

## Knowledge Base Architecture

The knowledge base lives in `knowledge/` as Markdown files with YAML frontmatter.

```
knowledge/
├── README.md              # Index and taxonomy
├── [Subject]/
│   ├── README.md          # Subject overview, prerequisites, skills list
│   ├── course.md          # Full course outline
│   └── modules/
│       └── [Module]/
│           ├── README.md  # Module overview
│           └── lessons/
│               └── [Lesson].md  # Individual lesson
```

### Why Markdown?

- Human-readable (tutors can contribute without code knowledge)
- AI-parseable (future agents can read and assemble curriculum)
- Version-controlled (every curriculum change is tracked in git)
- Searchable (grep, semantic search, full-text search)

### Knowledge File Frontmatter (Lesson)

```yaml
---
id: sat-algebra-linear-equations
subject: SAT
module: Algebra
lesson: Linear Equations
skills:
  - slope-intercept-form
  - solving-for-x
  - word-problems-linear
difficulty: 2        # 1-5
estimated_minutes: 45
prerequisites:
  - basic-algebra
  - variables
grade_level: [9, 10, 11, 12]
tutor_level: [college_tutor, graduate_mentor]
last_reviewed: 2026-07-15
---
```

---

## Authentication Architecture

Supabase Auth handles all authentication.

- Login: `/login` — email + password
- Session persistence: Supabase handles via cookies
- Role determination: After auth, check which table (students/tutors/admin) the email belongs to
- Admin emails: Stored in environment variable (not in DB, for security)

### Auth Flow

```
User visits /portal/student
  → useAuth() checks session
  → No session → redirect to /login
  → Session exists → load student data by email
  → Student not found → redirect to /login with error
  → Student found → render portal
```

---

## Realtime Architecture

Supabase realtime subscriptions keep the student portal live without polling.

**Current subscriptions:**
- `homework` table changes for the student's ID → refresh homework list
- `parent_updates` INSERT for the student's ID → refresh updates list

**Pattern:**
```typescript
const channel = supabase
  .channel(`student-live-${sid}`)
  .on("postgres_changes", { event: "*", schema: "public", table: "homework",
    filter: `student_id=eq.${sid}` }, () => {
    fetchHomework(sid).then(setHomeworkList);
  })
  .subscribe();
return () => { supabase.removeChannel(channel); };
```

---

## Planned System Expansions

### Phase 2: Learning Path Engine

```
LearningPath {
  studentId
  subjectId
  currentModule
  currentLesson
  completedLessons[]
  skillMastery: Record<skillId, 0-100>
  nextRecommendedLesson
  estimatedCompletionDate
}
```

### Phase 3: AI Curriculum Assembly

```
CurriculumRequest {
  studentId
  subject
  currentSkillLevel
  targetGoal           # "SAT 1400", "AP CSP exam", "Python basics"
  availableWeeks
}
  ↓ AI reads knowledge/[Subject]/**
  ↓ Assembles: lessons, homework, resources, practice questions
  ↓ Returns: PersonalizedCurriculum
  ↓ Tutor reviews + approves
  ↓ Published to student
```

### Phase 4: Whiteboard / PDF Annotation

Every homework submission eventually happens inside MetaMinds, not as a file upload.

```
HomeworkSession {
  homeworkId
  studentId
  pdfUrl
  annotations[]
  timeSpentSeconds
  pageTimeDistribution: Record<pageNum, seconds>
  submittedAt
}
```

### Phase 5: Credits & Compensation

```
MentorCredit {
  mentorId
  creditType: "teaching" | "curriculum" | "review" | "bonus"
  amount
  sessionId?
  curriculumId?
  earnedAt
  redeemedAt?
  redemptionType?
}
```

---

## Deployment Architecture

| Environment | URL | Branch |
|------------|-----|--------|
| Production | metaminds.vercel.app | `main` |
| Preview | auto-generated | any PR |

**Build command:** `next build`  
**TypeScript check before deploy:** `npx tsc --noEmit` must pass with zero errors.

---

## Related Documents

- `docs/Database.md` — Full schema documentation
- `docs/EngineeringStandards.md` — Code conventions
- `docs/CurriculumSystem.md` — Knowledge base design
- `docs/AI.md` — AI integration strategy
