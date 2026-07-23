import { NextResponse } from "next/server";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";

export async function POST(request: Request) {
  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Missing Supabase env vars" }, { status: 500 });
  }

  let file: File | null = null;
  let studentId: string | null = null;
  try {
    const formData = await request.formData();
    file      = formData.get("file")      as File   | null;
    studentId = formData.get("studentId") as string | null;
  } catch (e: unknown) {
    return NextResponse.json({ error: `FormData: ${e instanceof Error ? e.message : e}` }, { status: 400 });
  }

  if (!file || !studentId) {
    return NextResponse.json({ error: "Missing file or studentId" }, { status: 400 });
  }
  const studentIdNum = Number.parseInt(studentId, 10);
  if (!Number.isInteger(studentIdNum)) {
    return NextResponse.json({ error: "Invalid studentId" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
  }

  if (caller.role !== "tutor" && caller.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = adminClient();

  // Tutors can only upload for their own assigned students
  if (caller.role === "tutor") {
    const { data: student, error: sErr } = await admin
      .from("students")
      .select("assigned_tutor_id")
      .eq("id", studentIdNum)
      .single();
    if (sErr || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    if (student.assigned_tutor_id !== caller.linkedId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const buffer   = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/\s+/g, "_");
  const path     = `student_${studentIdNum}/${Date.now()}_${safeName}`;

  const { error: uploadError } = await admin.storage
    .from("student-success-plans")
    .upload(path, buffer, { contentType: "application/pdf", upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: `Storage: ${uploadError.message}` }, { status: 500 });
  }

  const { data, error: dbError } = await admin
    .from("students")
    .update({ success_plan_url: path, success_plan: null })
    .eq("id", studentIdNum)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: `DB: ${dbError.message}` }, { status: 500 });
  }

  return NextResponse.json({ student: data, path });
}
