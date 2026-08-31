import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";
import { resolveZoomUrl, formatDate } from "@/lib/portal/utils";
import { convertSessionDisplay } from "@/lib/portal/timezone";

const admin = adminClient();

const FROM = process.env.RESEND_FROM_EMAIL ?? "updates@metaminds.com";

function buildEmail({
  studentName,
  tutorName,
  subject,
  dateLabel,
  time,
  durationHours,
  sessionType,
  zoomUrl,
}: {
  studentName: string;
  tutorName: string;
  subject: string;
  dateLabel: string;
  time: string;
  durationHours: number;
  sessionType: string;
  zoomUrl: string | null;
}): string {
  const joinButton = zoomUrl
    ? `<tr><td style="padding:4px 0 0;">
        <a href="${zoomUrl}" style="display:inline-block;margin-top:12px;padding:10px 20px;background:#2563eb;color:#ffffff;font-size:13px;font-weight:600;border-radius:8px;text-decoration:none;">Join Zoom Session</a>
       </td></tr>`
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
            <p style="margin:4px 0 0;font-size:13px;color:#bfdbfe;">Session Confirmed</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">
              Hi ${studentName}, your session is booked
            </p>
            <p style="margin:0 0 20px;font-size:13px;color:#6b7280;">
              With ${tutorName}
            </p>
            <div style="padding:16px 18px;background:#f0f9ff;border-left:3px solid #3b82f6;border-radius:4px;">
              <p style="margin:0 0 4px;font-size:14px;color:#1e40af;font-weight:600;">${subject}</p>
              <p style="margin:0 0 2px;font-size:13px;color:#1d4ed8;">${dateLabel} at ${time} · ${durationHours} hr</p>
              <p style="margin:0;font-size:13px;color:#1d4ed8;">${sessionType === "in-person" ? "In-person session" : "Online session"}</p>
              <table cellpadding="0" cellspacing="0">${joinButton}</table>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              Log in to your portal to view, reschedule, or cancel this session.
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
    const { sessionId } = await req.json() as { sessionId: number };

    const { data: sessionRow, error: sessionErr } = await admin
      .from("sessions")
      .select("id, student_id, tutor_id, subject, session_date, session_time, duration_hours, session_type, zoom_link, status")
      .eq("id", sessionId)
      .single();

    if (sessionErr || !sessionRow) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const owns =
      caller.role === "admin" ||
      (caller.role === "tutor" && caller.linkedId === sessionRow.tutor_id) ||
      ((caller.role === "student" || caller.role === "parent") && caller.linkedId === sessionRow.student_id);
    if (!owns) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (sessionRow.status === "cancelled") {
      return NextResponse.json({ error: "Session is cancelled" }, { status: 400 });
    }

    const [tutorRes, studentRes] = await Promise.all([
      admin.from("tutors").select("name, zoom_link").eq("id", sessionRow.tutor_id).single(),
      admin.from("students").select("name, email, parent_email, timezone").eq("id", sessionRow.student_id).single(),
    ]);

    if (tutorRes.error || studentRes.error) {
      return NextResponse.json({ error: "Could not fetch data" }, { status: 500 });
    }

    const tutorName    = tutorRes.data.name as string;
    const studentName  = studentRes.data.name as string;
    const studentEmail = studentRes.data.email as string;
    const parentEmail  = studentRes.data.parent_email as string | null;
    const recipients   = [studentEmail, parentEmail].filter(Boolean) as string[];

    const rawZoom = (sessionRow.zoom_link ?? tutorRes.data.zoom_link ?? "") as string;
    const zoomUrl = sessionRow.session_type === "online" && rawZoom ? resolveZoomUrl(rawZoom) : null;

    const converted = convertSessionDisplay(
      sessionRow.session_date as string,
      sessionRow.session_time as string,
      studentRes.data.timezone as string | null,
    );
    const shiftNote = converted.dayShift === 1 ? " (+1 day)" : converted.dayShift === -1 ? " (-1 day)" : "";

    const html    = buildEmail({
      studentName,
      tutorName,
      subject:       sessionRow.subject as string,
      dateLabel:     formatDate(converted.dateISO),
      time:          `${converted.time12h} ${converted.zoneAbbrev}${shiftNote}`,
      durationHours: Number(sessionRow.duration_hours),
      sessionType:   sessionRow.session_type as string,
      zoomUrl,
    });
    const subject = `Session confirmed: ${sessionRow.subject} on ${formatDate(converted.dateISO)}`;

    if (recipients.length === 0) {
      return NextResponse.json({ sent: false, reason: "no_recipients" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey.startsWith("re_placeholder")) {
      console.warn("[send-session-confirmation] RESEND_API_KEY not configured — email skipped");
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
    console.error("[send-session-confirmation]", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
