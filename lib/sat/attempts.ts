import { decodeHtmlEntities } from "./html.ts";
import type { SatDifficulty, SatSection, SatSource } from "./types.ts";
import { checkAnswer } from "./session.ts";

/** Question fields the grader needs. The answer comes from sat_questions, never from the client. */
export interface GradeKey {
  type: "mcq" | "spr";
  answer: string;
}

/**
 * Server grade for one submitted response.
 * Multiple choice matches the choice label exactly.
 * Student-produced responses use responsesMatch, including numeric equivalents.
 */
export function gradeSatResponse(question: GradeKey, selected: string): boolean {
  if (question.type === "mcq") {
    return checkAnswer(
      {
        id: "grade",
        section: "math",
        domain: "grade",
        skill: "grade",
        difficulty: "medium",
        stem: "grade",
        choices: [{ label: question.answer, text: question.answer }],
        correctAnswer: question.answer,
        explanation: "grade",
        format: "text",
        source: "metaminds",
      },
      selected,
    );
  }
  return checkAnswer(
    {
      id: "grade",
      section: "math",
      domain: "grade",
      skill: "grade",
      difficulty: "medium",
      stem: "grade",
      sprAnswer: question.answer,
      correctAnswer: question.answer,
      explanation: "grade",
      format: "text",
      source: "metaminds",
    },
    selected,
  );
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_ANSWER_LENGTH = 200;
const MAX_TIME_SECONDS = 86400;

export interface ParsedAttemptBody {
  questionId: string;
  selectedAnswer: string;
  timeSpentSeconds: number | null;
  practiceSetId: string | null;
}

export function parseAttemptBody(value: unknown): ParsedAttemptBody | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (typeof body.questionId !== "string") return null;
  const questionId = body.questionId.trim();
  if (questionId === "" || questionId.length > 120) return null;
  if (typeof body.selectedAnswer !== "string") return null;
  const selectedAnswer = body.selectedAnswer.trim();
  if (selectedAnswer === "" || selectedAnswer.length > MAX_ANSWER_LENGTH) return null;

  let timeSpentSeconds: number | null = null;
  if (body.timeSpentSeconds !== undefined && body.timeSpentSeconds !== null) {
    if (typeof body.timeSpentSeconds !== "number" || !Number.isInteger(body.timeSpentSeconds)) return null;
    if (body.timeSpentSeconds < 0 || body.timeSpentSeconds > MAX_TIME_SECONDS) return null;
    timeSpentSeconds = body.timeSpentSeconds;
  }

  let practiceSetId: string | null = null;
  if (body.practiceSetId !== undefined && body.practiceSetId !== null) {
    if (typeof body.practiceSetId !== "string" || !UUID_PATTERN.test(body.practiceSetId)) return null;
    practiceSetId = body.practiceSetId;
  }

  return { questionId, selectedAnswer, timeSpentSeconds, practiceSetId };
}

export interface AttemptViewer {
  role: string;
  linkedId: number | null;
}

export interface AttemptViewOptions {
  /**
   * True when a parent is linked to this student through parent_students,
   * the same rule as my_parent_student_ids().
   */
  parentLinked?: boolean;
}

/**
 * Who may read one student's attempts.
 * Students read their own linked id. Tutors read students whose
 * assigned_tutor_id is the tutor's linked id (my_assigned_student_ids).
 * Admins read every student. Parents read only when parentLinked is set.
 */
export function canViewSatAttempts(
  viewer: AttemptViewer,
  studentId: number,
  assignedTutorId: number | null,
  options?: AttemptViewOptions,
): boolean {
  if (!Number.isInteger(studentId) || studentId <= 0) return false;
  if (viewer.role === "admin") return true;
  if (viewer.role === "student") return viewer.linkedId === studentId;
  if (viewer.role === "tutor") {
    return viewer.linkedId !== null && assignedTutorId !== null && viewer.linkedId === assignedTutorId;
  }
  if (viewer.role === "parent") return options?.parentLinked === true;
  return false;
}

export interface AttemptFact {
  id: string;
  questionId: string;
  selectedAnswer: string | null;
  isCorrect: boolean;
  createdAt: string;
  /** Null on rows saved before the client sent a practice set id. */
  practiceSetId: string | null;
  section: SatSection;
  domain: string;
  skill: string;
  difficulty: SatDifficulty;
  stem: string;
  correctAnswer: string;
  source?: SatSource;
}

export interface AccuracyBucket {
  key: string;
  attempted: number;
  correct: number;
}

export interface MissedAttempt {
  attemptId: string;
  questionId: string;
  section: SatSection;
  domain: string;
  skill: string;
  difficulty: SatDifficulty;
  stem: string;
  selectedAnswer: string | null;
  correctAnswer: string;
  createdAt: string;
  source?: SatSource;
}

export interface PracticeAttemptQuestion {
  id: string;
  questionId: string;
  selectedAnswer: string | null;
  isCorrect: boolean;
  createdAt: string;
  section: SatSection;
  domain: string;
  skill: string;
  difficulty: SatDifficulty;
  stem: string;
  correctAnswer: string;
  source?: SatSource;
}

/** One practice run: every saved answer that belongs to the same set. */
export interface PracticeAttempt {
  id: string;
  practiceSetId: string | null;
  startedAt: string;
  completedAt: string;
  correct: number;
  total: number;
  percentCorrect: number;
  questions: PracticeAttemptQuestion[];
}

export interface SatAttemptSummary {
  studentId: number;
  attempted: number;
  correct: number;
  percentCorrect: number | null;
  bySection: AccuracyBucket[];
  byDomain: AccuracyBucket[];
  bySkill: AccuracyBucket[];
  missed: MissedAttempt[];
  history: PracticeAttempt[];
}

/**
 * Rows with no practice_set_id are one attempt while consecutive answers
 * stay within this gap. A longer pause starts another attempt.
 * Rows are not rewritten.
 */
export const LEGACY_ATTEMPT_GAP_MS = 30 * 60 * 1000;

const SECTION_ORDER: SatSection[] = ["math", "reading_writing"];

const STRUCTURAL_TAGS = new Set(["mfrac", "msup", "msub", "msubsup", "msqrt", "mroot", "mfenced", "mrow"]);
const SKIP_TAGS = new Set(["annotation", "annotation-xml", "script", "style", "svg"]);
const SPACED_OPERATORS = new Set(["=", "+", "-", "−", "–", "×", "·", "÷", "<", ">", "≤", "≥", "≠", "≈"]);

/**
 * Readable excerpt. Math tokens stay glued (`f(x)`, `25x`), and operators keep
 * a single space. Replacing every tag with a space turns `f(x)` into `f ( x )`.
 */
export function plainStem(value: string): string {
  const decoded = decodeHtmlEntities(value).replace(/&nbsp;/gi, " ");
  return mathAwareText(decoded).replace(/\s+/g, " ").trim();
}

function classHasSrOnly(part: string): boolean {
  const match = part.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  if (!match) return false;
  return (match[1] ?? match[2] ?? "").split(/\s+/).includes("sr-only");
}

function tokenText(text: string): string {
  const trimmed = text.trim();
  if (SPACED_OPERATORS.has(trimmed)) return ` ${trimmed} `;
  return text;
}

function fractionPart(value: string): string {
  const compact = value.replace(/\s+/g, " ").trim();
  return /[\s+\-=<>/]/.test(compact) ? `(${compact})` : compact;
}

function formatFrame(tag: string, chunks: string[]): string {
  if (tag === "mrow") return chunks.join("");
  const bits = chunks.map((chunk) => chunk.replace(/\s+/g, " ").trim()).filter(Boolean);
  if (tag === "mfrac") return `${fractionPart(bits[0] ?? "")}/${fractionPart(bits[1] ?? "")}`;
  if (tag === "msup") return `${bits[0] ?? ""}^${bits[1] ?? ""}`;
  if (tag === "msub") return `${bits[0] ?? ""}_${bits[1] ?? ""}`;
  if (tag === "msubsup") return `${bits[0] ?? ""}_${bits[1] ?? ""}^${bits[2] ?? ""}`;
  if (tag === "msqrt" || tag === "mroot") return `sqrt(${bits[0] ?? ""})`;
  if (tag === "mfenced") return `(${bits.join(", ")})`;
  return bits.join(" ");
}

function mathAwareText(html: string): string {
  const parts = html.split(/(<[^>]+>)/);
  const stack: { tag: string; chunks: string[] }[] = [{ tag: "#root", chunks: [] }];
  let skipTag = "";
  let skipDepth = 0;

  const pushText = (text: string) => {
    stack[stack.length - 1]?.chunks.push(text);
  };

  for (const part of parts) {
    if (!part) continue;
    if (!part.startsWith("<")) {
      if (skipDepth === 0) pushText(tokenText(part));
      continue;
    }
    const tag = (part.match(/^<\/?\s*([a-zA-Z][\w:-]*)/)?.[1] ?? "").toLowerCase();
    if (!tag) continue;
    const closing = part.startsWith("</");
    if (skipDepth > 0) {
      if (!closing && tag === skipTag) skipDepth += 1;
      else if (closing && tag === skipTag) skipDepth -= 1;
      continue;
    }
    if (!closing && (SKIP_TAGS.has(tag) || classHasSrOnly(part))) {
      if (!/\/>$/.test(part)) {
        skipTag = tag;
        skipDepth = 1;
      }
      continue;
    }
    if (!closing) {
      if (tag === "br" || tag === "hr") pushText(" ");
      if (STRUCTURAL_TAGS.has(tag)) stack.push({ tag, chunks: [] });
      continue;
    }
    if (tag === "p" || tag === "div" || tag === "li" || tag === "tr" || tag === "h1" || tag === "h2" || tag === "h3") {
      pushText(" ");
    }
    if (stack.length > 1 && stack[stack.length - 1]?.tag === tag) {
      const frame = stack.pop();
      if (frame) pushText(formatFrame(frame.tag, frame.chunks));
    }
  }

  while (stack.length > 1) {
    const frame = stack.pop();
    if (frame) pushText(formatFrame(frame.tag, frame.chunks));
  }
  return stack[0]?.chunks.join("") ?? "";
}

function clip(value: string, max = 180): string {
  const plain = plainStem(value);
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max - 1).trimEnd()}…`;
}

function addBucket(map: Map<string, AccuracyBucket>, key: string, correct: boolean): void {
  const current = map.get(key) ?? { key, attempted: 0, correct: 0 };
  current.attempted += 1;
  if (correct) current.correct += 1;
  map.set(key, current);
}

function byVolume(rows: AccuracyBucket[]): AccuracyBucket[] {
  return [...rows].sort((a, b) => b.attempted - a.attempted || a.key.localeCompare(b.key));
}

function timeValue(iso: string): number {
  const value = Date.parse(iso);
  return Number.isFinite(value) ? value : Number.NaN;
}

function byAnswerTime(a: AttemptFact, b: AttemptFact): number {
  const aTime = timeValue(a.createdAt);
  const bTime = timeValue(b.createdAt);
  const aOk = Number.isFinite(aTime);
  const bOk = Number.isFinite(bTime);
  if (aOk && bOk && aTime !== bTime) return aTime - bTime;
  if (aOk !== bOk) return aOk ? -1 : 1;
  return a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
}

function toPracticeAttempt(
  id: string,
  practiceSetId: string | null,
  rows: readonly AttemptFact[],
  includeSource: boolean,
): PracticeAttempt {
  const ordered = [...rows].sort(byAnswerTime);
  let correct = 0;
  const questions = ordered.map((row) => {
    if (row.isCorrect) correct += 1;
    const question: PracticeAttemptQuestion = {
      id: row.id,
      questionId: row.questionId,
      selectedAnswer: row.selectedAnswer,
      isCorrect: row.isCorrect,
      createdAt: row.createdAt,
      section: row.section,
      domain: row.domain,
      skill: row.skill,
      difficulty: row.difficulty,
      stem: clip(row.stem),
      correctAnswer: row.correctAnswer,
    };
    if (includeSource && row.source) question.source = row.source;
    return question;
  });
  const total = questions.length;
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  return {
    id,
    practiceSetId,
    startedAt: first?.createdAt ?? "",
    completedAt: last?.createdAt ?? "",
    correct,
    total,
    percentCorrect: total === 0 ? 0 : Math.round((correct / total) * 100),
    questions,
  };
}

/**
 * Group saved answers into practice attempts, newest attempt first.
 * A shared practice_set_id is one attempt. Null ids stay out of those
 * sets and are split when two neighboring answers are more than
 * LEGACY_ATTEMPT_GAP_MS apart.
 */
export function groupPracticeAttempts(
  rows: readonly AttemptFact[],
  options: { includeSource: boolean },
): PracticeAttempt[] {
  const bySet = new Map<string, AttemptFact[]>();
  const legacy: AttemptFact[] = [];
  for (const row of rows) {
    const setId = row.practiceSetId?.trim() ?? "";
    if (setId !== "") {
      const group = bySet.get(setId) ?? [];
      group.push(row);
      bySet.set(setId, group);
      continue;
    }
    legacy.push(row);
  }

  const attempts: PracticeAttempt[] = [];
  for (const [setId, group] of bySet) {
    attempts.push(toPracticeAttempt(setId, setId, group, options.includeSource));
  }

  const orderedLegacy = [...legacy].sort(byAnswerTime);
  let current: AttemptFact[] = [];
  for (const row of orderedLegacy) {
    const previous = current[current.length - 1];
    const previousTime = previous ? timeValue(previous.createdAt) : Number.NaN;
    const rowTime = timeValue(row.createdAt);
    const gap = Number.isFinite(previousTime) && Number.isFinite(rowTime)
      ? rowTime - previousTime
      : Number.POSITIVE_INFINITY;
    if (previous && gap > LEGACY_ATTEMPT_GAP_MS) {
      const first = [...current].sort(byAnswerTime)[0];
      attempts.push(toPracticeAttempt(`legacy:${first?.id ?? row.id}`, null, current, options.includeSource));
      current = [];
    }
    current.push(row);
  }
  if (current.length > 0) {
    const first = [...current].sort(byAnswerTime)[0];
    attempts.push(toPracticeAttempt(`legacy:${first?.id ?? current[0]?.id ?? "legacy"}`, null, current, options.includeSource));
  }

  attempts.sort((a, b) => {
    const aTime = timeValue(a.completedAt);
    const bTime = timeValue(b.completedAt);
    const aOk = Number.isFinite(aTime);
    const bOk = Number.isFinite(bTime);
    if (aOk && bOk && aTime !== bTime) return bTime - aTime;
    if (aOk !== bOk) return aOk ? -1 : 1;
    return b.id.localeCompare(a.id);
  });
  return attempts;
}

export function summarizeAttempts(
  studentId: number,
  rows: readonly AttemptFact[],
  options: { includeSource: boolean; missedLimit?: number },
): SatAttemptSummary {
  const limit = options.missedLimit ?? 12;
  const bySection = new Map<string, AccuracyBucket>();
  const byDomain = new Map<string, AccuracyBucket>();
  const bySkill = new Map<string, AccuracyBucket>();
  let correct = 0;
  const missed: MissedAttempt[] = [];

  const ordered = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
  for (const row of ordered) {
    if (row.isCorrect) correct += 1;
    addBucket(bySection, row.section, row.isCorrect);
    addBucket(byDomain, row.domain, row.isCorrect);
    addBucket(bySkill, row.skill, row.isCorrect);
    if (!row.isCorrect && missed.length < limit) {
      const item: MissedAttempt = {
        attemptId: row.id,
        questionId: row.questionId,
        section: row.section,
        domain: row.domain,
        skill: row.skill,
        difficulty: row.difficulty,
        stem: clip(row.stem),
        selectedAnswer: row.selectedAnswer,
        correctAnswer: row.correctAnswer,
        createdAt: row.createdAt,
      };
      if (options.includeSource && row.source) item.source = row.source;
      missed.push(item);
    }
  }

  const attempted = ordered.length;
  return {
    studentId,
    attempted,
    correct,
    percentCorrect: attempted === 0 ? null : Math.round((correct / attempted) * 100),
    bySection: SECTION_ORDER
      .map((section) => bySection.get(section))
      .filter((bucket): bucket is AccuracyBucket => bucket !== undefined),
    byDomain: byVolume([...byDomain.values()]),
    bySkill: byVolume([...bySkill.values()]),
    missed,
    history: groupPracticeAttempts(rows, { includeSource: options.includeSource }),
  };
}

const SECTIONS = new Set<SatSection>(["math", "reading_writing"]);
const DIFFICULTIES = new Set<SatDifficulty>(["easy", "medium", "hard"]);
const SOURCES = new Set<SatSource>(["metaminds", "college_board_test"]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function embeddedQuestion(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return asRecord(value[0]);
  return asRecord(value);
}

/** One sat_attempts row joined to sat_questions. Source is kept only when requested. */
export function attemptFactFromRow(value: unknown, includeSource: boolean): AttemptFact | null {
  const row = asRecord(value);
  const question = embeddedQuestion(row?.sat_questions);
  if (!row || !question) return null;
  if (typeof row.id !== "string" || typeof row.question_id !== "string") return null;
  if (typeof row.is_correct !== "boolean" || typeof row.created_at !== "string") return null;
  if (typeof question.section !== "string" || !SECTIONS.has(question.section as SatSection)) return null;
  if (typeof question.domain !== "string" || question.domain === "") return null;
  if (typeof question.skill !== "string" || question.skill === "") return null;
  if (typeof question.difficulty !== "string" || !DIFFICULTIES.has(question.difficulty as SatDifficulty)) return null;
  if (typeof question.question !== "string" || typeof question.answer !== "string") return null;
  const setId = typeof row.practice_set_id === "string" ? row.practice_set_id.trim() : "";
  const fact: AttemptFact = {
    id: row.id,
    questionId: row.question_id,
    selectedAnswer: typeof row.selected_answer === "string" ? row.selected_answer : null,
    isCorrect: row.is_correct,
    createdAt: row.created_at,
    practiceSetId: setId === "" ? null : setId,
    section: question.section as SatSection,
    domain: question.domain,
    skill: question.skill,
    difficulty: question.difficulty as SatDifficulty,
    stem: question.question,
    correctAnswer: question.answer,
  };
  if (
    includeSource &&
    typeof question.source === "string" &&
    SOURCES.has(question.source as SatSource)
  ) {
    fact.source = question.source as SatSource;
  }
  return fact;
}

export function readGradeResponse(payload: unknown): { isCorrect: boolean; recorded: boolean } | null {
  const body = asRecord(payload);
  if (!body || typeof body.isCorrect !== "boolean") return null;
  return { isCorrect: body.isCorrect, recorded: body.recorded === true };
}

function isSection(value: unknown): value is SatSection {
  return typeof value === "string" && SECTIONS.has(value as SatSection);
}

function isDifficulty(value: unknown): value is SatDifficulty {
  return typeof value === "string" && DIFFICULTIES.has(value as SatDifficulty);
}

/** History array from GET /api/sat/attempts. Returns null when the shape is unusable. */
export function historyFromPayload(payload: unknown): PracticeAttempt[] | null {
  const body = asRecord(payload);
  if (!body || !Array.isArray(body.history)) return null;
  const attempts: PracticeAttempt[] = [];
  for (const item of body.history) {
    const row = asRecord(item);
    if (!row || typeof row.id !== "string" || row.id === "") return null;
    if (typeof row.startedAt !== "string" || typeof row.completedAt !== "string") return null;
    if (typeof row.correct !== "number" || typeof row.total !== "number" || typeof row.percentCorrect !== "number") return null;
    if (!Number.isInteger(row.correct) || !Number.isInteger(row.total) || row.total < 0 || row.correct < 0) return null;
    if (row.practiceSetId !== null && typeof row.practiceSetId !== "string") return null;
    if (!Array.isArray(row.questions)) return null;
    const questions: PracticeAttemptQuestion[] = [];
    for (const entry of row.questions) {
      const question = asRecord(entry);
      if (!question || typeof question.id !== "string" || typeof question.questionId !== "string") return null;
      if (typeof question.isCorrect !== "boolean" || typeof question.createdAt !== "string") return null;
      if (question.selectedAnswer !== null && typeof question.selectedAnswer !== "string") return null;
      if (!isSection(question.section) || !isDifficulty(question.difficulty)) return null;
      if (typeof question.domain !== "string" || typeof question.skill !== "string") return null;
      if (typeof question.stem !== "string" || typeof question.correctAnswer !== "string") return null;
      const parsed: PracticeAttemptQuestion = {
        id: question.id,
        questionId: question.questionId,
        selectedAnswer: typeof question.selectedAnswer === "string" ? question.selectedAnswer : null,
        isCorrect: question.isCorrect,
        createdAt: question.createdAt,
        section: question.section,
        domain: question.domain,
        skill: question.skill,
        difficulty: question.difficulty,
        stem: question.stem,
        correctAnswer: question.correctAnswer,
      };
      if (typeof question.source === "string" && SOURCES.has(question.source as SatSource)) {
        parsed.source = question.source as SatSource;
      }
      questions.push(parsed);
    }
    attempts.push({
      id: row.id,
      practiceSetId: typeof row.practiceSetId === "string" ? row.practiceSetId : null,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      correct: row.correct,
      total: row.total,
      percentCorrect: row.percentCorrect,
      questions,
    });
  }
  return attempts;
}

export function isMissingAttemptsTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  const message = error.message ?? "";
  return /sat_attempts/i.test(message) && /does not exist|schema cache|could not find/i.test(message);
}
