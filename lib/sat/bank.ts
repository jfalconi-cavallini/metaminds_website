import batch01 from "../../data/sat/batch-01.json";
import { REGISTERED_BATCH_FILES } from "./batchFiles.ts";
import { loadPracticeBatches, type PracticeBatch } from "./batches.ts";
import type { SatQuestion } from "./types.ts";

export { REGISTERED_BATCH_FILES };

/** Add the next Director batch here. Each file is a JSON array with the same fields. */
export const BATCH_01_SOURCE = "MetaMinds Director of Curriculum, sample batch 01";

export const PRACTICE_BATCHES: readonly PracticeBatch[] = [
  { source: BATCH_01_SOURCE, questions: batch01 },
];

export function getPracticeQuestions(): SatQuestion[] {
  return loadPracticeBatches(PRACTICE_BATCHES);
}
