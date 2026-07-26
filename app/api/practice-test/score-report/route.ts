import { NextResponse } from "next/server";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";

export async function POST(request: Request) {
  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;

  let rawPath: string;
  try {
    const body = await request.json() as { path?: string };
    if (!body.path) throw new Error("missing path");
    rawPath = body.path;
  } catch {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  // Handle both old format (full public URL) and new format (storage path).
  // Old: https://<project>.supabase.co/storage/v1/object/public/homework-submissions/score-reports/...
  // New: score-reports/<studentId>/...
  let storagePath = rawPath;
  const bucketMarker = "/object/public/homework-submissions/";
  if (rawPath.startsWith("https://")) {
    const idx = rawPath.indexOf(bucketMarker);
    if (idx === -1) {
      return NextResponse.json({ error: "Unrecognised URL format" }, { status: 400 });
    }
    storagePath = rawPath.slice(idx + bucketMarker.length);
  }

  if (!storagePath.startsWith("score-reports/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const admin = adminClient();

  const { data: blob, error } = await admin.storage
    .from("homework-submissions")
    .download(storagePath);

  if (error || !blob) {
    return NextResponse.json({ error: error?.message ?? "File not found" }, { status: 500 });
  }

  return new Response(await blob.arrayBuffer(), {
    status: 200,
    headers: { "content-type": blob.type || "application/octet-stream" },
  });
}
