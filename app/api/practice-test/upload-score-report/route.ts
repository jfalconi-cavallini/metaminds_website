import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("homework-submissions")
    .upload(path, Buffer.from(bytes), { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from("homework-submissions")
    .getPublicUrl(uploadData.path);

  return NextResponse.json({ url: publicUrl, filename: file.name, path: uploadData.path });
}
