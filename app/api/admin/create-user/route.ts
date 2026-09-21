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
            <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#111827;">Welcome to the team, ${firstName}!</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">Your tutor account has been created. Use the credentials below to sign in for the first time.</p>

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
              <p style="margin:0;font-size:13px;color:#92400e;">You&apos;ll be asked to create a new password immediately after your first login.</p>
            </div>

            <p style="margin:0 0 10px;font-size:14px;font-weight:600;color:#111827;">Inside your dashboard you&apos;ll be able to:</p>
            <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#4b5563;line-height:2;">
              <li>Manage your assigned students</li>
              <li>Schedule and run tutoring sessions</li>
              <li>Assign and grade homework</li>
              <li>Write session notes and parent updates</li>
              <li>Build learning plans from the curriculum library</li>
            </ul>

            <p style="margin:0;font-size:14px;color:#6b7280;">We&apos;re excited to have you on the team!</p>
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

  const body = await request.json() as {
    email: string;
    fullName: string;
    role: "tutor" | "student";
    linkedId: number;
  };

  const { email, fullName, role, linkedId } = body;
  if (!email || !fullName || !role || !linkedId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const tempPassword = generateTempPassword();

  // Create the Supabase auth user — the DB trigger auto-creates the profiles row
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { role, full_name: fullName, force_password_reset: true },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Update the auto-created profile row to set linked_id + force a password
  // reset on first login (the trigger only reads role/full_name from metadata)
  const { error: profileError } = await admin
    .from("profiles")
    .update({ linked_id: linkedId, force_password_reset: true })
    .eq("id", authData.user.id);

  if (profileError) {
    // Roll back: delete the auth user so admin can retry cleanly
    await admin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json(
      { error: `Profile link failed: ${profileError.message}` },
      { status: 500 },
    );
  }

  // Send the welcome email with login credentials (tutors only, for now —
  // student account creation goes through /api/admin/onboard-student instead)
  let emailSent = false;
  let emailError: string | undefined;

  if (role === "tutor") {
    const apiKey = process.env.RESEND_API_KEY;
    const FROM   = process.env.RESEND_FROM_EMAIL ?? "welcome@metamindsstemacademy.com";

    if (apiKey && !apiKey.startsWith("re_placeholder")) {
      const resend = new Resend(apiKey);
      const subject = "Welcome to the MetaMinds Team!";
      const html = tutorWelcomeHtml({ firstName: fullName.split(" ")[0], email, tempPassword });
      try {
        await resend.emails.send({ from: FROM, to: [email], subject, html });
        await logEmail(admin, {
          emailType: "welcome_tutor", recipients: [email], subject, html,
          relatedTutorId: linkedId,
        });
        emailSent = true;
      } catch (e) {
        emailError = e instanceof Error ? e.message : String(e);
        await logEmail(admin, {
          emailType: "welcome_tutor", recipients: [email], subject, html,
          relatedTutorId: linkedId, status: "failed", error: emailError,
        });
      }
    } else {
      emailError = "RESEND_API_KEY not configured — share the temporary password manually.";
    }
  }

  return NextResponse.json({
    success: true,
    emailSent,
    emailError,
    // Only handed back so the admin can share it manually if the email failed
    tempPassword: emailSent ? undefined : tempPassword,
  });
}
