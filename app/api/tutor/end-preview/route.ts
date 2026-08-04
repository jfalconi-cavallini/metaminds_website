import { NextResponse } from "next/server";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";

export async function POST(request: Request) {
  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;
  if (caller.role !== "tutor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let previewId: number;
  try {
    const body = await request.json() as { previewId?: unknown };
    if (typeof body.previewId !== "number" || !Number.isInteger(body.previewId)) {
      throw new Error("Invalid previewId");
    }
    previewId = body.previewId;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const admin = adminClient();

  const { data, error } = await admin
    .from("tutor_preview_sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", previewId)
    .eq("tutor_id", caller.id)
    .is("ended_at", null)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Preview session not found or already ended" }, { status: 404 });
  }

  console.log(`[tutor-preview] END tutor=${caller.id} previewId=${previewId}`);
  return NextResponse.json({ success: true });
}
