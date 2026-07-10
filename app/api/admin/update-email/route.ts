import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: { user: caller } } = await admin.auth.getUser(token);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: callerProfile } = await admin
    .from("profiles").select("role").eq("id", caller.id).single();
  if (callerProfile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { role, linkedId, newEmail } = await request.json() as {
    role: "student" | "tutor";
    linkedId: number;
    newEmail: string;
  };

  if (!role || !linkedId || !newEmail) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { data: profile } = await admin
    .from("profiles").select("id").eq("linked_id", linkedId).eq("role", role).maybeSingle();

  if (!profile) return NextResponse.json({ ok: true, note: "no auth user found" });

  const { error } = await admin.auth.admin.updateUserById(profile.id, { email: newEmail });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
