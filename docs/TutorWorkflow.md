# MetaMinds Tutor Workflow

**How tutors operate inside the platform.**

---

## Tutor Levels

| Level | Type | Notes |
|-------|------|-------|
| Junior Mentor | High school student | Supervised, earns credits, limited subjects |
| College Tutor | Undergraduate | Standard rate, primary workforce |
| Graduate Mentor | Professional | Premium rate, advanced subjects + career mentorship |

See `docs/MentorPipeline.md` for full requirements and advancement criteria.

---

## Onboarding (Admin-driven)

1. Admin creates tutor profile (name, email, subjects, booking lead hours)
2. Tutor receives login credentials
3. Tutor sets availability in the Tutor Portal
4. Admin assigns students to the tutor
5. Tutor is ready to accept bookings

---

## Daily Workflow

### Student Books a Session

1. Student selects slot on WeeklyCalendar
2. Session appears in tutor's portal
3. Tutor receives email notification (Resend)

### Running a Session

Sessions happen outside the platform (Zoom, Google Meet, or in-person). The tutor:
- Joins via Zoom link (added by admin or tutor to the session record)
- Has student's profile, homework, and skill history available in the portal
- Takes notes during the session (mental or in a scratch pad)

### After Every Session

This is the critical workflow. Tutors must complete these steps after each session:

#### Step 1: Add Session Notes

Navigate to the student's Session Notes section:
- **Topic:** The main concept taught (e.g., "Systems of Linear Equations")
- **Notes:** What was covered, how the student did, specific observations
- Best practice: Write notes immediately after the session while memory is fresh
- Notes should be written for two audiences:
  1. The student (learning review)
  2. The next tutor session (continuity)

If resources were used:
- Add resource links using the `_resource_` topic sentinel
- Each resource is a separate note entry with topic `_resource_` and the URL as the notes field

#### Step 2: Assign Homework

Navigate to the student's Homework section:
- Add task description (specific enough to be unambiguous)
- Set due date (typically before the next session)
- Leave grade and feedback blank until submission

Best practice: Homework should directly practice the skills from the session.

#### Step 3: Mark Session Complete

Sessions auto-complete via the `autoCompletePastSessions` function that runs on portal load. But tutors should verify status is correct.

Marking complete:
- Deducts hours from student's balance
- Updates completion statistics in the student's Progress tab

#### Step 4: Send Weekly Update (end of week)

At the end of each week (or after a significant session block):
1. Navigate to Parent Updates
2. Write a structured update:
   ```
   Overall Summary:
   [2-3 sentences about the week's progress]

   What Went Well:
   - [specific positive observation]
   - [another positive]

   Areas to Improve:
   - [specific area needing work]

   Next Steps:
   - [what comes next session]
   - [homework to complete]
   ```
3. The student portal auto-detects this structure and renders it as formatted sections
4. An email notification is sent to the parent/student

---

## Homework Grading Workflow

When a student submits homework:

1. Tutor sees notification in Homework tab
2. Opens the submission (PDF viewer or download)
3. Adds:
   - **Grade:** Text field (e.g., "A", "95%", "Excellent", "Needs Revision")
   - **Feedback:** Specific notes on what was good and what to improve
4. Marks as "Completed" → student sees grade + feedback in their portal

Best practices:
- Grade within 48 hours of submission
- Be specific in feedback: "Question 3 is almost right — check your sign when you move the variable to the right side" is better than "Good job"
- Reference the specific skill the problem was testing

---

## Student Management

In the Tutor Portal:
- View all assigned students
- See each student's: session history, homework status, session notes, updates sent
- Access student skill analytics
- Communicate with admin (not directly with parent — updates go through the platform)

---

## Curriculum Contribution (Phase 2+)

Every tutor is expected to contribute to the knowledge base.

### How to Contribute

1. Open Curriculum Contribution in the Tutor Portal
2. Select: Subject → Module → Lesson type (lesson, homework, question)
3. Fill in the lesson template (see `docs/CurriculumSystem.md`)
4. Tag skills being taught
5. Submit for peer review
6. Earn MetaMinds Credits (College Tutors, Junior Mentors) or recognition (Graduate Mentors)

### Contribution Quota

| Level | Minimum per Quarter |
|-------|-------------------|
| Junior Mentor | 1 homework set |
| College Tutor | 1 full lesson |
| Graduate Mentor | 1 lesson + 1 homework set |

---

## Availability Management

Tutors set their weekly availability in the portal:
- Day of week + start time + end time (e.g., Monday 3:00 PM – 7:00 PM)
- Students can only book within these windows
- Lead time enforced by `booking_lead_hours` (24 or 48 hours minimum before session)

Tutors can also block specific dates (vacation, exam periods) in the Blocked Dates section.

---

## Tutor-to-Student Ratio

Current guidance:
- College Tutor: max 8 students concurrently
- Graduate Mentor: max 5 students concurrently (premium time)
- Junior Mentor: max 3 students concurrently (supervised)

---

## Payment Rules

- **Tutors never collect payment directly from families.** All payments go through MetaMinds.
- Tutors are compensated by MetaMinds after sessions are completed and logged.
- If a parent offers to pay a tutor directly, the tutor must decline and direct them to MetaMinds.
- See `docs/ServiceTiers.md` for current pay bands.

---

## Tutor Communication Guidelines

### With Students
- All communication happens in the portal (notes, homework feedback, updates)
- Do not give personal contact information to students
- Do not communicate with students outside of MetaMinds channels

### With Parents
- All parent communication goes through the Updates system or admin
- Parents reply via email (Reply to Tutor link in the portal pre-fills the email)
- Tutors should respond to parent emails within 24 hours

### With Admin
- Flag concerns about a student (academic, behavioral, or family situation) to admin immediately
- Request curriculum support through the Tutor Portal
- Request student schedule changes through admin

---

## Quality Standards

Every session should end with:
- [ ] Session notes written (minimum 3 sentences)
- [ ] Homework assigned (if applicable)
- [ ] Homework from last session reviewed (if submitted)
- [ ] Session marked complete

Every week should end with:
- [ ] Parent update sent
- [ ] All submitted homework graded

A tutor who consistently misses these steps will be flagged by the admin dashboard (Phase 2 analytics).

---

## Related Documents

- `docs/MentorPipeline.md` — Tutor levels and advancement
- `docs/CurriculumSystem.md` — How to contribute curriculum
- `docs/StudentWorkflow.md` — What the student sees
- `docs/ParentExperience.md` — What parents see and expect
