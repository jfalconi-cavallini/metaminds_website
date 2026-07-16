import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";

const admin = adminClient();

const FROM = process.env.RESEND_FROM_EMAIL ?? "updates@metaminds.com";

function buildEmail({
  tutorName,
  studentName,
  message,
  sessionLines,
}: {
  tutorName: string;
  studentName: string;
  message: string;
  sessionLines: string[];
}): string {
  const sessionsHtml = sessionLines.length
    ? `<div style="margin:16px 0;padding:12px 16px;background:#f0f9ff;border-left:3px solid #3b82f6;border-radius:4px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#1e40af;text-transform:uppercase;letter-spacing:.05em;">Sessions covered</p>
        ${sessionLines.map((l) => `<p style="margin:2px 0;font-size:13px;color:#1d4ed8;">• ${l}</p>`).join("")}
       </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr>
          <td style="background:#2563eb;padding:28px 32px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">MetaMinds</p>
            <p style="margin:4px 0 0;font-size:13px;color:#bfdbfe;">Tutoring Progress Update</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">
              Update for ${studentName}
            </p>
            <p style="margin:0 0 20px;font-size:13px;color:#6b7280;">
              From your tutor, ${tutorName}
            </p>
            ${sessionsHtml}
            <div style="white-space:pre-wrap;font-size:14px;color:#374151;line-height:1.6;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              You received this because you are a MetaMinds student or parent. Log in to your portal to see all updates.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const caller = await authenticate(req);
  if (isAuthError(caller)) return caller;

  try {
    const { tutorId, studentId, message, sessionIds } = await req.json() as {
      tutorId: number;
      studentId: number;
      message: string;
      sessionIds: number[];
    };

    if (caller.role === "student" || (caller.role === "tutor" && caller.linkedId !== tutorId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch tutor, student, and tagged sessions in parallel
    const [tutorRes, studentRes, sessionsRes] = await Promise.all([
      admin.from("tutors").select("name").eq("id", tutorId).single(),
      admin.from("students").select("name,email,parent_email").eq("id", studentId).single(),
      sessionIds?.length
        ? admin.from("sessions").select("date,time,subject").in("id", sessionIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (tutorRes.error || studentRes.error) {
      return NextResponse.json({ error: "Could not fetch data" }, { status: 500 });
    }

    const tutorName   = tutorRes.data.name as string;
    const studentName = studentRes.data.name as string;
    const studentEmail = studentRes.data.email as string;
    const parentEmail  = studentRes.data.parent_email as string | null;

    const sessionLines = ((sessionsRes.data ?? []) as { date: string; time: string; subject: string }[]).map(
      (s) => `${new Date(s.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at ${s.time} — ${s.subject}`
    );

    const html    = buildEmail({ tutorName, studentName, message, sessionLines });
    const subject = `Progress update for ${studentName} from ${tutorName}`;

    const recipients = [studentEmail, parentEmail].filter(Boolean) as string[];

    // Skip sending if API key is not configured
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey.startsWith("re_placeholder")) {
      console.warn("[send-parent-update] RESEND_API_KEY not configured — email skipped");
      return NextResponse.json({ sent: false, reason: "email_not_configured" });
    }

    const resend = new Resend(apiKey);
    await resend.emails.send({
      from:    FROM,
      to:      recipients,
      subject,
      html,
    });

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("[send-parent-update]", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
