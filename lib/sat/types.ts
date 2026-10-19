/**
 * Runtime SAT practice question.
 *
 * This is the shape served at /sat-practice. It is intentionally smaller than
 * the vault authoring schema in Metaminds-vault
 * `architecture/original-question-bank-schema.md`. Vault files stay the
 * authoring source. Practice screens read this shape from the
 * `sat_questions` table through the signed-in user's session.
 *
 * A question carries either `choices` (multiple choice) or `sprAnswer`
 * (student produced response). `correctAnswer` is the choice label, or the
 * same accepted response stored on `sprAnswer`.
 * `format` `text` may contain `$...$` for KaTeX. `format` `html` is sanitized
 * before display and may contain MathML.
 * `source` is `metaminds` or `college_board_test`.
 */

export type SatSection = "math" | "reading_writing";

export type SatDifficulty = "easy" | "medium" | "hard";

export type SatFormat = "text" | "html";

export type SatSource = "metaminds" | "college_board_test";

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
  format: SatFormat;
  source: SatSource;
  skillCode?: string | null;
  sourceRef?: string;
}

export interface SatQuestionBankFile {
  batchId: string | null;
  questions: SatQuestion[];
}
