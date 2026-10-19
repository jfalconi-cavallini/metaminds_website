import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";
import { logEmail } from "@/lib/emailLog";
import { isKnownHourPackage } from "@/lib/portal/purchasePackages";
import {
  adminNotifyRecipients,
  buildPurchaseRequestEmail,
  callerCanNotifyPurchase,
  purchaseNoticeIsFresh,
  resendSendFailed,
} from "@/lib/portal/purchaseNotify";

const FROM = process.env.RESEND_FROM_EMAIL ?? "updates@metaminds.com";

export async function POST(req: NextRequest) {
  const caller = await authenticate(req);
  if (isAuthError(caller)) return caller;

  let requestId: number;
  try {
    const body = await req.json() as { requestId?: unknown };
    if (typeof body.requestId !== "number" || !Number.isInteger(body.requestId)) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }
    requestId = body.requestId;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const admin = adminClient();
  const { data: row, error: rowErr } = await admin
    .from("purchase_requests")
    .select("id, student_id, package_label, hours, price, created_at")
    .eq("id", requestId)
    .maybeSingle();

  if (rowErr) {
    console.error("[notify-purchase-request] load failed", rowErr.message);
    return NextResponse.json({ error: "Could not load the request" }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  let parentStudentIds: number[] = [];
  if (caller.role === "parent" && caller.linkedId !== row.student_id) {
    const { data: links, error: linkErr } = await admin
      .from("parent_students")
      .select("student_id")
      .eq("parent_profile_id", caller.id);
    if (linkErr) {
      console.error("[notify-purchase-request] parent link check failed", linkErr.message);
      return NextResponse.json({ error: "Could not verify the student" }, { status: 500 });
    }
    parentStudentIds = (links ?? []).map((link) => link.student_id as number);
  }

  const allowed = callerCanNotifyPurchase({
    role: caller.role,
    linkedId: caller.linkedId,
    studentId: row.student_id as number,
    parentStudentIds,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (!purchaseNoticeIsFresh(row.created_at as string, Date.now())) {
    return NextResponse.json({ sent: false, reason: "request_too_old" });
  }

  const hours = Number(row.hours);
  const price = Number(row.price);
  if (!isKnownHourPackage(row.package_label as string, hours, price)) {
    return NextResponse.json({ sent: false, reason: "unknown_package" });
  }

  const [studentRes, profileRes] = await Promise.all([
    admin.from("students").select("name, email, parent_name, parent_email").eq("id", row.student_id).single(),
    caller.role === "parent"
      ? admin.from("profiles").select("full_name").eq("id", caller.id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (studentRes.error || !studentRes.data) {
    return NextResponse.json({ error: "Could not load the student" }, { status: 500 });
  }

  const student = studentRes.data;
  const filedBy = caller.role === "parent" ? "parent" : "student";
  const parentName = filedBy === "parent"
    ? ((profileRes.data?.full_name as string | null) ?? (student.parent_name as string | null) ?? "")
    : ((student.parent_name as string | null) ?? "");
  const parentEmail = filedBy === "parent"
    ? (caller.email ?? (student.parent_email as string | null) ?? "")
    : ((student.parent_email as string | null) ?? "");

  const recipients = adminNotifyRecipients(process.env);
  const { subject, html } = buildPurchaseRequestEmail({
    parentName,
    parentEmail,
    studentName: (student.name as string) ?? "",
    studentEmail: (student.email as string) ?? "",
    packageLabel: row.package_label as string,
    hours,
    price,
    filedBy,
    requestId,
  });

  if (recipients.length === 0) {
    console.warn("[notify-purchase-request] ADMIN_NOTIFY_EMAIL is not set");
    return NextResponse.json({ sent: false, reason: "admin_notify_email_not_configured" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.startsWith("re_placeholder")) {
    console.warn("[notify-purchase-request] RESEND_API_KEY not configured — email skipped");
    return NextResponse.json({ sent: false, reason: "email_not_configured" });
  }

  const resend = new Resend(apiKey);
  let sendError: string | null = null;
  try {
    const result = await resend.emails.send({
      from: FROM,
      to: recipients,
      subject,
      html,
    });
    sendError = resendSendFailed(result.error) ?? (result.data?.id ? null : "Resend returned no message id");
  } catch (err) {
    sendError = err instanceof Error ? err.message : "Resend request failed";
  }

  if (sendError) {
    console.error("[notify-purchase-request]", sendError);
    await logEmail(admin, {
      emailType: "purchase_request",
      recipients,
      subject,
      html,
      relatedStudentId: row.student_id as number,
      status: "failed",
      error: sendError,
    });
    return NextResponse.json({ sent: false, reason: "send_failed" });
  }

  await logEmail(admin, {
    emailType: "purchase_request",
    recipients,
    subject,
    html,
    relatedStudentId: row.student_id as number,
  });

  return NextResponse.json({ sent: true });
}
