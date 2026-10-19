/** Production admin portal. Purchase requests show on the Packages tab. */
export const ADMIN_PORTAL_URL = "https://metamindsstemacademy.com/portal/admin";

/** A notice is only sent for a request the caller just filed. */
export const PURCHASE_NOTICE_MAX_AGE_MS = 15 * 60 * 1000;

export interface PurchaseRequestNotice {
  parentName: string;
  parentEmail: string;
  studentName: string;
  studentEmail: string;
  packageLabel: string;
  hours: number;
  price: number;
  filedBy: "parent" | "student";
  requestId: number;
}

/**
 * Who should receive a purchase request email.
 * ADMIN_NOTIFY_EMAIL is the server-only inbox. If it is unset, fall back to
 * NEXT_PUBLIC_ADMIN_EMAIL, which is already documented as the admin list
 * but is not used anywhere else in the app.
 */
export function adminNotifyRecipients(env: Record<string, string | undefined>): string[] {
  const raw = (env.ADMIN_NOTIFY_EMAIL || env.NEXT_PUBLIC_ADMIN_EMAIL || "").trim();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const email = part.trim();
    if (!email) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(email);
  }
  return out;
}

export function callerCanNotifyPurchase(args: {
  role: string;
  linkedId: number | null;
  studentId: number;
  parentStudentIds: number[];
}): boolean {
  if (args.role === "student") return args.linkedId === args.studentId;
  if (args.role === "parent") {
    return args.linkedId === args.studentId || args.parentStudentIds.includes(args.studentId);
  }
  return false;
}

export function purchaseNoticeIsFresh(createdAtIso: string, nowMs: number): boolean {
  const created = Date.parse(createdAtIso);
  if (Number.isNaN(created)) return false;
  const age = nowMs - created;
  return age >= -60_000 && age <= PURCHASE_NOTICE_MAX_AGE_MS;
}

/** Resend v6 returns `{ data, error }` and does not throw on API errors. */
export function resendSendFailed(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message.trim();
  }
  return "Resend returned an error";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function personLine(name: string, email: string): string {
  const safeName = name.trim();
  const safeEmail = email.trim();
  if (!safeName && !safeEmail) return "Not on file";
  if (!safeEmail) return safeName;
  if (!safeName) return safeEmail;
  return `${safeName} (${safeEmail})`;
}

export function buildPurchaseRequestEmail(notice: PurchaseRequestNotice): { subject: string; html: string } {
  const studentName = oneLine(notice.studentName) || "Unknown student";
  const subject = `Hour purchase request for ${studentName}`;
  const parent = escapeHtml(personLine(notice.parentName, notice.parentEmail));
  const student = escapeHtml(personLine(studentName, notice.studentEmail));
  const packageLabel = escapeHtml(oneLine(notice.packageLabel) || "Unknown package");
  const hours = Number.isFinite(notice.hours) ? String(notice.hours) : "";
  const price = Number.isFinite(notice.price) ? `$${notice.price}` : "";
  const filedBy = notice.filedBy === "parent"
    ? "Filed by the parent account."
    : "Filed by the student account.";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
        <tr>
          <td style="background:#2563eb;padding:28px 32px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">MetaMinds</p>
            <p style="margin:4px 0 0;font-size:13px;color:#bfdbfe;">Hour purchase request</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#111827;">${escapeHtml(subject)}</p>
            <p style="margin:0 0 16px;font-size:13px;color:#374151;">${filedBy} Hours are not added automatically. Add them on the Packages tab after the payment is confirmed.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#111827;">
              <tr><td style="padding:6px 0;color:#6b7280;width:120px;">Parent</td><td style="padding:6px 0;">${parent}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Student</td><td style="padding:6px 0;">${student}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Package</td><td style="padding:6px 0;">${packageLabel}${hours ? `, ${escapeHtml(hours)} hours` : ""}${price ? `, ${escapeHtml(price)}` : ""}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Request</td><td style="padding:6px 0;">#${notice.requestId}</td></tr>
            </table>
            <p style="margin:20px 0 0;">
              <a href="${ADMIN_PORTAL_URL}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#ffffff;font-size:13px;font-weight:600;border-radius:8px;text-decoration:none;">Open the admin portal</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
