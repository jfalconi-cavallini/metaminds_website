# Parent Portal & Auth — Architecture and Audit Record

*Last updated: 2026-07-22*

---

## Current Architecture

Parents are a **true, separate Supabase Auth role**, not a student account with a different sidebar.

| Layer | Implementation |
|---|---|
| Auth | Separate Supabase Auth user (separate email + credentials) |
| Profile | `profiles` row with `role = "parent"`, `linked_id = <student_id>` |
| Route | `/portal/parent` — only `role="parent"` passes the proxy |
| Student route | `/portal/student` — only `role="student"` passes the proxy |
| Component | Shared `StudentPortal` component; `isParent` flag gates mutations and filters tabs |
| RLS | Scoped to `my_linked_id()` (the child's student_id) via `SECURITY DEFINER` helper |

---

## Data Relationships

```
profiles (parent)
  id            = Supabase Auth UID
  role          = "parent"
  linked_id     = students.id   ← the child

profiles (student)
  id            = Supabase Auth UID (different user)
  role          = "student"
  linked_id     = students.id   ← same row, different credentials
```

**One parent — one student (current schema):** `profiles.linked_id` is a single integer. One parent account is linked to exactly one child's student record. Multi-student support (one parent, multiple children) requires a `parent_student_links` junction table — tracked as a follow-up.

**One student — multiple parents:** Multiple parent `profiles` rows can each point to the same `students.id`. This already works within the current schema.

---

## Role and Permission Matrix

| Capability | admin | tutor | student | parent |
|---|---|---|---|---|
| `/portal/admin` | ✅ | ❌ | ❌ | ❌ |
| `/portal/tutor` | ❌ | ✅ | ❌ | ❌ |
| `/portal/student` | ❌ | ❌ | ✅ | ❌ |
| `/portal/parent` | ❌ | ❌ | ❌ | ✅ |
| View child's overview | — | — | — | ✅ |
| View schedule / book sessions | — | — | ✅ | ✅ |
| View homework (read-only) | — | — | ✅ | ✅ (no upload) |
| Submit homework | — | — | ✅ | ❌ (RLS blocks + UI hidden) |
| View session notes | — | — | ✅ | ✅ |
| View tutor updates | — | — | ✅ | ✅ |
| View progress | — | — | ✅ | ✅ |
| View hours / buy hours | — | — | ✅ | ✅ |
| Settings | — | — | ✅ | ✅ |
| MetaMinds Lab | — | — | ✅ (stub) | ❌ |
| Access other student's data | ❌ | only assigned | only own | only linked child |

---

## Root Cause of the Former "Signing In…" Stuck Login

**Original bug (two separate issues that compounded):**

1. **`proxy.ts` role gate**: The proxy only allowed `role = "student"` for `/portal/student`. Any parent login attempted `router.push("/portal/student")` but the server-side proxy responded with a 302 redirect back to `/login` before any client code could run. The client-side router followed the redirect, navigating back to `/login`, so `setLoading(false)` was never called (the component re-mounted fresh). The button froze on "Signing in…" indefinitely.

2. **`onboard-student/route.ts`** (separate, pre-existing bug): The admin onboarding route was creating parent profiles with `role = "student"` instead of `role = "parent"`. Any parent created through the wizard would therefore hit the `/portal/student` route as a student — bypassing all parent tab restrictions and RLS scoping.

**Fix applied (previous session):** `proxy.ts` was changed to allow `["student", "parent"]` for `/portal/student`.

**This audit's correction:** The parent/student route separation is now proper:
- Parents → `/portal/parent` (proxy enforces `role = "parent"` only)
- Students → `/portal/student` (proxy enforces `role = "student"` only)
- Login page redirects each role to the correct URL
- `onboard-student/route.ts` and `resend-welcome/route.ts` now correctly write `role = "parent"` to the profiles table

---

## Changes Made in This Audit

### Code Fixes

| File | Change |
|---|---|
| `app/api/admin/onboard-student/route.ts` | Parent profile now set to `role: "parent"` (was `"student"` in 3 places) |
| `app/api/admin/resend-welcome/route.ts` | Same fix (3 places); `linkedProfiles` query now fetches both `"student"` and `"parent"` roles |
| `app/portal/student/page.tsx` | `PARENT_TABS` now includes `"homework"` and `"settings"`; upload controls gated with `!isParent` |
| `app/login/page.tsx` | Parent redirect changed from `/portal/student` to `/portal/parent` |
| `proxy.ts` | `/portal/student` restricted to `["student"]`; `/portal/parent` added for `["parent"]` |
| `app/portal/parent/page.tsx` | New — re-exports `StudentPortal` component under the `/portal/parent` route |

### Migration 029 (`029_parent_rls_booking.sql`)

| Policy / Function | Change |
|---|---|
| `sessions_select` | Parents can now see all sessions for their assigned tutor (needed for booking calendar slot availability) |
| `user_packages_update` | Parents can now update the linked student's package (needed for `book_session` / `cancel_session` RPC hour deduction, which are SECURITY INVOKER) |
| `book_session()` | Lead-time check now applies to `role in ('student', 'parent')` — parents can no longer bypass the tutor's advance booking requirement |
| `cancel_session()` | 48-hour cancel lock now applies to `role in ('student', 'parent')` |

---

## RLS / API Protections

### Supabase RLS Policies (after migrations 014, 025–029)

| Table | Parent access |
|---|---|
| `students` | SELECT own row only (`id = my_linked_id()`) |
| `tutors` | SELECT assigned tutor only (`id = my_assigned_tutor_id()`) |
| `sessions` | SELECT own child's sessions + tutor's calendar (for booking UI) |
| `sessions` INSERT | Allowed for linked student / assigned tutor pair only |
| `sessions` UPDATE | Allowed for linked student's sessions only (cancel) |
| `homework` | SELECT only; no INSERT/UPDATE/DELETE |
| `session_notes` | SELECT only (`student_id = my_linked_id()`) |
| `parent_updates` | SELECT only (`student_id = my_linked_id()`) |
| `user_packages` | SELECT + UPDATE for linked student (UPDATE needed for booking hour deduction) |
| `tutor_availability` | SELECT assigned tutor's schedule |
| `tutor_blocked_dates` | SELECT assigned tutor's blocked dates |
| `blocked_slots` | SELECT assigned tutor's blocked slots |
| `profiles` | SELECT own row only (`id = auth.uid()`) |

### Helper Functions (SECURITY DEFINER)

| Function | Behavior for parent |
|---|---|
| `my_role()` | Returns `"parent"` |
| `my_linked_id()` | Returns the child's `student_id` |
| `my_assigned_tutor_id()` | Returns the child's assigned tutor_id (follows `student.assigned_tutor_id` via join) |
| `is_admin()` | Returns `false` |

### API Routes (all use service role key + admin auth verification)

| Route | Auth check |
|---|---|
| `/api/admin/onboard-student` | Verifies `role = "admin"` via token before any write |
| `/api/admin/resend-welcome` | Same |
| `/api/homework/upload` | Requires valid session; Supabase Storage path scoped to student |
| `/api/student/complete-reset` | Requires valid session; clears `force_password_reset` for own profile only |

---

## Admin Onboarding Flow

When an admin clicks **+ Create Student** and submits the wizard:

1. `POST /api/admin/onboard-student` is called with a Bearer token (admin's JWT)
2. Route verifies caller is `role = "admin"` via service-role client
3. Creates `students` row → gets `studentId`
4. Creates student Supabase Auth user (`role = "student"` in metadata + profiles)
5. Creates `user_packages` row
6. Creates parent Supabase Auth user (`role = "parent"` in metadata + profiles, `linked_id = studentId`)
7. Sends separate welcome emails (student email + parent email) with separate temp passwords
8. Returns granular `results` object: each step has its own success/failure flag

**Failure isolation**: if step 6 fails, student creation is not rolled back (partial failure reported). A safe resend/retry path exists via `POST /api/admin/resend-welcome?which=parent`.

**Credential security**: temp passwords are generated with `crypto.randomBytes(14)`, mapped to a 58-char charset. They are never stored — returned to the admin only in the API response and the welcome email. The profile's `force_password_reset: true` flag forces the user to change the password on first login.

---

## Manual Test Matrix Results

| # | Test | Result | Notes |
|---|---|---|---|
| 1 | Parent with one linked student | ✅ Pass | Auto-selects student; shows parent-filtered tabs |
| 2 | Parent with multiple linked students | ⚠️ Limitation | Only one student per parent supported (single `linked_id`). Second parent account must be created separately |
| 3 | Parent with no linked student (`linked_id = null`) | Auth guard redirects to `/login` — `!user.linkedId` check at line 91 |
| 4 | Parent profile missing / `profiles` row absent | Login shows "Account not set up correctly" error |
| 5 | Invalid or missing role in profiles | Login shows "Account role not recognized" error |
| 6 | Wrong password | Supabase auth error message displayed; button resets |
| 7 | Page refresh while signed in | Proxy re-validates token server-side; session preserved |
| 8 | Sign out and sign back in | Works; new session cookie set; proxy validates fresh token |
| 9 | Parent directly opens `/portal/student` | Proxy blocks with 302 → `/login` (role mismatch) |
| 10 | Parent directly opens `/portal/parent/` URL for MetaMinds Lab tab | Not applicable — `/portal/parent` has no `?tab=lab` routing; the `isParent` guard bounces to overview |
| 11 | Parent attempts homework submission | UI: upload controls hidden. RLS: no `homework_update` policy for `role="parent"` |
| 12 | Parent attempts `/portal/tutor` | Proxy blocks (role mismatch → `/login`) |
| 13 | Parent attempts `/portal/admin` | Proxy blocks (role mismatch → `/login`) |
| 14 | Student login | `/portal/student` — unaffected |
| 15 | Tutor login | `/portal/tutor` — unaffected |
| 16 | Admin login | `/portal/admin` — unaffected |
| 17 | Existing student data integrity | No migration touches existing student or session rows |
| 18 | No redirect loops | Verified: proxy gate → `/login` → role check → correct portal |
| 19 | No permanent loading state | Catch block always calls `setLoading(false)` |
| 20 | Parent cannot access unrelated student by changing ID | RLS `sessions_select` / `homework_select` / etc. all use `my_linked_id()` server-side; cannot be forged client-side |

---

## Known Limitations and Follow-Up Work

| # | Limitation | Severity | Path to Fix |
|---|---|---|---|
| 1 | **Multi-student per parent** not supported | Medium | Add `parent_student_links` table; update `my_linked_id()` to return an array; add student-switcher UI |
| 2 | **Column-level homework guard** not enforced | Low | A student could write to `grade`/`feedback` columns via direct API call. Requires a column-guard trigger on `homework` |
| 3 | **Parent email login in the same email as student** | Low | When `parentEmail === studentEmail`, the same auth user gets `role="student"`. Parent access not granted in this edge case. Warn admin and require separate email |
| 4 | **Existing parent accounts with `role="student"`** | High (if any) | Any parent created via the wizard before migration 029 has `role="student"` in `profiles`. Run: `UPDATE profiles SET role='parent' WHERE id IN (SELECT id FROM profiles WHERE role='student' AND /* is_parent flag check */)` via Supabase dashboard; or use the admin Resend Welcome flow which now correctly sets `role="parent"` |
| 5 | **No parent-specific settings** | Low | Settings tab shows student's profile form. Parent should see their own name/email, not the student's. Tracked for Phase 2 |
| 6 | **`/portal/student` session cookies for existing parents** | One-time | Parents who logged in before this deploy cached a session routed to `/portal/student`. On next login they will be sent to `/portal/parent` correctly. No action needed |
