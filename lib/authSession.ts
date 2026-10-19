/**
 * Decides whether the portal proxy should send someone to /login.
 *
 * A token refresh rotates the refresh token before this runs. Redirecting
 * on a blip (auth server timeout, profile read failure) and dropping the
 * new cookies makes the next request present the old refresh token. Supabase
 * then treats that as reuse and revokes the session.
 */

export interface AuthFailure {
  name?: string;
  message?: string;
  status?: number;
}

export interface PortalAuthInput {
  pathname: string;
  /** User id from a verified JWT. Null when there is no session. */
  userId: string | null;
  authError: AuthFailure | null;
  /** Profile role, or null when the row was not returned. */
  role: string | null;
  /** PostgREST error code from the profile read, such as PGRST116. */
  profileErrorCode: string | null;
  /** True when the profile query failed. */
  profileRequestFailed: boolean;
}

export type PortalAuthDecision = "continue" | "redirect-login";

const ALLOWED_ROLES_FOR_PATH: Record<string, readonly string[]> = {
  "/portal/student": ["student"],
  "/portal/tutor": ["tutor"],
  "/portal/admin": ["admin"],
  "/portal/parent": ["parent"],
};

export function isTransientAuthError(error: AuthFailure | null | undefined): boolean {
  if (!error) return false;
  if (error.name === "AuthRetryableFetchError") return true;
  if (typeof error.status === "number" && error.status >= 500) return true;
  const message = (error.message ?? "").toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("econnreset") ||
    message.includes("enotfound") ||
    message.includes("socket")
  );
}

export function decidePortalAccess(input: PortalAuthInput): PortalAuthDecision {
  if (!input.pathname.startsWith("/portal")) return "continue";

  if (!input.userId) {
    // A network failure is not a signed-out tutor. Sending them to /login
    // here is what drops the refresh cookie the proxy just rotated.
    return isTransientAuthError(input.authError) ? "continue" : "redirect-login";
  }

  if (input.profileRequestFailed && input.profileErrorCode !== "PGRST116") {
    return "continue";
  }

  if (!input.role) return "redirect-login";

  // Admins and tutors can open any portal. Preview tokens are checked
  // client-side before student data loads.
  if (input.role === "admin" || input.role === "tutor") return "continue";

  const allowed = Object.entries(ALLOWED_ROLES_FOR_PATH).find(([prefix]) =>
    input.pathname.startsWith(prefix),
  )?.[1];

  if (allowed && !allowed.includes(input.role)) return "redirect-login";

  return "continue";
}
