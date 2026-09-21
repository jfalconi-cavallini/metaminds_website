import { NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";
import { logEmail } from "@/lib/emailLog";

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  const bytes = crypto.randomBytes(14);
  return Array.from(bytes).map((b) => chars[b % chars.length]).join("");
}

function tutorWelcomeHtml({
  firstName, email, tempPassword,
}: {
  firstName: string;
  email: string;
  tempPassword: string;
}): string {
  const loginUrl = "https://metamindsstemacademy.com/login";
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
            <p style="margin:4px 0 0;font-size:13px;color:#bfdbfe;">STEM Academy</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#111827;">Hi ${firstName},</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">Here are fresh login credentials for your MetaMinds tutor account.</p>

            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin:0 0 20px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:.05em;">Your Login Details</p>
              <p style="margin:0 0 6px;font-size:14px;color:#1e40af;">
                <strong>Portal:</strong>&nbsp;
                <a href="${loginUrl}" style="color:#2563eb;text-decoration:none;">${loginUrl}</a>
              </p>
              <p style="margin:0 0 6px;font-size:14px;color:#1e40af;"><strong>Email:</strong>&nbsp;${email}</p>
              <p style="margin:0;font-size:14px;color:#1e40af;"><strong>Temporary Password:</strong>&nbsp;<span style="font-family:monospace;background:#dbeafe;padding:2px 6px;border-radius:4px;">${tempPassword}</span></p>
            </div>

            <div style="background:#fffbeb;border-left:3px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:0 0 24px;">
              <p style="margin:0;font-size:13px;color:#92400e;">You&apos;ll be asked to create a new password immediately after your next login.</p>
            </div>

            <p style="margin:12px 0 0;font-size:14px;font-weight:600;color:#374151;">— MetaMinds STEM Academy</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">MetaMinds STEM Academy · Personalized learning for every student.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request: Request) {
  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;

  if (caller.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = adminClient();

  const body = await request.json() as { tutorId: number; tutorName: string; tutorEmail: string };
  const { tutorId, tutorName, tutorEmail } = body;
  if (!tutorId || !tutorName || !tutorEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "tutor")
    .eq("linked_id", tutorId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "No login account found for this tutor." }, { status: 404 });
  }

  const tempPassword = generateTempPassword();

  const updatePayload: Record<string, unknown> = {
    password: tempPassword,
    user_metadata: { role: "tutor", full_name: tutorName, force_password_reset: true },
  };

  const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
  if (authUser?.user && authUser.user.email?.toLowerCase() !== tutorEmail.trim().toLowerCase()) {
    updatePayload.email = tutorEmail.trim();
    updatePayload.email_confirm = true;
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(profile.id, updatePayload);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await admin.from("profiles").update({ force_password_reset: true }).eq("id", profile.id);

  let emailSent = false;
  let emailError: string | undefined;
  const apiKey = process.env.RESEND_API_KEY;
  const FROM   = process.env.RESEND_FROM_EMAIL ?? "welcome@metamindsstemacademy.com";

  if (apiKey && !apiKey.startsWith("re_placeholder")) {
    const resend = new Resend(apiKey);
    const subject = "Your MetaMinds Login Details";
    const html = tutorWelcomeHtml({ firstName: tutorName.split(" ")[0], email: tutorEmail.trim(), tempPassword });
    try {
      await resend.emails.send({ from: FROM, to: [tutorEmail.trim()], subject, html });
      await logEmail(admin, {
        emailType: "welcome_tutor", recipients: [tutorEmail.trim()], subject, html,
        relatedTutorId: tutorId,
      });
      emailSent = true;
    } catch (e) {
      emailError = e instanceof Error ? e.message : String(e);
      await logEmail(admin, {
        emailType: "welcome_tutor", recipients: [tutorEmail.trim()], subject, html,
        relatedTutorId: tutorId, status: "failed", error: emailError,
      });
    }
  } else {
    emailError = "RESEND_API_KEY not configured — share the temporary password manually.";
  }

  return NextResponse.json({
    success: true,
    emailSent,
    emailError,
    tempPassword: emailSent ? undefined : tempPassword,
  });
}
