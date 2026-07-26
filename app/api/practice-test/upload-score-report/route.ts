import { NextRequest, NextResponse } from "next/server";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await authenticate(req);
  if (isAuthError(caller)) return caller;

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const studentId = form.get("studentId") as string | null;

  if (!file || !studentId) {
    return NextResponse.json({ error: "Missing file or studentId" }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 20 MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `score-reports/${studentId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes = await file.arrayBuffer();

  const admin = adminClient();

  const { data: uploadData, error: uploadError } = await admin.storage
    .from("homework-submissions")
    .upload(path, Buffer.from(bytes), { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  return NextResponse.json({ url: uploadData.path, filename: file.name });
}
