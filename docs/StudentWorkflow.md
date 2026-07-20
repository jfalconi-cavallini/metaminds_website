# MetaMinds Student Workflow

**End-to-end experience: from enrollment to learning journey.**

---

## Onboarding

### Step 1: Enrollment (Admin)
- Admin creates student profile in the Admin Portal
- Sets: name, email, grade, subjects, assigned tutor, hours package
- Sends login credentials to parent/student via email
- Optionally enables `allow_in_person` if tutor covers the area

### Step 2: First Login
- Student (or parent on behalf of young student) logs into `/portal/student`
- Sees the Dashboard overview tab
- Dashboard shows: no sessions, no homework, introductory empty states

### Step 3: First Session Booking
- Student navigates to Schedule tab
- Sees WeeklyCalendar with tutor's available slots highlighted green
- Clicks a slot → booking modal opens
- Selects subject, duration, and optional notes
- Confirms → session appears on calendar, tutor is notified

---

## Weekly Rhythm

A typical student week:

### Before Session
1. Student checks Schedule tab → sees upcoming session date and time
2. If there's pending homework → Homework tab shows it with a "To Do" badge
3. Parent checks Updates tab if a new weekly update arrived

### During Session (outside MetaMinds)
- Session happens via Zoom (link in portal) or in-person
- Tutor takes notes during the session

### After Session (Tutor actions — reflected in Student Portal)
1. Tutor adds **Session Notes** (topic + full notes + optional resources)
2. Tutor assigns **Homework** (task + due date)
3. Tutor marks session as **completed** (hours deducted automatically)
4. If it's end of week → Tutor sends **Weekly Update**

### Student sees (immediately via realtime)
1. New item in Homework tab (To Do filter)
2. New note in Session Notes tab
3. New update in Updates tab (parent notification email sent)

---

## Homework Workflow

1. **Assignment:** Tutor assigns homework → appears in student's Homework tab under "To Do"
2. **Status: Pending (To Do)**
   - Student sees task, due date, assigned date, tutor name
   - "Start Assignment" button → expands upload panel
3. **Submission:**
   - Student attaches a file (PDF, image, document — max 10MB)
   - Clicks Submit → file uploads to Supabase Storage
   - Status changes to "Submitted" (blue badge)
   - Tutor is notified
4. **Grading:**
   - Tutor adds grade + feedback
   - Status changes to "Completed" (green "Graded" badge)
   - Student sees grade and feedback in the expanded panel
5. **Filters available:**
   - To Do: Pending + overdue items needing action
   - Submitted: Awaiting tutor feedback
   - Graded: Completed with grade visible
   - View All: Everything

---

## Progress Tracking

Students see their progress in the **Progress tab**:

- **Completion Rate:** What % of assignments are done or submitted
- **Sessions Done:** Total completed sessions (circular ring)
- **Attendance Rate:** Sessions attended vs. total non-cancelled
- **Hours Invested:** Total hours used with tutor
- **Subject Mastery bars:** Sessions per subject (visual, relative)
- **Monthly bar chart:** Sessions completed over the last 6 months
- **Achievements:** Unlocked at milestones (1st session, 5 sessions, 80% completion rate)
- **Session Impact:** Recent sessions with tutor note preview
- **Daily Study Tip:** Rotating tip + latest tutor note excerpt

---

## Session Notes Experience

Students find session notes in the **Session Notes tab**:

1. Left column: list of all notes (searchable, numbered, with subject chip)
2. Right column: detail panel when a note is selected
   - Note topic as heading
   - Date, subject, tutor name as chips
   - Key Takeaways (if multi-line note: bullet points per line; if single block: paragraph)
   - Attached Resources (if tutor linked anything)
   - Homework Assigned on that session date
   - "Was this helpful?" (thumbs up/down — no persistence yet)

---

## Updates Experience

Parents (and students) read updates in the **Updates tab**:

1. Left: list of updates sorted newest first
2. Right: selected update detail
   - Auto-detects sections (What Went Well / Areas to Improve / Next Steps) and renders them as structured visual sections
   - Falls back to plain text if no section structure detected
   - "Reply to Tutor" button opens pre-filled email (Re: Weekly Progress Update — [date])
   - Subject chips show which subjects were covered in the sessions referenced

---

## Hours Management

- Student sees remaining hours on every page (stat card in Schedule tab)
- When hours run low → alert appears prompting to buy more
- Purchase happens via the Hours tab (currently manual/admin-managed)
- Phase 2+: Stripe integration for self-service purchases

---

## Future Student Experiences (Phase 2+)

### Learning Path
- Visual roadmap showing: completed modules, current position, upcoming lessons
- Estimated weeks to goal
- Skill mastery per subject as heat map

### Resources Tab
- Curated study materials per subject
- Tutor-uploaded PDFs, Khan Academy links, practice sets
- Organized by subject and topic

### MetaMinds Lab
- Study groups with other students in same subjects
- AI practice sessions (adaptive questions)
- Project showcase
- Leaderboard + community challenges

### Courses Tab
- Formal enrolled courses (from the curriculum catalog)
- Module-by-module progress tracker
- Assessments and certificates

### Achievements + Profile
- Badge collection visible on profile
- Pipeline status (Explorer → Builder → Achiever → Junior Mentor)
- Shareable portfolio link

---

## Mobile Experience

The portal is responsive. On mobile:
- Sidebar collapses → hamburger menu in the top bar opens a dropdown listing every tab (no horizontal scrolling)
- Cards stack vertically
- Two-column layouts become single column (notes, updates)
- WeeklyCalendar scrolls horizontally within its own container (touch-friendly)
- Modals cap at viewport height and scroll internally instead of clipping content

Mobile is important: parents often check updates on their phones.

---

## Related Documents

- `docs/TutorWorkflow.md` — What tutors do that powers the student experience
- `docs/ParentExperience.md` — The parent-specific touchpoints
- `docs/Roadmap.md` — Future student features
- `CLAUDE.md` — Current student portal feature status
