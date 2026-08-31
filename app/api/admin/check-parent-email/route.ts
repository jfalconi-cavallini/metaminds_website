import { NextRequest, NextResponse } from "next/server";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";

/** Read-only lookup used by the onboarding wizard to tell the admin, before
 *  they even submit, whether a parent email already belongs to an existing
 *  parent account — and if so, which children it's already linked to. */
export async function GET(req: NextRequest) {
  const caller = await authenticate(req);
  if (isAuthError(caller)) return caller;
  if (caller.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }

  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const admin = adminClient();

  const { data: userList } = await admin.auth.admin.listUsers();
  const existingUser = userList?.users.find((u) => u.email?.toLowerCase() === email);
  if (!existingUser) {
    return NextResponse.json({ exists: false });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role, full_name")
    .eq("id", existingUser.id)
    .single();

  if (!profile || profile.role !== "parent") {
    return NextResponse.json({ exists: false });
  }

  const { data: links } = await admin
    .from("parent_students")
    .select("student_id")
    .eq("parent_profile_id", existingUser.id);

  const studentIds = (links ?? []).map((l) => l.student_id);
  let students: { id: number; name: string }[] = [];
  if (studentIds.length > 0) {
    const { data: rows } = await admin.from("students").select("id, name").in("id", studentIds);
    students = rows ?? [];
  }

  return NextResponse.json({
    exists:     true,
    parentName: profile.full_name ?? "",
    students,
  });
}
