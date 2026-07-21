import { NextResponse } from "next/server";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";

export async function POST(request: Request) {
  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;

  if (caller.role !== "tutor" && caller.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: tutors only" }, { status: 403 });
  }

  let file: File | null = null;
  let hwId: string | null = null;
  try {
    const formData = await request.formData();
    file = formData.get("file") as File | null;
    hwId = formData.get("hwId") as string | null;
  } catch (e: unknown) {
    return NextResponse.json({ error: `FormData: ${e instanceof Error ? e.message : e}` }, { status: 400 });
  }

  if (!file || !hwId) return NextResponse.json({ error: "Missing file or hwId" }, { status: 400 });
  const hwIdNum = Number.parseInt(hwId, 10);
  if (!Number.isInteger(hwIdNum)) return NextResponse.json({ error: "Invalid hwId" }, { status: 400 });
  if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 20 MB)" }, { status: 400 });

  const admin = adminClient();

  // Tutors may only attach to their own homework
  if (caller.role === "tutor") {
    const { data: hwRow } = await admin.from("homework").select("tutor_id").eq("id", hwIdNum).single();
    if (!hwRow || hwRow.tutor_id !== caller.linkedId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const buffer  = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/\s+/g, "_");
  const path    = `tutor_attach/hw_${hwIdNum}/${Date.now()}_${safeName}`;

  const { error: uploadError } = await admin.storage
    .from("homework-submissions")
    .upload(path, buffer, { contentType: file.type || "application/pdf", upsert: true });

  if (uploadError) return NextResponse.json({ error: `Storage: ${uploadError.message}` }, { status: 500 });

  const { data: row, error: dbError } = await admin
    .from("homework")
    .update({ attachment_url: path, attachment_filename: file.name })
    .eq("id", hwIdNum)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: `DB: ${dbError.message}` }, { status: 500 });

  return NextResponse.json({ homework: row });
}
