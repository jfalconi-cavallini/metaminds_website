import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  const bytes = crypto.randomBytes(14);
  return Array.from(bytes).map((b) => chars[b % chars.length]).join("");
}

function parentWelcomeHtml({ parentFirstName, parentEmail, tempPassword, studentName }: {
  parentFirstName: string; parentEmail: string; tempPassword: string; studentName: string;
}): string {
  const loginUrl = "https://metamindsstemacademy.com/login";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
        <tr><td style="background:#2563eb;padding:28px 32px;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">MetaMinds</p>
          <p style="margin:4px 0 0;font-size:13px;color:#bfdbfe;">STEM Academy</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#111827;">Welcome to MetaMinds, ${parentFirstName}!</p>
          <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
            Your student <strong>${studentName}</strong>'s MetaMinds account has been created.
            A parent account has been set up for you so you can monitor their progress.
          </p>
          <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:20px;margin:0 0 20px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#6d28d9;text-transform:uppercase;letter-spacing:.05em;">Parent Login Details</p>
            <p style="margin:0 0 6px;font-size:14px;color:#5b21b6;"><strong>Portal:</strong>&nbsp;<a href="${loginUrl}" style="color:#7c3aed;text-decoration:none;">${loginUrl}</a></p>
            <p style="margin:0 0 6px;font-size:14px;color:#5b21b6;"><strong>Email:</strong>&nbsp;${parentEmail}</p>
            <p style="margin:0;font-size:14px;color:#5b21b6;"><strong>Temporary Password:</strong>&nbsp;<span style="font-family:monospace;background:#ede9fe;padding:2px 6px;border-radius:4px;">${tempPassword}</span></p>
          </div>
          <div style="background:#fffbeb;border-left:3px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:0 0 24px;">
            <p style="margin:0;font-size:13px;color:#92400e;">After signing in you'll be prompted to create your own password.</p>
          </div>
          <p style="margin:0;font-size:14px;color:#6b7280;">Thank you for choosing MetaMinds!</p>
          <p style="margin:12px 0 0;font-size:14px;font-weight:600;color:#374151;">— MetaMinds STEM Academy</p>
        </td></tr>
        <tr><td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">MetaMinds STEM Academy · Personalized learning for every student.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 500 });
  }

  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = adminClient();

  const { data: { user: caller } } = await admin.auth.getUser(token);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: callerProfile } = await admin.from("profiles").select("role").eq("id", caller.id).single();
  if (callerProfile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json() as {
    studentId: number;
    sendTo: string;       // email address to send to (may differ from stored parent email)
    parentName: string;
    studentName: string;
  };

  const { studentId, sendTo, parentName, studentName } = body;
  if (!studentId || !sendTo || !parentName || !studentName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const newTempPassword = generateTempPassword();

  // Find the parent auth account (profile linked to this student with is_parent flag or second profile)
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, role")
    .eq("linked_id", studentId)
    .eq("role", "student");

  // Find the auth user whose email matches the stored parent email, or pick any linked profile
  const { data: allLinkedUsers } = await admin.auth.admin.listUsers();
  const linkedAuthIds = (profiles ?? []).map((p: { id: string }) => p.id);

  // Find the parent user among linked auth accounts
  let parentAuthId: string | null = null;
  let currentParentEmail: string | null = null;

  for (const authId of linkedAuthIds) {
    const linkedUser = allLinkedUsers?.users.find((u) => u.id === authId);
    if (linkedUser && linkedUser.user_metadata?.is_parent) {
      parentAuthId = authId;
      currentParentEmail = linkedUser.email ?? null;
      break;
    }
  }

  // If no explicit parent found, pick the second profile (first is student)
  if (!parentAuthId && linkedAuthIds.length > 1) {
    parentAuthId = linkedAuthIds[1];
    const u = allLinkedUsers?.users.find((u) => u.id === linkedAuthIds[1]);
    currentParentEmail = u?.email ?? null;
  }

  // Update the parent auth account: reset password + update email if changed + force reset
  if (parentAuthId) {
    const updatePayload: Record<string, unknown> = {
      password: newTempPassword,
      user_metadata: { force_password_reset: true, is_parent: true, full_name: parentName },
    };
    // If email changed, update it too
    if (sendTo.toLowerCase() !== currentParentEmail?.toLowerCase()) {
      updatePayload.email = sendTo;
      updatePayload.email_confirm = true;
      // Update student's parent_email in DB
      await admin.from("students").update({ parent_email: sendTo }).eq("id", studentId);
    }
    await admin.auth.admin.updateUserById(parentAuthId, updatePayload);
    // Reset force_password_reset in profiles table
    await admin.from("profiles").update({ force_password_reset: true }).eq("id", parentAuthId);
  }

  // Send welcome email
  const apiKey = process.env.RESEND_API_KEY;
  const FROM = process.env.RESEND_FROM_EMAIL ?? "welcome@metamindsstemacademy.com";

  if (!apiKey || apiKey.startsWith("re_placeholder")) {
    return NextResponse.json({
      success: true,
      emailSent: false,
      tempPassword: newTempPassword,
      note: "RESEND_API_KEY not configured — share credentials manually.",
    });
  }

  const resend = new Resend(apiKey);
  try {
    await resend.emails.send({
      from:    FROM,
      to:      [sendTo],
      subject: "Welcome to MetaMinds STEM Academy",
      html:    parentWelcomeHtml({
        parentFirstName: parentName.split(" ")[0],
        parentEmail:     sendTo,
        tempPassword:    newTempPassword,
        studentName,
      }),
    });
    return NextResponse.json({ success: true, emailSent: true, tempPassword: newTempPassword });
  } catch (e) {
    return NextResponse.json({
      success: true,
      emailSent: false,
      tempPassword: newTempPassword,
      note: `Email failed: ${e instanceof Error ? e.message : String(e)}`,
    });
  }
}
