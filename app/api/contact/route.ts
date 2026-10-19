import { NextResponse } from "next/server";
import { Resend } from "resend";
import { siteData } from "@/lib/data";
import {
  MAX_CONTACT_BODY_BYTES,
  buildContactEmail,
  isHoneypotTripped,
  validateContactFields,
} from "@/lib/contactForm";

/** Public inbox already printed in the site footer and on this form's
 *  error state. Lead mail goes there so it lands in the same mailbox
 *  the business already gives to parents. */
const TO = siteData.brand.email;

const FROM = process.env.RESEND_FROM_EMAIL ?? "welcome@metamindsstemacademy.com";

function jsonError(error: string, status: number, fields?: { name: string; email: string; message: string }) {
  return NextResponse.json(fields ? { error, fields } : { error }, { status });
}

/** Public on purpose: the homepage question form has no signed-in user.
 *  Abuse control is a honeypot plus a body and field length cap. */
export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return jsonError("Please check the form and try again.", 415);
  }

  const declaredLength = Number(req.headers.get("content-length") ?? "");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_CONTACT_BODY_BYTES) {
    return jsonError("Message is too long.", 413);
  }

  let raw: string;
  try {
    raw = await req.text();
  } catch (err) {
    console.error("[contact] could not read body", err);
    return jsonError("Please check the form and try again.", 400);
  }

  if (new TextEncoder().encode(raw).byteLength > MAX_CONTACT_BODY_BYTES) {
    return jsonError("Message is too long.", 413);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return jsonError("Please check the form and try again.", 400);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return jsonError("Please check the form and try again.", 400);
  }

  const body = parsed as Record<string, unknown>;

  // Pretend the send worked. A bot that filled the hidden field should
  // not learn that it was dropped, and it should not get a real email.
  if (isHoneypotTripped(body.mm_leave_blank)) {
    return NextResponse.json({ ok: true });
  }

  for (const key of ["name", "email", "message"] as const) {
    if (body[key] != null && typeof body[key] !== "string") {
      return jsonError("Please check the form and try again.", 400);
    }
  }

  const validated = validateContactFields({
    name: body.name,
    email: body.email,
    message: body.message,
  });
  if (!validated.ok) {
    return jsonError("Please check the form and try again.", 400, validated.errors);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.startsWith("re_placeholder")) {
    console.error("[contact] RESEND_API_KEY not configured");
    return jsonError("We couldn't send your message right now.", 503);
  }

  const { subject, html, text } = buildContactEmail(validated.value);

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: FROM,
      to: [TO],
      replyTo: validated.value.email,
      subject,
      html,
      text,
    });
    if (result.error) {
      console.error("[contact] Resend error", result.error);
      return jsonError("We couldn't send your message right now.", 502);
    }
  } catch (err) {
    console.error("[contact] send failed", err);
    return jsonError("We couldn't send your message right now.", 502);
  }

  return NextResponse.json({ ok: true });
}
