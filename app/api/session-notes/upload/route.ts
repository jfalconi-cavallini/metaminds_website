import { NextResponse } from "next/server";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";

export async function POST(request: Request) {
  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Missing Supabase env vars" }, { status: 500 });
  }

  let file: File | null = null;
  let noteId: string | null = null;
  try {
    const formData = await request.formData();
    file   = formData.get("file")   as File   | null;
    noteId = formData.get("noteId") as string | null;
  } catch (e: unknown) {
    return NextResponse.json({ error: `FormData: ${e instanceof Error ? e.message : e}` }, { status: 400 });
  }

  if (!file || !noteId) {
    return NextResponse.json({ error: "Missing file or noteId" }, { status: 400 });
  }
  const noteIdNum = Number.parseInt(noteId, 10);
  if (!Number.isInteger(noteIdNum)) {
    return NextResponse.json({ error: "Invalid noteId" }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 20 MB)" }, { status: 400 });
  }

  const admin = adminClient();

  const { data: noteRow, error: noteLookupError } = await admin
    .from("session_notes")
    .select("tutor_id")
    .eq("id", noteIdNum)
    .single();
  if (noteLookupError || !noteRow) {
    return NextResponse.json({ error: "Session note not found" }, { status: 404 });
  }

  const owns = caller.role === "tutor" && caller.linkedId === noteRow.tutor_id;
  if (!owns && caller.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer   = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/\s+/g, "_");
  const path     = `note_${noteIdNum}/${Date.now()}_${safeName}`;

  const { error: uploadError } = await admin.storage
    .from("session-note-attachments")
    .upload(path, buffer, {
      contentType: file.type || "application/pdf",
      upsert: true,
    });
  if (uploadError) {
    return NextResponse.json({ error: `Storage: ${uploadError.message}` }, { status: 500 });
  }

  const { data: row, error: dbError } = await admin
    .from("session_notes")
    .update({
      attachment_url:      path,
      attachment_filename: file.name,
    })
    .eq("id", noteIdNum)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: `DB: ${dbError.message}` }, { status: 500 });
  }

  return NextResponse.json({ note: row });
}
