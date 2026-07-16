# MetaMinds Knowledge Base

**The curriculum engine of the Educational OS.**

Every lesson at MetaMinds originates here. AI assembles curriculum from this base. Tutors contribute to this base. It compounds over time.

---

## Organization

```
knowledge/
├── README.md              ← You are here
├── SAT/
│   ├── README.md          ← Course overview, modules, skills map
│   └── modules/
│       ├── algebra/
│       ├── geometry/
│       ├── data-analysis/
│       └── advanced-math/
├── ACT/
├── Math/
│   ├── Algebra1/
│   ├── Algebra2/
│   ├── Geometry/
│   ├── Trigonometry/
│   ├── PreCalculus/
│   └── APCalculus/
├── Python/
├── Scratch/
├── Java/
├── WebDev/
├── Robotics/
├── Arduino/
├── AP/
│   ├── APCSP/
│   └── APCSA/
├── Reading/
├── Writing/
├── Entrepreneurship/
└── CareerDev/
```

---

## File Types

### `README.md` (Subject/Course level)

Every subject folder has a README with:
- Subject overview
- Who it's for (grade levels, prerequisites)
- Module list
- Complete skills taxonomy
- Tutor level requirements
- Estimated total hours

### `course.md`

The full course outline — all modules, all lessons, in sequence.

### `modules/[module]/README.md`

Module overview — lessons in the module, skills covered, estimated time.

### `modules/[module]/lessons/[lesson].md`

Individual lesson with YAML frontmatter and full content:
- Learning objectives
- Lesson outline (time-boxed)
- Common mistakes
- Tutor notes
- Homework reference
- Resources
- Assessment criteria

### `skills.md`

Complete skills taxonomy for the subject, formatted as a searchable list.

---

## Frontmatter Standard

Every lesson file must have this frontmatter:

```yaml
---
id: [subject]-[module]-[concept]         # e.g., sat-algebra-linear-systems
subject: SAT                             # Parent subject
module: Algebra                          # Parent module
lesson: Systems of Linear Equations      # Human-readable lesson title
skills:                                  # Skills this lesson develops
  - sat-algebra-linear-systems-substitution
  - sat-algebra-linear-systems-elimination
difficulty: 3                            # 1 (easiest) to 5 (hardest)
estimated_minutes: 60
prerequisites:
  - sat-algebra-linear-equations
  - sat-algebra-slope-intercept
grade_level: [10, 11, 12]
tutor_level: [college_tutor, graduate_mentor]
last_reviewed: 2026-07-15
status: draft                            # draft | reviewed | approved
---
```

Lessons with `status: draft` or `status: reviewed` are NOT available to the AI curriculum assembler. Only `status: approved` lessons can be assembled.

---

## Skills ID Convention

Format: `[subject]-[module]-[concept]`

Examples:
- `sat-algebra-linear-systems-substitution`
- `python-basics-variables`
- `scratch-motion-sprites`
- `math-algebra1-solving-one-step`

Skills referenced in frontmatter must exist in the subject's `skills.md` file before a lesson can be approved.

---

## Difficulty Scale

| Level | Description | Example |
|-------|-------------|---------|
| 1 | Foundational — no prerequisites | Identifying variables |
| 2 | Beginner — minimal prerequisites | Solving one-step equations |
| 3 | Intermediate — requires prior skills | Systems of equations |
| 4 | Advanced — complex multi-step | Quadratic word problems |
| 5 | Expert — near assessment level | Multi-concept SAT problems |

---

## Tutor Level Requirements

| Level | Who can teach |
|-------|--------------|
| `junior_mentor` | Junior Mentors (supervised, elementary/middle content) |
| `college_tutor` | College Tutors and above |
| `graduate_mentor` | Graduate Mentors only (advanced/career content) |
| `any` | Any qualified teacher |

A College Tutor cannot be assigned a lesson marked `graduate_mentor`.

---

## Quality Gates

Before any lesson reaches `status: approved`:

1. **Written by:** A College Tutor or Graduate Mentor
2. **Peer reviewed:** By at least one other tutor at the same or higher level
3. **Taught live:** At least 3 real sessions using this lesson
4. **Common mistakes:** Section must not be empty
5. **Tutor notes:** Must be honest about difficulty and student sticking points
6. **Admin approved:** MetaMinds academic director signs off

---

## How AI Uses This Base

When the AI Curriculum Builder runs:

1. Student profile → identify target skills
2. Query lessons WHERE `status = 'approved'` AND `subject = ?` AND skills overlap with target
3. Sort by prerequisite chain (topological sort of the skill graph)
4. Build lesson sequence respecting prerequisites and difficulty progression
5. Attach homework and resources from same module
6. Return structured curriculum plan

**The AI cannot:**
- Use a lesson with `status: draft` or `status: reviewed`
- Invent content not in the knowledge base
- Skip prerequisite lessons
- Assign a lesson to a tutor level below requirement

---

## Contribution Guide

### To add a new lesson

1. Identify which subject and module it belongs to
2. Create the file at the correct path: `knowledge/[Subject]/modules/[module]/lessons/[kebab-case-title].md`
3. Add YAML frontmatter (all required fields)
4. Write the lesson content (see SAT lessons as models)
5. Add the new skills to `knowledge/[Subject]/skills.md` if they don't exist
6. Submit for review (PR or admin submission)
7. Set `status: draft` — a reviewer will change to `reviewed`, admin will approve to `approved`

### To fix an error in existing content

1. Edit the file
2. Update `last_reviewed` to today's date
3. If it's a significant change, reset `status: reviewed` (requires re-approval)
4. Submit for review

### Never do

- Do not copy content from textbooks or copyrighted materials
- Do not write a lesson you have never taught
- Do not skip the frontmatter
- Do not approve your own content

---

## Subject Status

| Subject | Status | Priority | Notes |
|---------|--------|---------|-------|
| SAT | 🟡 Structure only | P1 | See `SAT/README.md` |
| ACT | 🟡 Structure only | P1 | See `ACT/README.md` |
| Python | 🟡 Structure only | P1 | See `Python/README.md` |
| Scratch | 🟡 Structure only | P2 | See `Scratch/README.md` |
| Algebra 1 | 🟡 Structure only | P2 | See `Math/Algebra1/README.md` |
| Algebra 2 | 🟡 Structure only | P2 | See `Math/Algebra2/README.md` |
| Geometry | 🟡 Structure only | P2 | See `Math/Geometry/README.md` |
| Trigonometry | 🟡 Structure only | P2 | See `Math/Trigonometry/README.md` |
| Pre-Calculus | 🟡 Structure only | P2 | See `Math/PreCalculus/README.md` |
| AP Calculus | 🟡 Structure only | P2 | See `Math/APCalculus/README.md` |
| Java | 🟡 Structure only | P3 | See `Java/README.md` |
| Robotics | 🟡 Structure only | P3 | See `Robotics/README.md` |
| Arduino | 🟡 Structure only | P3 | See `Arduino/README.md` |
| AP CSP | 🟡 Structure only | P3 | See `AP/APCSP/README.md` |
| AP CSA | 🟡 Structure only | P3 | See `AP/APCSA/README.md` |
| Entrepreneurship | 🟡 Structure only | P3 | See `Entrepreneurship/README.md` |
| Career Dev | 🟡 Structure only | P3 | See `CareerDev/README.md` |

🟢 Approved content available | 🟡 Structure created, needs content | 🔴 Planned

---

## Related Documents

- `docs/CurriculumSystem.md` — Full curriculum design philosophy
- `docs/AI.md` — How the AI assembler uses this base
- `docs/TutorWorkflow.md` — How tutors contribute
