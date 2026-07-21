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

  // Storage paths: "hw_<id>/..." (student submission) or "tutor_attach/hw_<id>/..." (tutor attachment)
  const hwIdMatch = storagePath.match(/(?:^|\/)hw_(\d+)\//);
  if (!hwIdMatch) {
    return NextResponse.json({ error: "Invalid storage path" }, { status: 400 });
  }
  const hwIdNum = Number.parseInt(hwIdMatch[1], 10);

  const admin = adminClient();

  const { data: hwRow, error: hwLookupError } = await admin
    .from("homework")
    .select("student_id, tutor_id")
    .eq("id", hwIdNum)
    .single();
  if (hwLookupError || !hwRow) {
    return NextResponse.json({ error: "Homework not found" }, { status: 404 });
  }
  const owns =
    (caller.role === "student" && caller.linkedId === hwRow.student_id) ||
    (caller.role === "tutor" && caller.linkedId === hwRow.tutor_id);
  if (!owns && caller.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: blob, error: downloadError } = await admin.storage
    .from("homework-submissions")
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
