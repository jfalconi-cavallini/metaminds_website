import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  SAT_PRACTICE_ACCESS,
  allowsPracticeDevBypass,
  decidePracticeAccess,
  isSatPracticePath,
} from "./lib/sat/access";

// Lists the roles allowed to access each portal path.
const ALLOWED_ROLES_FOR_PATH: Record<string, string[]> = {
  "/portal/student": ["student"],
  "/portal/tutor":   ["tutor"],
  "/portal/admin":   ["admin"],
  "/portal/parent":  ["parent"],
};

function loginRedirect(request: NextRequest, returnToPractice: boolean) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  if (returnToPractice) {
    url.search = "";
    url.searchParams.set("next", "/sat-practice");
  }
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const practice = isSatPracticePath(path);

  if (
    practice &&
    (SAT_PRACTICE_ACCESS === "public" ||
      allowsPracticeDevBypass(process.env.NODE_ENV, process.env.SAT_PRACTICE_DEV_BYPASS))
  ) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() re-validates the token against the Supabase Auth server.
  let user: { id: string } | null = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (error) {
    if (practice) return loginRedirect(request, true);
    throw error;
  }

  if (!user) {
    return loginRedirect(request, practice);
  }

  if (practice) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const decision = decidePracticeAccess({
      access: SAT_PRACTICE_ACCESS,
      nodeEnv: process.env.NODE_ENV,
      devBypass: process.env.SAT_PRACTICE_DEV_BYPASS,
      userId: user.id,
      role: typeof profile?.role === "string" ? profile.role : null,
    });
    if (decision.type === "redirect") return loginRedirect(request, true);
    return response;
  }

  const allowedRoles = Object.entries(ALLOWED_ROLES_FOR_PATH).find(([prefix]) => path.startsWith(prefix))?.[1];
  if (allowedRoles) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return loginRedirect(request, false);
    }

    // Admins and tutors can access any portal path — the preview token is validated
    // client-side by usePortalViewerContext before any student data is loaded.
    if (profile.role === "admin" || profile.role === "tutor") {
      return response;
    }

    if (!allowedRoles.includes(profile.role)) {
      return loginRedirect(request, false);
    }
  }

  return response;
}

export const config = {
  matcher: ["/portal/:path*", "/sat-practice", "/sat-practice/:path*"],
};
