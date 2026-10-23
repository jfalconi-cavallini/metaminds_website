import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";
import { allowsPracticeDevBypass } from "@/lib/sat/access";
import {
  attemptFactFromRow,
  canViewSatAttempts,
  gradeSatResponse,
  isMissingAttemptsTable,
  parseAttemptBody,
  summarizeAttempts,
  type AttemptFact,
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
const MAX_ROWS = 20000;

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

  const { data, error } = await userClient(token)
    .from("sat_attempts")
    .insert({
      student_id: caller.linkedId,
      question_id: body.questionId,
      selected_answer: body.selectedAnswer,
      is_correct: isCorrect,
      time_spent_seconds: body.timeSpentSeconds,
      // The practice app sends one id for every answer in a set. Null is kept
      // for older clients; history groups those rows by a time gap.
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

export async function GET(request: Request) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "Practice results are not configured." }, { status: 503 });
  }

  const studentId = Number(new URL(request.url).searchParams.get("studentId"));
  if (!Number.isInteger(studentId) || studentId <= 0) {
    return NextResponse.json({ error: "Invalid student" }, { status: 400 });
  }

  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;

  const admin = adminClient();
  const studentQuery = admin
    .from("students")
    .select("id, assigned_tutor_id")
    .eq("id", studentId)
    .maybeSingle();
  const parentQuery = caller.role === "parent"
    ? admin
      .from("parent_students")
      .select("student_id")
      .eq("parent_profile_id", caller.id)
      .eq("student_id", studentId)
      .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const [studentResult, parentResult] = await Promise.all([studentQuery, parentQuery]);
  if (studentResult.error) return NextResponse.json({ error: "Could not load this student." }, { status: 500 });
  if (!studentResult.data) return NextResponse.json({ error: "Student not found" }, { status: 404 });
  if (parentResult.error) return NextResponse.json({ error: "Could not verify access." }, { status: 500 });

  const assignedTutorId = typeof studentResult.data.assigned_tutor_id === "number"
    ? studentResult.data.assigned_tutor_id
    : null;
  const parentLinked = caller.role === "parent" && Boolean(parentResult.data);
  if (!canViewSatAttempts(caller, studentId, assignedTutorId, { parentLinked })) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const includeSource = caller.role === "admin";
  const facts: AttemptFact[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE_SIZE) {
    const { data, error } = await admin
      .from("sat_attempts")
      .select(attemptColumns(includeSource))
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      if (isMissingAttemptsTable(error)) return migrationRequired();
      return NextResponse.json({ error: "Could not load SAT practice results." }, { status: 500 });
    }
    const page = data ?? [];
    for (const row of page) {
      const fact = attemptFactFromRow(row, includeSource);
      if (fact) facts.push(fact);
    }
    if (page.length < PAGE_SIZE) break;
  }

  return NextResponse.json(summarizeAttempts(studentId, facts, { includeSource }));
}
