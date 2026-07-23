import { NextResponse } from "next/server";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";

export async function POST(request: Request) {
  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Missing Supabase env vars" }, { status: 500 });
  }

  let storagePath: string;
  let studentIdNum: number;
  try {
    const body = await request.json() as { path?: string };
    if (!body.path) throw new Error("missing path");
    storagePath = body.path;
    const match = storagePath.match(/^student_(\d+)\//);
    if (!match) throw new Error("invalid path format");
    studentIdNum = Number.parseInt(match[1], 10);
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Bad request" }, { status: 400 });
  }

  const admin = adminClient();

  // Authorization: student/parent can view their own; tutor can view their assigned students; admin all
  const { data: student, error: sErr } = await admin
    .from("students")
    .select("id, assigned_tutor_id")
    .eq("id", studentIdNum)
    .single();
  if (sErr || !student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const allowed =
    caller.role === "admin" ||
    ((caller.role === "student" || caller.role === "parent") && caller.linkedId === studentIdNum) ||
    (caller.role === "tutor" && caller.linkedId === student.assigned_tutor_id);

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: blob, error: downloadError } = await admin.storage
    .from("student-success-plans")
    .download(storagePath);

  if (downloadError || !blob) {
    return NextResponse.json(
      { error: `Storage: ${downloadError?.message ?? "file not found"}` },
      { status: 500 },
    );
  }

  return new Response(await blob.arrayBuffer(), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": "inline",
    },
  });
}
