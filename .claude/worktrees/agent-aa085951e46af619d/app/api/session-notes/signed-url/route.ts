import { NextResponse } from "next/server";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";

export async function POST(request: Request) {
  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Missing Supabase env vars" }, { status: 500 });
  }

  let storagePath: string;
  try {
    const body = await request.json() as { path?: string };
    if (!body.path) throw new Error("missing path");
    storagePath = body.path;
  } catch {
    return NextResponse.json({ error: "Missing storage path" }, { status: 400 });
  }

  // Storage paths look like "note_<noteId>/<timestamp>_<filename>"
  const noteIdMatch = storagePath.match(/^note_(\d+)\//);
  if (!noteIdMatch) {
    return NextResponse.json({ error: "Invalid storage path" }, { status: 400 });
  }
  const noteIdNum = Number.parseInt(noteIdMatch[1], 10);

  const admin = adminClient();

  const { data: noteRow, error: noteLookupError } = await admin
    .from("session_notes")
    .select("student_id, tutor_id")
    .eq("id", noteIdNum)
    .single();
  if (noteLookupError || !noteRow) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const owns =
    (caller.role === "student" && caller.linkedId === noteRow.student_id) ||
    (caller.role === "tutor" && caller.linkedId === noteRow.tutor_id);
  if (!owns && caller.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: blob, error: downloadError } = await admin.storage
    .from("session-note-attachments")
    .download(storagePath);

  if (downloadError || !blob) {
    return NextResponse.json(
      { error: `Storage: ${downloadError?.message ?? "file not found"}` },
      { status: 500 },
    );
  }

  return new Response(await blob.arrayBuffer(), {
    status: 200,
    headers: { "content-type": blob.type || "application/octet-stream" },
  });
}
