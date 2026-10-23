import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";
import { allowsPracticeDevBypass } from "@/lib/sat/access";
import {
  attemptFactFromRow,
  attemptGroupFactFromRow,
  canViewSatAttempts,
  earliestSavedAnswer,
  gradeSatResponse,
  groupPracticeAttempts,
  isAttemptHistoryId,
  isMissingAttemptsTable,
  parseAttemptBody,
  questionsForAttempt,
  sliceAttemptHistory,
  summarizeAttempts,
  type AttemptFact,
  type AttemptGroupFact,
  type GradeKey,
} from "@/lib/sat/attempts";
import { mockQuestionKey } from "@/lib/sat/mockBank";

export const dynamic = "force-dynamic";

function attemptColumns(includeSource: boolean): string {
  const questionColumns = includeSource
    ? "section, domain, skill, difficulty, question, answer, source"
    : "section, domain, skill, difficulty, question, answer";
  return [
    "id",
    "question_id",
    "selected_answer",
    "is_correct",
    "practice_set_id",
    "created_at",
    `sat_questions ( ${questionColumns} )`,
  ].join(", ");
}

const PAGE_SIZE = 1000;
/** Stop and report an error instead of returning a silently shortened history. */
const MAX_FACTS = 50000;

function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

function devBypass(): boolean {
  return allowsPracticeDevBypass(process.env.NODE_ENV, process.env.SAT_PRACTICE_DEV_BYPASS);
}

function userClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}

function migrationRequired() {
  return NextResponse.json(
    { error: "Apply migration 072 in the Supabase SQL Editor before using SAT practice attempts." },
    { status: 503 },
  );
}

async function loadGradeKey(questionId: string): Promise<GradeKey | null | "missing-table"> {
  const admin = adminClient();
  const { data, error } = await admin
    .from("sat_questions")
    .select("type, answer")
    .eq("id", questionId)
    .maybeSingle();
  if (error) {
    const message = error.message ?? "";
    const missingQuestions = /sat_questions/i.test(message) && /does not exist|schema cache|could not find/i.test(message);
    if (isMissingAttemptsTable(error) || missingQuestions) return "missing-table";
    throw new Error(message);
  }
  if (!data || (data.type !== "mcq" && data.type !== "spr") || typeof data.answer !== "string") return null;
  return { type: data.type, answer: data.answer };
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const body = parseAttemptBody(raw);
  if (!body) return NextResponse.json({ error: "Invalid attempt" }, { status: 400 });

  if (!supabaseConfigured()) {
    if (!devBypass()) {
      return NextResponse.json({ error: "Practice recording is not configured." }, { status: 503 });
    }
    const key = mockQuestionKey(body.questionId);
    if (!key) return NextResponse.json({ error: "Question not found" }, { status: 404 });
    return NextResponse.json({
      isCorrect: gradeSatResponse(key, body.selectedAnswer),
      recorded: false,
    });
  }

  const token = request.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;

  let key: GradeKey | null | "missing-table";
  try {
    key = await loadGradeKey(body.questionId);
  } catch {
    return NextResponse.json({ error: "Could not grade this answer." }, { status: 500 });
  }
  if (key === "missing-table") return migrationRequired();
  if (!key && devBypass()) {
    const mock = mockQuestionKey(body.questionId);
    if (mock) {
      return NextResponse.json({
        isCorrect: gradeSatResponse(mock, body.selectedAnswer),
        recorded: false,
      });
    }
  }
  if (!key) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const isCorrect = gradeSatResponse(key, body.selectedAnswer);
  if (caller.role !== "student") {
    return NextResponse.json({ isCorrect, recorded: false });
  }
  if (caller.linkedId === null) {
    return NextResponse.json({ error: "This account is not linked to a student." }, { status: 409 });
  }

  const client = userClient(token);
  // No unique index: existing production rows may already repeat a question.
  // If one is already stored, keep it and skip the insert. A parallel insert
  // can still land twice; history then counts the earliest row.
  const { data: existing, error: existingError } = await client
    .from("sat_attempts")
    .select("id, is_correct, created_at")
    .eq("student_id", caller.linkedId)
    .eq("practice_set_id", body.practiceSetId)
    .eq("question_id", body.questionId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(20);
  if (existingError) {
    if (isMissingAttemptsTable(existingError)) return migrationRequired();
    return NextResponse.json({ error: "Could not record this answer." }, { status: 500 });
  }
  const prior = earliestSavedAnswer(existing ?? []);
  if (prior) {
    return NextResponse.json({ isCorrect: prior.isCorrect, recorded: true });
  }

  const { data, error } = await client
    .from("sat_attempts")
    .insert({
      student_id: caller.linkedId,
      question_id: body.questionId,
      selected_answer: body.selectedAnswer,
      is_correct: isCorrect,
      time_spent_seconds: body.timeSpentSeconds,
      practice_set_id: body.practiceSetId,
    })
    .select("is_correct")
    .single();

  if (error || !data || typeof data.is_correct !== "boolean") {
    if (isMissingAttemptsTable(error)) return migrationRequired();
    return NextResponse.json({ error: "Could not record this answer." }, { status: 500 });
  }

  return NextResponse.json({ isCorrect: data.is_correct, recorded: true });
}

function historyPayload(attempts: ReturnType<typeof groupPracticeAttempts>, offset: number) {
  const page = sliceAttemptHistory(attempts, offset);
  return {
    history: page.history,
    historyOffset: page.offset,
    historyHasMore: page.hasMore,
    historyNextOffset: page.nextOffset,
  };
}

function tooLarge() {
  return NextResponse.json({ error: "SAT practice history is too large to load." }, { status: 500 });
}

async function loadAttemptPages(options: {
  studentId: number;
  columns: string;
  practiceSetId?: string;
  onlyNullSet?: boolean;
}): Promise<{ rows: unknown[] } | { error: NextResponse }> {
  const admin = adminClient();
  const rows: unknown[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let query = admin
      .from("sat_attempts")
      .select(options.columns)
      .eq("student_id", options.studentId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
    if (options.practiceSetId) query = query.eq("practice_set_id", options.practiceSetId);
    if (options.onlyNullSet) query = query.is("practice_set_id", null);
    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) {
      if (isMissingAttemptsTable(error)) return { error: migrationRequired() };
      return { error: NextResponse.json({ error: "Could not load SAT practice results." }, { status: 500 }) };
    }
    const page = data ?? [];
    if (rows.length + page.length > MAX_FACTS) return { error: tooLarge() };
    rows.push(...page);
    if (page.length < PAGE_SIZE) return { rows };
    if (from + PAGE_SIZE >= MAX_FACTS) {
      let probe = admin
        .from("sat_attempts")
        .select("id")
        .eq("student_id", options.studentId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });
      if (options.practiceSetId) probe = probe.eq("practice_set_id", options.practiceSetId);
      if (options.onlyNullSet) probe = probe.is("practice_set_id", null);
      const extra = await probe.range(MAX_FACTS, MAX_FACTS);
      if (extra.error) {
        if (isMissingAttemptsTable(extra.error)) return { error: migrationRequired() };
        return { error: NextResponse.json({ error: "Could not load SAT practice results." }, { status: 500 }) };
      }
      if ((extra.data ?? []).length > 0) return { error: tooLarge() };
      return { rows };
    }
  }
}

export async function GET(request: Request) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "Practice results are not configured." }, { status: 503 });
  }

  const url = new URL(request.url);
  const studentId = Number(url.searchParams.get("studentId"));
  if (!Number.isInteger(studentId) || studentId <= 0) {
    return NextResponse.json({ error: "Invalid student" }, { status: 400 });
  }
  const offsetRaw = url.searchParams.get("offset");
  if (offsetRaw !== null && !/^\d+$/.test(offsetRaw)) {
    return NextResponse.json({ error: "Invalid offset" }, { status: 400 });
  }
  const offset = offsetRaw === null ? 0 : Number(offsetRaw);
  const attemptId = url.searchParams.get("attemptId");
  if (attemptId !== null && !isAttemptHistoryId(attemptId)) {
    return NextResponse.json({ error: "Invalid attempt" }, { status: 400 });
  }
  const historyOnly = url.searchParams.get("scope") === "history" || offset > 0;

  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;
  if (caller.role === "parent") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = adminClient();
  const studentResult = await admin
    .from("students")
    .select("id, assigned_tutor_id")
    .eq("id", studentId)
    .maybeSingle();
  if (studentResult.error) return NextResponse.json({ error: "Could not load this student." }, { status: 500 });
  if (!studentResult.data) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const assignedTutorId = typeof studentResult.data.assigned_tutor_id === "number"
    ? studentResult.data.assigned_tutor_id
    : null;
  if (!canViewSatAttempts(caller, studentId, assignedTutorId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const includeSource = caller.role === "admin";
  const legacyDetail = attemptId?.startsWith("legacy:") === true;
  const loaded = await loadAttemptPages({
    studentId,
    columns: historyOnly && attemptId === null
      ? "id, question_id, selected_answer, is_correct, practice_set_id, created_at"
      : attemptColumns(includeSource),
    practiceSetId: attemptId !== null && !legacyDetail ? attemptId : undefined,
    onlyNullSet: legacyDetail,
  });
  if ("error" in loaded) return loaded.error;

  if (attemptId !== null) {
    const facts: AttemptFact[] = [];
    for (const row of loaded.rows) {
      const fact = attemptFactFromRow(row, includeSource);
      if (fact) facts.push(fact);
    }
    const questions = questionsForAttempt(facts, attemptId, { includeSource });
    if (!questions) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    return NextResponse.json({ questions });
  }

  if (historyOnly) {
    const facts: AttemptGroupFact[] = [];
    for (const row of loaded.rows) {
      const fact = attemptGroupFactFromRow(row);
      if (fact) facts.push(fact);
    }
    return NextResponse.json(historyPayload(groupPracticeAttempts(facts), offset));
  }

  const facts: AttemptFact[] = [];
  for (const row of loaded.rows) {
    const fact = attemptFactFromRow(row, includeSource);
    if (fact) facts.push(fact);
  }
  const summary = summarizeAttempts(studentId, facts, { includeSource });
  return NextResponse.json({
    ...summary,
    ...historyPayload(summary.history, 0),
  });
}
