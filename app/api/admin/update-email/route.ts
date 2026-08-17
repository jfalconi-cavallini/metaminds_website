import { NextResponse } from "next/server";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";

export async function POST(request: Request) {
  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;

  if (caller.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = adminClient();

  const { role, linkedId, newEmail } = await request.json() as {
    role: "student" | "tutor";
    linkedId: number;
    newEmail: string;
  };

  if (!role || !linkedId || !newEmail) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Primary lookup: by linked_id + role
  let { data: profile } = await admin
    .from("profiles").select("id").eq("linked_id", linkedId).eq("role", role).maybeSingle();

  // Fallback: role column may not be set — try without it
  if (!profile) {
    const { data: fallback } = await admin
      .from("profiles").select("id").eq("linked_id", linkedId).maybeSingle();
    profile = fallback;
  }

  if (!profile) {
    console.warn("[update-email] No auth profile found", { role, linkedId });
    return NextResponse.json(
      { error: `No login account found for this ${role}. The account may not have been created yet.` },
      { status: 404 },
    );
  }

  const { error } = await admin.auth.admin.updateUserById(profile.id, {
    email: newEmail,
    email_confirm: true,
  });

  if (error) {
    console.error("[update-email] Failed to update auth email", { role, linkedId, detail: error.message });
    return NextResponse.json({ error: "Failed to update login email." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
