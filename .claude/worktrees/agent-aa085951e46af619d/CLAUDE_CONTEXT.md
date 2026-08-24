# MetaMinds Portal — Claude Context

## What This Is
A tutoring business CRM (MetaMinds STEM Academy). Two parts: (1) a public marketing site (done), and (2) a **private portal** with three role-based dashboards. The portal replaces manual scheduling between Jose (admin/owner), tutors, and student families.

---

## Architecture

**Stack:** Next.js 16.1.6 App Router · React 19 · TypeScript · Tailwind CSS · Supabase (Postgres + Auth)

**All portal pages are `"use client"`** — no RSC, no server actions. All DB calls go through `lib/portal/db.ts`. Never write raw Supabase queries in page components.

**Key files:**
- `app/portal/admin/page.tsx` — Admin portal (single large client component)
- `app/portal/tutor/page.tsx` — Tutor portal
- `app/portal/student/page.tsx` — Student/parent portal
- `app/login/page.tsx` — Supabase auth + role-based redirect
- `components/portal/WeeklyCalendar.tsx` — Core calendar (modes: `"book"` / `"tutor"` / `"view"`)
- `lib/portal/db.ts` — All DB functions
- `lib/portal/types.ts` — All TypeScript interfaces
- `lib/auth.ts` — `useAuth()` hook (non-enforcing — portals fall back to hardcoded IDs 1 when unauthenticated)

**Auth flow:** Supabase Auth → reads `profiles` table → `profiles.role` → redirect. `profiles.linked_id` = integer FK to `tutors.id` or `students.id`. Portals use `user?.linkedId ?? FALLBACK_ID` so dev preview works without login.

---

## Database (5 migrations, run in order in Supabase SQL Editor)

| Migration | Adds |
|-----------|------|
| `001_initial_schema.sql` | tutors, students, sessions, user_packages, tutor_availability tables + seed data |
| `002_auth_notes_homework.sql` | profiles, session_notes, homework tables; zoom_link on sessions |
| `003_booking_lead_hours.sql` | `tutors.booking_lead_hours` (integer, default 24) |
| `004_blocked_dates.sql` | `tutor_blocked_dates` table |
| `005_profile_fields.sql` | phone/bio on tutors; phone/parent_*/notes on students |

**Time format gotcha:** Session times stored as `"4:00 PM"` (12h string). Availability times may be `"15:00"` (24h, from `<input type="time">`). `parseTimeToHour()` in WeeklyCalendar handles both — do not break this.

**RLS:** All tables have wide-open `phase1_allow_all` policies (anon key has full access). Needs tightening before production.

---

## Current Status — What's Built

**Admin portal:** Student/tutor tables with clickable profile modals (view + edit), tutor schedule viewer, single session scheduling, **bulk session scheduling** (weekly recurring, N sessions at once for onboarding), package/hours management.

**Tutor portal:** Overview with upcoming sessions, My Students with profile cards, Schedule tab with WeeklyCalendar (book slots, click sessions for detail modal), availability editor, **blocked dates** (students can't book these days), booking lead time setting (24h or 48h), session notes + resource links, homework assignment.

**Student portal:** Overview with next session + tutor contact card, self-service booking calendar (respects availability + lead time + blocked dates), session notes viewer, homework tracker, hours balance + pricing display (Stripe not wired yet).

**Shared features:** Tab state persists via URL `?tab=...`. Session detail modal is global (accessible from overview cards AND calendar). 1.5h sessions visually span 1.5 rows on calendar. Student names shown on tutor's calendar cells.

---

## Critical Rules — Do Not Break

1. **Fragment wrapper `<>...</>`** is the return root in admin and tutor portals — required so global modals render outside `<DashboardShell>`.
2. **`parseTimeToHour()`** must handle both `"3:00 PM"` and `"15:00"` — do not simplify it.
3. **Tab persistence pattern** — all three portals read initial tab from `window.location.search` in `useState` initializer (not `useSearchParams`), then call `router.replace("?tab=<id>", { scroll: false })` on change.
4. **Session detail modal** in tutor portal is rendered at root level, not inside any tab conditional.
5. **`session_requests` table is dead code** — ignore it, do not build on it.
6. **Hours deducted at booking time** via `insertSession()`, restored on cancel via `cancelSession()`.

---

## Next Steps (in priority order)

1. **Run migrations 003–005** in Supabase SQL Editor (blocked dates, lead time, profile fields won't work without this)
2. **Create auth accounts**: admin → `profiles` row with `role="admin"`; each tutor/student → `profiles` row with `role` + `linked_id` pointing to their DB record
3. **Remove dev preview links** from bottom of `/login` before sharing with real users
4. **Wire Stripe** — install `@stripe/stripe-js`, attach Payment Links to "Buy Hours" buttons in student Hours tab; `/success` page already exists for redirect
5. **Auth middleware** — add `middleware.ts` to enforce login on all `/portal/*` routes
6. **Password reset** — add `supabase.auth.resetPasswordForEmail()` link on login page
7. **Tighten RLS** — replace `phase1_allow_all` with user-scoped policies

---

## Not Yet Implemented
- Stripe payments (pricing display only)
- Email notifications (booking confirmations, reminders)
- Auth middleware (portals accessible without login)
- Password reset UI
- Automatic session completion (sessions stay "upcoming" forever after their date passes)
- Mobile responsiveness audit
