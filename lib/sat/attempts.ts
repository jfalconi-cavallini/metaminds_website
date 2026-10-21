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

/** Who may read one student's attempts. Matches the sat_attempts select policies. */
export function canViewSatAttempts(
  viewer: AttemptViewer,
  studentId: number,
  assignedTutorId: number | null,
): boolean {
  if (!Number.isInteger(studentId) || studentId <= 0) return false;
  if (viewer.role === "admin") return true;
  if (viewer.role === "student") return viewer.linkedId === studentId;
  if (viewer.role === "tutor") {
    return viewer.linkedId !== null && assignedTutorId !== null && viewer.linkedId === assignedTutorId;
  }
  return false;
}

export interface AttemptFact {
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

export interface SatAttemptSummary {
  studentId: number;
  attempted: number;
  correct: number;
  percentCorrect: number | null;
  bySection: AccuracyBucket[];
  byDomain: AccuracyBucket[];
  bySkill: AccuracyBucket[];
  missed: MissedAttempt[];
}

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
  const fact: AttemptFact = {
    id: row.id,
    questionId: row.question_id,
    selectedAnswer: typeof row.selected_answer === "string" ? row.selected_answer : null,
    isCorrect: row.is_correct,
    createdAt: row.created_at,
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

export function isMissingAttemptsTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  const message = error.message ?? "";
  return /sat_attempts/i.test(message) && /does not exist|schema cache|could not find/i.test(message);
}
