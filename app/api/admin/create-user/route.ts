import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not set in .env.local" },
      { status: 500 },
    );
  }

  // Verify caller is an authenticated admin
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = adminClient();

  const { data: { user: caller } } = await admin.auth.getUser(token);
  if (!caller) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: callerProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (callerProfile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }

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
