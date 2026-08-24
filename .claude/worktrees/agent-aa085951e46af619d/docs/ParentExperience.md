# MetaMinds Parent Experience

**Parents are the primary buyer. The student is the primary user. Both must be served.**

---

## Parent Philosophy

Parents trust MetaMinds with their child's education. That trust must be earned through:
1. **Transparency** — they always know what is happening
2. **Structure** — updates are predictable and consistent
3. **Evidence** — progress is visible, not just claimed
4. **Communication** — reaching a human is never hard

A parent who feels informed will stay. A parent who feels in the dark will leave.

---

## Parent Touchpoints

### 1. Enrollment Email (Admin-triggered)
- Welcome to MetaMinds
- Student login credentials
- Tutor introduction (name, bio, contact through platform)
- What to expect in the first few weeks

### 2. Session Confirmation Email
- Triggered when a session is booked
- Shows: date, time, subject, tutor name, Zoom link (if online)
- Allows parent to calendar the session

### 3. Session Reminder Email (24 hours before)
- Reminds parent (and student) of upcoming session
- Includes Zoom link

### 4. Weekly Progress Update Email
- Triggered when tutor sends an update through the portal
- Subject line: "Weekly Progress Update — [Student Name] — [Date Range]"
- Body: Full structured update (Summary, What Went Well, Areas to Improve, Next Steps)
- Footer: "Reply to this email to message [Tutor Name]" → tutor email pre-filled
- Parents can also read all updates in the portal (Updates tab)

### 5. Homework Graded Notification
- Triggered when tutor grades a submission
- Shows: homework task name, grade, link to view feedback in portal

### 6. Hours Running Low Alert
- Triggered when remaining hours drop below threshold (e.g., 2 hours)
- Prompts parent to purchase more hours

### 7. Monthly Progress Summary (Phase 2)
- Auto-generated from analytics
- Shows: sessions completed, skills improved, subjects covered
- No AI invention — only real data from the platform

---

## What Parents See in the Portal

Parents currently access the portal through the student login. In Phase 2, a dedicated parent view will be available.

**Current (student portal viewed by parent):**
- Dashboard: upcoming sessions, hours balance, homework status
- Updates tab: all weekly updates from tutor
- Session Notes: what was taught in each session
- Progress tab: completion rate, sessions done, hours invested
- Hours tab: package balance and purchase history

**Planned (Phase 2 — dedicated parent view):**
- Simplified view focused on: progress, schedule, updates
- No access to the practice or lab features (student-only)
- Notification preferences (email, SMS)
- Direct message to tutor through the platform
- Payment history and receipts

---

## The Weekly Update — The Most Important Parent Touchpoint

The weekly update is the highest-value parent communication. It must:

1. **Be specific** — Not "good session" but "we covered systems of equations using substitution and elimination methods"
2. **Be honest** — Not just praise; flag real areas that need work
3. **Be actionable** — Tell the parent what to do (or what to make sure their child does)
4. **Be consistent** — Arrive on the same cadence (end of each week or after each session block)

### Structured Format (enforced by the portal)

```
Overall Summary:
2-3 sentences about this week's work.

What Went Well:
- Specific observation 1
- Specific observation 2

Areas to Improve:
- Specific challenge 1

Next Steps:
1. What the student should do before next session
2. What will be covered next session
```

The student portal detects this structure and renders it as formatted sections (blue summary block, green checkmarks for What Went Well, amber icons for Areas to Improve, numbered list for Next Steps).

---

## Responding to Parents

When a parent replies to an update email:
- The email goes directly to the tutor's inbox (pre-filled by the portal's "Reply to Tutor" button)
- Subject: "Re: Weekly Progress Update — [Date]"
- Tutor responds within 24 hours (standard) or 48 hours (acceptable)

If the parent has a concern that escalates beyond the tutor:
- Tutor notifies admin through the portal
- Admin contacts the parent within 24 hours
- All communications are logged

---

## Parent Satisfaction Signals (to track)

These are proxy metrics for parent satisfaction:
- Do they open the weekly update emails? (email open rate)
- Do they log into the portal? (session activity)
- Do they reply to updates? (engagement)
- Do they renew hours packages? (the most important metric)
- Do they refer other families? (the ultimate satisfaction signal)

---

## Common Parent Questions

**"How do I know my child is making progress?"**
→ Point them to the Progress tab in the portal. Show them skill mastery increasing, homework completion rate, and the monthly session chart.

**"Can I talk to the tutor directly?"**
→ Use the "Reply to Tutor" button in any weekly update. The portal pre-fills the email so it reads as a direct reply.

**"My child says they don't understand the homework."**
→ The student can re-submit with a question note. Or, the tutor's session notes have resources attached.

**"Will my child be ready for the SAT in time?"**
→ That depends on their current skill level and how many sessions per week. Show them the Progress tab timeline feature (Phase 2).

**"Can we switch tutors?"**
→ Yes, admin handles tutor reassignment. Not a student or tutor action.

---

## Privacy & Data

Parents should know:
- All student data is stored securely in Supabase (US-based servers)
- No student information is shared with third parties
- AI features use session notes and homework data — no external LLM sees student names or personal information (we strip PII before any AI API call)
- Parents can request deletion of their student's data at any time by contacting admin

---

## Related Documents

- `docs/TutorWorkflow.md` — How tutors generate parent-facing content
- `docs/StudentWorkflow.md` — The student experience
- `docs/Brand.md` — How to communicate with parents
- `docs/AI.md` — Privacy rules for AI features
