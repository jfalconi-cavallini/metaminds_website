import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  SAT_PRACTICE_ACCESS,
  decidePracticeAccess,
  type PracticeGateDecision,
} from "./access.ts";

/**
 * Server-side practice viewer. Reads the Supabase session cookie and the
 * profile role. Local development can bypass this only when
 * SAT_PRACTICE_DEV_BYPASS=1 and NODE_ENV is not production.
 */
export async function getSatPracticeViewer(): Promise<PracticeGateDecision> {
  const nodeEnv = process.env.NODE_ENV;
  const devBypass = process.env.SAT_PRACTICE_DEV_BYPASS;
  const early = decidePracticeAccess({
    access: SAT_PRACTICE_ACCESS,
    nodeEnv,
    devBypass,
    userId: null,
    role: null,
  });
  if (early.type === "allow") return early;

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return early;

    const cookieStore = await cookies();
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const cookie of cookiesToSet) {
              cookieStore.set(cookie.name, cookie.value, cookie.options);
            }
          } catch {
            // A Server Component can read the session when it cannot write refreshed cookies.
          }
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return early;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const role = typeof profile?.role === "string" ? profile.role : null;
    return decidePracticeAccess({
      access: SAT_PRACTICE_ACCESS,
      nodeEnv,
      devBypass,
      userId: user.id,
      role,
    });
  } catch {
    return early;
  }
}
