import type { SatChoice, SatDifficulty, SatQuestion, SatQuestionBankFile, SatSection } from "./types.ts";

const SECTIONS: readonly SatSection[] = ["math", "reading_writing"];
const DIFFICULTIES: readonly SatDifficulty[] = ["easy", "medium", "hard"];

export class QuestionBankError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuestionBankError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSection(value: unknown): value is SatSection {
  return typeof value === "string" && SECTIONS.includes(value as SatSection);
}

function isDifficulty(value: unknown): value is SatDifficulty {
  return typeof value === "string" && DIFFICULTIES.includes(value as SatDifficulty);
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new QuestionBankError(`${label} must be a non-empty string.`);
  }
  return value;
}

function parseChoices(value: unknown, correctAnswer: string, label: string): SatChoice[] {
  if (!Array.isArray(value) || value.length < 2) {
    throw new QuestionBankError(`${label} needs at least two choices.`);
  }
  const labels = new Set<string>();
  const choices = value.map((choice, index) => {
    if (!isRecord(choice)) {
      throw new QuestionBankError(`${label} choice ${index + 1} must be an object.`);
    }
    const choiceLabel = requiredString(choice.label, `${label} choice ${index + 1} label`);
    const text = requiredString(choice.text, `${label} choice ${index + 1} text`);
    if (labels.has(choiceLabel)) {
      throw new QuestionBankError(`${label} repeats choice label ${choiceLabel}.`);
    }
    labels.add(choiceLabel);
    return { label: choiceLabel, text };
  });
  if (!labels.has(correctAnswer)) {
    throw new QuestionBankError(`${label} correctAnswer does not match a choice label.`);
  }
  return choices;
}

export function parseQuestion(value: unknown, index: number): SatQuestion {
  const label = `Question ${index + 1}`;
  if (!isRecord(value)) throw new QuestionBankError(`${label} must be an object.`);

  const section = value.section;
  if (!isSection(section)) {
    throw new QuestionBankError(`${label} section must be math or reading_writing.`);
  }

  const difficulty = value.difficulty;
  if (!isDifficulty(difficulty)) {
    throw new QuestionBankError(`${label} difficulty must be easy, medium, or hard.`);
  }

  const hasChoices = value.choices !== undefined;
  const hasSpr = value.sprAnswer !== undefined;
  if (hasChoices === hasSpr) {
    throw new QuestionBankError(`${label} needs choices or sprAnswer, not both.`);
  }

  const correctAnswer = requiredString(value.correctAnswer, `${label} correctAnswer`);
  const question: SatQuestion = {
    id: requiredString(value.id, `${label} id`),
    section,
    domain: requiredString(value.domain, `${label} domain`),
    skill: requiredString(value.skill, `${label} skill`),
    difficulty,
    stem: requiredString(value.stem, `${label} stem`),
    correctAnswer,
    explanation: requiredString(value.explanation, `${label} explanation`),
    source: requiredString(value.source, `${label} source`),
  };

  if (typeof value.passage === "string" && value.passage.trim() !== "") {
    question.passage = value.passage;
  }

  if (hasChoices) {
    question.choices = parseChoices(value.choices, correctAnswer, label);
  } else {
    const sprAnswer = requiredString(value.sprAnswer, `${label} sprAnswer`);
    if (sprAnswer !== correctAnswer) {
      throw new QuestionBankError(`${label} sprAnswer must match correctAnswer.`);
    }
    question.sprAnswer = sprAnswer;
  }

  return question;
}

export function parseQuestionBank(input: unknown): SatQuestionBankFile {
  if (!isRecord(input)) throw new QuestionBankError("Question bank must be an object.");
  if (input.batchId !== null && typeof input.batchId !== "string") {
    throw new QuestionBankError("batchId must be a string or null.");
  }
  if (typeof input.batchId === "string" && input.batchId.trim() === "") {
    throw new QuestionBankError("batchId must be a non-empty string or null.");
  }
  if (!Array.isArray(input.questions)) {
    throw new QuestionBankError("questions must be an array.");
  }

  const questions = input.questions.map((question, index) => parseQuestion(question, index));
  const ids = new Set<string>();
  for (const question of questions) {
    if (ids.has(question.id)) {
      throw new QuestionBankError(`Duplicate question id ${question.id}.`);
    }
    ids.add(question.id);
  }

  return {
    batchId: input.batchId === null ? null : input.batchId,
    questions,
  };
}
