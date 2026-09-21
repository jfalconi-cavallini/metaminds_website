import { NextResponse } from "next/server";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";

export async function GET(request: Request) {
  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;
  if (caller.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url   = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const admin = adminClient();
  const now   = new Date().toISOString();

  const { data: preview, error } = await admin
    .from("admin_tutor_preview_sessions")
    .select("id, admin_id, tutor_id, expires_at, ended_at, tutors(name)")
    .eq("token", token)
    .eq("admin_id", caller.id)   // only this admin's own sessions
    .is("ended_at", null)
    .gt("expires_at", now)
    .single();

  if (error || !preview) {
    return NextResponse.json({ error: "Invalid or expired preview session" }, { status: 401 });
  }

  const p = preview as unknown as {
    id: number;
    admin_id: string;
    tutor_id: number;
    expires_at: string;
    ended_at: string | null;
    tutors: { name: string } | { name: string }[] | null;
  };

  const tutorField = Array.isArray(p.tutors) ? p.tutors[0] : p.tutors;
  const tutorName  = tutorField?.name ?? "Tutor";

  console.log(`[preview] VALIDATE admin=${caller.id} tutor=${p.tutor_id} previewId=${p.id}`);

  return NextResponse.json({
    tutorId:   p.tutor_id,
    tutorName,
    previewId: p.id,
    expiresAt: p.expires_at,
  });
}
