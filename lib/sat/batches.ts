import type { SatChoice, SatDifficulty, SatQuestion, SatSection } from "./types.ts";
import { QuestionBankError } from "./schema.ts";

/**
 * Director of Curriculum batch file.
 * Batch 02 and later use this same shape: a JSON array of these records.
 * `type` is `mcq` or `spr`. `choices` is null for spr.
 */
export interface DirectorBatchQuestion {
  id: string;
  section: "Math" | "Reading and Writing";
  domain: string;
  skill: string;
  difficulty: SatDifficulty;
  type: "mcq" | "spr";
  passage: string | null;
  question: string;
  choices: Record<string, string> | null;
  answer: string;
  explanation: string;
}

export interface PracticeBatch {
  source: string;
  questions: readonly unknown[];
}

const SECTION_FROM_LABEL: Record<string, SatSection> = {
  Math: "math",
  "Reading and Writing": "reading_writing",
};

const DIFFICULTIES: readonly SatDifficulty[] = ["easy", "medium", "hard"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new QuestionBankError(`${label} must be a non-empty string.`);
  }
  return value;
}

function mapChoices(value: unknown, answer: string, label: string): SatChoice[] {
  if (!isRecord(value)) {
    throw new QuestionBankError(`${label} mcq choices must be an object.`);
  }
  const entries = Object.entries(value);
  if (entries.length < 2) {
    throw new QuestionBankError(`${label} needs at least two choices.`);
  }
  const choices = entries.map(([choiceLabel, text], index) => {
    if (choiceLabel.trim() === "") {
      throw new QuestionBankError(`${label} choice ${index + 1} label must be a non-empty string.`);
    }
    return { label: choiceLabel, text: exactString(text, `${label} choice ${choiceLabel}`) };
  });
  if (!choices.some((choice) => choice.label === answer)) {
    throw new QuestionBankError(`${label} answer does not match a choice label.`);
  }
  return choices;
}

export function mapDirectorQuestion(value: unknown, index: number, source: string): SatQuestion {
  const label = `Question ${index + 1}`;
  if (!isRecord(value)) throw new QuestionBankError(`${label} must be an object.`);

  const section = SECTION_FROM_LABEL[exactString(value.section, `${label} section`)];
  if (!section) {
    throw new QuestionBankError(`${label} section must be Math or Reading and Writing.`);
  }
  if (typeof value.difficulty !== "string" || !DIFFICULTIES.includes(value.difficulty as SatDifficulty)) {
    throw new QuestionBankError(`${label} difficulty must be easy, medium, or hard.`);
  }
  const difficulty = value.difficulty as SatDifficulty;
  if (value.type !== "mcq" && value.type !== "spr") {
    throw new QuestionBankError(`${label} type must be mcq or spr.`);
  }
  if (value.passage !== null && typeof value.passage !== "string") {
    throw new QuestionBankError(`${label} passage must be a string or null.`);
  }
  if (typeof source !== "string" || source.trim() === "") {
    throw new QuestionBankError(`${label} source must be a non-empty string.`);
  }

  const question: SatQuestion = {
    id: exactString(value.id, `${label} id`),
    section,
    domain: exactString(value.domain, `${label} domain`),
    skill: exactString(value.skill, `${label} skill`),
    difficulty,
    stem: exactString(value.question, `${label} question`),
    correctAnswer: exactString(value.answer, `${label} answer`),
    explanation: exactString(value.explanation, `${label} explanation`),
    source,
  };
  if (typeof value.passage === "string" && value.passage !== "") {
    question.passage = value.passage;
  }

  if (value.type === "spr") {
    if (value.choices !== null) {
      throw new QuestionBankError(`${label} spr choices must be null.`);
    }
    question.sprAnswer = question.correctAnswer;
    return question;
  }

  if (value.choices === null) {
    throw new QuestionBankError(`${label} mcq choices must be an object.`);
  }
  question.choices = mapChoices(value.choices, question.correctAnswer, label);
  return question;
}

export function loadPracticeBatches(batches: readonly PracticeBatch[]): SatQuestion[] {
  const questions = batches.flatMap((batch) =>
    batch.questions.map((question, index) => mapDirectorQuestion(question, index, batch.source)),
  );
  const ids = new Set<string>();
  for (const question of questions) {
    if (ids.has(question.id)) {
      throw new QuestionBankError(`Duplicate question id ${question.id}.`);
    }
    ids.add(question.id);
  }
  return questions;
}
