/** Shared rules for the public homepage question form.
 *  The browser and /api/contact both use this so a submission that
 *  passes the form cannot fail a different set of checks on the server. */

export const CONTACT_LIMITS = {
  nameMin: 2,
  nameMax: 80,
  emailMax: 254,
  messageMin: 10,
  messageMax: 2000,
} as const;

/** Reject request bodies larger than a valid submission can be.
 *  2000 characters of escaped JSON, plus the name and email, stays
 *  well under this. Anything bigger is dropped before it is parsed. */
export const MAX_CONTACT_BODY_BYTES = 16_000;

export interface ContactFields {
  name: string;
  email: string;
  message: string;
}

export interface ContactFieldErrors {
  name: string;
  email: string;
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateContactFields(input: {
  name: unknown;
  email: unknown;
  message: unknown;
}): { ok: true; value: ContactFields } | { ok: false; errors: ContactFieldErrors } {
  const name = asTrimmedString(input.name);
  const email = asTrimmedString(input.email);
  const message = asTrimmedString(input.message);
  const errors: ContactFieldErrors = { name: "", email: "", message: "" };

  if (name.length < CONTACT_LIMITS.nameMin) {
    errors.name = "Name must be at least 2 characters";
  } else if (name.length > CONTACT_LIMITS.nameMax) {
    errors.name = `Name must be ${CONTACT_LIMITS.nameMax} characters or fewer`;
  } else if (/[\u0000-\u001F\u007F]/.test(name)) {
    errors.name = "Name contains invalid characters";
  }

  if (
    email.length === 0 ||
    email.length > CONTACT_LIMITS.emailMax ||
    /[\r\n]/.test(email) ||
    !EMAIL_RE.test(email)
  ) {
    errors.email = "Please enter a valid email address";
  }

  if (message.length < CONTACT_LIMITS.messageMin) {
    errors.message = "Message must be at least 10 characters";
  } else if (message.length > CONTACT_LIMITS.messageMax) {
    errors.message = `Message must be ${CONTACT_LIMITS.messageMax} characters or fewer`;
  } else if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(message)) {
    errors.message = "Message contains invalid characters";
  }

  if (errors.name || errors.email || errors.message) {
    return { ok: false, errors };
  }

  return { ok: true, value: { name, email, message } };
}

/** A honeypot that contains anything was filled by a bot. Non-strings
 *  are treated the same way so a crafted payload cannot skip the check. */
export function isHoneypotTripped(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  return value != null;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildContactEmail(value: ContactFields): {
  subject: string;
  html: string;
  text: string;
} {
  const safeName = escapeHtml(value.name);
  const safeEmail = escapeHtml(value.email);
  const safeMessage = escapeHtml(value.message).replace(/\r\n|\r|\n/g, "<br />");
  const subjectName = value.name.replace(/[\r\n]+/g, " ");

  const text = [`Name: ${value.name}`, `Email: ${value.email}`, "", value.message].join("\n");

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
            <p style="margin:4px 0 0;font-size:13px;color:#bfdbfe;">New question from the website</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">From</p>
            <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#111827;">${safeName}</p>
            <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Email</p>
            <p style="margin:0 0 20px;font-size:14px;color:#1d4ed8;">${safeEmail}</p>
            <div style="padding:16px 18px;background:#f0f9ff;border-left:3px solid #3b82f6;border-radius:4px;font-size:14px;color:#374151;line-height:1.6;">${safeMessage}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">Reply to this email to respond directly to ${safeName}.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return {
    subject: `Website question from ${subjectName}`,
    html,
    text,
  };
}
