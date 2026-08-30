import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { adminClient } from "@/lib/apiAuth";
import { resolveZoomUrl, formatDate } from "@/lib/portal/utils";

const admin = adminClient();
const FROM = process.env.RESEND_FROM_EMAIL ?? "updates@metaminds.com";

/** Today's calendar date in America/New_York, as a UTC-midnight Date so
 *  day-add arithmetic (setUTCDate) doesn't fall over a DST boundary. */
function easternToday(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const y = Number(parts.find((p) => p.type === "year")!.value);
  const m = Number(parts.find((p) => p.type === "month")!.value);
  const d = Number(parts.find((p) => p.type === "day")!.value);
  return new Date(Date.UTC(y, m - 1, d));
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function emailShell(headerLabel: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
        <tr>
          <td style="background:#2563eb;padding:28px 32px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">MetaMinds</p>
            <p style="margin:4px 0 0;font-size:13px;color:#bfdbfe;">${headerLabel}</p>
          </td>
        </tr>
        <tr><td style="padding:32px;">${bodyHtml}</td></tr>
        <tr>
          <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">Log in to your portal for full details.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildSessionReminderEmail(opts: {
  studentName: string; tutorName: string; subject: string;
  dateLabel: string; time: string; durationHours: number;
  sessionType: string; zoomUrl: string | null;
}): string {
  const joinButton = opts.zoomUrl
    ? `<tr><td style="padding:4px 0 0;">
        <a href="${opts.zoomUrl}" style="display:inline-block;margin-top:12px;padding:10px 20px;background:#2563eb;color:#ffffff;font-size:13px;font-weight:600;border-radius:8px;text-decoration:none;">Join Zoom Session</a>
       </td></tr>`
    : "";
  return emailShell("Session Reminder", `
    <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">
      Hi ${opts.studentName}, you have a session tomorrow
    </p>
    <p style="margin:0 0 20px;font-size:13px;color:#6b7280;">With ${opts.tutorName}</p>
    <div style="padding:16px 18px;background:#f0f9ff;border-left:3px solid #3b82f6;border-radius:4px;">
      <p style="margin:0 0 4px;font-size:14px;color:#1e40af;font-weight:600;">${opts.subject}</p>
      <p style="margin:0 0 2px;font-size:13px;color:#1d4ed8;">${opts.dateLabel} at ${opts.time} · ${opts.durationHours} hr</p>
      <p style="margin:0;font-size:13px;color:#1d4ed8;">${opts.sessionType === "in-person" ? "In-person session" : "Online session"}</p>
      <table cellpadding="0" cellspacing="0">${joinButton}</table>
    </div>
  `);
}

function buildHomeworkReminderEmail(opts: {
  studentName: string; tutorName: string; task: string; dateLabel: string;
}): string {
  return emailShell("Homework Due Tomorrow", `
    <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">
      Hi ${opts.studentName}, homework is due tomorrow
    </p>
    <p style="margin:0 0 20px;font-size:13px;color:#6b7280;">Assigned by ${opts.tutorName}</p>
    <div style="padding:16px 18px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:4px;">
      <p style="margin:0 0 4px;font-size:14px;color:#92400e;font-weight:600;">${opts.task}</p>
      <p style="margin:0;font-size:13px;color:#b45309;">Due ${opts.dateLabel}</p>
    </div>
  `);
}

/** Daily cron (see vercel.json) — emails a 24h-before session reminder and a
 *  due-tomorrow homework reminder. Runs once/day, so both windows are simply
 *  "tomorrow" in America/New_York; each row is marked reminder_sent_at so a
 *  re-run (or a slightly-late cron trigger) never double-sends. */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ?dryRun=true reports what would be sent without sending or marking
  // reminder_sent_at — safe to hit against production at any time.
  const dryRun = req.nextUrl.searchParams.get("dryRun") === "true";

  const apiKey = process.env.RESEND_API_KEY;
  if (!dryRun && (!apiKey || apiKey.startsWith("re_placeholder"))) {
    console.warn("[send-reminders] RESEND_API_KEY not configured — skipping run");
    return NextResponse.json({ sessionsReminded: 0, homeworkReminded: 0, reason: "email_not_configured" });
  }
  const resend = apiKey ? new Resend(apiKey) : null;

  const tomorrow = easternToday();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowStr = isoDate(tomorrow);
  const tomorrowLabel = formatDate(tomorrowStr);

  let sessionsReminded = 0;
  let homeworkReminded = 0;
  const dryRunDetails: string[] = [];

  // ── Session reminders (24h before) ──────────────────────────────
  const { data: sessions, error: sessionsErr } = await admin
    .from("sessions")
    .select("id, student_id, tutor_id, subject, session_date, session_time, duration_hours, session_type, zoom_link")
    .eq("session_date", tomorrowStr)
    .eq("status", "upcoming")
    .is("reminder_sent_at", null);
  if (sessionsErr) console.error("[send-reminders] sessions query", sessionsErr);

  for (const s of sessions ?? []) {
    const [{ data: tutor }, { data: student }] = await Promise.all([
      admin.from("tutors").select("name, zoom_link").eq("id", s.tutor_id).single(),
      admin.from("students").select("name, email, parent_email").eq("id", s.student_id).single(),
    ]);
    if (!tutor || !student) continue;

    const recipients = [student.email, student.parent_email].filter(Boolean) as string[];
    if (recipients.length === 0) continue;

    const rawZoom = (s.zoom_link ?? tutor.zoom_link ?? "") as string;
    const zoomUrl = s.session_type === "online" && rawZoom ? resolveZoomUrl(rawZoom) : null;

    if (dryRun) {
      dryRunDetails.push(`session #${s.id} (${s.subject}) → ${recipients.join(", ")}`);
      sessionsReminded++;
      continue;
    }

    try {
      await resend!.emails.send({
        from:    FROM,
        to:      recipients,
        subject: `Reminder: ${s.subject} tomorrow at ${s.session_time}`,
        html:    buildSessionReminderEmail({
          studentName:   student.name,
          tutorName:     tutor.name,
          subject:       s.subject,
          dateLabel:     tomorrowLabel,
          time:          s.session_time,
          durationHours: Number(s.duration_hours),
          sessionType:   s.session_type,
          zoomUrl,
        }),
      });
      await admin.from("sessions").update({ reminder_sent_at: new Date().toISOString() }).eq("id", s.id);
      sessionsReminded++;
    } catch (err) {
      console.error(`[send-reminders] session ${s.id}`, err);
    }
  }

  // ── Homework reminders (due tomorrow, not yet submitted) ────────
  const { data: homework, error: homeworkErr } = await admin
    .from("homework")
    .select("id, student_id, tutor_id, task, due_date")
    .eq("due_date", tomorrowStr)
    .eq("status", "pending")
    .is("reminder_sent_at", null);
  if (homeworkErr) console.error("[send-reminders] homework query", homeworkErr);

  for (const h of homework ?? []) {
    const [{ data: tutor }, { data: student }] = await Promise.all([
      admin.from("tutors").select("name").eq("id", h.tutor_id).single(),
      admin.from("students").select("name, email, parent_email").eq("id", h.student_id).single(),
    ]);
    if (!tutor || !student) continue;

    const recipients = [student.email, student.parent_email].filter(Boolean) as string[];
    if (recipients.length === 0) continue;

    if (dryRun) {
      dryRunDetails.push(`homework #${h.id} (${h.task}) → ${recipients.join(", ")}`);
      homeworkReminded++;
      continue;
    }

    try {
      await resend!.emails.send({
        from:    FROM,
        to:      recipients,
        subject: `Reminder: "${h.task}" is due tomorrow`,
        html:    buildHomeworkReminderEmail({
          studentName: student.name,
          tutorName:   tutor.name,
          task:        h.task,
          dateLabel:   tomorrowLabel,
        }),
      });
      await admin.from("homework").update({ reminder_sent_at: new Date().toISOString() }).eq("id", h.id);
      homeworkReminded++;
    } catch (err) {
      console.error(`[send-reminders] homework ${h.id}`, err);
    }
  }

  return NextResponse.json({
    sessionsReminded,
    homeworkReminded,
    ...(sessionsErr || homeworkErr ? { queryErrors: [sessionsErr?.message, homeworkErr?.message].filter(Boolean) } : {}),
    ...(dryRun ? { dryRun: true, dryRunDetails } : {}),
  });
}
