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

function studentWelcomeHtml({
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
            <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#111827;">Welcome to MetaMinds, ${firstName}!</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">Your account has been created. Use the credentials below to sign in for the first time.</p>

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
              <li>Schedule tutoring sessions</li>
              <li>View and submit homework</li>
              <li>Read session notes from your tutor</li>
              <li>Track your progress</li>
              <li>Access learning resources</li>
            </ul>

            <p style="margin:0;font-size:14px;color:#6b7280;">We&apos;re excited to work with you!</p>
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

function parentWelcomeHtml({
  parentFirstName, parentEmail, tempPassword, studentName,
}: {
  parentFirstName: string;
  parentEmail: string;
  tempPassword: string;
  studentName: string;
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
            <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#111827;">Welcome to MetaMinds, ${parentFirstName}!</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
              Your student <strong>${studentName}</strong>&apos;s MetaMinds account has been created.
              A separate parent account has also been set up for you so you can monitor their progress.
            </p>

            <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:20px;margin:0 0 20px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#6d28d9;text-transform:uppercase;letter-spacing:.05em;">Parent Login Details</p>
              <p style="margin:0 0 6px;font-size:14px;color:#5b21b6;">
                <strong>Portal:</strong>&nbsp;
                <a href="${loginUrl}" style="color:#7c3aed;text-decoration:none;">${loginUrl}</a>
              </p>
              <p style="margin:0 0 6px;font-size:14px;color:#5b21b6;"><strong>Email:</strong>&nbsp;${parentEmail}</p>
              <p style="margin:0;font-size:14px;color:#5b21b6;"><strong>Temporary Password:</strong>&nbsp;<span style="font-family:monospace;background:#ede9fe;padding:2px 6px;border-radius:4px;">${tempPassword}</span></p>
            </div>

            <div style="background:#fffbeb;border-left:3px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:0 0 24px;">
              <p style="margin:0;font-size:13px;color:#92400e;">After signing in you&apos;ll be prompted to create your own password.</p>
            </div>

            <p style="margin:0 0 10px;font-size:14px;font-weight:600;color:#111827;">Your dashboard lets you monitor:</p>
            <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#4b5563;line-height:2;">
              <li>Your student&apos;s upcoming sessions and progress</li>
              <li>Homework assignments and submissions</li>
              <li>Weekly tutor updates</li>
              <li>Remaining tutoring hours</li>
            </ul>

            <p style="margin:0;font-size:14px;color:#6b7280;">Thank you for choosing MetaMinds!</p>
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
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" }, { status: 500 });
  }

  // Verify caller is an authenticated admin
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = adminClient();

  const { data: { user: caller } } = await admin.auth.getUser(token);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: callerProfile } = await admin
    .from("profiles").select("role").eq("id", caller.id).single();
  if (callerProfile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }

  const body = await request.json() as {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    grade: string;
    school?: string;
    graduationYear?: string;
    parentName: string;
    parentEmail: string;
    parentPhone?: string;
    packageHours: number;
    packageExpiry: string;
    tutorId?: number;
    courseIds: number[];
    status?: string;
  };

  const {
    firstName, lastName, email, phone,
    grade, school, graduationYear,
    parentName, parentEmail, parentPhone,
    packageHours, packageExpiry,
    tutorId, courseIds, status = "active",
  } = body;

  if (!firstName || !lastName || !email || !grade || !parentName || !parentEmail || !packageExpiry) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const studentName = `${firstName} ${lastName}`.trim();
  const studentTempPassword = generateTempPassword();
  const sameEmail = parentEmail.toLowerCase() === email.toLowerCase();
  const parentTempPassword = sameEmail ? studentTempPassword : generateTempPassword();

  const results = {
    studentCreated:     false,
    studentAuthCreated: false,
    parentAuthCreated:  false,
    packageAssigned:    false,
    tutorAssigned:      false,
    coursesEnrolled:    false,
    studentEmailSent:   false,
    parentEmailSent:    false,
    errors:             [] as string[],
  };

  // ── 1. Create student DB record ──────────────────────────────────
  let studentId: number | null = null;

  const studentInsert: Record<string, unknown> = {
    name:             studentName,
    email:            email.trim(),
    grade:            grade.trim(),
    phone:            phone         || null,
    parent_name:      parentName    || null,
    parent_email:     parentEmail   || null,
    parent_phone:     parentPhone   || null,
    school:           school        || null,
    graduation_year:  graduationYear || null,
    assigned_tutor_id: tutorId      || null,
  };

  // status column added in migration 014 — include it if the value is not default
  if (status !== "active") studentInsert.status = status;

  const { data: studentRow, error: studentError } = await admin
    .from("students")
    .insert(studentInsert)
    .select()
    .single();

  if (studentError) {
    // Retry without status column if migration hasn't run yet
    if (studentError.message.includes("column") && studentError.message.includes("status")) {
      delete studentInsert.status;
      const retry = await admin.from("students").insert(studentInsert).select().single();
      if (retry.error) {
        return NextResponse.json({ error: `Student creation failed: ${retry.error.message}`, results }, { status: 500 });
      }
      studentId = retry.data.id;
    } else {
      return NextResponse.json({ error: `Student creation failed: ${studentError.message}`, results }, { status: 500 });
    }
  } else {
    studentId = studentRow.id;
  }

  results.studentCreated = true;
  if (tutorId) results.tutorAssigned = true;

  // ── 2. Create student Supabase Auth account ──────────────────────
  // Look up existing user first to avoid "already registered" error
  const { data: existingStudentList } = await admin.auth.admin.listUsers();
  const existingStudentUser = existingStudentList?.users.find(
    (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
  );

  let studentAuthId: string | null = null;

  if (existingStudentUser) {
    // Email already in Auth — reuse and re-link
    studentAuthId = existingStudentUser.id;
    await admin.auth.admin.updateUserById(existingStudentUser.id, {
      password: studentTempPassword,
      user_metadata: { role: "student", full_name: studentName, force_password_reset: true },
    });
    results.errors.push("Student login: email already existed — credentials reset and re-linked.");
  } else {
    const { data: studentAuth, error: studentAuthError } = await admin.auth.admin.createUser({
      email:         email.trim(),
      password:      studentTempPassword,
      email_confirm: true,
      user_metadata: {
        role:                 "student",
        full_name:            studentName,
        force_password_reset: true,
      },
    });
    if (studentAuthError) {
      results.errors.push(`Student login: ${studentAuthError.message}`);
    } else {
      studentAuthId = studentAuth.user.id;
    }
  }

  if (studentAuthId) {
    const { error: profileErr } = await admin
      .from("profiles")
      .update({ linked_id: studentId, role: "student", force_password_reset: true })
      .eq("id", studentAuthId);
    if (profileErr) {
      results.errors.push(`Student profile link: ${profileErr.message}`);
    } else {
      results.studentAuthCreated = true;
    }
  }

  // ── 3. Create package ────────────────────────────────────────────
  const { error: pkgError } = await admin.from("user_packages").insert({
    student_id:  studentId,
    total_hours: Number(packageHours),
    hours_used:  0,
    expires_at:  packageExpiry,
  });

  if (pkgError) {
    results.errors.push(`Package: ${pkgError.message}`);
  } else {
    results.packageAssigned = true;
  }

  // ── 3b. Enroll in course offerings ───────────────────────────────
  if (courseIds && courseIds.length > 0) {
    const { error: enrollError } = await admin.from("student_course_enrollments").insert(
      courseIds.map((courseId) => ({ student_id: studentId, course_id: courseId }))
    );
    if (enrollError) {
      results.errors.push(`Course enrollment: ${enrollError.message}`);
    } else {
      results.coursesEnrolled = true;
    }
  } else {
    results.coursesEnrolled = true; // nothing to enroll — not an error
  }

  // ── 4. Create parent Supabase Auth account (if different email) ──
  if (!sameEmail) {
    const existingParentUser = existingStudentList?.users.find(
      (u) => u.email?.toLowerCase() === parentEmail.trim().toLowerCase()
    );

    let parentAuthId: string | null = null;

    if (existingParentUser) {
      parentAuthId = existingParentUser.id;
      await admin.auth.admin.updateUserById(existingParentUser.id, {
        password: parentTempPassword,
        user_metadata: { role: "parent", full_name: parentName, force_password_reset: true, is_parent: true },
      });
      results.errors.push("Parent login: email already existed — credentials reset and re-linked.");
    } else {
      const { data: parentAuth, error: parentAuthError } = await admin.auth.admin.createUser({
        email:         parentEmail.trim(),
        password:      parentTempPassword,
        email_confirm: true,
        user_metadata: {
          role:                 "parent",
          full_name:            parentName,
          force_password_reset: true,
          is_parent:            true,
        },
      });
      if (parentAuthError) {
        results.errors.push(`Parent login: ${parentAuthError.message}`);
      } else {
        parentAuthId = parentAuth.user.id;
      }
    }

    if (parentAuthId) {
      const { error: parentProfileErr } = await admin
        .from("profiles")
        .update({ linked_id: studentId, role: "parent", force_password_reset: true })
        .eq("id", parentAuthId);
      if (parentProfileErr) {
        results.errors.push(`Parent profile link: ${parentProfileErr.message}`);
      } else {
        results.parentAuthCreated = true;
      }
    }
  } else {
    results.parentAuthCreated = true;
  }

  // ── 5. Send welcome emails ───────────────────────────────────────
  const apiKey = process.env.RESEND_API_KEY;
  const FROM   = process.env.RESEND_FROM_EMAIL ?? "welcome@metamindsstemacademy.com";

  if (apiKey && !apiKey.startsWith("re_placeholder")) {
    const resend = new Resend(apiKey);

    // Student email
    try {
      await resend.emails.send({
        from:    FROM,
        to:      [email.trim()],
        subject: "Welcome to MetaMinds STEM Academy!",
        html:    studentWelcomeHtml({ firstName, email: email.trim(), tempPassword: studentTempPassword }),
      });
      results.studentEmailSent = true;
    } catch (e) {
      results.errors.push(`Student email: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Parent email (skip if same address — student email already sent)
    if (!sameEmail) {
      try {
        await resend.emails.send({
          from:    FROM,
          to:      [parentEmail.trim()],
          subject: "Welcome to MetaMinds STEM Academy",
          html:    parentWelcomeHtml({
            parentFirstName: parentName.split(" ")[0],
            parentEmail:     parentEmail.trim(),
            tempPassword:    parentTempPassword,
            studentName,
          }),
        });
        results.parentEmailSent = true;
      } catch (e) {
        results.errors.push(`Parent email: ${e instanceof Error ? e.message : String(e)}`);
      }
    } else {
      results.parentEmailSent = true;
    }
  } else {
    results.errors.push("RESEND_API_KEY not configured — emails skipped. Share credentials manually.");
  }

  return NextResponse.json({
    studentId,
    studentName,
    studentEmail:        email.trim(),
    studentTempPassword,
    parentTempPassword:  sameEmail ? null : parentTempPassword,
    results,
  });
}
