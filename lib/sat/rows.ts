import { QuestionBankError } from "./schema.ts";
import type { SatChoice, SatDifficulty, SatFormat, SatQuestion, SatSection, SatSource } from "./types.ts";

/** One row of public.sat_questions, without the database timestamps. */
export interface SatQuestionRow {
  id: string;
  section: SatSection;
  domain: string;
  skill: string;
  skill_code: string | null;
  difficulty: SatDifficulty;
  type: "mcq" | "spr";
  passage: string | null;
  question: string;
  choices: SatChoice[] | null;
  answer: string;
  explanation: string;
  format: SatFormat;
  source: SatSource;
  source_ref: string;
  active: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function rowToQuestion(row: SatQuestionRow): SatQuestion {
  const question: SatQuestion = {
    id: row.id,
    section: row.section,
    domain: row.domain,
    skill: row.skill,
    skillCode: row.skill_code,
    difficulty: row.difficulty,
    stem: row.question,
    correctAnswer: row.answer,
    explanation: row.explanation,
    format: row.format,
    source: row.source,
    sourceRef: row.source_ref,
  };
  if (row.passage) question.passage = row.passage;
  if (row.type === "spr") {
    question.sprAnswer = row.answer;
    return question;
  }
  if (!row.choices || row.choices.length < 2) {
    throw new QuestionBankError(`${row.id} needs at least two choices.`);
  }
  question.choices = row.choices;
  return question;
}

export function parseQuestionRow(value: unknown): SatQuestionRow {
  if (!isRecord(value)) throw new QuestionBankError("Question row must be an object.");
  const choices = value.choices === null || value.choices === undefined
    ? null
    : parseChoices(value.choices);
  const row: SatQuestionRow = {
    id: required(value.id, "id"),
    section: section(value.section),
    domain: required(value.domain, "domain"),
    skill: required(value.skill, "skill"),
    skill_code: value.skill_code === null || value.skill_code === undefined ? null : required(value.skill_code, "skill_code"),
    difficulty: difficulty(value.difficulty),
    type: value.type === "mcq" || value.type === "spr" ? value.type : fail("type"),
    passage: typeof value.passage === "string" && value.passage !== "" ? value.passage : null,
    question: required(value.question, "question"),
    choices,
    answer: required(value.answer, "answer"),
    explanation: typeof value.explanation === "string" ? value.explanation : fail("explanation"),
    format: value.format === "text" || value.format === "html" ? value.format : fail("format"),
    source: value.source === "metaminds" || value.source === "college_board_test" ? value.source : fail("source"),
    source_ref: required(value.source_ref, "source_ref"),
    active: value.active !== false,
  };
  return row;
}

function parseChoices(value: unknown): SatChoice[] {
  if (!Array.isArray(value)) throw new QuestionBankError("choices must be an array.");
  return value.map((choice, index) => {
    if (!isRecord(choice)) throw new QuestionBankError(`choice ${index + 1} must be an object.`);
    const text = choiceMarkup(choice);
    if (!text) throw new QuestionBankError(`choice ${index + 1} text must be a non-empty string.`);
    return {
      label: required(choice.label, `choice ${index + 1} label`),
      text,
    };
  });
}

/** Markup wins when a stored choice still carries both spoken text and HTML. */
function choiceMarkup(choice: Record<string, unknown>): string | null {
  for (const key of ["text_html", "html", "text", "body", "content"]) {
    const value = choice[key];
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return null;
}

function required(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new QuestionBankError(`${label} must be a non-empty string.`);
  }
  return value;
}

function fail(label: string): never {
  throw new QuestionBankError(`${label} is invalid.`);
}

function section(value: unknown): SatSection {
  if (value === "math" || value === "reading_writing") return value;
  return fail("section");
}

function difficulty(value: unknown): SatDifficulty {
  if (value === "easy" || value === "medium" || value === "hard") return value;
  return fail("difficulty");
}
