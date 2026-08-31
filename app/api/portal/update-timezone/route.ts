import { NextResponse } from "next/server";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";

/** Students/parents have no direct RLS write access to `students` (admin-only
 *  today), so this narrow route is the only way the portal can self-serve a
 *  timezone update — auto-detected on load, or corrected in Settings. */
export async function POST(request: Request) {
  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;

  const { studentId, timezone } = await request.json() as { studentId: number; timezone: string };
  if (!studentId || !timezone) {
    return NextResponse.json({ error: "Missing studentId or timezone" }, { status: 400 });
  }

  const admin = adminClient();

  let owns = caller.role === "student" && caller.linkedId === studentId;
  if (!owns && caller.role === "parent") {
    if (caller.linkedId === studentId) {
      owns = true;
    } else {
      const { data } = await admin
        .from("parent_students")
        .select("student_id")
        .eq("parent_profile_id", caller.id)
        .eq("student_id", studentId)
        .maybeSingle();
      owns = !!data;
    }
  }
  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await admin.from("students").update({ timezone }).eq("id", studentId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
