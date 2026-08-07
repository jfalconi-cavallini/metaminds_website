import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Lists the roles allowed to access each portal path.
const ALLOWED_ROLES_FOR_PATH: Record<string, string[]> = {
  "/portal/student": ["student"],
  "/portal/tutor":   ["tutor"],
  "/portal/admin":   ["admin"],
  "/portal/parent":  ["parent"],
};

export async function proxy(request: NextRequest) {
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
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const allowedRoles = Object.entries(ALLOWED_ROLES_FOR_PATH).find(([prefix]) => path.startsWith(prefix))?.[1];
  if (allowedRoles) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Admins and tutors can access any portal path — the preview token is validated
    // client-side by usePortalViewerContext before any student data is loaded.
    if (profile.role === "admin" || profile.role === "tutor") {
      return response;
    }

    if (!allowedRoles.includes(profile.role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/portal/:path*"],
};
