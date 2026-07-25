import { supabase } from "@/lib/supabase";
import type { Student, Tutor, Session, HoursBalance, TutorAvailability, SessionNote, Homework, BlockedDate, ParentUpdate, BlockedSlot, PurchaseRequest, StudyLog, Course, Module, Lesson, LessonResource, Skill, StudentPlan, StudentPlanLesson, SkillMastery, LessonPackage, CatalogLesson, CatalogCategory, CatalogSection, CourseCatalogFull, StudentPlanLessonFull, StudentPlanFull, SkillBaseline, SkillNode, StudentSkill, StudentSkillStatus, SkillNoteLink, HomeworkSkillLink, VocabularyWord, VocabularyAssignmentConfig, VocabularySubmissionEntry, PracticeTestResult } from "./types";

// ── TYPE MAPPERS ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToStudent(r: any): Student {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    grade: r.grade,
    subjects: r.subjects ?? [],
    programs: r.programs ?? [],
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
    status:                 r.status                   ?? "active",
    successPlan:            r.success_plan             ?? undefined,
    successPlanUrl:         r.success_plan_url         ?? undefined,
    weeklyStudyGoalMinutes: r.weekly_study_goal_minutes ?? 180,
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
    zoomLink:  r.zoom_link        as string | undefined ?? undefined,
    meetingId: r.zoom_meeting_id  as string | undefined ?? undefined,
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
    kamiLink:           r.kami_link            ?? undefined,
    noteDate:           r.note_date            ?? undefined,
    attachmentUrl:      r.attachment_url       ?? undefined,
    attachmentFilename: r.attachment_filename  ?? undefined,
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
    attachmentUrl:      r.attachment_url      ?? undefined,
    attachmentFilename: r.attachment_filename ?? undefined,
    kamiLink:           r.kami_link           ?? undefined,
    estimatedMinutes:   r.estimated_minutes   ?? undefined,
    assignmentType:     r.assignment_type     ?? undefined,
    instructions:       r.instructions        ?? undefined,
    studentTimeMinutes: r.student_time_minutes ?? undefined,
    studentNote:        r.student_note        ?? undefined,
    difficultyRating:   r.difficulty_rating   ?? undefined,
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
  tutorId: number; studentId: number; topic: string; notes: string;
  sessionId?: number; kamiLink?: string; noteDate?: string;
}): Promise<SessionNote> {
  const { data, error } = await supabase.from("session_notes").insert({
    tutor_id:   payload.tutorId,
    student_id: payload.studentId,
    topic:      payload.topic,
    notes:      payload.notes,
    session_id: payload.sessionId ?? null,
    kami_link:  payload.kamiLink  ?? null,
    note_date:  payload.noteDate  ?? null,
  }).select().single();
  if (error) throw error;
  return rowToNote(data);
}

export async function updateSessionNote(
  noteId: number,
  topic: string,
  notes: string,
  kamiLink?: string,
  noteDate?: string,
): Promise<SessionNote> {
  const { data, error } = await supabase
    .from("session_notes")
    .update({
      topic,
      notes,
      kami_link: kamiLink ?? null,
      note_date: noteDate ?? null,
    })
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
  studentId: number; tutorId: number; task: string; dueDate?: string; kamiLink?: string;
  estimatedMinutes?: number; assignmentType?: string; instructions?: string;
}): Promise<Homework> {
  const { data, error } = await supabase.from("homework").insert({
    student_id:        payload.studentId,
    tutor_id:          payload.tutorId,
    task:              payload.task,
    assigned_date:     new Date().toISOString().slice(0, 10),
    due_date:          payload.dueDate         ?? null,
    kami_link:         payload.kamiLink        ?? null,
    estimated_minutes: payload.estimatedMinutes ?? null,
    assignment_type:   payload.assignmentType  ?? null,
    instructions:      payload.instructions    ?? null,
  }).select().single();
  if (error) throw error;
  return rowToHomework(data);
}

export async function deleteHomework(id: number): Promise<void> {
  const { error } = await supabase.from("homework").delete().eq("id", id);
  if (error) throw error;
}

// ── STUDY LOG ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToStudyLog(r: any): StudyLog {
  return {
    id:         r.id,
    studentId:  r.student_id,
    logDate:    r.log_date,
    minutes:    r.minutes,
    category:   r.category,
    note:       r.note        ?? undefined,
    homeworkId: r.homework_id ?? undefined,
    createdAt:  r.created_at,
  };
}

export async function fetchStudyLog(studentId: number, daysBack = 90): Promise<StudyLog[]> {
  const from = new Date();
  from.setDate(from.getDate() - daysBack);
  const fromIso = from.toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("study_log")
    .select("*")
    .eq("student_id", studentId)
    .gte("log_date", fromIso)
    .order("log_date", { ascending: false });
  if (error) return [];
  return data.map(rowToStudyLog);
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
  name: string; email: string; grade: string; subjects: string[]; programs: string[];
  phone: string; parentName: string; parentEmail: string; parentPhone: string; notes: string;
  allowInPerson: boolean; successPlan: string; successPlanUrl: string;
}>): Promise<Student> {
  const update: Record<string, unknown> = {};
  if (payload.name           !== undefined) update.name             = payload.name;
  if (payload.email          !== undefined) update.email            = payload.email;
  if (payload.grade          !== undefined) update.grade            = payload.grade;
  if (payload.subjects       !== undefined) update.subjects         = payload.subjects;
  if (payload.programs       !== undefined) update.programs         = payload.programs;
  if (payload.phone          !== undefined) update.phone            = payload.phone;
  if (payload.parentName     !== undefined) update.parent_name      = payload.parentName;
  if (payload.parentEmail    !== undefined) update.parent_email     = payload.parentEmail;
  if (payload.parentPhone    !== undefined) update.parent_phone     = payload.parentPhone;
  if (payload.notes          !== undefined) update.notes            = payload.notes;
  if (payload.allowInPerson  !== undefined) update.allow_in_person  = payload.allowInPerson;
  if (payload.successPlan    !== undefined) update.success_plan     = payload.successPlan    || null;
  if (payload.successPlanUrl !== undefined) update.success_plan_url = payload.successPlanUrl || null;
  const { data, error } = await supabase.from("students").update(update).eq("id", id).select().single();
  if (error) throw error;
  return rowToStudent(data);
}

export async function updateTutorProfile(id: number, payload: Partial<{
  name: string; email: string; subjects: string[]; phone: string; bio: string; photoUrl: string; zoomLink: string; meetingId: string;
}>): Promise<Tutor> {
  const update: Record<string, unknown> = {};
  if (payload.name      !== undefined) update.name             = payload.name;
  if (payload.email     !== undefined) update.email            = payload.email;
  if (payload.subjects  !== undefined) update.subjects         = payload.subjects;
  if (payload.phone     !== undefined) update.phone            = payload.phone;
  if (payload.bio       !== undefined) update.bio              = payload.bio;
  if (payload.photoUrl  !== undefined) update.photo_url        = payload.photoUrl || null;
  if (payload.zoomLink  !== undefined) update.zoom_link        = payload.zoomLink || null;
  if (payload.meetingId !== undefined) update.zoom_meeting_id  = payload.meetingId || null;
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

// ── CMS: ROW MAPPERS ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCourse(r: any): Course {
  return {
    id: r.id, subject: r.subject, title: r.title,
    description: r.description ?? undefined,
    gradeLevels: r.grade_levels ?? [],
    estimatedHours: r.estimated_hours ?? undefined,
    status: r.status, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToModule(r: any): Module {
  return {
    id: r.id, courseId: r.course_id,
    parentId: r.parent_id ?? undefined,
    title: r.title,
    description: r.description ?? undefined,
    position: r.position, estimatedWeeks: r.estimated_weeks ?? undefined,
    createdAt: r.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToLesson(r: any): Lesson {
  return {
    id:                r.id,
    moduleId:          r.module_id,
    title:             r.title,
    description:       r.description    ?? undefined,
    difficulty:        r.difficulty,
    estimatedMinutes:  r.estimated_minutes,
    hwMinutes:         r.hw_minutes     ?? undefined,
    tags:              r.tags           ?? [],
    learningObjectives: r.learning_objectives ?? [],
    commonMistakes:    r.common_mistakes ?? undefined,
    tutorNotes:        r.tutor_notes    ?? undefined,
    desmosUsage:       r.desmos_usage   ?? undefined,
    prerequisites:     r.prerequisites  ?? undefined,
    followUp:          r.follow_up      ?? undefined,
    aiNotes:           r.ai_notes       ?? undefined,
    status:            r.status,
    position:          r.position,
    createdAt:         r.created_at,
    updatedAt:         r.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToLessonResource(r: any): LessonResource {
  return {
    id: r.id, lessonId: r.lesson_id, type: r.type, label: r.label,
    url: r.url ?? undefined, storagePath: r.storage_path ?? undefined,
    position: r.position, createdAt: r.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSkill(r: any): Skill {
  return {
    id: r.id, slug: r.slug, name: r.name, subject: r.subject,
    moduleId: r.module_id ?? undefined,
    difficulty: r.difficulty, prerequisites: r.prerequisites ?? [],
    createdAt: r.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToStudentPlan(r: any): StudentPlan {
  return {
    id: r.id, studentId: r.student_id, tutorId: r.tutor_id, courseId: r.course_id,
    title: r.title,
    startingScore:        r.starting_score        ?? undefined,
    currentScore:         r.current_score         ?? undefined,
    targetScore:          r.target_score          ?? undefined,
    targetDate:           r.target_date           ?? undefined,
    status: r.status, notes: r.notes ?? undefined,
    sectionBars:          r.section_bars          ?? undefined,
    sectionScores:        r.section_scores        ?? undefined,
    skillBaseline:        r.skill_baseline        ?? undefined,
    consultationNotes:    r.consultation_notes    ?? undefined,
    sessionsPerWeek:      r.sessions_per_week     ?? undefined,
    studyMinutesPerWeek:  r.study_minutes_per_week ?? undefined,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPlanLesson(r: any): StudentPlanLesson {
  return {
    id: r.id, planId: r.plan_id, lessonId: r.lesson_id,
    position: r.position, status: r.status,
    scheduledDate: r.scheduled_date ?? undefined,
    completedAt: r.completed_at ?? undefined,
    tutorNotes: r.tutor_notes ?? undefined,
    createdAt: r.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSkillMastery(r: any): SkillMastery {
  return {
    studentId: r.student_id, skillId: r.skill_id,
    masteryPct: r.mastery_pct,
    lastAssessed: r.last_assessed ?? undefined,
  };
}

// ── CMS: COURSES ──────────────────────────────────────────────────────────────

export async function fetchCourses(opts: { all?: boolean } = {}): Promise<Course[]> {
  let q = supabase.from("courses").select("*").order("subject").order("title");
  if (!opts.all) q = q.eq("status", "active");
  const { data, error } = await q;
  if (error) throw error;
  return data.map(rowToCourse);
}

export async function fetchCourse(id: number): Promise<Course> {
  const { data, error } = await supabase.from("courses").select("*").eq("id", id).single();
  if (error) throw error;
  return rowToCourse(data);
}

export async function insertCourse(payload: {
  subject: string; title: string; description?: string;
  gradeLevels?: string[]; estimatedHours?: number;
}): Promise<Course> {
  const { data, error } = await supabase.from("courses").insert({
    subject:         payload.subject,
    title:           payload.title,
    description:     payload.description     ?? null,
    grade_levels:    payload.gradeLevels     ?? [],
    estimated_hours: payload.estimatedHours  ?? null,
    status:          "draft",
  }).select().single();
  if (error) throw error;
  return rowToCourse(data);
}

export async function updateCourse(id: number, payload: Partial<{
  subject: string; title: string; description: string;
  gradeLevels: string[]; estimatedHours: number; status: string;
}>): Promise<Course> {
  const u: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.subject        !== undefined) u.subject         = payload.subject;
  if (payload.title          !== undefined) u.title           = payload.title;
  if (payload.description    !== undefined) u.description     = payload.description || null;
  if (payload.gradeLevels    !== undefined) u.grade_levels    = payload.gradeLevels;
  if (payload.estimatedHours !== undefined) u.estimated_hours = payload.estimatedHours || null;
  if (payload.status         !== undefined) u.status          = payload.status;
  const { data, error } = await supabase.from("courses").update(u).eq("id", id).select().single();
  if (error) throw error;
  return rowToCourse(data);
}

export async function deleteCourse(id: number): Promise<void> {
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw error;
}

// ── CMS: MODULES ──────────────────────────────────────────────────────────────

/** All modules for a course (flat, includes both sections and categories). */
export async function fetchModules(courseId: number): Promise<Module[]> {
  const { data, error } = await supabase
    .from("modules").select("*").eq("course_id", courseId).order("position");
  if (error) throw error;
  return data.map(rowToModule);
}

/** Top-level sections for a course (parent_id IS NULL). */
export async function fetchSections(courseId: number): Promise<Module[]> {
  const { data, error } = await supabase
    .from("modules").select("*")
    .eq("course_id", courseId)
    .is("parent_id", null)
    .order("position");
  if (error) throw error;
  return data.map(rowToModule);
}

/** Categories that belong to a section (parent_id = sectionId). */
export async function fetchCategories(sectionId: number): Promise<Module[]> {
  const { data, error } = await supabase
    .from("modules").select("*")
    .eq("parent_id", sectionId)
    .order("position");
  if (error) throw error;
  return data.map(rowToModule);
}

export async function insertModule(payload: {
  courseId: number; title: string; description?: string;
  position?: number; estimatedWeeks?: number; parentId?: number;
}): Promise<Module> {
  const { data, error } = await supabase.from("modules").insert({
    course_id:       payload.courseId,
    parent_id:       payload.parentId       ?? null,
    title:           payload.title,
    description:     payload.description    ?? null,
    position:        payload.position       ?? 0,
    estimated_weeks: payload.estimatedWeeks ?? null,
  }).select().single();
  if (error) throw error;
  return rowToModule(data);
}

export async function updateModule(id: number, payload: Partial<{
  title: string; description: string; position: number; estimatedWeeks: number;
}>): Promise<Module> {
  const u: Record<string, unknown> = {};
  if (payload.title          !== undefined) u.title           = payload.title;
  if (payload.description    !== undefined) u.description     = payload.description || null;
  if (payload.position       !== undefined) u.position        = payload.position;
  if (payload.estimatedWeeks !== undefined) u.estimated_weeks = payload.estimatedWeeks || null;
  const { data, error } = await supabase.from("modules").update(u).eq("id", id).select().single();
  if (error) throw error;
  return rowToModule(data);
}

export async function deleteModule(id: number): Promise<void> {
  const { error } = await supabase.from("modules").delete().eq("id", id);
  if (error) throw error;
}

// ── CMS: LESSONS ──────────────────────────────────────────────────────────────

export async function fetchLessons(moduleId: number): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from("lessons").select("*").eq("module_id", moduleId).order("position");
  if (error) throw error;
  return data.map(rowToLesson);
}

export async function fetchLesson(id: number): Promise<Lesson> {
  const { data, error } = await supabase.from("lessons").select("*").eq("id", id).single();
  if (error) throw error;
  return rowToLesson(data);
}

export async function insertLesson(payload: {
  moduleId: number; title: string; description?: string;
  difficulty?: number; estimatedMinutes?: number; hwMinutes?: number;
  tags?: string[]; learningObjectives?: string[]; commonMistakes?: string;
  tutorNotes?: string; desmosUsage?: string; prerequisites?: string;
  followUp?: string; aiNotes?: string; status?: string; position?: number;
}): Promise<Lesson> {
  const { data, error } = await supabase.from("lessons").insert({
    module_id:            payload.moduleId,
    title:                payload.title,
    description:          payload.description        ?? null,
    difficulty:           payload.difficulty         ?? 2,
    estimated_minutes:    payload.estimatedMinutes   ?? 60,
    hw_minutes:           payload.hwMinutes          ?? null,
    tags:                 payload.tags               ?? [],
    learning_objectives:  payload.learningObjectives ?? [],
    common_mistakes:      payload.commonMistakes     ?? null,
    tutor_notes:          payload.tutorNotes         ?? null,
    desmos_usage:         payload.desmosUsage        ?? null,
    prerequisites:        payload.prerequisites      ?? null,
    follow_up:            payload.followUp           ?? null,
    ai_notes:             payload.aiNotes            ?? null,
    status:               payload.status             ?? "draft",
    position:             payload.position           ?? 0,
  }).select().single();
  if (error) throw error;
  return rowToLesson(data);
}

export async function updateLesson(id: number, payload: Partial<{
  title: string; description: string; difficulty: number; estimatedMinutes: number;
  hwMinutes: number; tags: string[]; learningObjectives: string[];
  commonMistakes: string; tutorNotes: string; desmosUsage: string;
  prerequisites: string; followUp: string; aiNotes: string;
  status: string; position: number;
}>): Promise<Lesson> {
  const u: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.title               !== undefined) u.title               = payload.title;
  if (payload.description         !== undefined) u.description         = payload.description || null;
  if (payload.difficulty          !== undefined) u.difficulty          = payload.difficulty;
  if (payload.estimatedMinutes    !== undefined) u.estimated_minutes   = payload.estimatedMinutes;
  if (payload.hwMinutes           !== undefined) u.hw_minutes          = payload.hwMinutes || null;
  if (payload.tags                !== undefined) u.tags                = payload.tags;
  if (payload.learningObjectives  !== undefined) u.learning_objectives = payload.learningObjectives;
  if (payload.commonMistakes      !== undefined) u.common_mistakes     = payload.commonMistakes || null;
  if (payload.tutorNotes          !== undefined) u.tutor_notes         = payload.tutorNotes || null;
  if (payload.desmosUsage         !== undefined) u.desmos_usage        = payload.desmosUsage || null;
  if (payload.prerequisites       !== undefined) u.prerequisites       = payload.prerequisites || null;
  if (payload.followUp            !== undefined) u.follow_up           = payload.followUp || null;
  if (payload.aiNotes             !== undefined) u.ai_notes            = payload.aiNotes || null;
  if (payload.status              !== undefined) u.status              = payload.status;
  if (payload.position            !== undefined) u.position            = payload.position;
  const { data, error } = await supabase.from("lessons").update(u).eq("id", id).select().single();
  if (error) throw error;
  return rowToLesson(data);
}

export async function deleteLesson(id: number): Promise<void> {
  const { error } = await supabase.from("lessons").delete().eq("id", id);
  if (error) throw error;
}

// ── CMS: LESSON RESOURCES ────────────────────────────────────────────────────

export async function fetchLessonResources(lessonId: number): Promise<LessonResource[]> {
  const { data, error } = await supabase
    .from("lesson_resources").select("*").eq("lesson_id", lessonId).order("position");
  if (error) throw error;
  return data.map(rowToLessonResource);
}

export async function insertLessonResource(payload: {
  lessonId: number; type: string; label: string; url?: string; storagePath?: string; position?: number;
}): Promise<LessonResource> {
  const { data, error } = await supabase.from("lesson_resources").insert({
    lesson_id:    payload.lessonId,
    type:         payload.type,
    label:        payload.label,
    url:          payload.url          ?? null,
    storage_path: payload.storagePath  ?? null,
    position:     payload.position     ?? 0,
  }).select().single();
  if (error) throw error;
  return rowToLessonResource(data);
}

export async function deleteLessonResource(id: number): Promise<void> {
  const { error } = await supabase.from("lesson_resources").delete().eq("id", id);
  if (error) throw error;
}

export async function updateLessonResource(id: number, payload: Partial<{
  label: string; url: string | null; storagePath: string | null;
}>): Promise<LessonResource> {
  const u: Record<string, unknown> = {};
  if (payload.label       !== undefined) u.label        = payload.label;
  if (payload.url         !== undefined) u.url          = payload.url;
  if (payload.storagePath !== undefined) u.storage_path = payload.storagePath;
  const { data, error } = await supabase
    .from("lesson_resources").update(u).eq("id", id).select().single();
  if (error) throw error;
  return rowToLessonResource(data);
}

// ── CMS: SKILLS ──────────────────────────────────────────────────────────────

export async function fetchSkills(opts: { subject?: string } = {}): Promise<Skill[]> {
  let q = supabase.from("skills").select("*").order("subject").order("difficulty").order("name");
  if (opts.subject) q = q.eq("subject", opts.subject);
  const { data, error } = await q;
  if (error) throw error;
  return data.map(rowToSkill);
}

export async function fetchLessonSkills(lessonId: number): Promise<Skill[]> {
  const { data, error } = await supabase
    .from("lesson_skills")
    .select("skills(*)")
    .eq("lesson_id", lessonId);
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => rowToSkill(r.skills));
}

export async function insertSkill(payload: {
  slug: string; name: string; subject: string;
  moduleId?: number; difficulty?: number; prerequisites?: string[];
}): Promise<Skill> {
  const { data, error } = await supabase.from("skills").insert({
    slug:          payload.slug,
    name:          payload.name,
    subject:       payload.subject,
    module_id:     payload.moduleId     ?? null,
    difficulty:    payload.difficulty   ?? 2,
    prerequisites: payload.prerequisites ?? [],
  }).select().single();
  if (error) throw error;
  return rowToSkill(data);
}

export async function setLessonSkills(lessonId: number, skillIds: number[]): Promise<void> {
  await supabase.from("lesson_skills").delete().eq("lesson_id", lessonId);
  if (skillIds.length === 0) return;
  const { error } = await supabase.from("lesson_skills").insert(
    skillIds.map((skillId) => ({ lesson_id: lessonId, skill_id: skillId }))
  );
  if (error) throw error;
}

// ── CMS: STUDENT PLANS ───────────────────────────────────────────────────────

export async function fetchStudentPlans(studentId: number): Promise<StudentPlan[]> {
  const { data, error } = await supabase
    .from("student_plans").select("*").eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(rowToStudentPlan);
}

export async function fetchPlansByTutor(tutorId: number): Promise<StudentPlan[]> {
  const { data, error } = await supabase
    .from("student_plans").select("*").eq("tutor_id", tutorId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(rowToStudentPlan);
}

export async function insertStudentPlan(payload: {
  studentId: number; tutorId: number; courseId: number; title: string;
  startingScore?: number; currentScore?: number; targetScore?: number;
  targetDate?: string; notes?: string;
  sectionScores?: import("./types").PlanSectionScores;
  skillBaseline?: import("./types").SkillBaseline;
  consultationNotes?: import("./types").ConsultationNotes;
  sessionsPerWeek?: number;
  studyMinutesPerWeek?: number;
}): Promise<StudentPlan> {
  const { data, error } = await supabase.from("student_plans").insert({
    student_id:             payload.studentId,
    tutor_id:               payload.tutorId,
    course_id:              payload.courseId,
    title:                  payload.title,
    starting_score:         payload.startingScore        ?? payload.currentScore ?? null,
    current_score:          payload.currentScore         ?? null,
    target_score:           payload.targetScore          ?? null,
    target_date:            payload.targetDate            ?? null,
    notes:                  payload.notes                ?? null,
    section_scores:         payload.sectionScores        ?? null,
    skill_baseline:         payload.skillBaseline        ?? null,
    consultation_notes:     payload.consultationNotes    ?? null,
    sessions_per_week:      payload.sessionsPerWeek      ?? null,
    study_minutes_per_week: payload.studyMinutesPerWeek  ?? null,
    status:                 "active",
  }).select().single();
  if (error) throw error;
  return rowToStudentPlan(data);
}

export async function updateStudentPlan(id: number, payload: Partial<{
  title: string; currentScore: number; targetScore: number;
  targetDate: string; status: string; notes: string;
}>): Promise<StudentPlan> {
  const u: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.title        !== undefined) u.title         = payload.title;
  if (payload.currentScore !== undefined) u.current_score = payload.currentScore || null;
  if (payload.targetScore  !== undefined) u.target_score  = payload.targetScore  || null;
  if (payload.targetDate   !== undefined) u.target_date   = payload.targetDate   || null;
  if (payload.status       !== undefined) u.status        = payload.status;
  if (payload.notes        !== undefined) u.notes         = payload.notes        || null;
  const { data, error } = await supabase.from("student_plans").update(u).eq("id", id).select().single();
  if (error) throw error;
  return rowToStudentPlan(data);
}

// ── CMS: STUDENT PLAN LESSONS ─────────────────────────────────────────────────

export async function fetchPlanLessons(planId: number): Promise<StudentPlanLesson[]> {
  const { data, error } = await supabase
    .from("student_plan_lessons").select("*").eq("plan_id", planId).order("position");
  if (error) throw error;
  return data.map(rowToPlanLesson);
}

export async function insertPlanLessons(
  planId: number,
  lessons: Array<{ lessonId: number; position: number; scheduledDate?: string; tutorNotes?: string }>,
): Promise<StudentPlanLesson[]> {
  const { data, error } = await supabase.from("student_plan_lessons").insert(
    lessons.map((l) => ({
      plan_id:        planId,
      lesson_id:      l.lessonId,
      position:       l.position,
      scheduled_date: l.scheduledDate ?? null,
      tutor_notes:    l.tutorNotes    ?? null,
      status:         "pending",
    }))
  ).select();
  if (error) throw error;
  return data.map(rowToPlanLesson);
}

export async function updatePlanLesson(id: number, payload: Partial<{
  position: number; status: string; scheduledDate: string;
  completedAt: string; tutorNotes: string;
}>): Promise<StudentPlanLesson> {
  const u: Record<string, unknown> = {};
  if (payload.position      !== undefined) u.position       = payload.position;
  if (payload.status        !== undefined) u.status         = payload.status;
  if (payload.scheduledDate !== undefined) u.scheduled_date = payload.scheduledDate || null;
  if (payload.completedAt   !== undefined) u.completed_at   = payload.completedAt  || null;
  if (payload.tutorNotes    !== undefined) u.tutor_notes    = payload.tutorNotes   || null;
  const { data, error } = await supabase.from("student_plan_lessons").update(u).eq("id", id).select().single();
  if (error) throw error;
  return rowToPlanLesson(data);
}

export async function deletePlanLesson(id: number): Promise<void> {
  const { error } = await supabase.from("student_plan_lessons").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteStudentPlan(planId: number): Promise<void> {
  const { error } = await supabase.from("student_plans").delete().eq("id", planId);
  if (error) throw error;
}

export async function updatePlanSectionBars(planId: number, bars: Record<string, number>): Promise<void> {
  const { error } = await supabase
    .from("student_plans")
    .update({ section_bars: bars })
    .eq("id", planId);
  if (error) throw error;
}

export async function updatePlanSkillBaseline(planId: number, baseline: SkillBaseline): Promise<void> {
  const { error } = await supabase
    .from("student_plans")
    .update({ skill_baseline: baseline })
    .eq("id", planId);
  if (error) throw error;
}

// ── CMS: SKILL MASTERY ────────────────────────────────────────────────────────

export async function fetchSkillMastery(studentId: number): Promise<SkillMastery[]> {
  const { data, error } = await supabase
    .from("skill_mastery").select("*").eq("student_id", studentId);
  if (error) throw error;
  return data.map(rowToSkillMastery);
}

export async function upsertSkillMastery(
  studentId: number, skillId: number, masteryPct: number,
): Promise<void> {
  const { error } = await supabase.from("skill_mastery").upsert({
    student_id:    studentId,
    skill_id:      skillId,
    mastery_pct:   masteryPct,
    last_assessed: new Date().toISOString(),
  }, { onConflict: "student_id,skill_id" });
  if (error) throw error;
}

// ── CMS: COMPOSITE QUERIES ────────────────────────────────────────────────────

/**
 * Fetches a single lesson with all its resource slots and tagged skills.
 * Used for lesson detail panels in admin Curriculum Builder and tutor Curriculum Library.
 */
export async function fetchLessonPackage(lessonId: number): Promise<LessonPackage> {
  const [lessonRes, resourcesRes, skillsRes] = await Promise.all([
    supabase.from("lessons").select("*").eq("id", lessonId).single(),
    supabase.from("lesson_resources").select("*").eq("lesson_id", lessonId).order("position"),
    supabase.from("lesson_skills").select("skills(*)").eq("lesson_id", lessonId),
  ]);
  if (lessonRes.error)    throw lessonRes.error;
  if (resourcesRes.error) throw resourcesRes.error;
  if (skillsRes.error)    throw skillsRes.error;
  return {
    ...rowToLesson(lessonRes.data),
    resources: (resourcesRes.data ?? []).map(rowToLessonResource),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    skills: (skillsRes.data ?? []).map((r: any) => rowToSkill(r.skills)).filter(Boolean),
  };
}

/**
 * Fetches the full course catalog as a nested tree:
 *   Course → Sections → Categories → Lessons (with resources)
 * Used for sidebar navigation in admin Curriculum Builder and tutor Curriculum Library.
 */
export async function fetchFullCatalog(courseId: number): Promise<CourseCatalogFull> {
  const [courseRes, modulesRes, lessonsRes, resourcesRes] = await Promise.all([
    supabase.from("courses").select("*").eq("id", courseId).single(),
    supabase.from("modules").select("*").eq("course_id", courseId).order("position"),
    supabase.from("lessons")
      .select("*, modules!inner(course_id)")
      .eq("modules.course_id", courseId)
      .order("position"),
    supabase.from("lesson_resources")
      .select("*, lessons!inner(module_id, modules!inner(course_id))")
      .eq("lessons.modules.course_id", courseId)
      .order("position"),
  ]);
  if (courseRes.error)    throw courseRes.error;
  if (modulesRes.error)   throw modulesRes.error;
  if (lessonsRes.error)   throw lessonsRes.error;
  if (resourcesRes.error) throw resourcesRes.error;

  const course  = rowToCourse(courseRes.data);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allMods = (modulesRes.data ?? []).map((r: any) => rowToModule(r));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allLessons = (lessonsRes.data ?? []).map((r: any) => rowToLesson(r));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allResources = (resourcesRes.data ?? []).map((r: any) => rowToLessonResource(r));

  const resourcesByLesson = new Map<number, LessonResource[]>();
  for (const res of allResources) {
    if (!resourcesByLesson.has(res.lessonId)) resourcesByLesson.set(res.lessonId, []);
    resourcesByLesson.get(res.lessonId)!.push(res);
  }

  const lessonsByModule = new Map<number, CatalogLesson[]>();
  for (const lesson of allLessons) {
    if (!lessonsByModule.has(lesson.moduleId)) lessonsByModule.set(lesson.moduleId, []);
    lessonsByModule.get(lesson.moduleId)!.push({
      ...lesson,
      resources: resourcesByLesson.get(lesson.id) ?? [],
    });
  }

  const sections: CatalogSection[] = [];
  const categoryMap = new Map<number, CatalogCategory[]>();

  for (const mod of allMods) {
    if (mod.parentId != null) {
      if (!categoryMap.has(mod.parentId)) categoryMap.set(mod.parentId, []);
      categoryMap.get(mod.parentId)!.push({
        ...mod,
        lessons: lessonsByModule.get(mod.id) ?? [],
      });
    }
  }

  for (const mod of allMods) {
    if (mod.parentId == null) {
      sections.push({
        ...mod,
        categories: categoryMap.get(mod.id) ?? [],
      });
    }
  }

  return { ...course, sections };
}

// ── CMS: TUTOR ASSIGNMENT FLOW ────────────────────────────────────────────────

/**
 * Finds an active student plan for a given student+course, or creates one.
 * Tutors use this before adding lessons to a student's plan.
 */
export async function getOrCreateStudentPlan(params: {
  studentId: number;
  tutorId:   number;
  courseId:  number;
  title?:    string;
}): Promise<StudentPlan> {
  const { data: existing, error: fetchErr } = await supabase
    .from("student_plans").select("*")
    .eq("student_id", params.studentId)
    .eq("course_id", params.courseId)
    .in("status", ["draft", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (existing) return rowToStudentPlan(existing);

  const { data: courseRow, error: courseErr } = await supabase
    .from("courses").select("title").eq("id", params.courseId).single();
  if (courseErr) throw courseErr;

  const { data, error } = await supabase.from("student_plans").insert({
    student_id: params.studentId,
    tutor_id:   params.tutorId,
    course_id:  params.courseId,
    title:      params.title ?? `${courseRow.title} — Learning Plan`,
    status:     "active",
  }).select().single();
  if (error) throw error;
  return rowToStudentPlan(data);
}

/**
 * Assigns a lesson to a student plan.
 * Position defaults to appending after the last existing plan lesson.
 */
export async function assignLessonToStudent(params: {
  planId:        number;
  lessonId:      number;
  position?:     number;
  scheduledDate?: string;
  tutorNotes?:   string;
}): Promise<StudentPlanLesson> {
  let position = params.position;
  if (position == null) {
    const { count } = await supabase
      .from("student_plan_lessons")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", params.planId);
    position = count ?? 0;
  }
  const { data, error } = await supabase.from("student_plan_lessons").insert({
    plan_id:        params.planId,
    lesson_id:      params.lessonId,
    position,
    status:         "pending",
    scheduled_date: params.scheduledDate ?? null,
    tutor_notes:    params.tutorNotes    ?? null,
  }).select().single();
  if (error) throw error;
  return rowToPlanLesson(data);
}

/**
 * Returns the full learning plan for a student for a specific course,
 * with each plan lesson enriched with its lesson data and resource slots.
 * Returns null if no active plan exists.
 */
export async function fetchStudentPlanFull(
  studentId: number,
  courseId: number,
): Promise<StudentPlanFull | null> {
  const { data: planRow, error: planErr } = await supabase
    .from("student_plans").select("*")
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .in("status", ["draft", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (planErr) throw planErr;
  if (!planRow) return null;

  const plan = rowToStudentPlan(planRow);

  const { data: planLessonRows, error: plErr } = await supabase
    .from("student_plan_lessons").select("*")
    .eq("plan_id", plan.id)
    .order("position");
  if (plErr) throw plErr;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const planLessons: StudentPlanLesson[] = (planLessonRows ?? []).map((r: any) => rowToPlanLesson(r));
  const lessonIds = planLessons.map((pl) => pl.lessonId);
  if (lessonIds.length === 0) return { ...plan, lessons: [] };

  const [lessonsRes, resourcesRes] = await Promise.all([
    supabase.from("lessons").select("*").in("id", lessonIds),
    supabase.from("lesson_resources").select("*").in("lesson_id", lessonIds).order("position"),
  ]);
  if (lessonsRes.error)   throw lessonsRes.error;
  if (resourcesRes.error) throw resourcesRes.error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lessonMap   = new Map((lessonsRes.data ?? []).map((r: any) => [r.id, rowToLesson(r)]));
  const resMap      = new Map<number, LessonResource[]>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of (resourcesRes.data ?? []).map((r: any) => rowToLessonResource(r))) {
    if (!resMap.has(r.lessonId)) resMap.set(r.lessonId, []);
    resMap.get(r.lessonId)!.push(r);
  }

  const fullLessons: StudentPlanLessonFull[] = planLessons.map((pl) => ({
    ...pl,
    lesson:    lessonMap.get(pl.lessonId)!,
    resources: resMap.get(pl.lessonId) ?? [],
  }));

  return { ...plan, lessons: fullLessons };
}

/**
 * Removes a lesson from a student plan and re-sequences positions.
 */
export async function removeLessonFromPlan(planLessonId: number): Promise<void> {
  const { error } = await supabase
    .from("student_plan_lessons").delete().eq("id", planLessonId);
  if (error) throw error;
}

/**
 * Updates the status of a student plan lesson (e.g., mark in_progress or completed).
 */
export async function updatePlanLessonStatus(
  planLessonId: number,
  status: "pending" | "in_progress" | "completed" | "skipped",
  completedAt?: string,
): Promise<StudentPlanLesson> {
  const u: Record<string, unknown> = { status };
  if (status === "completed") u.completed_at = completedAt ?? new Date().toISOString();
  const { data, error } = await supabase
    .from("student_plan_lessons").update(u).eq("id", planLessonId).select().single();
  if (error) throw error;
  return rowToPlanLesson(data);
}

// ── SKILL NODES ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSkillNode(r: any): SkillNode {
  return {
    id:           r.id,
    slug:         r.slug,
    course:       r.course,
    category:     r.category,
    parentId:     r.parent_id ?? null,
    title:        r.title,
    description:  r.description ?? undefined,
    displayOrder: r.display_order,
    createdAt:    r.created_at,
    updatedAt:    r.updated_at,
  };
}

/** Fetch the full skill tree for a course, ordered by display_order. */
export async function fetchSkillNodes(course?: string): Promise<SkillNode[]> {
  let q = supabase.from("skill_nodes").select("*").order("display_order");
  if (course) q = q.eq("course", course);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(rowToSkillNode);
}

/** Fetch a single skill node by id. Returns null if not found. */
export async function fetchSkillNode(id: number): Promise<SkillNode | null> {
  const { data, error } = await supabase
    .from("skill_nodes").select("*").eq("id", id).single();
  if (error) return null;
  return rowToSkillNode(data);
}

/** Fetch a single skill node by slug. Returns null if not found. */
export async function fetchSkillNodeBySlug(slug: string): Promise<SkillNode | null> {
  const { data, error } = await supabase
    .from("skill_nodes").select("*").eq("slug", slug).single();
  if (error) return null;
  return rowToSkillNode(data);
}

/** Fetch all direct children of a parent node. */
export async function fetchChildSkillNodes(parentId: number): Promise<SkillNode[]> {
  const { data, error } = await supabase
    .from("skill_nodes").select("*")
    .eq("parent_id", parentId)
    .order("display_order");
  if (error) throw error;
  return (data ?? []).map(rowToSkillNode);
}

// ── STUDENT SKILLS ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToStudentSkill(r: any): StudentSkill {
  return {
    id:           r.id,
    studentId:    r.student_id,
    skillId:      r.skill_id,
    masteryScore: r.mastery_score,
    status:       r.status as StudentSkillStatus,
    tutorNotes:   r.tutor_notes   ?? undefined,
    lastAssessed: r.last_assessed ?? undefined,
    createdAt:    r.created_at,
    updatedAt:    r.updated_at,
  };
}

/** Fetch all student skill records for a student, optionally filtered by course. */
export async function fetchStudentSkills(
  studentId: number,
  course?: string,
): Promise<StudentSkill[]> {
  if (course) {
    // Join through skill_nodes to filter by course.
    const { data, error } = await supabase
      .from("student_skills")
      .select("*, skill_nodes!inner(course)")
      .eq("student_id", studentId)
      .eq("skill_nodes.course", course)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToStudentSkill);
  }
  const { data, error } = await supabase
    .from("student_skills").select("*")
    .eq("student_id", studentId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToStudentSkill);
}

/** Fetch one student skill record. Returns null if not yet assessed. */
export async function fetchStudentSkill(
  studentId: number,
  skillId:   number,
): Promise<StudentSkill | null> {
  const { data, error } = await supabase
    .from("student_skills").select("*")
    .eq("student_id", studentId)
    .eq("skill_id",   skillId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToStudentSkill(data) : null;
}

/**
 * Create or update a student's skill assessment.
 * Tutors call this after evaluating a student on a specific skill.
 * All fields are optional — only supplied fields are changed on update.
 */
export async function upsertStudentSkill(
  studentId: number,
  skillId:   number,
  payload: {
    masteryScore?: number;
    status?:       StudentSkillStatus;
    tutorNotes?:   string;
    lastAssessed?: string;   // ISO date; defaults to today
  },
): Promise<StudentSkill> {
  const now = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("student_skills")
    .upsert(
      {
        student_id:    studentId,
        skill_id:      skillId,
        mastery_score: payload.masteryScore ?? 0,
        status:        payload.status       ?? "not_assessed",
        tutor_notes:   payload.tutorNotes   ?? null,
        last_assessed: payload.lastAssessed ?? now,
      },
      { onConflict: "student_id,skill_id" },
    )
    .select()
    .single();
  if (error) throw error;
  return rowToStudentSkill(data);
}

/**
 * Partial update for an existing student skill record.
 * Only the supplied fields are written — useful for updating just the notes
 * or just the mastery score without touching other fields.
 */
export async function updateStudentSkill(
  studentId: number,
  skillId:   number,
  payload: {
    masteryScore?: number;
    status?:       StudentSkillStatus;
    tutorNotes?:   string;
    lastAssessed?: string;
  },
): Promise<StudentSkill> {
  const u: Record<string, unknown> = {};
  if (payload.masteryScore !== undefined) u.mastery_score = payload.masteryScore;
  if (payload.status       !== undefined) u.status        = payload.status;
  if (payload.tutorNotes   !== undefined) u.tutor_notes   = payload.tutorNotes  || null;
  if (payload.lastAssessed !== undefined) u.last_assessed = payload.lastAssessed || null;
  const { data, error } = await supabase
    .from("student_skills")
    .update(u)
    .eq("student_id", studentId)
    .eq("skill_id",   skillId)
    .select()
    .single();
  if (error) throw error;
  return rowToStudentSkill(data);
}

/** Delete a student's skill assessment record. */
export async function deleteStudentSkill(
  studentId: number,
  skillId:   number,
): Promise<void> {
  const { error } = await supabase
    .from("student_skills")
    .delete()
    .eq("student_id", studentId)
    .eq("skill_id",   skillId);
  if (error) throw error;
}

// ── SESSION NOTE SKILLS ───────────────────────────────────────────────────────

/**
 * Fetch the skill nodes tagged on a session note.
 * Returns the full SkillNode rows (not just IDs) so the UI can render titles.
 */
export async function fetchNoteSkills(noteId: number): Promise<SkillNode[]> {
  const { data, error } = await supabase
    .from("session_note_skills")
    .select("skill_nodes(*)")
    .eq("session_note_id", noteId);
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => rowToSkillNode(r.skill_nodes)).filter(Boolean);
}

/**
 * Atomically replace all skill tags on a session note.
 * Deletes existing links first, then inserts the new set.
 * Passing an empty array clears all tags.
 */
export async function setNoteSkillLinks(
  noteId:    number,
  skillIds:  number[],
  studentId: number,
  createdBy: number,
): Promise<void> {
  const { error: delError } = await supabase
    .from("session_note_skills")
    .delete()
    .eq("session_note_id", noteId);
  if (delError) throw delError;

  if (skillIds.length === 0) return;

  const { error: insError } = await supabase
    .from("session_note_skills")
    .insert(
      skillIds.map((skillId) => ({
        session_note_id: noteId,
        skill_id:        skillId,
        student_id:      studentId,
        created_by:      createdBy,
      })),
    );
  if (insError) throw insError;
}

/**
 * Fetch a lightweight summary of all skill-tagged session notes for a student.
 * Used in the student Learning Path "Sessions by Skill" panel.
 * Returns one entry per (note × skill) pair, ordered newest first.
 */
export async function fetchSkillLinkedNotes(studentId: number): Promise<SkillNoteLink[]> {
  const { data, error } = await supabase
    .from("session_note_skills")
    .select("skill_id, session_note_id, session_notes(topic, note_date, created_at)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({
    skillId:   r.skill_id           as number,
    noteId:    r.session_note_id    as number,
    topic:     r.session_notes?.topic    ?? "",
    noteDate:  r.session_notes?.note_date ?? undefined,
    createdAt: r.session_notes?.created_at ?? "",
  }));
}

// ── HOMEWORK ASSIGNMENT SKILLS ────────────────────────────────────────────────

/**
 * Fetch the skill nodes tagged on a homework assignment.
 */
export async function fetchHomeworkSkills(hwId: number): Promise<SkillNode[]> {
  const { data, error } = await supabase
    .from("homework_assignment_skills")
    .select("skill_nodes(*)")
    .eq("assignment_id", hwId);
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => rowToSkillNode(r.skill_nodes)).filter(Boolean);
}

/**
 * Atomically replace all skill tags on a homework assignment.
 * Deletes existing links first, then inserts the new set.
 * Passing an empty array clears all tags.
 */
export async function setHomeworkSkillLinks(
  hwId:      number,
  skillIds:  number[],
  studentId: number,
  createdBy: number,
): Promise<void> {
  const { error: delError } = await supabase
    .from("homework_assignment_skills")
    .delete()
    .eq("assignment_id", hwId);
  if (delError) throw delError;

  if (skillIds.length === 0) return;

  const { error: insError } = await supabase
    .from("homework_assignment_skills")
    .insert(
      skillIds.map((skillId) => ({
        assignment_id: hwId,
        skill_id:      skillId,
        student_id:    studentId,
        created_by:    createdBy,
      })),
    );
  if (insError) throw insError;
}

/**
 * Fetch a lightweight summary of all skill-tagged homework for a student.
 * Used in the student Learning Path "Assignments by Skill" panel.
 * Returns one entry per (assignment × skill) pair, ordered newest first.
 */
export async function fetchSkillLinkedHomework(studentId: number): Promise<HomeworkSkillLink[]> {
  const { data, error } = await supabase
    .from("homework_assignment_skills")
    .select("skill_id, assignment_id, homework(task, due_date, status, estimated_minutes, student_time_minutes, grade, feedback, assigned_date)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({
    skillId:             r.skill_id                        as number,
    homeworkId:          r.assignment_id                   as number,
    task:                r.homework?.task                  ?? "",
    dueDate:             r.homework?.due_date              ?? null,
    status:              (r.homework?.status               ?? "pending") as "pending" | "submitted" | "completed",
    estimatedMinutes:    r.homework?.estimated_minutes     ?? undefined,
    studentTimeMinutes:  r.homework?.student_time_minutes  ?? undefined,
    grade:               r.homework?.grade                 ?? undefined,
    feedback:            r.homework?.feedback              ?? undefined,
    assignedDate:        r.homework?.assigned_date         ?? "",
  }));
}

// ── VOCABULARY ASSIGNMENT ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToVocabConfig(r: any): VocabularyAssignmentConfig {
  return {
    id:         r.id,
    homeworkId: r.homework_id,
    words:      (r.words ?? []) as VocabularyWord[],
    createdAt:  r.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToVocabEntry(r: any): VocabularySubmissionEntry {
  return {
    id:            r.id,
    homeworkId:    r.homework_id,
    studentId:     r.student_id,
    wordIndex:     r.word_index,
    word:          r.word,
    definition:    r.definition,
    sentence:      r.sentence,
    confidence:    r.confidence ?? undefined,
    tutorStatus:   r.tutor_status,
    tutorFeedback: r.tutor_feedback ?? undefined,
    createdAt:     r.created_at,
    updatedAt:     r.updated_at,
  };
}

export async function fetchVocabularyConfig(homeworkId: number): Promise<VocabularyAssignmentConfig | null> {
  const { data, error } = await supabase
    .from("vocabulary_assignment_config")
    .select("*")
    .eq("homework_id", homeworkId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToVocabConfig(data) : null;
}

export async function upsertVocabularyConfig(homeworkId: number, words: VocabularyWord[]): Promise<VocabularyAssignmentConfig> {
  const { data, error } = await supabase
    .from("vocabulary_assignment_config")
    .upsert({ homework_id: homeworkId, words }, { onConflict: "homework_id" })
    .select()
    .single();
  if (error) throw error;
  return rowToVocabConfig(data);
}

export async function fetchVocabularySubmissions(homeworkId: number): Promise<VocabularySubmissionEntry[]> {
  const { data, error } = await supabase
    .from("vocabulary_submission_entries")
    .select("*")
    .eq("homework_id", homeworkId)
    .order("word_index", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToVocabEntry);
}

export async function upsertVocabularySubmissions(
  entries: Omit<VocabularySubmissionEntry, "id" | "tutorStatus" | "tutorFeedback" | "createdAt" | "updatedAt">[],
): Promise<VocabularySubmissionEntry[]> {
  const rows = entries.map((e) => ({
    homework_id: e.homeworkId,
    student_id:  e.studentId,
    word_index:  e.wordIndex,
    word:        e.word,
    definition:  e.definition,
    sentence:    e.sentence,
    confidence:  e.confidence ?? null,
  }));
  const { data, error } = await supabase
    .from("vocabulary_submission_entries")
    .upsert(rows, { onConflict: "homework_id,student_id,word_index" })
    .select();
  if (error) throw error;
  return (data ?? []).map(rowToVocabEntry);
}

export async function updateVocabularyEntry(
  entryId: number,
  fields: { tutorStatus?: string; tutorFeedback?: string },
): Promise<VocabularySubmissionEntry> {
  const update: Record<string, unknown> = {};
  if (fields.tutorStatus  !== undefined) update.tutor_status   = fields.tutorStatus;
  if (fields.tutorFeedback !== undefined) update.tutor_feedback = fields.tutorFeedback;
  const { data, error } = await supabase
    .from("vocabulary_submission_entries")
    .update(update)
    .eq("id", entryId)
    .select()
    .single();
  if (error) throw error;
  return rowToVocabEntry(data);
}

export async function markHomeworkSubmitted(id: number): Promise<Homework> {
  const { data, error } = await supabase
    .from("homework")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return rowToHomework(data);
}

// ── PRACTICE TEST RESULTS ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPracticeTestResult(r: any): PracticeTestResult {
  return {
    id:           r.id,
    studentId:    r.student_id,
    planId:       r.plan_id       ?? null,
    testDate:     r.test_date,
    overallScore: r.overall_score,
    rwScore:      r.rw_score      ?? undefined,
    mathScore:    r.math_score    ?? undefined,
    tutorNotes:   r.tutor_notes   ?? undefined,
    createdAt:    r.created_at,
  };
}

export async function fetchPracticeTestResults(studentId: number): Promise<PracticeTestResult[]> {
  const { data, error } = await supabase
    .from("practice_test_results")
    .select("*")
    .eq("student_id", studentId)
    .order("test_date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToPracticeTestResult);
}

export async function insertPracticeTestResult(payload: {
  studentId:    number;
  planId?:      number;
  testDate:     string;
  overallScore: number;
  rwScore?:     number;
  mathScore?:   number;
  tutorNotes?:  string;
}): Promise<PracticeTestResult> {
  const { data, error } = await supabase
    .from("practice_test_results")
    .insert({
      student_id:    payload.studentId,
      plan_id:       payload.planId       ?? null,
      test_date:     payload.testDate,
      overall_score: payload.overallScore,
      rw_score:      payload.rwScore      ?? null,
      math_score:    payload.mathScore    ?? null,
      tutor_notes:   payload.tutorNotes   ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToPracticeTestResult(data);
}

export async function deletePracticeTestResult(id: number): Promise<void> {
  const { error } = await supabase
    .from("practice_test_results")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
