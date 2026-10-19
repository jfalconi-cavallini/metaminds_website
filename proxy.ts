import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { decidePortalAccess, type AuthFailure } from "@/lib/authSession";

const CACHE_HEADERS = ["cache-control", "expires", "pragma"] as const;

type AuthCookie = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function redirectKeepingSession(request: NextRequest, sessionResponse: NextResponse, refreshed: AuthCookie[]) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  const redirect = NextResponse.redirect(url);
  // getAll() drops maxAge, so copy the cookies setAll just received.
  // Without maxAge the browser treats the rotated refresh token as a
  // session cookie and drops it when the device sleeps.
  for (const cookie of refreshed) {
    redirect.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  for (const header of CACHE_HEADERS) {
    const value = sessionResponse.headers.get(header);
    if (value) redirect.headers.set(header, value);
  }
  return redirect;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  let refreshedCookies: AuthCookie[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          // One setAll call is the full cookie write (new chunks and
          // cleared stale chunks). Keep that list — a later redirect has
          // to send the same Set-Cookie headers or the browser keeps the
          // refresh token this response just rotated away.
          refreshedCookies = cookiesToSet.map(({ name, value, options }) => ({
            name,
            value,
            options,
          }));
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          if (headers) {
            Object.entries(headers).forEach(([key, value]) => {
              response.headers.set(key, value);
            });
          }
        },
      },
    },
  );

  // getClaims() verifies the JWT and refreshes it when it is near expiry.
  // Nothing else may run before this, or the refreshed cookies are lost.
  let userId: string | null = null;
  let authError: AuthFailure | null = null;
  try {
    const { data, error } = await supabase.auth.getClaims();
    userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
    if (error) {
      authError = { name: error.name, message: error.message, status: error.status };
    }
  } catch (err) {
    authError = {
      name: "AuthRetryableFetchError",
      message: err instanceof Error ? err.message : "Failed to fetch",
    };
  }

  const pathname = request.nextUrl.pathname;
  let role: string | null = null;
  let profileErrorCode: string | null = null;
  let profileRequestFailed = false;

  if (userId && pathname.startsWith("/portal")) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    role = profile && typeof profile.role === "string" ? profile.role : null;
    if (error) {
      profileRequestFailed = true;
      profileErrorCode = typeof error.code === "string" ? error.code : null;
    }
  }

  const decision = decidePortalAccess({
    pathname,
    userId,
    authError,
    role,
    profileErrorCode,
    profileRequestFailed,
  });

  if (decision === "redirect-login") {
    return redirectKeepingSession(request, response, refreshedCookies);
  }

  return response;
}

export const config = {
  // Refresh the session on every page, not only /portal. A tutor who
  // lands on the marketing site or /login still needs the rotated
  // refresh token written back. Static assets are skipped.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
