import { basename } from "node:path";
import { QuestionBankError } from "./schema.ts";
import type { SatQuestionRow } from "./rows.ts";
import type { SatChoice, SatDifficulty, SatSection } from "./types.ts";

const SECTION_FROM_LABEL: Record<string, SatSection> = {
  Math: "math",
  math: "math",
  "Reading and Writing": "reading_writing",
  reading_writing: "reading_writing",
};

const DIFFICULTY_FROM: Record<string, SatDifficulty> = {
  easy: "easy",
  E: "easy",
  e: "easy",
  medium: "medium",
  M: "medium",
  m: "medium",
  hard: "hard",
  H: "hard",
  h: "hard",
};

export interface ImportMapResult {
  rows: SatQuestionRow[];
  warnings: string[];
}

export function sectionFromFileName(fileName: string): SatSection | null {
  const base = basename(fileName).toLowerCase();
  if (base.includes("math")) return "math";
  if (base.includes("english") || base.includes("reading") || base.includes("writing")) {
    return "reading_writing";
  }
  return null;
}

export function parseImportArgs(argv: string[]): { dryRun: boolean; files: string[] } {
  const dryRun = argv.includes("--dry-run");
  const files = argv.filter((arg) => arg !== "--dry-run" && !arg.startsWith("-"));
  if (files.length === 0) {
    throw new QuestionBankError("Pass at least one JSON file.");
  }
  return { dryRun, files };
}

export function mapImportDocument(input: unknown, fileName: string): ImportMapResult {
  const questions = documentQuestions(input, fileName);
  const warnings: string[] = [];
  const rows = questions.map((question, index) => mapImportRecord(question, fileName, index, warnings));
  const ids = new Set<string>();
  for (const row of rows) {
    if (ids.has(row.id)) {
      throw new QuestionBankError(`Duplicate question id ${row.id} in ${basename(fileName)}.`);
    }
    ids.add(row.id);
  }
  return { rows, warnings };
}

export function mergeImportFiles(parts: readonly ImportMapResult[]): ImportMapResult {
  const ids = new Set<string>();
  const rows: SatQuestionRow[] = [];
  const warnings: string[] = [];
  for (const part of parts) {
    warnings.push(...part.warnings);
    for (const row of part.rows) {
      if (ids.has(row.id)) {
        throw new QuestionBankError(`Duplicate question id ${row.id}.`);
      }
      ids.add(row.id);
      rows.push(row);
    }
  }
  return { rows, warnings };
}

export function summarizeImport(rows: readonly SatQuestionRow[]): string {
  const lines = [`rows ${rows.length}`];
  for (const key of ["source", "section", "difficulty"] as const) {
    lines.push(key);
    const counts = new Map<string, number>();
    for (const row of rows) counts.set(row[key], (counts.get(row[key]) ?? 0) + 1);
    for (const name of [...counts.keys()].sort()) {
      lines.push(`  ${name} ${counts.get(name)}`);
    }
  }
  return lines.join("\n");
}

function documentQuestions(input: unknown, fileName: string): unknown[] {
  if (Array.isArray(input)) return input;
  if (isRecord(input) && Array.isArray(input.questions)) return input.questions;
  throw new QuestionBankError(`${basename(fileName)} must be a JSON array of questions.`);
}

function mapImportRecord(
  value: unknown,
  fileName: string,
  index: number,
  warnings: string[],
): SatQuestionRow {
  const label = `${basename(fileName)} question ${index + 1}`;
  if (!isRecord(value)) throw new QuestionBankError(`${label} must be an object.`);
  if (isAiprepRecord(value)) return mapAiprepRecord(value, fileName, label, warnings);
  if (isDirectorRecord(value)) return mapDirectorRecord(value, fileName, label);
  throw new QuestionBankError(`${label} is not a MetaMinds batch record or an AIPrep record.`);
}

function isDirectorRecord(value: Record<string, unknown>): boolean {
  return typeof value.id === "string" && typeof value.question === "string" && typeof value.section === "string";
}

function isAiprepRecord(value: Record<string, unknown>): boolean {
  return typeof value.questionId === "string" && (
    typeof value.stem_html === "string" || typeof value.stimulus_html === "string"
  );
}

function mapDirectorRecord(value: Record<string, unknown>, fileName: string, label: string): SatQuestionRow {
  const id = exactString(value.id, `${label} id`);
  const type = mapType(value.type, label);
  const answer = exactString(value.answer, `${label} answer`);
  const choices = type === "spr" ? null : mapChoices(value.choices, answer, label);
  if (type === "spr" && value.choices !== null) {
    throw new QuestionBankError(`${label} spr choices must be null.`);
  }
  if (value.passage !== null && typeof value.passage !== "string") {
    throw new QuestionBankError(`${label} passage must be a string or null.`);
  }
  return {
    id,
    section: mapSection(value.section, fileName, label),
    domain: exactString(value.domain, `${label} domain`),
    skill: exactString(value.skill, `${label} skill`),
    skill_code: optionalString(value.skill_code) ?? optionalString(value.skill_cd),
    difficulty: mapDifficulty(value.difficulty, label),
    type,
    passage: typeof value.passage === "string" && value.passage !== "" ? value.passage : null,
    question: exactString(value.question, `${label} question`),
    choices,
    answer,
    explanation: exactString(value.explanation, `${label} explanation`),
    format: "text",
    source: "metaminds",
    source_ref: `${basename(fileName)}#${id}`,
    active: true,
  };
}

function mapAiprepRecord(
  value: Record<string, unknown>,
  fileName: string,
  label: string,
  warnings: string[],
): SatQuestionRow {
  const questionId = exactString(value.questionId, `${label} questionId`);
  const id = questionId.startsWith("CB-") ? questionId : `CB-${questionId}`;
  const type = mapType(value.type, label);
  const letters = readLetters(value.correct_letters);
  const answerText = optionalString(value.answer);
  const answer = type === "spr"
    ? (answerText ?? letters[0] ?? "")
    : (letters[0] ?? answerText ?? "");
  if (answer === "") throw new QuestionBankError(`${label} needs an answer.`);
  const choices = type === "spr" ? null : mapChoices(value.choices, answer, label);
  const rationale = typeof value.rationale_html === "string" ? value.rationale_html : "";
  if (rationale === "") warnings.push(`${id} has no rationale_html.`);
  const stimulus = optionalString(value.stimulus_html);
  return {
    id,
    section: mapSection(value.section, fileName, label),
    domain: exactString(value.domain_desc, `${label} domain_desc`),
    skill: exactString(value.skill_desc, `${label} skill_desc`),
    skill_code: optionalString(value.skill_cd),
    difficulty: mapDifficulty(value.difficulty, label),
    type,
    passage: stimulus,
    question: exactString(value.stem_html, `${label} stem_html`),
    choices,
    answer,
    explanation: rationale,
    format: "html",
    source: "college_board_test",
    source_ref: `${basename(fileName)}#${questionId}`,
    active: true,
  };
}

function mapSection(value: unknown, fileName: string, label: string): SatSection {
  if (typeof value === "string" && SECTION_FROM_LABEL[value]) return SECTION_FROM_LABEL[value];
  const fromFile = sectionFromFileName(fileName);
  if (fromFile) return fromFile;
  throw new QuestionBankError(`${label} section must be Math or Reading and Writing, or the file name must say math or english.`);
}

function mapDifficulty(value: unknown, label: string): SatDifficulty {
  if (typeof value === "string" && DIFFICULTY_FROM[value]) return DIFFICULTY_FROM[value];
  throw new QuestionBankError(`${label} difficulty must be easy, medium, hard, E, M, or H.`);
}

function mapType(value: unknown, label: string): "mcq" | "spr" {
  if (typeof value !== "string") throw new QuestionBankError(`${label} type must be mcq or spr.`);
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized === "mcq" || normalized === "multiple_choice" || normalized === "multiplechoice") return "mcq";
  if (
    normalized === "spr" ||
    normalized === "grid_in" ||
    normalized === "gridin" ||
    normalized === "student_produced_response"
  ) return "spr";
  throw new QuestionBankError(`${label} type must be mcq or spr.`);
}

function mapChoices(value: unknown, answer: string, label: string): SatChoice[] {
  let choices: SatChoice[];
  if (Array.isArray(value)) {
    if (value.length < 2) throw new QuestionBankError(`${label} needs at least two choices.`);
    choices = value.map((item, index) => {
      if (typeof item === "string") {
        return { label: String.fromCharCode(65 + index), text: exactString(item, `${label} choice ${index + 1}`) };
      }
      if (!isRecord(item)) throw new QuestionBankError(`${label} choice ${index + 1} must be an object.`);
      const choiceLabel = optionalString(item.label) ?? optionalString(item.letter) ?? optionalString(item.key)
        ?? String.fromCharCode(65 + index);
      const text = optionalString(item.text_html)
        ?? optionalString(item.html)
        ?? optionalString(item.text)
        ?? optionalString(item.body)
        ?? optionalString(item.content);
      if (!text) throw new QuestionBankError(`${label} choice ${choiceLabel} needs text.`);
      return { label: choiceLabel, text };
    });
  } else if (isRecord(value)) {
    const entries = Object.entries(value);
    if (entries.length < 2) throw new QuestionBankError(`${label} needs at least two choices.`);
    choices = entries.map(([choiceLabel, text]) => ({
      label: choiceLabel,
      text: exactString(text, `${label} choice ${choiceLabel}`),
    }));
  } else {
    throw new QuestionBankError(`${label} mcq choices must be an object or an array.`);
  }
  if (!choices.some((choice) => choice.label === answer)) {
    throw new QuestionBankError(`${label} answer does not match a choice label.`);
  }
  return choices;
}

function readLetters(value: unknown): string[] {
  if (typeof value === "string" && value.trim() !== "") {
    return value.split(/[\s,]+/).map((letter) => letter.trim()).filter(Boolean);
  }
  if (!Array.isArray(value)) return [];
  return value.filter((letter): letter is string => typeof letter === "string" && letter.trim() !== "")
    .map((letter) => letter.trim());
}

function exactString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new QuestionBankError(`${label} must be a non-empty string.`);
  }
  return value;
}

function optionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
