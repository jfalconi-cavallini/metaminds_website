import { NextResponse } from "next/server";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";

export async function POST(request: Request) {
  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;

  if (caller.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = adminClient();

  // Parse body
  const body = await request.json() as {
    email: string;
    password: string;
    fullName: string;
    role: "tutor" | "student";
    linkedId: number;
  };

  const { email, password, fullName, role, linkedId } = body;
  if (!email || !password || !role || !linkedId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  // Create the Supabase auth user — the DB trigger auto-creates the profiles row
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role, full_name: fullName },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Update the auto-created profile row to set linked_id
  const { error: profileError } = await admin
    .from("profiles")
    .update({ linked_id: linkedId })
    .eq("id", authData.user.id);

  if (profileError) {
    // Roll back: delete the auth user so admin can retry cleanly
    await admin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json(
      { error: `Profile link failed: ${profileError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
