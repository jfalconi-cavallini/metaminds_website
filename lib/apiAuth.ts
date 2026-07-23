import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export interface AuthedCaller {
  id: string;
  email: string | null;
  role: "admin" | "tutor" | "student" | "parent";
  linkedId: number | null;
}

/**
 * Verifies the request's `Authorization: Bearer <token>` header against
 * Supabase Auth and loads the caller's profile (role + linked_id).
 * Returns the caller on success, or a NextResponse to return immediately
 * (401/403) on failure.
 */
export async function authenticate(request: Request): Promise<AuthedCaller | NextResponse> {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = adminClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role, linked_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return {
    id: user.id,
    email: user.email ?? null,
    role: profile.role as AuthedCaller["role"],
    linkedId: profile.linked_id,
  };
}

export function isAuthError(x: AuthedCaller | NextResponse): x is NextResponse {
  return x instanceof NextResponse;
}
