# MetaMinds Product Roadmap

**Status:** Living Document  
**Owner:** Jose Falconi-Cavallini, CEO

---

## Roadmap Philosophy

We build in phases. Each phase must be fully functional before the next begins. We do not build features for hypothetical future users — we build for students and tutors we have today, in a way that scales to the students and tutors we will have tomorrow.

**North Star Metric:** Student lifetime engagement (how many years does a student stay in the MetaMinds ecosystem?)

---

## Phase 1 — Foundation (Current)

**Goal:** A complete, professional portal for existing students, tutors, and one admin.

**Theme:** Make every existing relationship work beautifully.

### Student Portal ✅

| Feature | Status |
|---------|--------|
| Dashboard overview | ✅ Complete |
| Schedule + booking | ✅ Complete |
| Homework (To Do / Submitted / Graded) | ✅ Complete |
| Homework file upload | ✅ Complete |
| Session Notes (list + detail panel) | ✅ Complete |
| Weekly Updates (list + structured detail) | ✅ Complete |
| Progress tab (analytics) | ✅ Complete |
| Hours & package balance | ✅ Complete |
| In-person session gating (admin-controlled) | ✅ Complete |
| Realtime homework refresh | ✅ Complete |

### Tutor Portal ✅

| Feature | Status |
|---------|--------|
| Student management | ✅ Complete |
| Session management | ✅ Complete |
| Homework assignment + grading | ✅ Complete |
| Session notes (with resource links) | ✅ Complete |
| Parent/student updates | ✅ Complete |
| Tutor availability setting | ✅ Complete |
| Blocked dates | ✅ Complete |

### Admin Portal ✅

| Feature | Status |
|---------|--------|
| Student CRUD | ✅ Complete |
| Tutor CRUD | ✅ Complete |
| Hours package management | ✅ Complete |
| In-person toggle per student | ✅ Complete |
| Email sync with Supabase Auth | ✅ Complete |

### Phase 1 Completion Criteria

- [ ] All student portal tabs match their design templates
- [ ] Email notifications (new homework, session reminder, weekly update) work reliably
- [ ] Mobile experience is tested and functional
- [ ] At least 5 real students are using the portal regularly

---

## Phase 2 — Learning System

**Goal:** Transform the portal from a session tracker into a learning system.

**Theme:** Every session connects to a learning path. Every homework targets a skill.

### Student Portal Additions

| Feature | Priority | Notes |
|---------|----------|-------|
| Resources tab | P1 | Curated study materials, organized by subject |
| Learning Path visualization | P1 | Visual roadmap: where they are, where they're going |
| Skill Mastery dashboard | P1 | Which skills are strong, which need work |
| Achievement system | P2 | Badges, milestones, pipeline progression |
| MetaMinds Lab (basic) | P2 | Community space, initially study groups |
| Courses tab | P2 | Enrolled courses and module progress |

### Tutor Portal Additions

| Feature | Priority | Notes |
|---------|----------|-------|
| Lesson Builder | P1 | Tutors create structured lessons linked to skills |
| Homework Generator | P1 | Generate homework from knowledge base by skill |
| Student Skill Map | P1 | Visual skill mastery per student |
| Curriculum Contribution | P2 | Submit lessons/homework to knowledge base |

### Infrastructure

| Feature | Priority | Notes |
|---------|----------|-------|
| Knowledge base: SAT content | P1 | Full SAT Math + R&W lesson library |
| Knowledge base: Python content | P1 | Python beginner + intermediate lessons |
| `learning_paths` DB table | P1 | See Database.md |
| `skill_mastery` DB table | P1 | See Database.md |
| `session_resources` DB table | P1 | Replace `_resource_` sentinel |

---

## Phase 3 — AI Integration

**Goal:** AI augments every part of the learning experience — but never replaces the human.

**Theme:** AI for scale, humans for inspiration.

### AI Curriculum Builder (Tutor Tool)

The AI assembles a personalized curriculum from the knowledge base based on:
- Student's current skill mastery
- Target goal and timeline
- Available tutor sessions

Tutor reviews and approves before publishing to student.

### AI Practice Study (AIPrep.study Integration)

Adaptive practice questions that:
- Match the student's current skill level
- Adjust difficulty based on performance
- Feed back into `skill_mastery` table
- Generate recommendations for next session topic

### AI Homework Generator

Given: subject + skills to practice  
Output: 5 custom homework problems + answer key + skill tags

Tutor reviews before assigning.

### AI Parent Update Assistant

Given: session notes + homework grades + skill mastery change  
Output: Draft parent update (structured: summary, what went well, areas to improve, next steps)

Tutor edits and sends.

### AI Question Bank

As tutors contribute curriculum, AI flags:
- Skills with fewer than 10 practice questions
- Lessons without a homework assignment
- Modules without a diagnostic assessment

Prompts tutors to fill gaps.

---

## Phase 4 — Community

**Goal:** MetaMinds becomes a place students want to be, not just a service they use.

**Theme:** Learning is better together.

### MetaMinds Lab (Full)

| Feature | Description |
|---------|-------------|
| Study groups | Students with same subjects can join groups |
| Programming projects | Collaborative Scratch / Python projects |
| SAT/ACT discussion boards | Ask questions, share strategies |
| Project showcases | Students present their work |
| Office hours | Tutors hold group Q&A sessions |
| Hackathons | Semester events with prizes |
| Leaderboard | Points for sessions, homework, contributions |
| Achievements (public profile) | Visible badges on profile |
| Private study rooms | Book a virtual room with a friend |

### Junior Mentor Program Launch

| Feature | Description |
|---------|-------------|
| Junior Mentor application | In-portal application flow |
| Training modules | Online certification |
| Shadow session scheduling | Book shadow sessions with senior tutors |
| Credit dashboard | Track and redeem MetaMinds Credits |
| Junior Mentor profile | Special designation visible to parents |

---

## Phase 5 — Ecosystem

**Goal:** MetaMinds is where students begin and build their entire academic and professional journey.

**Theme:** From first lesson to first job.

### Career Pathway

| Feature | Description |
|---------|-------------|
| Career Roadmap tab | Visual path from current grade to career |
| Portfolio builder | Collect projects, achievements, certificates |
| Resume builder | Auto-populated from MetaMinds activity |
| Certificates | Completion certificates for courses |
| LinkedIn integration | Export achievements |
| Interview prep | Technical + behavioral mock interviews |
| College application center | Essay review, school list, timeline |

### Summer Camps & Bootcamps

| Feature | Description |
|---------|-------------|
| Camp enrollment | Online registration + payment |
| Camp portal | Separate view for camp participants |
| Camp curriculum | Linked to knowledge base subjects |
| Camp projects | Showcase and submission |
| Bootcamp track | Intensive 4-week deep dives |

### Enterprise / School Partnerships

- School district licensing
- Classroom integration
- Teacher dashboard
- Progress reports for school administrators

---

## What We Are NOT Building

To maintain focus, the following are explicitly out of scope:

- **General content marketplace** (we are not Udemy or Coursera)
- **Live streaming platform** (sessions use Zoom/Meet links — we do not build video infrastructure)
- **Social network** (MetaMinds Lab is study-focused, not social)
- **AI that replaces tutors** (AI augments, humans lead)
- **Automated grading of open-ended work** (AI can flag, humans grade)

---

## Related Documents

- `docs/Vision.md` — Why we are building this
- `docs/Architecture.md` — How we build it
- `docs/CurriculumSystem.md` — Phase 2 foundation
- `docs/AI.md` — Phase 3 AI strategy
- `docs/MentorPipeline.md` — Phase 4 Junior Mentor program
