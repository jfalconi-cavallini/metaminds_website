import type { SupabaseClient } from "@supabase/supabase-js";

export type EmailType =
  | "session_confirmation"
  | "session_reminder"
  | "homework_reminder"
  | "parent_update"
  | "welcome_student"
  | "welcome_parent"
  | "test";

/** Records an outbound email after a Resend send attempt, so admins/tutors
 *  can confirm it went out and see exactly what was sent. Call with a
 *  service-role client (API routes only — never from the browser).
 *  Never throws: a logging failure shouldn't take down the email flow. */
export async function logEmail(
  admin: SupabaseClient,
  payload: {
    emailType:        EmailType;
    recipients:       string[];
    subject:          string;
    html:             string;
    relatedStudentId?: number;
    relatedTutorId?:   number;
    status?:           "sent" | "failed";
    error?:            string;
  },
): Promise<void> {
  try {
    await admin.from("email_log").insert({
      email_type:         payload.emailType,
      recipients:         payload.recipients,
      subject:            payload.subject,
      html:               payload.html,
      related_student_id: payload.relatedStudentId ?? null,
      related_tutor_id:   payload.relatedTutorId   ?? null,
      status:             payload.status ?? "sent",
      error:              payload.error ?? null,
    });
  } catch (err) {
    console.error("[logEmail] failed to record sent email", err);
  }
}
