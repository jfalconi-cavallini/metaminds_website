import raw from "../../data/sat/questions.json";
import { isFixtureQuestion, parseQuestionBank, selectPracticeQuestions } from "./schema.ts";
import type { SatQuestion } from "./types.ts";

/**
 * Batch 01 from Metaminds-vault is not in the repo yet.
 * `question-bank/sat/original/` does not exist, and the College Board
 * reference bank is internal pattern material, so it is not imported.
 * Until a real batch is converted, this file stays empty.
 * Development builds fall back to the three FIXTURE questions.
 * Those fixtures are required only outside production, so the production
 * bundle does not include their text.
 */
const bank = parseQuestionBank(raw);

export const SAT_BANK_BATCH_ID = bank.batchId;

const publishedQuestions = bank.questions.filter((question) => !isFixtureQuestion(question));

const devFixtures: readonly SatQuestion[] = process.env.NODE_ENV === "production"
  ? []
  // Loaded only when this module is evaluated outside production.
  // The production branch is a constant, so the fixture module is not part of that build.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  : (require("./fixtures.ts") as { FIXTURE_QUESTIONS: readonly SatQuestion[] }).FIXTURE_QUESTIONS;

export function getPracticeQuestions(): SatQuestion[] {
  if (process.env.NODE_ENV === "production" || publishedQuestions.length > 0) return publishedQuestions;
  return selectPracticeQuestions([], devFixtures, process.env.NODE_ENV);
}
