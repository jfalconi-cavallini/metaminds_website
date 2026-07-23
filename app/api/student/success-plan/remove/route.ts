import { NextResponse } from "next/server";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";

export async function POST(request: Request) {
  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;

  if (caller.role !== "tutor" && caller.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let studentIdNum: number;
  try {
    const body = await request.json() as { studentId?: number };
    if (!body.studentId) throw new Error("missing studentId");
    studentIdNum = body.studentId;
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Bad request" }, { status: 400 });
  }

  const admin = adminClient();

  if (caller.role === "tutor") {
    const { data: student, error: sErr } = await admin
      .from("students")
      .select("assigned_tutor_id, success_plan_url")
      .eq("id", studentIdNum)
      .single();
    if (sErr || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    if (student.assigned_tutor_id !== caller.linkedId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Remove the file from storage if it exists
    if (student.success_plan_url) {
      await admin.storage.from("student-success-plans").remove([student.success_plan_url]);
    }
  } else {
    // Admin — fetch the path to remove
    const { data: student } = await admin
      .from("students")
      .select("success_plan_url")
      .eq("id", studentIdNum)
      .single();
    if (student?.success_plan_url) {
      await admin.storage.from("student-success-plans").remove([student.success_plan_url]);
    }
  }

  const { error: dbError } = await admin
    .from("students")
    .update({ success_plan_url: null })
    .eq("id", studentIdNum);

  if (dbError) {
    return NextResponse.json({ error: `DB: ${dbError.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
