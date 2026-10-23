import { NextResponse } from "next/server";
import { Resend } from "resend";
import { adminClient } from "@/lib/apiAuth";
import {
  CAMPUS_LEAD_SUCCESS,
  isHoneypotTripped,
  isMissingLeadStore,
  validateCampusLead,
  type NormalizedCampusLead,
} from "@/lib/campusLead";
import { logEmail } from "@/lib/emailLog";

const LEAD_NOTICE_TO = "metamindsstemacademy@gmail.com";
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

const attempts = new Map<string, number[]>();

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Best-effort limit. The repo has no shared limiter; this map lives in one server instance. */
function allowAttempt(ip: string, now = Date.now()): boolean {
  const recent = (attempts.get(ip) ?? []).filter((at) => now - at < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    attempts.set(ip, recent);
    return false;
  }
  recent.push(now);
  attempts.set(ip, recent);
  return true;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatLabel(lead: NormalizedCampusLead): string {
  if (lead.sessionFormat === "online") return "Online";
  if (lead.sessionFormat === "in_person") return "In person";
  return "Not answered";
}

function parentLabel(lead: NormalizedCampusLead): string {
  if (lead.parentHelping === true) return "Yes";
  if (lead.parentHelping === false) return "No";
  return "Not answered";
}

function noticeHtml(lead: NormalizedCampusLead): string {
  const rows: Array<[string, string]> = [
    ["Name", lead.name],
    ["Email", lead.email ?? ""],
    ["Phone", lead.phone ?? ""],
    ["Course", lead.course],
    ["Online or in person", formatLabel(lead)],
    ["Parent helping", parentLabel(lead)],
    ["utm_source", lead.utmSource],
    ["utm_medium", lead.utmMedium],
  ];
  const body = rows
    .map(
      ([label, value]) =>
        `<p style="margin:0 0 8px;font-size:14px;color:#111827;"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value) || "Not provided"}</p>`,
    )
    .join("");
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${body}</body></html>`;
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return adminClient();
}

async function storeLead(
  admin: ReturnType<typeof serviceClient>,
  lead: NormalizedCampusLead,
): Promise<"stored" | "missing" | "failed"> {
  if (!admin) return "missing";
  try {
    const { error } = await admin.from("campus_flyer_leads").insert({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      course: lead.course,
      session_format: lead.sessionFormat,
      parent_helping: lead.parentHelping,
      utm_source: lead.utmSource,
      utm_medium: lead.utmMedium,
    });
    if (!error) return "stored";
    if (isMissingLeadStore(error)) return "missing";
    console.error("campus lead insert failed", error.code, error.message);
    return "failed";
  } catch (err) {
    console.error("campus lead insert threw", err instanceof Error ? err.message : "unknown");
    return "failed";
  }
}

async function sendNotice(
  admin: ReturnType<typeof serviceClient>,
  lead: NormalizedCampusLead,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey || apiKey.startsWith("re_placeholder")) return false;

  const from = process.env.RESEND_FROM_EMAIL?.trim() || "updates@metaminds.com";
  const subject = `New tutor request (${lead.utmSource.toUpperCase()})`;
  const html = noticeHtml(lead);
  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from,
      to: [LEAD_NOTICE_TO],
      ...(lead.email ? { replyTo: lead.email } : {}),
      subject,
      html,
    });
    if (admin) {
      await logEmail(admin, {
        emailType: "campus_flyer_lead",
        recipients: [LEAD_NOTICE_TO],
        subject,
        html,
        status: error ? "failed" : "sent",
        error: error ? error.message : undefined,
      });
    }
    if (error) {
      console.error("campus lead email failed", error.message);
      return false;
    }
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("campus lead email threw", message);
    if (admin) {
      await logEmail(admin, {
        emailType: "campus_flyer_lead",
        recipients: [LEAD_NOTICE_TO],
        subject,
        html,
        status: "failed",
        error: message,
      });
    }
    return false;
  }
}

export async function POST(request: Request) {
  if (!allowAttempt(clientIp(request))) {
    return NextResponse.json(
      { ok: false, error: "Please wait a moment and try again." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  if (isHoneypotTripped(record.mm_hp)) {
    return NextResponse.json({ ok: true, message: CAMPUS_LEAD_SUCCESS });
  }

  const parsed = validateCampusLead({
    name: record.name,
    email: record.email,
    phone: record.phone,
    course: record.course,
    sessionFormat: record.sessionFormat,
    parentHelping: record.parentHelping,
    source: record.source,
    website: record.mm_hp,
  });

  if (!parsed.ok) {
    return NextResponse.json({ ok: false, fieldErrors: parsed.fieldErrors }, { status: 400 });
  }

  const admin = serviceClient();
  const [stored, emailed] = await Promise.all([
    storeLead(admin, parsed.lead),
    sendNotice(admin, parsed.lead),
  ]);

  if (stored === "failed" && !emailed) {
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 503 },
    );
  }

  if (stored === "missing" && !emailed) {
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, message: CAMPUS_LEAD_SUCCESS });
}
