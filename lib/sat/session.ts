import type { SatDifficulty, SatQuestion, SatSection } from "./types.ts";

export interface PracticeFilters {
  section: SatSection | "any";
  domain: string | "any";
  skill: string | "any";
  difficulty: SatDifficulty | "any";
  count: number;
  timed: boolean;
}

export interface StoredAnswer {
  response: string;
  checked: boolean;
  correct: boolean | null;
  marked: boolean;
  crossedOut: string[];
}

export interface StoredSession {
  id: string;
  /** Groups the attempts recorded for this run. Absent on sessions saved before attempt tracking. */
  practiceSetId?: string;
  startedAt: string;
  finishedAt: string | null;
  timed: boolean;
  durationSeconds: number;
  questionIds: string[];
  answers: Record<string, StoredAnswer>;
}

export interface AccuracyRow {
  key: string;
  correct: number;
  checked: number;
}

export interface QuestionRef {
  questionId: string;
  skill: string;
  difficulty: SatDifficulty;
  response: string;
  correctAnswer: string;
}

export interface SessionSummary {
  bySection: AccuracyRow[];
  bySkill: AccuracyRow[];
  byDifficulty: AccuracyRow[];
  missed: QuestionRef[];
  marked: QuestionRef[];
  unchecked: QuestionRef[];
}

export function emptyAnswer(): StoredAnswer {
  return {
    response: "",
    checked: false,
    correct: null,
    marked: false,
    crossedOut: [],
  };
}

export function filterQuestions(
  questions: readonly SatQuestion[],
  filters: Pick<PracticeFilters, "section" | "domain" | "skill" | "difficulty">,
): SatQuestion[] {
  return questions.filter((question) => {
    if (filters.section !== "any" && question.section !== filters.section) return false;
    if (filters.domain !== "any" && question.domain !== filters.domain) return false;
    if (filters.skill !== "any" && question.skill !== filters.skill) return false;
    if (filters.difficulty !== "any" && question.difficulty !== filters.difficulty) return false;
    return true;
  });
}

export function takeQuestions(questions: readonly SatQuestion[], count: number): SatQuestion[] {
  const size = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  return questions.slice(0, size);
}

/** Per question budget, in seconds. Math 95, Reading and Writing 71. */
export function timeBudgetSeconds(questions: readonly SatQuestion[]): number {
  return questions.reduce((sum, question) => sum + (question.section === "math" ? 95 : 71), 0);
}

export function createSession(
  questions: readonly SatQuestion[],
  timed: boolean,
  now = new Date(),
): StoredSession {
  const answers: Record<string, StoredAnswer> = {};
  for (const question of questions) answers[question.id] = emptyAnswer();
  return {
    id: `set-${now.getTime()}`,
    practiceSetId: globalThis.crypto.randomUUID(),
    startedAt: now.toISOString(),
    finishedAt: null,
    timed,
    durationSeconds: timeBudgetSeconds(questions),
    questionIds: questions.map((question) => question.id),
    answers,
  };
}

export function sessionScore(summary: Pick<SessionSummary, "bySkill">): { correct: number; checked: number } {
  return summary.bySkill.reduce(
    (total, row) => ({ correct: total.correct + row.correct, checked: total.checked + row.checked }),
    { correct: 0, checked: 0 },
  );
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function secondsRemaining(startedAtIso: string, durationSeconds: number, nowMs: number): number {
  const elapsed = (nowMs - Date.parse(startedAtIso)) / 1000;
  return durationSeconds - elapsed;
}

function parseNumberish(value: string): number | null {
  const compact = value.trim().replace(/\s+/g, "");
  if (/^[+-]?\d+(\.\d+)?$/.test(compact)) return Number(compact);
  const fraction = compact.match(/^([+-]?\d+)\/(\d+)$/);
  if (!fraction) return null;
  const denominator = Number(fraction[2]);
  if (denominator === 0) return null;
  return Number(fraction[1]) / denominator;
}

export function responsesMatch(expected: string, given: string): boolean {
  const left = expected.trim();
  const right = given.trim();
  if (right === "") return false;
  if (left === right) return true;
  const leftNumber = parseNumberish(left);
  const rightNumber = parseNumberish(right);
  if (leftNumber === null || rightNumber === null) return false;
  return Math.abs(leftNumber - rightNumber) < 1e-9;
}

export function checkAnswer(question: SatQuestion, response: string): boolean {
  const given = response.trim();
  if (given === "") return false;
  if (question.choices) return given === question.correctAnswer;
  return responsesMatch(question.correctAnswer, given);
}

function row(map: Map<string, AccuracyRow>, key: string, correct: boolean): void {
  const current = map.get(key) ?? { key, correct: 0, checked: 0 };
  current.checked += 1;
  if (correct) current.correct += 1;
  map.set(key, current);
}

export function summarizeSession(
  session: StoredSession,
  questions: readonly SatQuestion[],
): SessionSummary {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const bySection = new Map<string, AccuracyRow>();
  const bySkill = new Map<string, AccuracyRow>();
  const byDifficulty = new Map<string, AccuracyRow>();
  const missed: QuestionRef[] = [];
  const marked: QuestionRef[] = [];
  const unchecked: QuestionRef[] = [];

  for (const questionId of session.questionIds) {
    const question = byId.get(questionId);
    if (!question) continue;
    const answer = session.answers[questionId] ?? emptyAnswer();
    const ref: QuestionRef = {
      questionId,
      skill: question.skill,
      difficulty: question.difficulty,
      response: answer.response,
      correctAnswer: question.correctAnswer,
    };
    if (answer.marked) marked.push(ref);
    if (!answer.checked) {
      unchecked.push(ref);
      continue;
    }
    const correct = answer.correct === true;
    row(bySection, question.section, correct);
    row(bySkill, question.skill, correct);
    row(byDifficulty, question.difficulty, correct);
    if (!correct) missed.push(ref);
  }

  const sectionOrder: SatSection[] = ["math", "reading_writing"];
  const difficultyOrder: SatDifficulty[] = ["easy", "medium", "hard"];
  return {
    bySection: sectionOrder
      .map((section) => bySection.get(section))
      .filter((entry): entry is AccuracyRow => entry !== undefined),
    bySkill: [...bySkill.values()],
    byDifficulty: difficultyOrder
      .map((difficulty) => byDifficulty.get(difficulty))
      .filter((entry): entry is AccuracyRow => entry !== undefined),
    missed,
    marked,
    unchecked,
  };
}

export function summarizeSessions(
  sessions: readonly StoredSession[],
  questions: readonly SatQuestion[],
): Pick<SessionSummary, "bySkill" | "byDifficulty"> {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const bySkill = new Map<string, AccuracyRow>();
  const byDifficulty = new Map<string, AccuracyRow>();

  for (const session of sessions) {
    for (const questionId of session.questionIds) {
      const question = byId.get(questionId);
      const answer = session.answers[questionId];
      if (!question || !answer?.checked || answer.correct === null) continue;
      row(bySkill, question.skill, answer.correct);
      row(byDifficulty, question.difficulty, answer.correct);
    }
  }

  const difficultyOrder: SatDifficulty[] = ["easy", "medium", "hard"];
  return {
    bySkill: [...bySkill.values()],
    byDifficulty: difficultyOrder
      .map((difficulty) => byDifficulty.get(difficulty))
      .filter((entry): entry is AccuracyRow => entry !== undefined),
  };
}
