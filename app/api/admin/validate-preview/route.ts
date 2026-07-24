import { NextResponse } from "next/server";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";

export async function GET(request: Request) {
  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;
  if (caller.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url   = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const admin = adminClient();
  const now   = new Date().toISOString();

  const { data: preview, error } = await admin
    .from("admin_preview_sessions")
    .select("id, admin_id, student_id, expires_at, ended_at, view_as, students(name)")
    .eq("token", token)
    .eq("admin_id", caller.id)   // only this admin's own sessions
    .is("ended_at", null)
    .gt("expires_at", now)
    .single();

  if (error || !preview) {
    return NextResponse.json({ error: "Invalid or expired preview session" }, { status: 401 });
  }

  const p = preview as unknown as {
    id: number;
    admin_id: string;
    student_id: number;
    expires_at: string;
    ended_at: string | null;
    view_as: string;
    students: { name: string } | { name: string }[] | null;
  };

  const studentsField = Array.isArray(p.students) ? p.students[0] : p.students;
  const studentName = studentsField?.name ?? "Student";

  console.log(`[preview] VALIDATE admin=${caller.id} student=${p.student_id} previewId=${p.id} viewAs=${p.view_as}`);

  return NextResponse.json({
    studentId:   p.student_id,
    studentName,
    previewId:   p.id,
    expiresAt:   p.expires_at,
    viewAs:      (p.view_as === "parent" ? "parent" : "student") as "student" | "parent",
  });
}
