# MetaMinds Curriculum System

**The knowledge engine of the platform.**

---

## Core Principle

**AI never invents curriculum. AI assembles curriculum from the MetaMinds knowledge base.**

Every lesson, homework problem, assessment question, and resource must exist in the knowledge base before AI can use it. This ensures:
- Quality control (tutors review before AI can use it)
- Consistency across all students
- Trust from parents (no hallucinated content)
- Compounding improvement (the base grows with every contributor)

---

## Curriculum Hierarchy

```
Course
  └── Module
        └── Lesson
              ├── Homework
              ├── Resources
              ├── Practice Questions
              └── Skills Assessed
```

### Course
The highest level. A complete learning objective.

Examples:
- SAT Math Prep
- Python Fundamentals
- Algebra 1
- AP Computer Science Principles

**A course should take 4–24 weeks to complete.**

### Module
A thematic grouping of lessons within a course.

Examples (SAT Math):
- Module 1: Algebra & Linear Equations
- Module 2: Geometry & Measurement
- Module 3: Data Analysis & Statistics
- Module 4: Advanced Math

**A module should take 1–4 weeks to complete.**

### Lesson
A single teachable concept. One lesson = one session (roughly 1 hour).

Examples:
- Lesson: Solving Systems of Equations
- Lesson: Slope-Intercept Form
- Lesson: Word Problems: Linear Models

**A lesson targets 2–5 specific skills.**

### Homework
Problems assigned after the lesson. Directly linked to skills taught.

Every homework set should include:
- 3–5 practice problems (same difficulty as lesson)
- 1–2 stretch problems (one level harder)
- Reference to the skills being tested

### Assessment
A formal evaluation at the end of a module or course.

Types:
- **Module Quiz:** 10–15 questions covering all module skills
- **Course Assessment:** Full-length practice test format
- **Skills Diagnostic:** Given before starting a course to determine entry point

---

## The Skills System

Skills are the atomic unit of learning at MetaMinds. Everything traces back to skills.

### What Is a Skill?

A skill is a specific, demonstrable competency. Not "knows algebra" but "can solve a two-variable linear system by substitution."

Skills have:
- **ID:** Unique slug (`sat-algebra-linear-systems-substitution`)
- **Name:** Human-readable ("Linear Systems: Substitution Method")
- **Subject:** Which subject this belongs to
- **Module:** Which module this skill lives in
- **Difficulty:** 1–5 (1 = foundational, 5 = advanced)
- **Prerequisites:** Other skill IDs required before learning this one
- **Assessment criteria:** What does "mastery" look like (0–100 scale)

### Why Skills Instead of Grades?

Grades are lagging indicators. A B+ on a test doesn't tell a tutor *what* to teach next.

Skills are leading indicators. Knowing a student is at 45% mastery on "slope-intercept form" but 90% on "solving for x" tells the tutor exactly what to do in the next session.

Parent reports reference skills. Homework targets skills. Practice questions build skills. Analytics show skills. The entire platform revolves around skills.

### Skills Taxonomy (SAT Math Example)

```
SAT Math
├── Algebra
│   ├── Variables & Expressions (difficulty: 1)
│   ├── Solving Linear Equations (difficulty: 2)
│   ├── Slope-Intercept Form (difficulty: 2)
│   ├── Systems of Equations: Substitution (difficulty: 3)
│   ├── Systems of Equations: Elimination (difficulty: 3)
│   ├── Word Problems: Linear Models (difficulty: 3)
│   └── Inequalities (difficulty: 2)
├── Geometry
│   ├── Area & Perimeter (difficulty: 1)
│   ├── Triangle Properties (difficulty: 2)
│   ├── Circle Theorems (difficulty: 3)
│   ├── Coordinate Geometry (difficulty: 3)
│   └── Transformations (difficulty: 2)
├── Data Analysis
│   ├── Mean, Median, Mode (difficulty: 1)
│   ├── Ratios & Proportions (difficulty: 2)
│   ├── Percentages & Change (difficulty: 2)
│   ├── Scatterplots (difficulty: 3)
│   └── Probability (difficulty: 3)
└── Advanced Math
    ├── Quadratic Functions (difficulty: 3)
    ├── Factoring (difficulty: 3)
    ├── Exponential Functions (difficulty: 4)
    ├── Polynomial Functions (difficulty: 4)
    └── Rational Equations (difficulty: 5)
```

---

## Knowledge File Format

### Course File (`knowledge/SAT/course.md`)

```yaml
---
id: sat-prep
subject: SAT
title: SAT Math & Reading Prep
level: high_school
grades: [9, 10, 11, 12]
estimated_hours: 40
prerequisites: []
tutor_level: [college_tutor, graduate_mentor]
last_reviewed: 2026-07-15
---

# SAT Prep

## Overview
...

## Modules
1. Algebra & Linear Equations
2. Geometry & Measurement
...
```

### Lesson File (`knowledge/SAT/modules/algebra/lessons/linear-systems.md`)

```yaml
---
id: sat-algebra-linear-systems
subject: SAT
module: Algebra
lesson: Systems of Linear Equations
skills:
  - sat-algebra-linear-systems-substitution
  - sat-algebra-linear-systems-elimination
  - sat-algebra-linear-systems-word-problems
difficulty: 3
estimated_minutes: 60
prerequisites:
  - sat-algebra-linear-equations
  - sat-algebra-slope-intercept
grade_level: [10, 11, 12]
tutor_level: [college_tutor, graduate_mentor]
last_reviewed: 2026-07-15
---

## Learning Objectives

By the end of this lesson, the student can:
1. Solve a 2x2 system by substitution
2. Solve a 2x2 system by elimination
3. Identify when a system has no solution or infinite solutions
4. Set up and solve a word problem that requires a system of equations

## Lesson Outline

### Part 1: Setup (10 min)
...

### Part 2: Substitution Method (15 min)
...

### Part 3: Elimination Method (15 min)
...

### Part 4: Word Problems (15 min)
...

### Part 5: Practice & Check (5 min)
...

## Common Mistakes

- Forgetting to substitute back to find both variables
- Sign errors when multiplying to align coefficients
- Misidentifying "no solution" vs "infinite solutions"

## Tutor Notes

This lesson pairs well with a whiteboard. Have the student write out each step.
Check understanding of Part 1 before moving to Part 2 — students often rush.

## Homework

See: `homework/sat-algebra-linear-systems-hw.md`

## Resources

- Khan Academy: Systems of Equations (video)
- SAT Practice Test 4, Section 3: Questions 8, 12, 15

## Assessment Criteria

| Skill | Mastery Threshold |
|-------|------------------|
| Substitution | Can solve 4/5 problems independently |
| Elimination | Can solve 4/5 problems independently |
| Word Problems | Can set up AND solve 3/5 problems |
```

---

## Curriculum Contribution Workflow

Every College Tutor and Graduate Mentor is expected to contribute to the knowledge base.

### Contribution Process

1. **Identify a gap** — Missing lesson, outdated content, better explanation
2. **Write the file** — Follow the lesson template exactly
3. **Submit for review** — Open a PR or submit to admin
4. **Peer review** — Another tutor at the same or higher level reviews
5. **Admin approval** — MetaMinds academic director approves
6. **Merge** — Content is available to the AI curriculum assembler
7. **Credits awarded** — Contributor earns MetaMinds Credits

### Quality Standards

- Every skill must have at least 10 practice questions in the question bank before AI can serve it
- Every lesson must be taught live at least 3 times before it is approved for AI assembly
- Every lesson must include common mistakes — this is non-negotiable
- Tutor notes must be honest about difficulty and where students typically get stuck

### Anti-Patterns (Never Do)

- Do not copy content from textbooks or copyrighted materials
- Do not write lessons you have never actually taught
- Do not approve your own contributions — always require a second reviewer
- Do not add skills to a lesson that the lesson does not actually cover

---

## AI Curriculum Assembly (Phase 3)

When the AI Curriculum Builder launches, here is how it works:

```
Input:
  - Student profile (grade, subjects, goal, current skill mastery)
  - Target goal ("SAT 1400 by November")
  - Available time ("12 weeks, 2 sessions/week")
  - Preferred tutor level (any / college / graduate)

Process:
  1. Run diagnostic assessment → identify skill gaps
  2. Query knowledge base for all relevant skills
  3. Sort skills by prerequisite chain + difficulty
  4. Select lessons that cover the identified skill gaps
  5. Assemble module sequence
  6. Assign homework for each lesson
  7. Schedule assessments at module end points
  8. Generate parent-facing summary

Output:
  - 12-week personalized curriculum
  - Session topics for each week
  - Homework assignments
  - Estimated improvement per skill
  - Tutor briefing document
```

The AI never invents a lesson. It only selects from approved knowledge base content.

---

## Subject Coverage Plan

| Subject | Knowledge Base Status | Priority |
|---------|----------------------|---------|
| SAT Math | 🔜 Template created | P1 |
| SAT Reading/Writing | 🔜 Template created | P1 |
| ACT | 🔜 Planned | P1 |
| Python | 🔜 Template created | P1 |
| Scratch | 🔜 Template created | P2 |
| Algebra 1 | 🔜 Template created | P2 |
| Algebra 2 | 🔜 Planned | P2 |
| Geometry | 🔜 Planned | P2 |
| Java | 🔜 Planned | P3 |
| AP CSP | 🔜 Planned | P3 |
| Robotics | 🔜 Planned | P3 |
| Entrepreneurship | 🔜 Planned | P3 |

---

## Related Documents

- `knowledge/README.md` — Knowledge base index and navigation
- `knowledge/SAT/README.md` — SAT curriculum (fully detailed model)
- `docs/AI.md` — How AI uses the knowledge base
- `docs/Architecture.md` — Technical design of the curriculum system
