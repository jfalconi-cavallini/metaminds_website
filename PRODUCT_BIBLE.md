# MetaMinds Product Bible

> This is the source of truth for **why** MetaMinds exists and **where** it is going.
> `CLAUDE.md` is the source of truth for what's been built and how the code works.
> When they conflict, the code wins — update this document to reflect reality.

---

## North Star

MetaMinds is an **Educational Operating System**.

We are not building a tutoring website.

We are building the platform that manages every aspect of a student's academic journey — from elementary school through college and eventually into becoming a tutor or mentor themselves.

**Every feature should answer one question:**

> Does this help students learn more effectively while making tutors more effective?

Everything else is secondary.

---

## What MetaMinds Actually Is

MetaMinds is four products sharing one database:

```
MetaMinds
├── Student LMS             — The student's full learning journey, K–12 and beyond
├── Tutor Operating System  — Everything a tutor needs to teach, plan, and communicate
├── Curriculum CMS          — Lesson packages built to last and improve over time
├── Parent Portal           — Real-time visibility and communication for parents
├── Admin Portal            — Platform control, billing, oversight
└── AI Learning Engine      — Data layer that makes every lesson smarter over time
```

This is not a tool. It is an ecosystem. Every product makes the others stronger.

---

## Product Principles

- **Curriculum-first.** Great lessons outlast any single tutor. Build curriculum that works without its author.
- **AI assists, never replaces.** The best tutors don't need AI to teach — they use AI to eliminate the work that doesn't require a human.
- **Every lesson is reusable.** One tutor building a lesson package benefits every future tutor and every future student who takes that lesson.
- **Data should eliminate repetitive tutor work.** If a tutor does something more than once manually, the platform should eventually do it for them.
- **Every click should save tutor time.** If a feature adds more steps than it removes, it's wrong.
- **Student progress must be measurable.** If we can't measure it, we can't improve it.
- **Parents should always know what's happening.** A parent who feels informed is a parent who stays. A parent who is surprised is a parent who leaves.
- **Curriculum compounds over time.** The 100th lesson we build is better than the 1st because of everything we learned from the 99 before it.

---

## The Learning Flow

Everything moves in one direction. Every portal, every feature, every database table should support this pipeline:

```
Admin
  │
  ├── Creates Course
  ├── Builds Lesson Packages (8-slot structure)
  └── Publishes to Course Library
          │
          ▼
       Tutor
  │
  ├── Browses Course Library
  ├── Assigns Lesson Package to Student
  ├── Teaches Session (Zoom / In-Person)
  ├── Writes Session Notes
  └── Assigns Homework (from package)
          │
          ▼
      Student
  │
  ├── Receives Homework Assignment
  ├── Completes Lesson Deck (self-study or in-session)
  ├── Submits Homework
  └── Takes Mastery Check
          │
          ▼
       Tutor
  │
  ├── Reviews Submission
  ├── Grades + Leaves Feedback
  ├── Sends Parent Update
  └── Schedules Next Session
          │
          ▼
      Platform
  │
  ├── Updates Progress / Skill Map
  ├── AI Detects Skill Gaps
  ├── Adapts Next Lesson Recommendation
  └── Updates Long-Term Learning Model
```

When every engineer understands this pipeline, every page built reinforces the same workflow. When a feature doesn't fit into this diagram, ask why before building it.

---

## The Long-Term Vision: The Mentor Pipeline

This is what separates MetaMinds from every other tutoring platform.

```
Student joins at age 7–8
    │
    ├── Scratch → Python → Java
    ├── SAT Prep → College Applications
    └── Strong academic performance unlocks Junior Mentor status
          │
          ▼
   Junior Mentor (age 15–18)
    │
    ├── Assists tutors in sessions with younger students
    ├── Earns MetaMinds credits toward their own college prep tutoring
    └── Builds a real teaching portfolio
          │
          ▼
   College Student
    │
    ├── Returns as a College Tutor (paid)
    ├── Stays connected to the ecosystem through college
    └── Builds resume, references, and teaching experience
          │
          ▼
   Graduate / Professional
    │
    ├── Returns as a Graduate Mentor
    ├── Contributes curriculum to the platform
    └── Mentors the next generation of Junior Mentors
```

The platform compounds. Every student who becomes a mentor makes the next generation of students better. Every lesson contributed improves the curriculum for every future student.

This is called the **MetaMinds Leadership Program** — never "kids teaching kids."

**This is the flywheel.** Revenue compounds. Curriculum compounds. Talent compounds.

---

## The Six Roles

There are currently three portals. There are ultimately six distinct roles, each with different permissions, workflows, and data access. Document this now so permissions don't need to be redesigned later.

| Role | Access Level | Core Job |
|------|-------------|---------|
| **Admin** | Full platform control | Manage students, tutors, curriculum, sessions, billing, settings |
| **Curriculum Manager** | Curriculum CMS only | Build, review, and publish lesson packages (may eventually separate from Admin) |
| **Tutor** | Assigned students only | Teach, assign homework, write notes, send parent updates |
| **Junior Mentor** | Limited — assists a tutor | Observe sessions, assist with homework review, earn credits |
| **Parent** | Read-only — their child only | View progress, sessions, homework status, parent updates |
| **Student** | Their own journey only | Access lessons, submit homework, view progress, join sessions |

---

## The Curriculum Philosophy

Everything revolves around the **Lesson Package**. A lesson is not a PDF. It is a structured, reusable, measurable unit of teaching.

### The 8-Slot Lesson Package

Every lesson in MetaMinds has exactly these 8 resource slots, created automatically when a lesson is inserted:

| Slot | Category | Purpose |
|------|----------|---------|
| Lesson Deck | In-Class | Main teaching slides used in session |
| Guided Practice | In-Class | Worked examples done with tutor |
| Tutor Guide | In-Class | Teaching notes, pacing, common mistakes |
| Homework L1 | Homework | Easy tier — builds confidence |
| Homework L2 | Homework | Medium tier — consolidates learning |
| Homework L3 | Homework | Hard tier — stretches ability |
| Answer Key | Reference | Answers for all three homework tiers |
| Mastery Check | Assessment | End-of-lesson quiz that verifies skill acquisition |

The structure is non-negotiable. It ensures consistency across all subjects, all tutors, and all students.

### CMS Hierarchy

```
Course  (e.g. SAT Math Prep — Full Program)
  └─ Section  (e.g. Algebra)
       └─ Category  (e.g. Linear Equations)
            └─ Lesson  (e.g. Slope-Intercept Form)
                 └─ 8 Resource Slots  (auto-created on lesson insert)
```

### Approval Workflow

```
Draft  →  In Review  →  Active  →  Archived
```

- Tutors and curriculum managers create lessons as **Draft**
- When ready, they **Submit for Review**
- Admins **Approve & Publish** → lesson becomes **Active**
- Only **Active** lessons appear in the Tutor Course Library and can be assigned to students

---

## AI Roadmap

AI in MetaMinds is a tool for tutors, not a replacement for them. It automates the repetitive so tutors can focus on what only humans can do: build relationships and adapt in real time.

**Rule:** All AI output must be grounded in the shared MetaMinds Knowledge Vault (`metaminds-vault`) — the in-repo `knowledge/` folder is deprecated and retained only for compatibility. AI assembles — it never invents curriculum.

### Phase 1 — Automation (reduce tutor admin time)
- AI-drafted parent updates (tutor reviews and sends, not AI sends)
- AI homework suggestions based on lesson taught that day
- AI session note summary from transcript or tutor voice input
- Automatic skill tagging from session notes

### Phase 2 — Adaptation (personalize the path)
- AI Curriculum Builder: tutor selects a topic, AI assembles a lesson package from the MetaMinds Knowledge Vault
- Adaptive homework difficulty based on submission history
- Skill gap detection from homework grades and mastery check scores
- Recommended next lesson based on current skill map

### Phase 3 — Intelligence (the long-term learning model)
- Per-student learning model that persists across years
- Predictive analytics ("Romir is likely to struggle with quadratics next week — here's why")
- Whiteboard / image analysis for in-person sessions
- AI Study Companion for students between sessions
- Automatic achievement detection and milestone recognition

---

## Business Model

Every feature built should support at least one revenue stream. When deciding whether to build something, ask which revenue stream it strengthens.

| Revenue Stream | Stage | Notes |
|---------------|-------|-------|
| Premium 1:1 Tutoring | Now | Core revenue — experienced tutors, higher rate |
| College Mentor 1:1 Tutoring | Now | Accessible 1:1 — high-achieving college students, lower rate |
| SAT/ACT Preparation | Now | Both tiers serve SAT/ACT; primary student acquisition driver |
| Group Classes | Conditional | Launch only when: similar needs + similar level + compatible schedules + financially sustainable enrollment |
| Bootcamps | Pilot phase | First bootcamp is a FREE community pilot (school/library/org partner). Paid bootcamps come after the pilot proves the model. |
| Summer Camps | Seasonal | Same infrastructure as group classes — not yet |
| Monthly Membership | Mid-term | Platform access + curriculum for independent learners |
| Course Marketplace | Mid-term | Tutors and curriculum managers sell lesson packages |
| School Partnerships | Long-term | Institutional licenses, district-level contracts |

### Two Service Tiers (Now)

**Premium Mentoring** — experienced tutors (graduates, engineers, specialized SAT/ACT instructors, professionals with significant teaching experience)

| Package | Price | Per Hour |
|---------|-------|----------|
| 1 hour | $70 | $70 |
| 4 hours | $260 | $65 |
| 8 hours | $480 | $60 |
| 20 hours | $1,000 | $50 |

**College Mentor Tutoring** — high-achieving college students, trained and supervised by MetaMinds

| Package | Price | Per Hour |
|---------|-------|----------|
| 1 hour | $50 | $50 |
| 4 hours | $190 | $47.50 |
| 8 hours | $360 | $45 |
| 20 hours | $850 | $42.50 |

**Payment rule:** Parents always pay MetaMinds directly. Tutors never collect payment from families.

See `docs/ServiceTiers.md` for full positioning, pay bands, and messaging guidelines.

### Operating Principle: Prove the Workflow First

Before building platform automation, prove this sequence manually:

```
Lead → consultation → needs assessment → tutor recommendation →
parent payment → tutor match → completed session → session notes →
homework assignment → parent update → package-hours deduction →
tutor payment → renewal
```

Use manual tools (Google Sheets, Calendly, Stripe payment links, email templates) until the workflow is reliable with real students. Platform automation follows proven process — it does not replace unproven process.

---

## Engineering Principles

Build for five years from now, not just for what exists today.

- **No duplicate data.** One source of truth for every piece of information. If it's in two places, one of them is wrong.
- **Everything reusable.** Components, lesson packages, and curriculum all get built once and used everywhere. No one-offs.
- **Every feature must scale.** Design for: 100 tutors, 10,000 students, 500 courses, 100,000 lesson packages.
- **Every page should reduce tutor workload.** Count the clicks. If a tutor has to navigate to three tabs to do one task, the UX is broken.
- **No subject hardcoding.** SAT is not the only subject. Every assumption about curriculum structure must generalize to Scratch, Python, Physics, Calculus.
- **The right architecture over the easy code.** A clear data model today saves three refactors tomorrow.
- **Better abstraction over fewer tables.** More normalized is more future-proof.
- **AI assembles from knowledge — it never invents.** All AI-generated curriculum must trace back to verified content in the MetaMinds Knowledge Vault (`metaminds-vault`); the deprecated in-repo `knowledge/` folder no longer receives new content.

---

## The 7 Questions (Before Building Anything)

Before implementing any feature — ask these:

1. **Why does this exist?** What problem does it solve for which role?
2. **Who uses it and how often?** Daily? Weekly? Once at setup?
3. **What is the fastest possible workflow?** How many steps from intent to done?
4. **What is the most important information to show?** What does the user need to know first?
5. **What are the edge cases?** 0 students, 50 students, no sessions, archived state, missing data.
6. **What future features does this need to not break?** Think one phase ahead.
7. **Does it scale to 100 tutors and 10,000 students?**

After finishing, ask:

> *If Khan Academy, Canvas LMS, Notion, GitHub, Stripe, Linear, and Duolingo built this together — what would they improve?*

---

## Current Build Status

See `CLAUDE.md` for the always-current feature status table, file structure, and database schema.
