import { NextResponse } from "next/server";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";

// Max file size: 50 MB (lesson decks can be large PDFs)
const MAX_BYTES = 50 * 1024 * 1024;

export async function POST(request: Request) {
  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;

  // Only admins and tutors may upload curriculum files
  if (caller.role === "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let file: File | null = null;
  let resourceId: string | null = null;
  try {
    const formData = await request.formData();
    file       = formData.get("file")       as File   | null;
    resourceId = formData.get("resourceId") as string | null;
  } catch (e: unknown) {
    return NextResponse.json(
      { error: `FormData: ${e instanceof Error ? e.message : e}` },
      { status: 400 },
    );
  }

  if (!file || !resourceId) {
    return NextResponse.json({ error: "Missing file or resourceId" }, { status: 400 });
  }
  const resIdNum = Number.parseInt(resourceId, 10);
  if (!Number.isInteger(resIdNum)) {
    return NextResponse.json({ error: "Invalid resourceId" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 50 MB)" }, { status: 400 });
  }

  const admin = adminClient();

  // Verify the resource row exists
  const { data: resRow, error: resLookupErr } = await admin
    .from("lesson_resources").select("id, lesson_id, type").eq("id", resIdNum).single();
  if (resLookupErr || !resRow) {
    return NextResponse.json({ error: "Resource slot not found" }, { status: 404 });
  }

  const buffer   = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/\s+/g, "_");
  const path     = `lesson_${resRow.lesson_id}/${resRow.type}/${Date.now()}_${safeName}`;

  // Upload to the lesson-resources bucket (create it in Supabase dashboard if needed)
  const { error: uploadError } = await admin.storage
    .from("lesson-resources")
    .upload(path, buffer, {
      contentType: file.type || "application/pdf",
      upsert: true,
    });
  if (uploadError) {
    return NextResponse.json({ error: `Storage: ${uploadError.message}` }, { status: 500 });
  }

  // Generate a long-lived signed URL (10 years) for accessing the file
  const { data: signedUrlData, error: signedUrlErr } = await admin.storage
    .from("lesson-resources")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (signedUrlErr || !signedUrlData) {
    return NextResponse.json({ error: `Signed URL: ${signedUrlErr?.message}` }, { status: 500 });
  }

  // Update the resource row with storage path and URL
  const { data: updated, error: dbErr } = await admin
    .from("lesson_resources")
    .update({
      storage_path: path,
      url:          signedUrlData.signedUrl,
    })
    .eq("id", resIdNum)
    .select()
    .single();
  if (dbErr) {
    return NextResponse.json({ error: `DB: ${dbErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ resource: updated, storagePath: path, url: signedUrlData.signedUrl });
}
