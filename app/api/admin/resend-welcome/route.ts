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

function studentWelcomeHtml({ firstName, email, tempPassword }: {
  firstName: string; email: string; tempPassword: string;
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
          <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#111827;">Welcome to MetaMinds, ${firstName}!</p>
          <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">Your account has been created. Use the credentials below to sign in for the first time.</p>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin:0 0 20px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:.05em;">Your Login Details</p>
            <p style="margin:0 0 6px;font-size:14px;color:#1e40af;"><strong>Portal:</strong>&nbsp;<a href="${loginUrl}" style="color:#2563eb;text-decoration:none;">${loginUrl}</a></p>
            <p style="margin:0 0 6px;font-size:14px;color:#1e40af;"><strong>Email:</strong>&nbsp;${email}</p>
            <p style="margin:0;font-size:14px;color:#1e40af;"><strong>Temporary Password:</strong>&nbsp;<span style="font-family:monospace;background:#dbeafe;padding:2px 6px;border-radius:4px;">${tempPassword}</span></p>
          </div>
          <div style="background:#fffbeb;border-left:3px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:0 0 24px;">
            <p style="margin:0;font-size:13px;color:#92400e;">You'll be asked to create a new password immediately after your first login.</p>
          </div>
          <p style="margin:0;font-size:14px;color:#6b7280;">We're excited to work with you!</p>
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
    studentId:   number;
    which:       "student" | "parent" | "both";
    studentEmail?: string;
    studentName:   string;
    parentEmail?:  string;
    parentName?:   string;
  };

  const { studentId, which, studentName, parentName = "Parent" } = body;
  const studentEmail = body.studentEmail?.trim();
  const parentEmail  = body.parentEmail?.trim();

  if (!studentId || !which || !studentName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const FROM   = process.env.RESEND_FROM_EMAIL ?? "welcome@metamindsstemacademy.com";
  const canEmail = !!(apiKey && !apiKey.startsWith("re_placeholder"));
  const resend   = canEmail ? new Resend(apiKey) : null;

  // Fetch all auth users once (needed for lookups)
  const { data: allUsersData } = await admin.auth.admin.listUsers();
  const allUsers = allUsersData?.users ?? [];

  // Fetch all profiles linked to this student
  const { data: linkedProfiles } = await admin
    .from("profiles")
    .select("id, role")
    .eq("linked_id", studentId)
    .eq("role", "student");
  const linkedIds = (linkedProfiles ?? []).map((p: { id: string }) => p.id);

  const results: Record<string, unknown> = {};

  // ── STUDENT ────────────────────────────────────────────────────────
  if (which === "student" || which === "both") {
    if (!studentEmail) {
      results.studentError = "No student email provided";
    } else {
      const tempPassword = generateTempPassword();

      // Find student auth account (the one without is_parent)
      let studentAuthId: string | null = null;
      for (const authId of linkedIds) {
        const u = allUsers.find((x) => x.id === authId);
        if (u && !u.user_metadata?.is_parent) { studentAuthId = authId; break; }
      }
      // Fallback: match by email
      if (!studentAuthId) {
        const u = allUsers.find((x) => x.email?.toLowerCase() === studentEmail.toLowerCase());
        if (u) studentAuthId = u.id;
      }

      if (studentAuthId) {
        const currentEmail = allUsers.find((u) => u.id === studentAuthId)?.email ?? "";
        const updatePayload: Record<string, unknown> = {
          password: tempPassword,
          user_metadata: { force_password_reset: true, full_name: studentName },
        };
        if (studentEmail.toLowerCase() !== currentEmail.toLowerCase()) {
          updatePayload.email         = studentEmail;
          updatePayload.email_confirm = true;
          await admin.from("students").update({ email: studentEmail }).eq("id", studentId);
        }
        await admin.auth.admin.updateUserById(studentAuthId, updatePayload);
        await admin.from("profiles").update({ force_password_reset: true }).eq("id", studentAuthId);

        if (resend) {
          try {
            await resend.emails.send({
              from:    FROM,
              to:      [studentEmail],
              subject: "Welcome to MetaMinds STEM Academy!",
              html:    studentWelcomeHtml({
                firstName: studentName.split(" ")[0],
                email: studentEmail,
                tempPassword,
              }),
            });
            results.studentEmailSent = true;
          } catch (e) {
            results.studentEmailError = e instanceof Error ? e.message : String(e);
            results.studentTempPassword = tempPassword;
          }
        } else {
          results.studentEmailSent    = false;
          results.studentTempPassword = tempPassword;
          results.studentNote         = "RESEND_API_KEY not configured — share credentials manually.";
        }
      } else {
        results.studentError = "No student auth account found for this student.";
      }
    }
  }

  // ── PARENT ─────────────────────────────────────────────────────────
  if (which === "parent" || which === "both") {
    if (!parentEmail) {
      results.parentError = "No parent email provided";
    } else {
      const tempPassword = generateTempPassword();

      // Find parent auth account (is_parent flag, or second linked profile)
      let parentAuthId: string | null = null;
      let currentParentEmail: string | null = null;

      for (const authId of linkedIds) {
        const u = allUsers.find((x) => x.id === authId);
        if (u?.user_metadata?.is_parent) {
          parentAuthId = authId;
          currentParentEmail = u.email ?? null;
          break;
        }
      }
      // Fallback: pick second linked profile if exists
      if (!parentAuthId && linkedIds.length > 1) {
        const studentAuthId2 = linkedIds.find((id) => !allUsers.find((u) => u.id === id)?.user_metadata?.is_parent);
        const otherId = linkedIds.find((id) => id !== studentAuthId2);
        if (otherId) {
          parentAuthId = otherId;
          currentParentEmail = allUsers.find((u) => u.id === otherId)?.email ?? null;
        }
      }
      // Fallback: match by email in auth
      if (!parentAuthId) {
        const u = allUsers.find((x) => x.email?.toLowerCase() === parentEmail.toLowerCase());
        if (u) { parentAuthId = u.id; currentParentEmail = u.email ?? null; }
      }

      if (parentAuthId) {
        // Update existing account
        const updatePayload: Record<string, unknown> = {
          password: tempPassword,
          user_metadata: { force_password_reset: true, is_parent: true, full_name: parentName },
        };
        if (parentEmail.toLowerCase() !== (currentParentEmail ?? "").toLowerCase()) {
          updatePayload.email         = parentEmail;
          updatePayload.email_confirm = true;
          await admin.from("students").update({ parent_email: parentEmail }).eq("id", studentId);
        }
        await admin.auth.admin.updateUserById(parentAuthId, updatePayload);
        await admin.from("profiles").update({ force_password_reset: true }).eq("id", parentAuthId);
      } else {
        // No parent account exists — create one
        const { data: newAuth, error: createErr } = await admin.auth.admin.createUser({
          email:         parentEmail,
          password:      tempPassword,
          email_confirm: true,
          user_metadata: { role: "student", full_name: parentName, force_password_reset: true, is_parent: true },
        });
        if (createErr) {
          results.parentError = `Could not create parent account: ${createErr.message}`;
        } else {
          parentAuthId = newAuth.user.id;
          await admin.from("profiles")
            .update({ linked_id: studentId, role: "student", force_password_reset: true })
            .eq("id", parentAuthId);
          await admin.from("students").update({ parent_email: parentEmail }).eq("id", studentId);
        }
      }

      if (parentAuthId && !results.parentError) {
        if (resend) {
          try {
            await resend.emails.send({
              from:    FROM,
              to:      [parentEmail],
              subject: "Welcome to MetaMinds STEM Academy",
              html:    parentWelcomeHtml({
                parentFirstName: parentName.split(" ")[0],
                parentEmail,
                tempPassword,
                studentName,
              }),
            });
            results.parentEmailSent = true;
          } catch (e) {
            results.parentEmailError = e instanceof Error ? e.message : String(e);
            results.parentTempPassword = tempPassword;
          }
        } else {
          results.parentEmailSent    = false;
          results.parentTempPassword = tempPassword;
          results.parentNote         = "RESEND_API_KEY not configured — share credentials manually.";
        }
      }
    }
  }

  return NextResponse.json({ success: true, results });
}
