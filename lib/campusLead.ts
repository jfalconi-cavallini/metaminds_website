export const CAMPUS_SOURCES = ["tcu", "smu"] as const;
export type CampusSource = (typeof CAMPUS_SOURCES)[number];

export const CAMPUS_UTM_MEDIUM = "campus_flyer";
export const CAMPUS_LEAD_SUCCESS = "Thanks, we will reach out soon.";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MAX = 120;
const COURSE_MAX = 200;
const EMAIL_MAX = 254;
const PHONE_MAX = 40;

export type SessionFormat = "online" | "in_person";

export type CampusLeadField =
  | "name"
  | "email"
  | "phone"
  | "contact"
  | "course"
  | "sessionFormat"
  | "source";

export type CampusLeadFieldErrors = Partial<Record<CampusLeadField, string>>;

export type NormalizedCampusLead = {
  name: string;
  email: string | null;
  phone: string | null;
  course: string;
  sessionFormat: SessionFormat | null;
  utmSource: CampusSource;
  utmMedium: typeof CAMPUS_UTM_MEDIUM;
};

export type CampusLeadDraft = {
  name: unknown;
  email: unknown;
  phone: unknown;
  course: unknown;
  sessionFormat: unknown;
  source: unknown;
  website: unknown;
};

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function validateCampusLead(
  draft: CampusLeadDraft,
): { ok: true; lead: NormalizedCampusLead } | { ok: false; fieldErrors: CampusLeadFieldErrors } {
  const fieldErrors: CampusLeadFieldErrors = {};
  const name = oneLine(text(draft.name));
  const email = oneLine(text(draft.email));
  const phone = oneLine(text(draft.phone));
  const course = oneLine(text(draft.course));
  const sessionFormat = text(draft.sessionFormat);
  const source = text(draft.source);

  if (!name) fieldErrors.name = "Enter your name.";
  else if (name.length > NAME_MAX) fieldErrors.name = "Name is too long.";

  if (email) {
    if (email.length > EMAIL_MAX || !EMAIL_RE.test(email)) {
      fieldErrors.email = "Enter a valid email.";
    }
  }

  if (phone) {
    const digits = phoneDigits(phone);
    if (phone.length > PHONE_MAX || digits.length < 10 || digits.length > 15) {
      fieldErrors.phone = "Enter a valid phone number.";
    }
  }

  if (!email && !phone) {
    fieldErrors.contact = "Enter an email or a phone number.";
  }

  if (!course) fieldErrors.course = "Enter the class you need a tutor for.";
  else if (course.length > COURSE_MAX) fieldErrors.course = "Course is too long.";

  let format: SessionFormat | null = null;
  if (sessionFormat === "") format = null;
  else if (sessionFormat === "online" || sessionFormat === "in_person") format = sessionFormat;
  else fieldErrors.sessionFormat = "Choose online or in person.";

  const campus: CampusSource | null = source === "tcu" || source === "smu" ? source : null;
  if (!campus) fieldErrors.source = "Unknown campus page.";

  if (Object.keys(fieldErrors).length > 0 || !campus) return { ok: false, fieldErrors };

  return {
    ok: true,
    lead: {
      name,
      email: email || null,
      phone: phone || null,
      course,
      sessionFormat: format,
      utmSource: campus,
      utmMedium: CAMPUS_UTM_MEDIUM,
    },
  };
}

export function isHoneypotTripped(website: unknown): boolean {
  return typeof website === "string" && website.trim().length > 0;
}

/** True when the leads table or a column it needs is not in this database yet. */
export function isMissingLeadStore(error: { code?: string; message?: string }): boolean {
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();
  return (
    code === "42P01" ||
    code === "42703" ||
    code === "PGRST204" ||
    code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("schema cache") ||
    message.includes("could not find")
  );
}
