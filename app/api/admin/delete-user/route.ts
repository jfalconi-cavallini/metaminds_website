import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";

export async function POST(request: Request) {
  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;

  if (caller.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  // Re-confirm admin identity with password before any destructive action
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

  const admin = adminClient();
  const completed: string[] = [];

  // Logs full detail server-side; sends only the operation label to the client.
  function failStep(label: string, detail: string): NextResponse {
    console.error("[delete-user] Cascade delete failed", {
      step: label, role, linkedId, completed, detail,
    });
    return NextResponse.json(
      { error: `Deletion failed at: ${label}`, completed },
      { status: 500 },
    );
  }

  // ── 1. Delete Supabase Auth accounts linked to this record ──────
  const { data: linkedProfiles, error: profilesLookupError } = await admin
    .from("profiles")
    .select("id")
    .eq("linked_id", linkedId)
    .eq("role", role);

  if (profilesLookupError) {
    console.error("[delete-user] Failed to look up linked auth profiles", {
      role, linkedId, detail: profilesLookupError.message,
    });
    return NextResponse.json({ error: "Failed to look up linked accounts" }, { status: 500 });
  }

  if (linkedProfiles?.length) {
    const settled = await Promise.allSettled(
      linkedProfiles.map((p: { id: string }) => admin.auth.admin.deleteUser(p.id)),
    );
    let authFailed = false;
    for (const r of settled) {
      if (r.status === "rejected") {
        console.error("[delete-user] Auth account deletion threw", { role, linkedId, reason: r.reason });
        authFailed = true;
      } else if (r.value.error) {
        console.error("[delete-user] Auth account deletion error", { role, linkedId, detail: r.value.error.message });
        authFailed = true;
      }
    }
    if (authFailed) {
      return NextResponse.json({ error: "Failed to remove login accounts" }, { status: 500 });
    }
  }
  completed.push("login accounts");

  // ── 2+. Delete dependent DB records in FK order, bail on first failure ──
  if (role === "student") {
    const { error: e1 } = await admin.from("parent_updates").delete().eq("student_id", linkedId);
    if (e1) return failStep("parent updates", e1.message);
    completed.push("parent updates");

    const { error: e2 } = await admin.from("homework").delete().eq("student_id", linkedId);
    if (e2) return failStep("homework", e2.message);
    completed.push("homework");

    const { error: e3 } = await admin.from("session_notes").delete().eq("student_id", linkedId);
    if (e3) return failStep("session notes", e3.message);
    completed.push("session notes");

    const { error: e4 } = await admin.from("session_requests").delete().eq("student_id", linkedId);
    if (e4) return failStep("session requests", e4.message);
    completed.push("session requests");

    const { error: e5 } = await admin.from("purchase_requests").delete().eq("student_id", linkedId);
    if (e5) return failStep("purchase requests", e5.message);
    completed.push("purchase requests");

    const { error: e6 } = await admin.from("sessions").delete().eq("student_id", linkedId);
    if (e6) return failStep("sessions", e6.message);
    completed.push("sessions");

    const { error: e7 } = await admin.from("user_packages").delete().eq("student_id", linkedId);
    if (e7) return failStep("hours packages", e7.message);
    completed.push("hours packages");

    const { error: e8 } = await admin.from("students").delete().eq("id", linkedId);
    if (e8) return failStep("student record", e8.message);
    completed.push("student record");
  } else {
    const { error: e1 } = await admin.from("parent_updates").delete().eq("tutor_id", linkedId);
    if (e1) return failStep("parent updates", e1.message);
    completed.push("parent updates");

    const { error: e2 } = await admin.from("homework").delete().eq("tutor_id", linkedId);
    if (e2) return failStep("homework", e2.message);
    completed.push("homework");

    const { error: e3 } = await admin.from("session_notes").delete().eq("tutor_id", linkedId);
    if (e3) return failStep("session notes", e3.message);
    completed.push("session notes");

    const { error: e4 } = await admin.from("sessions").delete().eq("tutor_id", linkedId);
    if (e4) return failStep("sessions", e4.message);
    completed.push("sessions");

    const { error: e5 } = await admin.from("blocked_slots").delete().eq("tutor_id", linkedId);
    if (e5) return failStep("blocked slots", e5.message);
    completed.push("blocked slots");

    const { error: e6 } = await admin.from("tutor_blocked_dates").delete().eq("tutor_id", linkedId);
    if (e6) return failStep("blocked dates", e6.message);
    completed.push("blocked dates");

    const { error: e7 } = await admin.from("tutor_availability").delete().eq("tutor_id", linkedId);
    if (e7) return failStep("availability", e7.message);
    completed.push("availability");

    const { error: e8 } = await admin.from("students").update({ assigned_tutor_id: null }).eq("assigned_tutor_id", linkedId);
    if (e8) return failStep("student unassign", e8.message);
    completed.push("student unassign");

    const { error: e9 } = await admin.from("tutors").delete().eq("id", linkedId);
    if (e9) return failStep("tutor record", e9.message);
    completed.push("tutor record");
  }

  return NextResponse.json({ success: true });
}
