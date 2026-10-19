/**
 * Single access switch for /sat-practice.
 *
 * "public" shows practice to anyone.
 * "students" requires a signed-in MetaMinds student, tutor, or admin.
 * Everyone else is sent to /login with a return path.
 *
 * The default is "students". Local screenshots set SAT_PRACTICE_DEV_BYPASS=1
 * on the development server only. That flag does nothing when NODE_ENV is
 * production.
 */

export type SatPracticeAccess = "public" | "students";

export const SAT_PRACTICE_ACCESS: SatPracticeAccess = "students";

export const SAT_PRACTICE_PATH = "/sat-practice";

const PRACTICE_ROLES = new Set(["student", "admin", "tutor"]);

const USER_ID_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;

export function isPracticeUserId(userId: string): boolean {
  return USER_ID_PATTERN.test(userId);
}

export function isSatPracticePath(path: string): boolean {
  return path === SAT_PRACTICE_PATH || path.startsWith(`${SAT_PRACTICE_PATH}/`);
}

export function canEnterPractice(access: SatPracticeAccess, role: string | null): boolean {
  if (access === "public") return true;
  return role !== null && PRACTICE_ROLES.has(role);
}

/** Development-only screenshot bypass. Never true in production. */
export function allowsPracticeDevBypass(nodeEnv: string | undefined, flag: string | undefined): boolean {
  return nodeEnv !== "production" && flag === "1";
}

export function practiceLoginPath(): string {
  return `/login?next=${encodeURIComponent(SAT_PRACTICE_PATH)}`;
}

/** Accept only the practice route. Other values are ignored. */
export function practiceReturnPath(value: string | null): string | null {
  if (value === SAT_PRACTICE_PATH) return value;
  return null;
}

export type PracticeGateDecision =
  | { type: "allow"; userId: string }
  | { type: "redirect"; location: string };

export function decidePracticeAccess(input: {
  access: SatPracticeAccess;
  nodeEnv: string | undefined;
  devBypass: string | undefined;
  userId: string | null;
  role: string | null;
}): PracticeGateDecision {
  if (input.access === "public") {
    const userId = input.userId && isPracticeUserId(input.userId) ? input.userId : "public";
    return { type: "allow", userId };
  }
  if (allowsPracticeDevBypass(input.nodeEnv, input.devBypass)) {
    return { type: "allow", userId: "local-dev" };
  }
  if (
    input.userId &&
    isPracticeUserId(input.userId) &&
    canEnterPractice(input.access, input.role)
  ) {
    return { type: "allow", userId: input.userId };
  }
  return { type: "redirect", location: practiceLoginPath() };
}

/** Where to send someone after a successful sign-in. */
export function destinationAfterLogin(role: string, nextParam: string | null): string | null {
  const next = practiceReturnPath(nextParam);
  if (next && canEnterPractice(SAT_PRACTICE_ACCESS, role)) return next;
  if (role === "admin") return "/portal/admin";
  if (role === "tutor") return "/portal/tutor";
  if (role === "student") return "/portal/student";
  if (role === "parent") return "/portal/parent";
  return null;
}
