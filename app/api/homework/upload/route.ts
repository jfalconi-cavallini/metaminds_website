import { NextResponse } from "next/server";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";

export async function POST(request: Request) {
  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Missing Supabase env vars" }, { status: 500 });
  }

  // Parse multipart form
  let file: File | null = null;
  let hwId: string | null = null;
  let studentTimeMinutes: string | null = null;
  let studentNote: string | null = null;
  let difficultyRating: string | null = null;
  try {
    const formData    = await request.formData();
    file              = formData.get("file")              as File   | null;
    hwId              = formData.get("hwId")              as string | null;
    studentTimeMinutes = formData.get("studentTimeMinutes") as string | null;
    studentNote       = formData.get("studentNote")       as string | null;
    difficultyRating  = formData.get("difficultyRating")  as string | null;
  } catch (e: unknown) {
    return NextResponse.json({ error: `FormData: ${e instanceof Error ? e.message : e}` }, { status: 400 });
  }

  if (!file || !hwId) {
    return NextResponse.json({ error: "Missing file or hwId" }, { status: 400 });
  }
  const hwIdNum = Number.parseInt(hwId, 10);
  if (!Number.isInteger(hwIdNum)) {
    return NextResponse.json({ error: "Invalid hwId" }, { status: 400 });
  }

  let timeMins: number | null = null;
  if (studentTimeMinutes) {
    timeMins = Number.parseInt(studentTimeMinutes, 10);
    if (!Number.isInteger(timeMins) || timeMins < 1 || timeMins > 600) {
      return NextResponse.json({ error: "Time must be between 1 and 600 minutes." }, { status: 400 });
    }
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  const admin = adminClient();

  // Ownership check: only the owning student (or an admin) may submit here.
  const { data: hwRow, error: hwLookupError } = await admin
    .from("homework")
    .select("student_id")
    .eq("id", hwIdNum)
    .single();
  if (hwLookupError || !hwRow) {
    return NextResponse.json({ error: "Homework not found" }, { status: 404 });
  }
  const owns = caller.role === "student" && caller.linkedId === hwRow.student_id;
  if (!owns && caller.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer   = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/\s+/g, "_");
  const path     = `hw_${hwIdNum}/${Date.now()}_${safeName}`;

  // ── 1. Upload file to Supabase Storage ──────────────────────────
  const { error: uploadError } = await admin.storage
    .from("homework-submissions")
    .upload(path, buffer, {
      contentType: file.type || "application/pdf",
      upsert: true,
    });
  if (uploadError) {
    return NextResponse.json({ error: `Storage: ${uploadError.message}` }, { status: 500 });
  }

  // ── 2. Update homework row ────────────────────────────────────────
  const validDifficulties = ["easy", "appropriate", "difficult"];
  const { data: row, error: dbError } = await admin
    .from("homework")
    .update({
      submission_url:       path,
      submission_filename:  file.name,
      submitted_at:         new Date().toISOString(),
      status:               "submitted",
      student_time_minutes: timeMins,
      student_note:         studentNote?.trim() || null,
      difficulty_rating:    validDifficulties.includes(difficultyRating ?? "") ? difficultyRating : null,
    })
    .eq("id", hwIdNum)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: `DB: ${dbError.message}` }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Homework row not found" }, { status: 404 });
  }

  // ── 3. Auto-log study time in study_log (upsert — one entry per hw) ──────
  if (timeMins) {
    await admin.from("study_log").upsert({
      student_id:  hwRow.student_id,
      log_date:    new Date().toISOString().slice(0, 10),
      minutes:     timeMins,
      category:    "homework",
      note:        studentNote?.trim() || null,
      homework_id: hwIdNum,
    }, { onConflict: "homework_id" });
  }

  return NextResponse.json({ homework: row });
}
