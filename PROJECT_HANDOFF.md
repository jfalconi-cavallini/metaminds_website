# MetaMinds Portal Project Handoff

## Project Overview

MetaMinds is a tutoring business (MetaMinds STEM Academy) offering one-on-one academic tutoring sessions to K-12 students. The platform consists of:

1. A **public marketing website** (already built) with hero, services, tutor carousel, FAQ, and a lead-capture form pointing to an external consultation booking URL.
2. A **private CRM portal** with three role-based dashboards: Admin, Tutor, and Student/Parent.

The portal is the active development focus. Its purpose is to replace manual scheduling/communication between Jose (admin), tutors, and student families with a self-service platform: students book sessions against tutor availability, tutors log notes and assign homework, and the admin manages everything from a single view.

---

## Tech Stack

**Frontend:**
- Next.js 16.1.6 (App Router, `"use client"` pages)
- React 19.2.3
- TypeScript 5
- Tailwind CSS 4 (via `@tailwindcss/postcss`)
- Framer Motion (used on marketing pages, not portal)
- Lucide React (icons, available but not heavily used yet)

**Backend:**
- Supabase (PostgreSQL + Auth + RLS)
- All DB calls are made directly from client components via `@supabase/supabase-js` v2.108.2
- No separate API server — Next.js API routes are not used

**Database:**
- Supabase PostgreSQL
- Anon key used for all reads/writes (wide-open RLS in Phase 1)
- Auth via Supabase Auth (`signInWithPassword`)

**Authentication:**
- Supabase Auth + custom `profiles` table
- Role-based routing (`admin` → `/portal/admin`, `tutor` → `/portal/tutor`, `student` → `/portal/student`)

**Payments:**
- Not yet integrated
- Stripe is planned; pricing is defined in `lib/portal/mockData.ts` (`purchaseOptions`)
- A `/success` page exists at `app/success/page.tsx` (likely intended as Stripe redirect target)

**Deployment:**
- Not yet deployed (local dev only as of this handoff)
- Intended deployment target: Vercel

---

## Completed Features

### Authentication
- Login page at `/login` with real Supabase `signInWithPassword`
- After login, reads `profiles` table to determine role and redirects to correct portal
- Sign-out button in every portal sidebar calls `supabase.auth.signOut()` then redirects to `/login`
- Dev preview links at the bottom of `/login` allow direct portal access without auth (use hardcoded fallback IDs)
- `useAuth()` hook in `lib/auth.ts` is **non-enforcing** — portals degrade gracefully to fallback IDs when unauthenticated

### Admin Portal (`/portal/admin`)
- **Overview tab**: stat cards (students, tutors, active sessions, total hours sold), recent sessions table
- **Students tab**: table with name (clickable → profile modal), grade, subjects, tutor assignment, hours balance; inline tutor assignment/change; "Create Account" form
- **Tutors tab**: table with name (clickable → profile modal), email, subjects, assigned student count; "View Schedule" button opens modal with AvailabilityGrid + upcoming sessions; "Create Account" form
- **Sessions tab**: full sessions table with zoom link inline edit, cancel button; "+ Single Session" form; **"Bulk Schedule"** form for onboarding (weekly recurring sessions — pick student, tutor, subject, start date, time, duration, N sessions → generates all dates with preview, creates all at once)
- **Packages tab**: package management per student; "Add Hours" modal; shows students without packages
- **Profile modals**: click student or tutor name → view profile; "Edit Profile" → inline edit form saves to DB

### Tutor Portal (`/portal/tutor`)
- **Overview tab**: welcome, stat cards, upcoming sessions list (clickable → session detail modal); Zoom link add/edit per session
- **My Students tab**: student cards (clickable → student profile modal with contact, parent info, hours, upcoming sessions)
- **Schedule tab**:
  - WeeklyCalendar in tutor mode (click empty slot → "Schedule Session" modal; click booked session → session detail modal)
  - Schedule session modal: session type toggle, student select, subject, duration (1/1.5/2 hr), Zoom link
  - **Student Booking Window**: 24h or 48h minimum advance notice (saves to `tutors.booking_lead_hours`); shows currently-saved value
  - **My Weekly Availability**: day/time slot editor → saves to `tutor_availability` table; displayed as AvailabilityGrid
  - **Block Off Dates**: date picker + optional reason → saves to `tutor_blocked_dates`; blocked dates shown as orange chips with × to remove
- **Session Notes tab**: add notes by student; past notes list
- **Homework tab**: assign homework by student with optional due date; table of all assigned homework
- **Session Detail Modal** (global — works from overview AND calendar): student info, zoom link (editable), session-specific notes with resource links, add note form with optional resource URL, cancel button

### Student/Parent Portal (`/portal/student`)
- **Overview tab**: next session countdown card with Join Zoom button, stat cards (hours remaining, sessions done, homework due), latest session note, **My Tutor card** (tutor name, subjects, bio, clickable email/phone links)
- **Schedule tab**: WeeklyCalendar in "book" mode (only availability slots are clickable, lead-time window shown in amber, blocked dates are invisible/unclickable); book session modal; cancel sessions (locked within 48h of start time); hours balance display
- **Session Notes tab**: all notes from tutor for this student
- **Homework tab**: all homework assigned by tutor, with status badges
- **Hours tab**: current package balance, expiry, purchase options display (Stripe not wired yet)

### WeeklyCalendar Component
The core shared calendar component used across all three portals with different modes:
- `"book"` — student mode: only shows and allows clicking within tutor's availability window; respects lead time
- `"tutor"` — tutor mode: all future slots clickable; shows student name + subject in booked cells; blocked dates visible (orange tint)
- `"view"` — read-only: admin/overview use

**Visual color scheme:**
- Green (`bg-emerald-100`) = available slot
- Blue (`bg-blue-500`) = booked session (including multi-hour continuation rows)
- White = unavailable / outside availability
- Amber (`bg-amber-50`) = within lead-time window (too soon to book)
- Orange (`bg-orange-50`) = blocked date (tutor mode)
- Green-dark (`bg-emerald-600`) = selected slot (pending confirmation)

**Multi-hour sessions**: A 1.5h session starting at 3pm fills both the 3pm cell (with label) and the 4pm cell (continuation — same blue, horizontal divider). `getSessionContinuation()` detects which cells are covered.

**Blocked dates**: Column header turns orange with "Off" label (tutor mode). Student mode just sees those slots as unavailable.

**Lead time**: `bookingLeadHours` prop. Any slot where `hoursUntil < bookingLeadHours` shows amber and is non-clickable in book mode.

**Session click**: Tutor and view modes — clicking a booked cell calls `onSessionClick(session)`. Clicking a continuation cell calls the same handler with the originating session.

**Tab persistence**: All three portals sync the active tab to the URL via `?tab=schedule` etc. Page reloads restore the last tab.

---

## Current Portal Structure

### Admin Portal (`/portal/admin`)
**File**: `app/portal/admin/page.tsx`

**Tabs**: Overview, Students, Tutors, Sessions, Packages

**State managed locally** (loaded from Supabase on mount):
- `students`, `tutors`, `sessions`, `packages` arrays
- Profile modal state with edit fields for student and tutor profiles

**Key behaviors**:
- Clicking a student name opens a profile modal (view + edit)
- Clicking a tutor name opens a profile modal (view + edit)
- Tutor "View Schedule" fetches and renders availability + booked sessions in a modal
- Bulk Schedule generates N weekly sessions from a start date, inserts all at once via `bulkInsertSessions()`
- Session zoom link inline-edit via pencil icon
- Cancel session restores hours to student's package

---

### Tutor Portal (`/portal/tutor`)
**File**: `app/portal/tutor/page.tsx`

**Tabs**: Overview, My Students, Schedule, Session Notes, Homework

**Key behaviors**:
- `tutorId = user?.linkedId ?? TUTOR_ID_FALLBACK (1)` — uses auth profile or falls back to ID 1
- Session detail modal is rendered at the root level (outside tab conditionals) so it's accessible from both Overview and Schedule
- Availability saved via `upsertTutorAvailability()` — deletes existing slots for tutor and inserts new set
- Blocked dates each get their own row in `tutor_blocked_dates`
- Notes created from the Session Detail Modal are linked to the specific session via `session_id`; notes created from the Notes tab are not linked to a specific session

---

### Student/Parent Portal (`/portal/student`)
**File**: `app/portal/student/page.tsx`

**Tabs**: Overview, Schedule, Session Notes, Homework, Hours

**Key behaviors**:
- `studentId = user?.linkedId ?? STUDENT_ID_FALLBACK (1)` — uses auth profile or falls back to ID 1
- Loads the student's assigned tutor, then fetches tutor availability and blocked dates to pass to WeeklyCalendar
- Student books sessions via `insertSession()` directly (no approval step) — hours deducted immediately
- Students **cannot** cancel within 48 hours of session start time (enforced client-side)
- Tutor contact info (email, phone, bio) displayed on Overview tab

---

## Supabase Configuration

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_[...key...]
```
Set in `.env.local` at project root.

### Supabase Client
`lib/supabase.ts` — single shared client instance created with `createClient(url, key)`.

---

### Migration Order (all must be run in Supabase SQL Editor)

| File | Status | What it does |
|------|--------|--------------|
| `001_initial_schema.sql` | Run first — core schema | Creates tutors, students, sessions, user_packages, session_requests, tutor_availability tables + seed data |
| `002_auth_notes_homework.sql` | Run second | Creates profiles, session_notes, homework tables; auth trigger; adds zoom_link to sessions |
| `003_booking_lead_hours.sql` | Run third | `ALTER TABLE tutors ADD COLUMN booking_lead_hours integer NOT NULL DEFAULT 24` |
| `004_blocked_dates.sql` | Run fourth | Creates tutor_blocked_dates table |
| `005_profile_fields.sql` | Run fifth | Adds phone, parent_name, parent_email, parent_phone, notes to students; phone, bio to tutors |

### Current Tables

| Table | Purpose |
|-------|---------|
| `tutors` | Tutor records: name, email, subjects[], booking_lead_hours, phone, bio |
| `students` | Student records: name, email, grade, subjects[], assigned_tutor_id, phone, parent_*, notes |
| `sessions` | Booked sessions: student_id, tutor_id, subject, session_date (date), session_time (text "4:00 PM"), duration_hours, status, session_type, zoom_link, notes |
| `user_packages` | Student hour packages: student_id, total_hours, hours_used, expires_at |
| `session_requests` | **VESTIGIAL — no longer used.** Was for student booking requests pending tutor approval. Students now book directly via `sessions` table. |
| `tutor_availability` | Weekly recurring availability: tutor_id, day_of_week (0-6), start_time (text), end_time (text) |
| `tutor_blocked_dates` | Specific dates tutor is unavailable: tutor_id, blocked_date (date), reason |
| `profiles` | Links Supabase Auth UUID to portal role and linked_id: id (uuid FK to auth.users), role (admin/tutor/student), linked_id (int FK to tutors.id or students.id), full_name |
| `session_notes` | Session notes written by tutor: session_id (nullable), tutor_id, student_id, topic, notes. Notes with `topic = "_resource_"` are rendered as clickable resource links |
| `homework` | Homework assignments: student_id, tutor_id, task, assigned_date, due_date, status (pending/submitted/completed) |

### Relationships

```
auth.users (uuid)
    └── profiles.id (uuid FK)
              ├── role = "tutor"   → linked_id → tutors.id
              ├── role = "student" → linked_id → students.id
              └── role = "admin"   → linked_id = null

tutors.id
    ├── students.assigned_tutor_id (FK)
    ├── sessions.tutor_id (FK)
    ├── tutor_availability.tutor_id (FK)
    ├── tutor_blocked_dates.tutor_id (FK)
    ├── session_notes.tutor_id (FK)
    └── homework.tutor_id (FK)

students.id
    ├── sessions.student_id (FK)
    ├── user_packages.student_id (FK)
    ├── session_notes.student_id (FK)
    └── homework.student_id (FK)

sessions.id
    └── session_notes.session_id (nullable FK)
```

### Important: Time String Formats

- **Session times** (`sessions.session_time`): stored as 12h string `"4:00 PM"`. The `hourToTimeString()` function in WeeklyCalendar generates these. The `formatTime24to12()` helper in mockData.ts converts browser `input[type=time]` output to this format.
- **Availability times** (`tutor_availability.start_time/end_time`): stored as whatever format the browser time input gives — typically `"15:00"` (24h). The `parseTimeToHour()` function in WeeklyCalendar handles BOTH `"3:00 PM"` and `"15:00"` formats. The seed data uses `"3:00 PM"` format.
- **Dates**: always ISO `"YYYY-MM-DD"` strings throughout the app.

### RLS Policy Status
All tables have `"phase1_allow_all"` policies: `FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)`. This means the anon key has full read/write access to all tables. **These must be tightened before production launch.**

---

## Authentication Plan

### How It Works

1. User visits `/login`, enters email + password
2. `supabase.auth.signInWithPassword()` runs
3. On success, app reads `profiles` table for the user's UUID
4. `profiles.role` determines redirect: `admin` → `/portal/admin`, `tutor` → `/portal/tutor`, `student` → `/portal/student`
5. Within each portal, `useAuth()` hook watches the session and returns `{ user, authLoaded }` where `user` contains `{ id, email, role, linkedId, fullName }`
6. Each portal uses `user?.linkedId ?? FALLBACK_ID` — so unauthenticated dev preview still works

### Setting Up Accounts

**Admin account** (Jose):
1. Supabase Dashboard → Authentication → Users → "Add user" → "Create new user"
2. Enter email: `falconicavallinijose@gmail.com`, set a password
3. Copy the UUID shown
4. Run in SQL Editor:
```sql
INSERT INTO profiles (id, role, full_name, linked_id)
VALUES ('<UUID>', 'admin', 'Jose Falconi', null)
ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Jose Falconi';
```

**Tutor account** (example for Ms. Rivera, who is tutor ID 1 in the DB):
1. Create auth user in Supabase Dashboard
2. Copy UUID
3. Run:
```sql
INSERT INTO profiles (id, role, full_name, linked_id)
VALUES ('<UUID>', 'tutor', 'Ms. Rivera', 1);
```

**Student account** (example for Alex Johnson, student ID 1):
1. Create auth user with student's (or parent's) email
2. Copy UUID
3. Run:
```sql
INSERT INTO profiles (id, role, full_name, linked_id)
VALUES ('<UUID>', 'student', 'Alex Johnson', 1);
```

### Auth Trigger

Migration 002 installs a PostgreSQL trigger `on_auth_user_created` that auto-inserts a `profiles` row on signup if you pass metadata:
```js
supabase.auth.signUp({
  email, password,
  options: { data: { role: "tutor", full_name: "Ms. Rivera" } }
})
```
For now, profiles are inserted manually via SQL after creating auth users in the dashboard.

### What Is NOT Yet Implemented

- No auth middleware (`middleware.ts`) — portals are technically accessible without login. The `useAuth()` hook is intentionally non-enforcing.
- No password reset UI in the portal (users told to email support)
- No "sign up" flow — accounts are created by admin manually

---

## Stripe Plan

**Current state:**
- Pricing is defined in `lib/portal/mockData.ts` under `purchaseOptions`:
  - 1 Hour: $70
  - 4 Hours: $260
  - 8 Hours: $480
- The student portal Hours tab displays these options with placeholder "Buy" buttons
- A `/success` page exists at `app/success/page.tsx` (appears to be a Stripe redirect target)
- No Stripe SDK is installed yet

**Future state:**
- Install `@stripe/stripe-js` and create Stripe Payment Links for each package tier
- Each "Buy" button on the student Hours tab links to the corresponding Stripe Payment Link
- Stripe webhook (or manual process) updates `user_packages` when payment is confirmed
- Alternatively: admin manually runs "Add Hours" in the admin Packages tab after payment confirmation
- The `addPackageHours()` DB function already exists and works correctly

---

## Important Business Rules

1. **Student and parent share one account** — a single Supabase auth user covers both the student and their parent. The portal is branded as "Student / Parent" with the parent in mind for the Hours and billing sections.

2. **Hours are deducted at booking time**, not after session completion. `insertSession()` immediately deducts `durationHours` from `user_packages.hours_used`. If a session is cancelled, `cancelSession()` restores the hours.

3. **Students cannot cancel within 48 hours of session start** — enforced client-side in the student portal. Tutors can cancel anytime.

4. **Admin creates all accounts** — there is no self-signup flow. Families go through a consultation first, then Jose creates their student record in the admin portal and manually sets up their Supabase auth credentials.

5. **Admin creates student and tutor records separately from auth accounts** — a student can exist in the `students` table without a `profiles` row (i.e., no login yet). The admin uses the admin portal to create the record, then separately creates the auth account in Supabase Dashboard.

6. **Direct booking, no approval step** — students book sessions directly (calls `insertSession()`). There is no pending/approval workflow. The old `session_requests` table is vestigial and unused.

7. **Tutor availability is a weekly template** — `tutor_availability` rows define recurring weekly windows (e.g., Mon 3–7pm every week). This is NOT consumed by the booking system to enforce slot limits — it just colors the calendar green. The source of truth for blocked slots is the `sessions` table.

8. **Blocked dates override availability** — if a tutor blocks June 25, students cannot book that day even if it falls within their normal availability window.

9. **Multi-tutor per student is not supported** — a student has one `assigned_tutor_id`. The system is not designed for multiple tutors per student.

10. **Session notes tied to sessions** — notes created from the Session Detail Modal (clicking a calendar event) are linked via `session_id`. Notes created from the Notes tab directly are not linked to a specific session. Resource links are stored as notes with `topic = "_resource_"`.

11. **Booking lead time is per-tutor** — each tutor sets whether students need 24h or 48h advance notice. Stored in `tutors.booking_lead_hours`. Affects only the student booking calendar, not the tutor's own scheduling.

---

## Known Issues

### Critical (affects functionality)
1. **Migrations 003–005 may not be run** — If the Supabase database only has migration 001 and 002 applied, then `booking_lead_hours`, `tutor_blocked_dates`, and the new profile fields (`phone`, `bio`, `parent_*`, `notes`) do not exist. Saving lead time will silently fail; blocked dates will error; profile edits will fail. **Run migrations 003, 004, 005 in Supabase SQL Editor.**

2. **No auth enforcement** — Any URL is accessible without login. The portals fall back to hardcoded IDs (tutor 1, student 1) when unauthenticated. This means the dev preview links always show the same data. This is intentional for development but must be addressed before real users access it.

3. **`session_requests` table is dead code** — It exists in the schema but no UI writes to it anymore. Can be ignored; do not build on top of it.

### Minor / UX
4. **AvailabilityGrid displays raw time strings** — If tutor availability is stored as `"15:00"` (from `input[type=time]`), the `AvailabilityGrid` component displays `"15:00"` instead of `"3:00 PM"`. The calendar itself now handles both formats via `parseTimeToHour()`. Fix: add a time display helper to `AvailabilityGrid` that converts 24h strings to 12h.

5. **No password reset in portal** — Users who forget their password are told to email support. Supabase offers built-in password reset emails; this should be wired up eventually.

6. **`purchaseOptions` in mockData.ts is hardcoded** — The 1hr/$70, 4hr/$260, 8hr/$480 pricing is hardcoded. These will need Stripe Payment Links attached before the Hours tab is functional.

7. **No email notifications** — No emails are sent when sessions are booked, cancelled, or when homework is assigned. `@emailjs/browser` is installed (used elsewhere on the marketing site) and could be used for this.

8. **Profile edits don't sync across open tabs** — If admin edits a student profile, the tutor portal open in another tab won't reflect the change until reload. Acceptable for now.

9. **Session completion is manual** — Sessions with status `"upcoming"` that have passed their date/time are not automatically marked `"completed"`. The admin or a future cron job would need to do this.

---

## Next Priority Tasks

**Priority 1 — Required to hand to real users**
- Run migrations 003, 004, 005 in Supabase SQL Editor
- Create Jose's admin auth account + insert profile row
- Create auth accounts for each tutor + insert profile rows with `linked_id`
- Create auth accounts for student families + insert profile rows with `linked_id`
- Remove or hide dev preview links at bottom of `/login` before sharing with users

**Priority 2 — Core functionality gaps**
- Wire Stripe Payment Links to the "Buy Hours" buttons on the student Hours tab
- Add Next.js middleware (`middleware.ts`) to enforce auth on `/portal/*` routes and redirect to `/login`
- Add password reset link on the login page (`supabase.auth.resetPasswordForEmail`)
- Mark sessions as `"completed"` automatically (either cron or admin button)

**Priority 3 — Quality of life**
- Email notifications: send booking confirmation to student and tutor when a session is scheduled
- Email notifications: send reminder 24h before session
- Fix AvailabilityGrid to display times in 12h format
- Tighten RLS policies (students can only read their own data, tutors can only read their students' data)
- Mobile responsiveness audit on portal pages
- Admin ability to reset a student's package (zero out hours_used)

---

## Long-Term Roadmap

### Phase 1 — Current (Internal CRM)
- ✅ Three-portal structure (admin, tutor, student)
- ✅ Supabase Auth with role-based routing
- ✅ Session scheduling (admin + tutor direct booking, student self-booking)
- ✅ Weekly availability + blocked dates
- ✅ Session notes + resource links
- ✅ Homework tracking
- ✅ Hours package tracking
- ✅ Profile management
- ✅ Bulk session scheduling for onboarding
- ⬜ Stripe payment integration
- ⬜ Auth middleware enforcement
- ⬜ Email notifications

### Phase 2 — Student Experience
- Online session recordings / video storage (Supabase Storage)
- File uploads: worksheets, resources attached to sessions (Supabase Storage)
- Student progress tracking with visual charts (hours per subject over time)
- Parent notification digest (weekly summary email)
- Student homework submission (mark as submitted, tutor marks completed)
- In-portal messaging between student/tutor

### Phase 3 — Business Operations
- Automatic session completion (cron job or Supabase Edge Function)
- Invoicing / receipt generation after payment
- Multiple tutors per student (requires schema change — junction table)
- Tutor pay tracking (hours logged × rate)
- Waitlist management for popular tutors
- Group session support (one tutor, multiple students)
- Analytics dashboard for Jose (revenue, session volume, retention)
- Custom subdomain or white-label option per tutor

---

## File Structure

```
metaminds_website/
├── app/
│   ├── page.tsx                  # Marketing homepage
│   ├── login/page.tsx            # Login page (real Supabase auth + dev preview links)
│   ├── success/page.tsx          # Stripe redirect target (stub)
│   ├── privacy/page.tsx          # Privacy policy page
│   └── portal/
│       ├── admin/page.tsx        # Admin portal (full CRM)
│       ├── tutor/page.tsx        # Tutor portal
│       └── student/page.tsx      # Student/parent portal
│
├── components/
│   ├── DashboardShell.tsx        # Sidebar + mobile nav wrapper used by all portals
│   ├── Navbar.tsx                # Marketing site navbar
│   ├── Footer.tsx                # Marketing site footer
│   ├── [marketing components...] # HeroTutoring, ServiceCards, FAQ, etc.
│   └── portal/
│       ├── WeeklyCalendar.tsx    # THE core scheduling component (modes: book/tutor/view)
│       ├── Modal.tsx             # Shared modal wrapper (size: "md" | "xl")
│       ├── Badge.tsx             # Status/type pill badges
│       ├── StatCard.tsx          # Dashboard stat cards
│       └── AvailabilityGrid.tsx  # Visual weekly availability grid
│
├── lib/
│   ├── supabase.ts               # Supabase client singleton
│   ├── auth.ts                   # useAuth() hook + signOut()
│   ├── data.ts                   # Marketing site static content (siteData)
│   └── portal/
│       ├── types.ts              # All TypeScript interfaces for portal data
│       ├── db.ts                 # All Supabase DB functions (no raw queries outside this file)
│       └── mockData.ts           # Seed/fallback data, formatDate(), formatTime24to12()
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql      # Core tables + seed data
│       ├── 002_auth_notes_homework.sql # Auth profiles + notes + homework + zoom_link
│       ├── 003_booking_lead_hours.sql  # tutors.booking_lead_hours column
│       ├── 004_blocked_dates.sql       # tutor_blocked_dates table
│       └── 005_profile_fields.sql      # Extended profile fields (phone, bio, parent info, notes)
│
├── public/
│   └── images/
│       └── metaminds-logo2.png   # Logo used in sidebar and login
│
├── .env.local                    # NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
├── package.json
├── tsconfig.json
└── PROJECT_HANDOFF.md            # This file
```

---

## Notes For Future AI Assistants

### What Should NOT Be Changed

1. **`lib/portal/db.ts` is the single DB access layer** — All Supabase queries go through this file. Do not write raw Supabase queries in page components. Add new functions here following the existing `rowTo*()` mapper pattern.

2. **`"use client"` on all portal pages** — The entire portal is client-side rendered. Do not attempt to use React Server Components or server actions in the portal. Auth state is managed client-side via `useAuth()`.

3. **Integer IDs for students and tutors** — `students.id` and `tutors.id` are `integer` (generated identity). `profiles.id` is `uuid` (from Supabase Auth). Do not conflate them. The `profiles.linked_id` column stores the integer tutor or student ID.

4. **Session time stored as "4:00 PM" string** — The `sessions.session_time` column is a text string like `"4:00 PM"`, not a time type. `parseTimeToHour()` in WeeklyCalendar parses both 12h (`"4:00 PM"`) and 24h (`"16:00"`) formats. When inserting sessions, always use `hourToTimeString()` or `formatTime24to12()` to produce the correct format.

5. **Tab persistence via URL params** — All three portals use `router.replace("?tab=<id>", { scroll: false })` to sync the active tab to the URL. The initial tab is read from `window.location.search` in the `useState` initializer (not `useSearchParams`, to avoid Suspense issues). Do not change this pattern.

6. **`useAuth()` is non-enforcing by design** — The portals deliberately work without auth for dev preview. Each portal has `const tutorId = user?.linkedId ?? TUTOR_ID_FALLBACK` etc. The fallback IDs (1 for both tutor and student) point to the seeded Ms. Rivera / Alex Johnson records.

7. **Session detail modal is rendered at root level in tutor portal** — It was deliberately moved outside the `{tab === "schedule" && ...}` block so it can be triggered from both the Overview tab and the Schedule tab. Do not move it back inside a tab conditional.

### Architectural Decisions Already Made

- **No server-side rendering for portal** — All portal data is fetched client-side. This avoids auth complexity with RSC and keeps the pattern simple. Performance is acceptable for this scale.

- **No React Query / SWR** — Data is fetched once on mount (`useEffect`) and stored in local `useState`. Mutations update local state optimistically. This is deliberate — the data volume is small enough that a full cache layer adds unnecessary complexity.

- **`session_requests` table is abandoned** — The original design had a student → request → tutor approval flow. This was replaced with direct booking. The table remains in the schema but nothing writes to it. Do not build features on top of it.

- **Supabase anon key for everything** — RLS policies allow all access with the anon key ("phase1_allow_all"). This is the intentional Phase 1 approach. Real user-scoped RLS is Phase 2 after auth is enforced via middleware.

- **One package per student** — `addPackageHours()` checks for an existing package and updates it rather than creating a second row. The system assumes one active package per student. If stacking packages becomes a requirement, this logic needs revisiting.

### Preferred Implementation Approach

- Use Tailwind utility classes directly in JSX — no CSS modules or styled-components
- Keep components small and co-located with the page that uses them unless reused across multiple portals (then promote to `components/portal/`)
- New DB operations: add to `lib/portal/db.ts` following the `rowTo*()` + typed function pattern
- New migrations: add numbered SQL files to `supabase/migrations/` and document them in this file
- Modal pattern: use the existing `<Modal>` component with `size="md"` (default) or `size="xl"` (for wide content like calendars or forms with many fields)
- Error handling in portal forms: `try/catch` with a `setError()` state string shown inline below the relevant form; silent `catch` is acceptable for non-critical ops (e.g., save zoom link)
