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
const LEGACY_ATTEMPT_ID = /^legacy:[A-Za-z0-9_-]{1,80}$/;
const MAX_ANSWER_LENGTH = 200;
const MAX_TIME_SECONDS = 86400;

export interface ParsedAttemptBody {
  questionId: string;
  selectedAnswer: string;
  timeSpentSeconds: number | null;
  /** Required for new rows. Reads still accept older rows with a null set id. */
  practiceSetId: string;
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

  if (typeof body.practiceSetId !== "string" || !UUID_PATTERN.test(body.practiceSetId)) return null;

  return { questionId, selectedAnswer, timeSpentSeconds, practiceSetId: body.practiceSetId };
}

/** A practice-set id, or a legacy group id built from the first saved row. */
export function isAttemptHistoryId(value: string): boolean {
  return UUID_PATTERN.test(value) || LEGACY_ATTEMPT_ID.test(value);
}

export interface AttemptViewer {
  role: string;
  linkedId: number | null;
}

/**
 * Who may read one student's attempts. Matches migration 072:
 * a student reads their own linked id, a tutor reads students whose
 * assigned_tutor_id is the tutor's linked id, and an admin reads every student.
 * Parents are not included.
 */
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

/** Fields needed to group and score a saved answer. Question text is loaded only for an open attempt. */
export interface AttemptGroupFact {
  id: string;
  questionId: string;
  selectedAnswer: string | null;
  isCorrect: boolean;
  createdAt: string;
  /** Null on rows saved before the client sent a practice set id. */
  practiceSetId: string | null;
}

export interface AttemptFact extends AttemptGroupFact {
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

/**
 * Saved answers that share a practice set, or a legacy time gap.
 * `answered` is how many questions have a saved answer. It is not a finished-set size.
 * `latestAnswerAt` is the newest saved row in the group, which decides which group is latest.
 */
export interface PracticeAttempt {
  id: string;
  practiceSetId: string | null;
  startedAt: string;
  latestAnswerAt: string;
  latestAnswerId: string;
  answered: number;
  correct: number;
  percentCorrect: number;
}

export interface AttemptHistoryPage {
  history: PracticeAttempt[];
  offset: number;
  limit: number;
  hasMore: boolean;
  nextOffset: number | null;
}

/** How many attempt groups one history response includes. */
export const ATTEMPT_PAGE_SIZE = 20;

/** N answered, M correct (P%). Does not call the set complete. */
export function answeredScoreLabel(attempt: Pick<PracticeAttempt, "answered" | "correct" | "percentCorrect">): string {
  return `${attempt.answered} answered, ${attempt.correct} correct (${attempt.percentCorrect}%)`;
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

/** Ascending save order: earlier created_at, then lower id. */
function compareSavedOrder(aCreatedAt: string, aId: string, bCreatedAt: string, bId: string): number {
  const aTime = timeValue(aCreatedAt);
  const bTime = timeValue(bCreatedAt);
  const aOk = Number.isFinite(aTime);
  const bOk = Number.isFinite(bTime);
  if (aOk && bOk && aTime !== bTime) return aTime - bTime;
  if (aOk !== bOk) return aOk ? -1 : 1;
  return aCreatedAt.localeCompare(bCreatedAt) || aId.localeCompare(bId);
}

function byAnswerTime(a: AttemptGroupFact, b: AttemptGroupFact): number {
  return compareSavedOrder(a.createdAt, a.id, b.createdAt, b.id);
}

export interface SavedAnswerGrade {
  id: string;
  isCorrect: boolean;
  createdAt: string;
}

/**
 * The first stored answer for a question. Callers pass rows already limited
 * to one student, practice set, and question. An empty list means nothing was stored.
 */
export function earliestSavedAnswer(
  rows: readonly { id?: unknown; is_correct?: unknown; created_at?: unknown }[],
): SavedAnswerGrade | null {
  const usable = rows.flatMap((row) => {
    if (typeof row.id !== "string" || row.id === "") return [];
    if (typeof row.is_correct !== "boolean" || typeof row.created_at !== "string") return [];
    return [{ id: row.id, isCorrect: row.is_correct, createdAt: row.created_at }];
  });
  const first = [...usable].sort((a, b) => compareSavedOrder(a.createdAt, a.id, b.createdAt, b.id))[0];
  return first ?? null;
}

interface AttemptGroup {
  id: string;
  practiceSetId: string | null;
  rows: AttemptGroupFact[];
}

/** Earliest saved row wins. Same timestamp keeps the lower id. */
function firstSavedRow<T extends { id: string; createdAt: string }>(rows: readonly T[]): T | undefined {
  if (rows.length === 0) return undefined;
  return [...rows].sort((a, b) => compareSavedOrder(a.createdAt, a.id, b.createdAt, b.id))[0];
}

function lastSavedRow<T extends { id: string; createdAt: string }>(rows: readonly T[]): T | undefined {
  if (rows.length === 0) return undefined;
  return [...rows].sort((a, b) => compareSavedOrder(a.createdAt, a.id, b.createdAt, b.id)).at(-1);
}

/**
 * One row per question inside a single group. The first saved answer counts.
 * Later rows for the same question stay available for "newest saved answer" time.
 */
function firstAnswers(rows: readonly AttemptGroupFact[]): AttemptGroupFact[] {
  const ordered = [...rows].sort(byAnswerTime);
  const seen = new Set<string>();
  const kept: AttemptGroupFact[] = [];
  for (const row of ordered) {
    if (seen.has(row.questionId)) continue;
    seen.add(row.questionId);
    kept.push(row);
  }
  return kept;
}

function toPracticeAttempt(group: AttemptGroup): PracticeAttempt {
  const counted = firstAnswers(group.rows);
  const correct = counted.reduce((sum, row) => sum + (row.isCorrect ? 1 : 0), 0);
  const answered = counted.length;
  const first = firstSavedRow(group.rows);
  const last = lastSavedRow(group.rows);
  return {
    id: group.id,
    practiceSetId: group.practiceSetId,
    startedAt: first?.createdAt ?? "",
    latestAnswerAt: last?.createdAt ?? "",
    latestAnswerId: last?.id ?? "",
    answered,
    correct,
    percentCorrect: answered === 0 ? 0 : Math.round((correct / answered) * 100),
  };
}

function compareAttempts(a: PracticeAttempt, b: PracticeAttempt): number {
  const aTime = timeValue(a.latestAnswerAt);
  const bTime = timeValue(b.latestAnswerAt);
  const aOk = Number.isFinite(aTime);
  const bOk = Number.isFinite(bTime);
  if (aOk && bOk && aTime !== bTime) return bTime - aTime;
  if (aOk !== bOk) return aOk ? -1 : 1;
  return b.latestAnswerId.localeCompare(a.latestAnswerId) || b.id.localeCompare(a.id);
}

function collectGroups(rows: readonly AttemptGroupFact[]): AttemptGroup[] {
  const bySet = new Map<string, AttemptGroupFact[]>();
  const legacy: AttemptGroupFact[] = [];
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

  const groups: AttemptGroup[] = [];
  for (const [setId, groupRows] of bySet) {
    groups.push({ id: setId, practiceSetId: setId, rows: groupRows });
  }

  const orderedLegacy = [...legacy].sort(byAnswerTime);
  let current: AttemptGroupFact[] = [];
  const pushLegacy = () => {
    const first = firstSavedRow(current);
    groups.push({
      id: `legacy:${first?.id ?? current[0]?.id ?? "legacy"}`,
      practiceSetId: null,
      rows: current,
    });
  };
  for (const row of orderedLegacy) {
    const previous = current[current.length - 1];
    const previousTime = previous ? timeValue(previous.createdAt) : Number.NaN;
    const rowTime = timeValue(row.createdAt);
    const gap = Number.isFinite(previousTime) && Number.isFinite(rowTime)
      ? rowTime - previousTime
      : Number.POSITIVE_INFINITY;
    if (previous && gap > LEGACY_ATTEMPT_GAP_MS) {
      pushLegacy();
      current = [];
    }
    current.push(row);
  }
  if (current.length > 0) pushLegacy();
  return groups;
}

/**
 * Group saved answers into practice attempts, newest group first.
 * Newest means the latest saved row inside the group (`created_at`, then `id`).
 * A shared practice_set_id is one attempt. Null ids stay out of those
 * sets and are split when two neighboring answers are more than
 * LEGACY_ATTEMPT_GAP_MS apart. Duplicate question rows inside a group
 * count once, using the first saved answer.
 */
export function groupPracticeAttempts(rows: readonly AttemptGroupFact[]): PracticeAttempt[] {
  return collectGroups(rows).map(toPracticeAttempt).sort(compareAttempts);
}

/** One page of attempt summaries. `offset` is an attempt index, not a row index. */
export function sliceAttemptHistory(
  attempts: readonly PracticeAttempt[],
  offset: number,
  limit = ATTEMPT_PAGE_SIZE,
): AttemptHistoryPage {
  const start = Number.isInteger(offset) && offset > 0 ? offset : 0;
  const size = Number.isInteger(limit) && limit > 0 ? limit : ATTEMPT_PAGE_SIZE;
  const history = attempts.slice(start, start + size);
  const next = start + history.length;
  const hasMore = next < attempts.length;
  return {
    history: [...history],
    offset: start,
    limit: size,
    hasMore,
    nextOffset: hasMore ? next : null,
  };
}

function toQuestion(row: AttemptFact, includeSource: boolean): PracticeAttemptQuestion {
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
}

/**
 * Per-question detail for one attempt, in first-answer order.
 * Returns null when that attempt id is not in the rows.
 */
export function questionsForAttempt(
  rows: readonly AttemptFact[],
  attemptId: string,
  options: { includeSource: boolean },
): PracticeAttemptQuestion[] | null {
  const group = collectGroups(rows).find((item) => item.id === attemptId);
  if (!group) return null;
  const counted = firstAnswers(group.rows);
  const byId = new Map(rows.map((row) => [row.id, row]));
  return counted.flatMap((row) => {
    const fact = byId.get(row.id);
    return fact ? [toQuestion(fact, options.includeSource)] : [];
  });
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
    history: groupPracticeAttempts(rows),
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

function practiceAttemptFromRecord(item: unknown): PracticeAttempt | null {
  const row = asRecord(item);
  if (!row || typeof row.id !== "string" || row.id === "") return null;
  if (typeof row.startedAt !== "string" || typeof row.latestAnswerAt !== "string") return null;
  if (typeof row.latestAnswerId !== "string" || row.latestAnswerId === "") return null;
  if (typeof row.correct !== "number" || typeof row.answered !== "number" || typeof row.percentCorrect !== "number") return null;
  if (!Number.isInteger(row.correct) || !Number.isInteger(row.answered) || row.answered < 0 || row.correct < 0) return null;
  if (row.correct > row.answered) return null;
  if (row.practiceSetId !== null && typeof row.practiceSetId !== "string") return null;
  return {
    id: row.id,
    practiceSetId: typeof row.practiceSetId === "string" ? row.practiceSetId : null,
    startedAt: row.startedAt,
    latestAnswerAt: row.latestAnswerAt,
    latestAnswerId: row.latestAnswerId,
    answered: row.answered,
    correct: row.correct,
    percentCorrect: row.percentCorrect,
  };
}

function questionFromRecord(entry: unknown): PracticeAttemptQuestion | null {
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
  return parsed;
}

/**
 * History summaries from GET /api/sat/attempts.
 * Returns null when `history` is missing or a row is unusable. An empty list is valid.
 * Summaries do not include per-question detail.
 */
export function historyFromPayload(payload: unknown): PracticeAttempt[] | null {
  const body = asRecord(payload);
  if (!body || !Array.isArray(body.history)) return null;
  const attempts: PracticeAttempt[] = [];
  for (const item of body.history) {
    const parsed = practiceAttemptFromRecord(item);
    if (!parsed) return null;
    attempts.push(parsed);
  }
  return attempts;
}

/** Paged history. Null when the payload has no usable history array. */
export function historyPageFromPayload(payload: unknown): AttemptHistoryPage | null {
  const history = historyFromPayload(payload);
  if (!history) return null;
  const body = asRecord(payload);
  const offsetRaw = body?.historyOffset;
  const offset = typeof offsetRaw === "number" && Number.isInteger(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;
  const nextRaw = body?.historyNextOffset;
  const nextOffset = typeof nextRaw === "number" && Number.isInteger(nextRaw) && nextRaw >= 0 ? nextRaw : null;
  const hasMore = body?.historyHasMore === true && nextOffset !== null;
  return {
    history,
    offset,
    limit: history.length,
    hasMore,
    nextOffset: hasMore ? nextOffset : null,
  };
}

/** Questions returned for one expanded attempt. */
export function questionsFromPayload(payload: unknown): PracticeAttemptQuestion[] | null {
  const body = asRecord(payload);
  if (!body || !Array.isArray(body.questions)) return null;
  const questions: PracticeAttemptQuestion[] = [];
  for (const entry of body.questions) {
    const parsed = questionFromRecord(entry);
    if (!parsed) return null;
    questions.push(parsed);
  }
  return questions;
}

/** Grouping fields from a sat_attempts row that was not joined to the question bank. */
export function attemptGroupFactFromRow(value: unknown): AttemptGroupFact | null {
  const row = asRecord(value);
  if (!row || typeof row.id !== "string" || typeof row.question_id !== "string") return null;
  if (typeof row.is_correct !== "boolean" || typeof row.created_at !== "string") return null;
  const setId = typeof row.practice_set_id === "string" ? row.practice_set_id.trim() : "";
  return {
    id: row.id,
    questionId: row.question_id,
    selectedAnswer: typeof row.selected_answer === "string" ? row.selected_answer : null,
    isCorrect: row.is_correct,
    createdAt: row.created_at,
    practiceSetId: setId === "" ? null : setId,
  };
}

export function isMissingAttemptsTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  const message = error.message ?? "";
  return /sat_attempts/i.test(message) && /does not exist|schema cache|could not find/i.test(message);
}
