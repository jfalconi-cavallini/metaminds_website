import { parseQuestionRow, rowToQuestion } from "./rows.ts";
import type { SatQuestion } from "./types.ts";

const COLUMNS = [
  "id",
  "section",
  "domain",
  "skill",
  "skill_code",
  "difficulty",
  "type",
  "passage",
  "question",
  "choices",
  "answer",
  "explanation",
  "format",
  "source",
  "source_ref",
  "active",
].join(", ");

const PAGE_SIZE = 1000;

export interface SatQuestionPage {
  data: unknown[] | null;
  error: { message: string } | null;
}

export interface SatQuestionsClient {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: boolean): {
        order(column: string, options: { ascending: boolean }): {
          range(from: number, to: number): PromiseLike<SatQuestionPage>;
        };
      };
    };
  };
}

/** Active questions visible to the signed-in student, tutor, or admin. */
export async function fetchSatQuestions(client: SatQuestionsClient): Promise<SatQuestion[]> {
  const questions: SatQuestion[] = [];
  let from = 0;
  for (;;) {
    const page = await client
      .from("sat_questions")
      .select(COLUMNS)
      .eq("active", true)
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (page.error) throw new Error(page.error.message);
    const rows = page.data ?? [];
    for (const row of rows) questions.push(rowToQuestion(parseQuestionRow(row)));
    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return questions;
}
