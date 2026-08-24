# MetaMinds — Claude Code Session Guide

Every Claude session working on this codebase should read this file first.
**Also read `PRODUCT_BIBLE.md`** before implementing any new feature — it defines the mission, learning flow, roles, curriculum philosophy, AI roadmap, and engineering principles that every implementation decision must align with.
Full architecture, philosophy, and roadmap live in `docs/`. Knowledge base lives in `knowledge/`.

---

## What Is MetaMinds?

MetaMinds STEM Academy is an **Educational Operating System** — not a tutoring website.

Students join as young children and may remain in the MetaMinds ecosystem through high school, college, and eventually return as tutors and mentors. The platform compounds: every tutor contributes curriculum, every session generates analytics, every student who becomes a mentor makes the next generation better.

**CEO / Founder:** Jose Falconi-Cavallini  
**Mission:** Personalized learning journeys that grow with every student, forever.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Icons | lucide-react |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| File Storage | Supabase Storage |
| Email | Resend |
| Deployment | Vercel |
| Payments | (planned) Stripe |

---

## Project Structure

```
metaminds_website/
├── app/
│   ├── portal/
│   │   ├── student/page.tsx       # Student portal (main — heavily featured)
│   │   ├── tutor/page.tsx         # Tutor portal
│   │   └── admin/page.tsx         # Admin portal
│   ├── api/
│   │   ├── homework/upload/       # File upload endpoint
│   │   ├── send-email/            # Resend email endpoint
│   │   └── test-email/            # Debug endpoint
│   └── login/page.tsx
├── components/
│   ├── DashboardShell.tsx         # Sidebar + layout wrapper (all portals)
│   └── portal/
│       ├── WeeklyCalendar.tsx     # Booking calendar component
│       ├── Modal.tsx
│       ├── Badge.tsx
│       └── StatCard.tsx
├── lib/
│   ├── auth.ts                    # useAuth hook, signOut
│   ├── supabase.ts                # Supabase client
│   └── portal/
│       ├── types.ts               # All shared TypeScript interfaces
│       ├── db.ts                  # All DB read/write functions
│       └── utils.ts               # formatDate, resolveZoomUrl, purchaseOptions
├── public/
│   └── images/
│       ├── template/              # Design reference PNGs (read before implementing tabs)
│       └── dashboard_Logo.png     # Current active logo
├── docs/                          # Full architecture + strategy documentation
└── knowledge/                     # Subject curriculum knowledge base
```

---

## Current Feature Status

### Student Portal (`/portal/student`)
| Tab | Status | Notes |
|-----|--------|-------|
| Dashboard (Overview) | ✅ Built | Stats, tutor card, upcoming sessions, homework alerts |
| Schedule | ✅ Built | WeeklyCalendar, horizontal session cards, booking modal |
| Homework | ✅ Built | 3-tab filter (To Do/Submitted/Graded), table, upload, expand panel |
| Session Notes | ✅ Built | Two-column: list + detail panel, search, resources, homework link |
| Updates | ✅ Built | Two-column: list + detail panel, message parser, Reply to Tutor |
| Progress | ✅ Built | SVG ring stats, subject mastery bars, monthly chart, achievements |
| Hours | ✅ Built | Package balance, purchase options |
| Learning Path | ✅ Built | Score cards, progress bar, SAT Skills Roadmap tree (R&W + Math → categories → lessons), status dots, expandable lesson detail |
| MetaMinds Lab | 🔜 Stub | Coming soon badge |
| Resources | 🔜 Planned | See `docs/Roadmap.md` |
| Courses | 🔜 Planned | |
| Projects | 🔜 Planned | |
| Achievements | 🔜 Planned | |

### Tutor Portal (`/portal/tutor`)
| Feature | Status |
|---------|--------|
| Student management | ✅ Built |
| Session management | ✅ Built |
| Homework assignment + grading | ✅ Built |
| Session notes | ✅ Built |
| Parent updates | ✅ Built |
| Learning Plan builder (per student) | ✅ Built | Create plan, add/remove lessons from catalog, mark complete |
| AI Curriculum Builder | 🔜 Planned |

### Admin Portal (`/portal/admin`)
| Feature | Status |
|---------|--------|
| Student CRUD + profile | ✅ Built |
| Tutor CRUD + profile | ✅ Built |
| Session oversight | ✅ Built |
| Hours package management | ✅ Built |
| Allow in-person toggle per student | ✅ Built |
| Email sync (Supabase Auth) | ✅ Built |
| Course catalog | 🔜 Planned |
| Analytics | 🔜 Planned |

---

## Key Data Models (summary — full schema in `docs/Database.md`)

```typescript
Student      { id, name, email, grade, subjects[], assignedTutorId, allowInPerson, archived }
Tutor        { id, name, email, subjects[], assignedStudentIds[], bookingLeadHours, archived }
Session      { id, studentId, tutorId, subject, date, time, durationHours, status, sessionType, zoomLink, notes }
Homework     { id, studentId, tutorId, task, assignedDate, dueDate, status, submissionUrl, grade, feedback }
SessionNote  { id, sessionId, tutorId, studentId, topic, notes, createdAt }
ParentUpdate { id, tutorId, studentId, message, createdAt, sessionIds[] }
HoursBalance { studentId, totalPurchased, totalUsed, remaining, expiresAt }
```

---

## Critical Coding Patterns

### IIFE Tab Rendering
Tabs use an IIFE pattern. **Never use `useState` or `useEffect` inside an IIFE** — all state lives at the top-level component.

```tsx
{tab === "homework" && (() => {
  // Computed values from top-level state are fine
  const filtered = homeworkList.filter(...);
  // Helper functions (no hooks) are fine
  const mkBadge = (h) => <span>...</span>;
  return <div>...</div>;
})()}
```

### Fragment for Table Row Pairs
When rendering expandable table rows, use `React.Fragment` with a `key`:
```tsx
{items.map((item) => (
  <Fragment key={item.id}>
    <tr>...</tr>
    {expanded && <tr><td colSpan={5}>...</td></tr>}
  </Fragment>
))}
```

### TypeScript: `as const` for stat arrays
```tsx
{([
  { label: "Total", value: 5, Icon: Bell, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
] as const).map(...)}
```

### Design Reference Images
Before implementing any new tab, always check `public/images/template/` for a matching PNG. Use `Read` tool on the image to see the design.

---

## Design System

- **Border radius:** `rounded-2xl` for cards, `rounded-xl` for inputs/badges
- **Shadows:** `shadow-sm` default, `shadow-md` on hover
- **Card structure:** `bg-white border border-gray-100 shadow-sm`
- **Section headers:** `text-[10px] font-bold text-gray-400 uppercase tracking-widest`
- **Primary action:** `bg-blue-600 text-white rounded-xl`
- **Accent colors:** blue (primary), violet (in-person/premium), emerald (success), amber (warning), red (danger)
- **Font scale:** `text-2xl` (page title), `text-base` (card title), `text-sm` (body), `text-xs` (meta), `text-[10px]` (labels)
- **Sidebar:** `bg-slate-900` with `bg-blue-600` active state

---

## Supabase Tables (current)

`students`, `tutors`, `sessions`, `homework`, `session_notes`, `parent_updates`, `hours_packages`, `tutor_availability`, `blocked_dates`, `blocked_slots`

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
RESEND_API_KEY
```

---

## Documentation Index

| File | Purpose |
|------|---------|
| `PRODUCT_BIBLE.md` | **Start here** — mission, learning flow, roles, curriculum philosophy, AI roadmap, business model, engineering principles |
| `docs/Vision.md` | Mission, philosophy, long-term vision |
| `docs/OperatingSystem.md` | What the Educational OS means technically |
| `docs/MentorPipeline.md` | The student → mentor lifecycle + credit system |
| `docs/Architecture.md` | System architecture and module design |
| `docs/Database.md` | Full schema, planned tables, relationships |
| `docs/CurriculumSystem.md` | Course/module/lesson/skill structure |
| `docs/AI.md` | AI strategy: how AI assists without inventing |
| `docs/Roadmap.md` | Phased feature roadmap |
| `docs/Brand.md` | Brand identity, voice, messaging |
| `docs/DesignPrinciples.md` | Design philosophy |
| `docs/UIUX.md` | UI patterns, components, spacing rules |
| `docs/EngineeringStandards.md` | Code conventions, PR standards, TypeScript rules |
| `docs/StudentWorkflow.md` | End-to-end student experience |
| `docs/TutorWorkflow.md` | End-to-end tutor workflow |
| `docs/ParentExperience.md` | Parent touchpoints and communication |
| `knowledge/README.md` | How the knowledge base is organized |
| `knowledge/SAT/README.md` | SAT curriculum structure (model for all subjects) |

---

## Never Do

- Never use `useState` / `useEffect` inside an IIFE tab renderer
- Never hardcode curriculum content — it belongs in `knowledge/`
- Never invent curriculum — AI assembles from `knowledge/` only
- Never commit `.env` files
- Never skip `npx tsc --noEmit` after editing portal files
- Never implement features before checking `public/images/template/` for the design reference
