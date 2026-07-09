import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set" }, { status: 500 });
  }

  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = adminClient();

  const { data: { user: caller } } = await admin.auth.getUser(token);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: callerProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (callerProfile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }

  const body = await request.json() as {
    role: "student" | "tutor";
    linkedId: number;
    adminPassword: string;
  };

  const { role, linkedId, adminPassword } = body;
  if (!role || !linkedId || !adminPassword) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify admin password by re-signing in
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { error: signInError } = await anonClient.auth.signInWithPassword({
    email: caller.email!,
    password: adminPassword,
  });
  if (signInError) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 403 });
  }

  // Find and delete the Supabase auth user linked to this DB record
  const { data: targetProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("linked_id", linkedId)
    .eq("role", role)
    .maybeSingle();

  if (targetProfile) {
    await admin.auth.admin.deleteUser(targetProfile.id);
  }

  // Delete all related records first (FK constraints), then the main row
  if (role === "student") {
    await admin.from("parent_updates").delete().eq("student_id", linkedId);
    await admin.from("homework").delete().eq("student_id", linkedId);
    await admin.from("session_notes").delete().eq("student_id", linkedId);
    await admin.from("session_requests").delete().eq("student_id", linkedId);
    await admin.from("sessions").delete().eq("student_id", linkedId);
    await admin.from("user_packages").delete().eq("student_id", linkedId);
    const { error } = await admin.from("students").delete().eq("id", linkedId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    await admin.from("parent_updates").delete().eq("tutor_id", linkedId);
    await admin.from("homework").delete().eq("tutor_id", linkedId);
    await admin.from("session_notes").delete().eq("tutor_id", linkedId);
    await admin.from("sessions").delete().eq("tutor_id", linkedId);
    await admin.from("blocked_slots").delete().eq("tutor_id", linkedId);
    await admin.from("tutor_blocked_dates").delete().eq("tutor_id", linkedId);
    await admin.from("tutor_availability").delete().eq("tutor_id", linkedId);
    // Unassign students from this tutor
    await admin.from("students").update({ assigned_tutor_id: null }).eq("assigned_tutor_id", linkedId);
    const { error } = await admin.from("tutors").delete().eq("id", linkedId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
