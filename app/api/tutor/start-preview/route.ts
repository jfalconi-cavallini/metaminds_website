import { NextResponse } from "next/server";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";

export async function POST(request: Request) {
  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;
  if (caller.role !== "tutor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let studentId: number;
  try {
    const body = await request.json() as { studentId?: unknown };
    if (typeof body.studentId !== "number" || !Number.isInteger(body.studentId)) {
      throw new Error("Invalid studentId");
    }
    studentId = body.studentId;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const admin = adminClient();

  // Verify the student exists, is not archived, and is assigned to this tutor
  const { data: student, error: sErr } = await admin
    .from("students")
    .select("id, name, assigned_tutor_id")
    .eq("id", studentId)
    .eq("archived", false)
    .single();
  if (sErr || !student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const s = student as { id: number; name: string; assigned_tutor_id: number | null };
  if (s.assigned_tutor_id !== caller.linkedId) {
    return NextResponse.json({ error: "Not your assigned student" }, { status: 403 });
  }

  const { data: preview, error: pErr } = await admin
    .from("tutor_preview_sessions")
    .insert({ tutor_id: caller.id, student_id: studentId })
    .select("id, token, expires_at")
    .single();
  if (pErr || !preview) {
    return NextResponse.json({ error: "Failed to create preview session" }, { status: 500 });
  }

  const p = preview as { id: number; token: string; expires_at: string };
  console.log(`[tutor-preview] START tutor=${caller.id} student=${studentId} previewId=${p.id}`);

  return NextResponse.json({
    previewId:   p.id,
    studentName: s.name,
    expiresAt:   p.expires_at,
    previewUrl:  `/portal/student?tutorPreview=${p.token}`,
  });
}
