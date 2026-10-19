/**
 * Runtime SAT practice question.
 *
 * This is the shape served at /sat-practice. It is intentionally smaller than
 * the vault authoring schema in Metaminds-vault
 * `architecture/original-question-bank-schema.md`. Vault files stay the
 * authoring source. This type is what the practice screens read after
 * `data/sat/batch-*.json` files are mapped into this shape.
 *
 * A question carries either `choices` (multiple choice) or `sprAnswer`
 * (student produced response). `correctAnswer` is the choice label, or the
 * same accepted response stored on `sprAnswer`.
 * `source` is the vault path or the batch id the item came from.
 */

export type SatSection = "math" | "reading_writing";

export type SatDifficulty = "easy" | "medium" | "hard";

export interface SatChoice {
  label: string;
  text: string;
}

export interface SatQuestion {
  id: string;
  section: SatSection;
  domain: string;
  skill: string;
  difficulty: SatDifficulty;
  stem: string;
  passage?: string;
  choices?: SatChoice[];
  sprAnswer?: string;
  correctAnswer: string;
  explanation: string;
  source: string;
}

export interface SatQuestionBankFile {
  batchId: string | null;
  questions: SatQuestion[];
}
