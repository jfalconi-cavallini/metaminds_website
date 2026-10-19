/**
 * Single access switch for /sat-practice.
 *
 * "public" shows practice to anyone.
 * "students" requires the existing Supabase portal session and sends
 * everyone else to /login.
 *
 * Read this constant from the practice entry only.
 */
export type SatPracticeAccess = "public" | "students";

export const SAT_PRACTICE_ACCESS: SatPracticeAccess = "public";

export function canEnterPractice(access: SatPracticeAccess, hasSession: boolean): boolean {
  if (access === "public") return true;
  return hasSession;
}
