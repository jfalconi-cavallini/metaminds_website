import { NextResponse } from "next/server";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";
import {
  normalizePurchasedHours,
  purchasedHoursError,
  roundHours,
  toHoursBalance,
} from "@/lib/portal/hours";

/** numeric(6,2) ceiling on user_packages.total_hours. */
const MAX_STORED_HOURS = 9999.99;

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" }, { status: 500 });
  }

  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;
  if (caller.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { studentId, hours, expiresAt } = body as {
    studentId?: unknown;
    hours?: unknown;
    expiresAt?: unknown;
  };

  const id = typeof studentId === "number" ? studentId : Number(studentId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid student" }, { status: 400 });
  }

  const hoursError = purchasedHoursError(hours);
  if (hoursError) {
    return NextResponse.json({ error: hoursError }, { status: 400 });
  }
  const hoursToAdd = normalizePurchasedHours(typeof hours === "number" ? hours : Number(hours));

  if (typeof expiresAt !== "string" || !isIsoDate(expiresAt)) {
    return NextResponse.json({ error: "Select an expiry date." }, { status: 400 });
  }

  const admin = adminClient();

  const { data: student, error: studentError } = await admin
    .from("students")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (studentError) {
    console.error("[add-package-hours] student lookup failed", studentError.message);
    return NextResponse.json({ error: "Failed to add hours." }, { status: 500 });
  }
  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  const { data: existingRows, error: readError } = await admin
    .from("user_packages")
    .select("id, total_hours, hours_used")
    .eq("student_id", id)
    .order("created_at", { ascending: false })
    .limit(1);
  if (readError) {
    console.error("[add-package-hours] package lookup failed", readError.message);
    return NextResponse.json({ error: "Failed to add hours." }, { status: 500 });
  }

  const existing = existingRows?.[0];
  if (existing) {
    const newTotal = roundHours(Number(existing.total_hours) + hoursToAdd);
    if (newTotal > MAX_STORED_HOURS) {
      return NextResponse.json({ error: "That would put the package above 9999.99 hours." }, { status: 400 });
    }
    const { data, error } = await admin
      .from("user_packages")
      .update({ total_hours: newTotal, expires_at: expiresAt })
      .eq("id", existing.id)
      .select("student_id, total_hours, hours_used, expires_at")
      .single();
    if (error || !data) {
      console.error("[add-package-hours] update failed", error?.message);
      return NextResponse.json({ error: "Failed to add hours." }, { status: 500 });
    }
    return NextResponse.json({ balance: toHoursBalance(data) });
  }

  const { data, error } = await admin
    .from("user_packages")
    .insert({
      student_id: id,
      total_hours: hoursToAdd,
      hours_used: 0,
      expires_at: expiresAt,
    })
    .select("student_id, total_hours, hours_used, expires_at")
    .single();
  if (error || !data) {
    console.error("[add-package-hours] insert failed", error?.message);
    return NextResponse.json({ error: "Failed to add hours." }, { status: 500 });
  }
  return NextResponse.json({ balance: toHoursBalance(data) });
}
