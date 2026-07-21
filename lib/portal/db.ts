import { supabase } from "@/lib/supabase";
import type { Student, Tutor, Session, HoursBalance, TutorAvailability, SessionNote, Homework, BlockedDate, ParentUpdate, BlockedSlot, PurchaseRequest } from "./types";

// ── TYPE MAPPERS ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToStudent(r: any): Student {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    grade: r.grade,
    subjects: r.subjects ?? [],
    assignedTutorId: r.assigned_tutor_id ?? null,
    archived: r.archived ?? false,
    phone:       r.phone ?? undefined,
    parentName:  r.parent_name ?? undefined,
    parentEmail: r.parent_email ?? undefined,
    parentPhone:    r.parent_phone    ?? undefined,
    notes:          r.notes           ?? undefined,
    allowInPerson:  r.allow_in_person ?? false,
    school:         r.school          ?? undefined,
    graduationYear: r.graduation_year ?? undefined,
    status:         r.status          ?? "active",
    successPlan:    r.success_plan    ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTutorBase(r: any) {
  return {
    id: r.id as number,
    name: r.name as string,
    email: r.email as string,
    subjects: (r.subjects ?? []) as string[],
    bookingLeadHours: (r.booking_lead_hours ?? 24) as number,
    archived: (r.archived ?? false) as boolean,
    phone:    r.phone     as string | undefined ?? undefined,
    bio:      r.bio       as string | undefined ?? undefined,
    photoUrl: r.photo_url as string | undefined ?? undefined,
    zoomLink: r.zoom_link as string | undefined ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSession(r: any): Session {
  return {
    id: r.id,
    studentId: r.student_id,
    tutorId: r.tutor_id,
    subject: r.subject,
    date: r.session_date,
    time: r.session_time,
    durationHours: Number(r.duration_hours),
    status: r.status,
    sessionType: r.session_type ?? "online",
    zoomLink: r.zoom_link ?? undefined,
    notes: r.notes ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToNote(r: any): SessionNote {
  return {
    id: r.id,
    sessionId: r.session_id ?? null,
    tutorId: r.tutor_id,
    studentId: r.student_id,
    topic: r.topic,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToHomework(r: any): Homework {
  return {
    id: r.id,
    studentId: r.student_id,
    tutorId: r.tutor_id,
    task: r.task,
    assignedDate: r.assigned_date,
    dueDate: r.due_date ?? null,
    status: r.status,
    createdAt: r.created_at,
    submissionUrl:      r.submission_url      ?? undefined,
    submissionFilename: r.submission_filename ?? undefined,
    submittedAt:        r.submitted_at        ?? undefined,
    grade:              r.grade               ?? undefined,
    feedback:           r.feedback            ?? undefined,
    feedbackAt:         r.feedback_at         ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToBalance(r: any): HoursBalance {
  const total = Number(r.total_hours);
  const used  = Number(r.hours_used);
  return {
    studentId:      r.student_id,
    totalPurchased: total,
    totalUsed:      used,
    remaining:      total - used,
    expiresAt:      r.expires_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToAvailability(r: any): TutorAvailability {
  return {
    id:         r.id,
    tutorId:    r.tutor_id,
    dayOfWeek:  r.day_of_week,
    startTime:  r.start_time,
    endTime:    r.end_time,
  };
}

// ── STUDENTS ──────────────────────────────────────────────────────────────────

export async function fetchStudents(opts?: { all?: boolean }): Promise<Student[]> {
  let q = supabase.from("students").select("*").order("name");
  if (!opts?.all) q = q.eq("archived", false);
  const { data, error } = await q;
  if (error) {
    // archived column may not exist yet (migration 007 pending) — fall back to all rows
    const { data: fallback, error: fe } = await supabase.from("students").select("*").order("name");
    if (fe) throw fe;
    return fallback.map(rowToStudent);
  }
  return data.map(rowToStudent);
}

export async function fetchStudentById(id: number): Promise<Student | null> {
  const { data, error } = await supabase.from("students").select("*").eq("id", id).single();
  if (error) return null;
  return rowToStudent(data);
}

// ── TUTORS ────────────────────────────────────────────────────────────────────

export async function fetchTutors(opts?: { all?: boolean }): Promise<Tutor[]> {
  let tq = supabase.from("tutors").select("*").order("name");
  if (!opts?.all) tq = tq.eq("archived", false);
  const [tutorResult, studentResult] = await Promise.all([
    tq,
    supabase.from("students").select("id, assigned_tutor_id"),
  ]);
  // archived column may not exist yet (migration 007 pending) — fall back to all rows
  const tutorRows = tutorResult.error
    ? (await supabase.from("tutors").select("*").order("name")).data ?? []
    : tutorResult.data ?? [];
  const studentRows = studentResult.data ?? [];
  return tutorRows.map((t) => ({
    ...rowToTutorBase(t),
    assignedStudentIds: studentRows
      .filter((s) => s.assigned_tutor_id === t.id)
      .map((s) => s.id),
  }));
}

export async function fetchTutorById(id: number): Promise<Tutor | null> {
  const [{ data: t, error: te }, { data: studentRows }] = await Promise.all([
    supabase.from("tutors").select("*").eq("id", id).single(),
    supabase.from("students").select("id").eq("assigned_tutor_id", id),
  ]);
  if (te) return null;
  return {
    ...rowToTutorBase(t),
    assignedStudentIds: (studentRows ?? []).map((s) => s.id),
  };
}

// ── SESSIONS ──────────────────────────────────────────────────────────────────

export async function fetchSessions(): Promise<Session[]> {
  const { data, error } = await supabase
    .from("sessions").select("*").order("session_date", { ascending: false });
  if (error) throw error;
  return data.map(rowToSession);
}

export async function fetchSessionsByStudent(studentId: number): Promise<Session[]> {
  const { data, error } = await supabase
    .from("sessions").select("*").eq("student_id", studentId).order("session_date");
  if (error) throw error;
  return data.map(rowToSession);
}

export async function fetchSessionsByTutor(tutorId: number): Promise<Session[]> {
  const { data, error } = await supabase
    .from("sessions").select("*").eq("tutor_id", tutorId).order("session_date");
  if (error) throw error;
  return data.map(rowToSession);
}

export async function insertSession(payload: {
  studentId: number; tutorId: number; subject: string;
  sessionDate: string; sessionTime: string; durationHours: number;
  sessionType: "online" | "in-person"; notes?: string;
}): Promise<Session> {
  // book_session is a single Postgres transaction: it re-checks lead
  // time, cancel/double-booking races, and remaining hours server-side,
  // then writes the session and deducts hours together or not at all.
  const { data, error } = await supabase.rpc("book_session", {
    p_student_id:      payload.studentId,
    p_tutor_id:        payload.tutorId,
    p_subject:         payload.subject,
    p_session_date:    payload.sessionDate,
    p_session_time:    payload.sessionTime,
    p_duration_hours:  payload.durationHours,
    p_session_type:    payload.sessionType,
    p_notes:           payload.notes ?? null,
  }).single();
  if (error) throw error;
  return rowToSession(data);
}

// Direct insert for past/completed sessions — bypasses book_session lead-time checks.
// Deducts hours from user_packages inline.
export async function logCompletedSession(payload: {
  studentId: number; tutorId: number; subject: string;
  sessionDate: string; sessionTime: string; durationHours: number;
  sessionType: "online" | "in-person";
}): Promise<Session> {
  const { data, error } = await supabase
    .from("sessions")
    .insert({
      student_id:    payload.studentId,
      tutor_id:      payload.tutorId,
      subject:       payload.subject,
      session_date:  payload.sessionDate,
      session_time:  payload.sessionTime,
      duration_hours: payload.durationHours,
      session_type:  payload.sessionType,
      status:        "completed",
    })
    .select()
    .single();
  if (error) throw error;

  // Deduct hours from the student's active package
  const { data: pkg } = await supabase
    .from("user_packages")
    .select("id, hours_used")
    .eq("student_id", payload.studentId)
    .order("expires_at", { ascending: false })
    .limit(1)
    .single();
  if (pkg) {
    await supabase
      .from("user_packages")
      .update({ hours_used: Number(pkg.hours_used) + payload.durationHours })
      .eq("id", pkg.id);
  }

  return rowToSession(data);
}

export async function cancelSession(sessionId: number): Promise<void> {
  // cancel_session re-checks the 48-hour lock server-side and restores
  // hours in the same transaction as the status update.
  const { error } = await supabase.rpc("cancel_session", { p_session_id: sessionId });
  if (error) throw error;
}

export async function updateTutorLeadTime(tutorId: number, hours: number): Promise<void> {
  const { error } = await supabase
    .from("tutors")
    .update({ booking_lead_hours: hours })
    .eq("id", tutorId);
  if (error) throw error;
}

// ── SESSION REQUESTS ──────────────────────────────────────────────────────────

export async function insertSessionRequest(payload: {
  studentId: number; subject: string;
  requestedDate: string; requestedTime: string; notes?: string;
  sessionType: "online" | "in-person";
}): Promise<void> {
  const { error } = await supabase.from("session_requests").insert({
    student_id:     payload.studentId,
    subject:        payload.subject,
    requested_date: payload.requestedDate,
    requested_time: payload.requestedTime,
    notes:          payload.notes ?? null,
    session_type:   payload.sessionType,
  });
  if (error) throw error;
}

// ── PACKAGES ──────────────────────────────────────────────────────────────────

export async function fetchPackageByStudent(studentId: number): Promise<HoursBalance | null> {
  const { data, error } = await supabase
    .from("user_packages")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (error) return null;
  return rowToBalance(data);
}

export async function fetchAllPackages(): Promise<HoursBalance[]> {
  const { data, error } = await supabase.from("user_packages").select("*");
  if (error) throw error;
  return data.map(rowToBalance);
}

// ── PURCHASE REQUESTS ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPurchaseRequest(r: any): PurchaseRequest {
  return {
    id:           r.id,
    studentId:    r.student_id,
    packageLabel: r.package_label,
    hours:        Number(r.hours),
    price:        Number(r.price),
    status:       r.status,
    createdAt:    r.created_at,
  };
}

export async function insertPurchaseRequest(payload: {
  studentId: number; packageLabel: string; hours: number; price: number;
}): Promise<PurchaseRequest> {
  const { data, error } = await supabase.from("purchase_requests").insert({
    student_id:    payload.studentId,
    package_label: payload.packageLabel,
    hours:         payload.hours,
    price:         payload.price,
  }).select().single();
  if (error) throw error;
  return rowToPurchaseRequest(data);
}

export async function fetchPendingPurchaseRequests(): Promise<PurchaseRequest[]> {
  const { data, error } = await supabase
    .from("purchase_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data.map(rowToPurchaseRequest);
}

export async function resolvePurchaseRequest(
  id: number,
  status: "fulfilled" | "dismissed",
): Promise<void> {
  const { error } = await supabase
    .from("purchase_requests")
    .update({ status, resolved_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// ── TUTOR AVAILABILITY ────────────────────────────────────────────────────────

export async function fetchTutorAvailability(tutorId: number): Promise<TutorAvailability[]> {
  const { data, error } = await supabase
    .from("tutor_availability")
    .select("*")
    .eq("tutor_id", tutorId)
    .order("day_of_week");
  if (error) throw error;
  return data.map(rowToAvailability);
}

export async function upsertTutorAvailability(
  tutorId: number,
  slots: { dayOfWeek: number; startTime: string; endTime: string }[],
): Promise<void> {
  const { error: de } = await supabase.from("tutor_availability").delete().eq("tutor_id", tutorId);
  if (de) throw de;
  if (slots.length === 0) return;
  const { error } = await supabase.from("tutor_availability").insert(
    slots.map((s) => ({
      tutor_id:    tutorId,
      day_of_week: s.dayOfWeek,
      start_time:  s.startTime,
      end_time:    s.endTime,
    })),
  );
  if (error) throw error;
}

// ── SESSION NOTES ─────────────────────────────────────────────────────────────

export async function fetchSessionNotes(studentId: number): Promise<SessionNote[]> {
  const { data, error } = await supabase
    .from("session_notes")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(rowToNote);
}

export async function fetchSessionNotesByTutor(tutorId: number): Promise<SessionNote[]> {
  const { data, error } = await supabase
    .from("session_notes")
    .select("*")
    .eq("tutor_id", tutorId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(rowToNote);
}

export async function insertSessionNote(payload: {
  tutorId: number; studentId: number; topic: string; notes: string; sessionId?: number;
}): Promise<SessionNote> {
  const { data, error } = await supabase.from("session_notes").insert({
    tutor_id:   payload.tutorId,
    student_id: payload.studentId,
    topic:      payload.topic,
    notes:      payload.notes,
    session_id: payload.sessionId ?? null,
  }).select().single();
  if (error) throw error;
  return rowToNote(data);
}

export async function updateSessionNote(
  noteId: number,
  topic: string,
  notes: string,
): Promise<SessionNote> {
  const { data, error } = await supabase
    .from("session_notes")
    .update({ topic, notes })
    .eq("id", noteId)
    .select()
    .single();
  if (error) throw error;
  return rowToNote(data);
}

export async function deleteSessionNote(noteId: number): Promise<void> {
  const { error } = await supabase.from("session_notes").delete().eq("id", noteId);
  if (error) throw error;
}

// ── HOMEWORK ──────────────────────────────────────────────────────────────────

export async function fetchHomework(studentId: number): Promise<Homework[]> {
  const { data, error } = await supabase
    .from("homework")
    .select("*")
    .eq("student_id", studentId)
    .order("due_date", { ascending: true });
  if (error) throw error;
  return data.map(rowToHomework);
}

export async function fetchHomeworkByTutor(tutorId: number): Promise<Homework[]> {
  const { data, error } = await supabase
    .from("homework")
    .select("*")
    .eq("tutor_id", tutorId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(rowToHomework);
}

export async function submitHomework(
  id: number,
  submissionUrl: string,
  submissionFilename: string,
): Promise<Homework> {
  const { data, error } = await supabase
    .from("homework")
    .update({
      status: "submitted",
      submission_url:      submissionUrl,
      submission_filename: submissionFilename,
      submitted_at:        new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return rowToHomework(data);
}

export async function addHomeworkFeedback(
  id: number,
  feedback: string,
  grade?: string,
): Promise<Homework> {
  const { data, error } = await supabase
    .from("homework")
    .update({
      feedback,
      feedback_at: new Date().toISOString(),
      grade:       grade ?? null,
      status:      "completed",
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return rowToHomework(data);
}

export async function markHomeworkComplete(id: number): Promise<Homework> {
  const { data, error } = await supabase
    .from("homework")
    .update({ status: "completed" })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return rowToHomework(data);
}

export async function insertHomework(payload: {
  studentId: number; tutorId: number; task: string; dueDate?: string;
}): Promise<Homework> {
  const { data, error } = await supabase.from("homework").insert({
    student_id:    payload.studentId,
    tutor_id:      payload.tutorId,
    task:          payload.task,
    assigned_date: new Date().toISOString().slice(0, 10),
    due_date:      payload.dueDate ?? null,
  }).select().single();
  if (error) throw error;
  return rowToHomework(data);
}

// ── ZOOM LINK ─────────────────────────────────────────────────────────────────

export async function updateSession(id: number, payload: {
  sessionDate?: string;
  sessionTime?: string;
  durationHours?: number;
  subject?: string;
  sessionType?: "online" | "in-person";
}): Promise<Session> {
  const update: Record<string, unknown> = {};
  if (payload.sessionDate   !== undefined) update.session_date   = payload.sessionDate;
  if (payload.sessionTime   !== undefined) update.session_time   = payload.sessionTime;
  if (payload.durationHours !== undefined) update.duration_hours = payload.durationHours;
  if (payload.subject       !== undefined) update.subject        = payload.subject;
  if (payload.sessionType   !== undefined) update.session_type   = payload.sessionType;
  const { data, error } = await supabase.from("sessions").update(update).eq("id", id).select().single();
  if (error) throw error;
  return rowToSession(data);
}

export async function updateSessionZoomLink(sessionId: number, zoomLink: string): Promise<void> {
  const { error } = await supabase
    .from("sessions")
    .update({ zoom_link: zoomLink || null })
    .eq("id", sessionId);
  if (error) throw error;
}

// ── ARCHIVE / RESTORE ─────────────────────────────────────────────────────────

export async function archiveStudent(id: number): Promise<void> {
  const { error } = await supabase.from("students").update({ archived: true }).eq("id", id);
  if (error) throw error;
}

export async function restoreStudent(id: number): Promise<void> {
  const { error } = await supabase.from("students").update({ archived: false }).eq("id", id);
  if (error) throw error;
}

export async function archiveTutor(id: number): Promise<void> {
  const { error } = await supabase.from("tutors").update({ archived: true }).eq("id", id);
  if (error) throw error;
}

export async function restoreTutor(id: number): Promise<void> {
  const { error } = await supabase.from("tutors").update({ archived: false }).eq("id", id);
  if (error) throw error;
}

// ── ADMIN: CREATE / ASSIGN ────────────────────────────────────────────────────

export async function createStudent(payload: {
  name: string; email: string; grade: string; subjects: string[];
  phone?: string; parentName?: string; parentEmail?: string; parentPhone?: string;
  school?: string; graduationYear?: string; status?: string; assignedTutorId?: number;
}): Promise<Student> {
  const { data, error } = await supabase.from("students").insert({
    name:               payload.name,
    email:              payload.email,
    grade:              payload.grade,
    subjects:           payload.subjects,
    phone:              payload.phone              ?? null,
    parent_name:        payload.parentName         ?? null,
    parent_email:       payload.parentEmail        ?? null,
    parent_phone:       payload.parentPhone        ?? null,
    school:             payload.school             ?? null,
    graduation_year:    payload.graduationYear     ?? null,
    status:             payload.status             ?? "active",
    assigned_tutor_id:  payload.assignedTutorId    ?? null,
  }).select().single();
  if (error) throw error;
  return rowToStudent(data);
}

export async function createTutor(payload: {
  name: string; email: string; subjects: string[];
}): Promise<Tutor> {
  const { data, error } = await supabase.from("tutors").insert({
    name:     payload.name,
    email:    payload.email,
    subjects: payload.subjects,
    booking_lead_hours: 24,
  }).select().single();
  if (error) throw error;
  return { ...rowToTutorBase(data), assignedStudentIds: [] };
}

export async function assignStudentToTutor(studentId: number, tutorId: number | null): Promise<void> {
  const { error } = await supabase
    .from("students")
    .update({ assigned_tutor_id: tutorId })
    .eq("id", studentId);
  if (error) throw error;
}

// ── ADMIN: PACKAGE HOURS ──────────────────────────────────────────────────────

export async function addPackageHours(
  studentId: number,
  hoursToAdd: number,
  expiresAt: string,
): Promise<HoursBalance> {
  // Try to update existing package first
  const { data: existing } = await supabase
    .from("user_packages")
    .select("id, total_hours, hours_used")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    const newTotal = Number(existing.total_hours) + hoursToAdd;
    const { data, error } = await supabase
      .from("user_packages")
      .update({ total_hours: newTotal, expires_at: expiresAt })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return rowToBalance(data);
  }

  // No existing package — create one
  const { data, error } = await supabase.from("user_packages").insert({
    student_id:  studentId,
    total_hours: hoursToAdd,
    hours_used:  0,
    expires_at:  expiresAt,
  }).select().single();
  if (error) throw error;
  return rowToBalance(data);
}

// ── PROFILE UPDATES ───────────────────────────────────────────────────────────

export async function updateStudentProfile(id: number, payload: Partial<{
  name: string; email: string; grade: string; subjects: string[];
  phone: string; parentName: string; parentEmail: string; parentPhone: string; notes: string;
  allowInPerson: boolean; successPlan: string;
}>): Promise<Student> {
  const update: Record<string, unknown> = {};
  if (payload.name          !== undefined) update.name           = payload.name;
  if (payload.email         !== undefined) update.email          = payload.email;
  if (payload.grade         !== undefined) update.grade          = payload.grade;
  if (payload.subjects      !== undefined) update.subjects       = payload.subjects;
  if (payload.phone         !== undefined) update.phone          = payload.phone;
  if (payload.parentName    !== undefined) update.parent_name    = payload.parentName;
  if (payload.parentEmail   !== undefined) update.parent_email   = payload.parentEmail;
  if (payload.parentPhone   !== undefined) update.parent_phone   = payload.parentPhone;
  if (payload.notes         !== undefined) update.notes          = payload.notes;
  if (payload.allowInPerson !== undefined) update.allow_in_person = payload.allowInPerson;
  if (payload.successPlan   !== undefined) update.success_plan   = payload.successPlan || null;
  const { data, error } = await supabase.from("students").update(update).eq("id", id).select().single();
  if (error) throw error;
  return rowToStudent(data);
}

export async function updateTutorProfile(id: number, payload: Partial<{
  name: string; email: string; subjects: string[]; phone: string; bio: string; photoUrl: string; zoomLink: string;
}>): Promise<Tutor> {
  const update: Record<string, unknown> = {};
  if (payload.name     !== undefined) update.name      = payload.name;
  if (payload.email    !== undefined) update.email     = payload.email;
  if (payload.subjects !== undefined) update.subjects  = payload.subjects;
  if (payload.phone    !== undefined) update.phone     = payload.phone;
  if (payload.bio      !== undefined) update.bio       = payload.bio;
  if (payload.photoUrl !== undefined) update.photo_url = payload.photoUrl || null;
  if (payload.zoomLink !== undefined) update.zoom_link = payload.zoomLink || null;
  const { data, error } = await supabase.from("tutors").update(update).eq("id", id).select().single();
  if (error) throw error;
  const { data: studs } = await supabase.from("students").select("id").eq("assigned_tutor_id", id);
  return { ...rowToTutorBase(data), assignedStudentIds: (studs ?? []).map((s: { id: number }) => s.id) };
}

// ── BLOCKED DATES ──────────────────────────────────────────────────────────────

interface BlockedDateRow {
  id: number;
  tutor_id: number;
  blocked_date: string;
  reason: string | null;
}

function rowToBlockedDate(r: BlockedDateRow): BlockedDate {
  return {
    id: r.id,
    tutorId: r.tutor_id,
    blockedDate: r.blocked_date,
    reason: r.reason ?? undefined,
  };
}

export async function fetchBlockedDates(tutorId: number): Promise<BlockedDate[]> {
  const { data, error } = await supabase
    .from("tutor_blocked_dates")
    .select("*")
    .eq("tutor_id", tutorId)
    .order("blocked_date");
  if (error) throw error;
  return data.map(rowToBlockedDate);
}

export async function addBlockedDate(tutorId: number, date: string, reason?: string): Promise<BlockedDate> {
  const { data, error } = await supabase
    .from("tutor_blocked_dates")
    .insert({ tutor_id: tutorId, blocked_date: date, reason: reason ?? null })
    .select()
    .single();
  if (error) throw error;
  return rowToBlockedDate(data);
}

export async function removeBlockedDate(id: number): Promise<void> {
  const { error } = await supabase.from("tutor_blocked_dates").delete().eq("id", id);
  if (error) throw error;
}

// ── HOMEWORK COUNT ────────────────────────────────────────────────────────────

export async function countHomeworkByStatus(status: "pending" | "submitted" | "completed"): Promise<number> {
  const { count, error } = await supabase
    .from("homework")
    .select("*", { count: "exact", head: true })
    .eq("status", status);
  if (error) return 0;
  return count ?? 0;
}

// ── SESSION AUTO-COMPLETE ─────────────────────────────────────────────────────

/** Marks any "upcoming" session whose date is in the past as "completed". */
export async function autoCompletePastSessions(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  await supabase
    .from("sessions")
    .update({ status: "completed" })
    .eq("status", "upcoming")
    .lt("session_date", today);
}

// ── PARENT UPDATES ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToParentUpdate(r: any): ParentUpdate {
  return {
    id:         r.id,
    tutorId:    r.tutor_id,
    studentId:  r.student_id,
    message:    r.message,
    createdAt:  r.created_at,
    sessionIds: r.session_ids ?? [],
  };
}

export async function fetchParentUpdatesByStudent(studentId: number): Promise<ParentUpdate[]> {
  const { data, error } = await supabase
    .from("parent_updates")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) return []; // table may not exist yet (migration 010 pending)
  return data.map(rowToParentUpdate);
}

export async function fetchParentUpdatesByTutor(tutorId: number): Promise<ParentUpdate[]> {
  const { data, error } = await supabase
    .from("parent_updates")
    .select("*")
    .eq("tutor_id", tutorId)
    .order("created_at", { ascending: false });
  if (error) return []; // table may not exist yet (migration 010 pending)
  return data.map(rowToParentUpdate);
}

export async function insertParentUpdate(
  tutorId: number,
  studentId: number,
  message: string,
  sessionIds: number[] = [],
): Promise<ParentUpdate> {
  const { data, error } = await supabase
    .from("parent_updates")
    .insert({ tutor_id: tutorId, student_id: studentId, message, session_ids: sessionIds })
    .select()
    .single();
  if (error) throw error;
  return rowToParentUpdate(data);
}

// ── BULK SESSION SCHEDULING ────────────────────────────────────────────────────

export async function bulkInsertSessions(sessions: Array<{
  studentId: number; tutorId: number; subject: string;
  sessionDate: string; sessionTime: string; durationHours: number;
  sessionType: "online" | "in-person"; zoomLink?: string;
}>): Promise<Session[]> {
  // bulk_book_sessions inserts + deducts hours per session inside one
  // transaction, silently skipping any slot that loses a double-booking
  // race rather than aborting the whole batch.
  const payload = sessions.map((s) => ({
    studentId:     s.studentId,
    tutorId:       s.tutorId,
    subject:       s.subject,
    sessionDate:   s.sessionDate,
    sessionTime:   s.sessionTime,
    durationHours: s.durationHours,
    sessionType:   s.sessionType,
    zoomLink:      s.zoomLink ?? null,
  }));
  const { data, error } = await supabase.rpc("bulk_book_sessions", { p_sessions: payload });
  if (error) throw error;
  return (data ?? []).map(rowToSession);
}

// ── BLOCKED SLOTS (per-slot, not full-day) ────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToBlockedSlot(r: any): BlockedSlot {
  return { id: r.id, tutorId: r.tutor_id, slotDate: r.slot_date, slotTime: r.slot_time };
}

export async function fetchBlockedSlots(tutorId: number): Promise<BlockedSlot[]> {
  const { data, error } = await supabase
    .from("blocked_slots")
    .select("*")
    .eq("tutor_id", tutorId);
  if (error) return [];
  return data.map(rowToBlockedSlot);
}

/** Toggles a blocked slot: inserts if absent, deletes if present. Returns true if now blocked. */
export async function toggleBlockedSlot(
  tutorId: number, date: string, time: string,
): Promise<boolean> {
  const { data: existing } = await supabase
    .from("blocked_slots")
    .select("id")
    .eq("tutor_id", tutorId)
    .eq("slot_date", date)
    .eq("slot_time", time)
    .maybeSingle();

  if (existing) {
    await supabase.from("blocked_slots").delete().eq("id", existing.id);
    return false;
  } else {
    await supabase.from("blocked_slots").insert({ tutor_id: tutorId, slot_date: date, slot_time: time });
    return true;
  }
}
