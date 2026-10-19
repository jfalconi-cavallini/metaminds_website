import type { SatQuestion } from "./types.ts";
import { FIXTURE_SOURCE } from "./schema.ts";

/**
 * Development stand-ins so the practice screens can be reviewed before
 * batch 01 lands. They are not SAT questions and they are not curriculum.
 * `selectPracticeQuestions` drops them from production builds.
 */
export const FIXTURE_QUESTIONS: readonly SatQuestion[] = [
  {
    id: "FIXTURE-1",
    section: "reading_writing",
    domain: "sat-rw-craft-structure",
    skill: "sat-rw-cs-vocabulary",
    difficulty: "easy",
    passage:
      "FIXTURE passage. This block is a development stand in so the two pane layout can be reviewed. It is not an SAT question and it is not curriculum.",
    stem: "FIXTURE. Which choice is the stand in answer?",
    choices: [
      { label: "A", text: "The stand in answer" },
      { label: "B", text: "A second placeholder" },
      { label: "C", text: "A third placeholder" },
      { label: "D", text: "A fourth placeholder" },
    ],
    correctAnswer: "A",
    explanation: "FIXTURE explanation. The stand in answer is choice A. This text is not an SAT explanation.",
    source: FIXTURE_SOURCE,
  },
  {
    id: "FIXTURE-2",
    section: "math",
    domain: "sat-math-algebra",
    skill: "sat-math-algebra-linear-equations-1v",
    difficulty: "medium",
    stem: "FIXTURE. Select the choice that shows $2 + 2$.",
    choices: [
      { label: "A", text: "$3$" },
      { label: "B", text: "$4$" },
      { label: "C", text: "$5$" },
      { label: "D", text: "$6$" },
    ],
    correctAnswer: "B",
    explanation: "FIXTURE explanation. $2 + 2 = 4$. This text is not an SAT explanation.",
    source: FIXTURE_SOURCE,
  },
  {
    id: "FIXTURE-3",
    section: "math",
    domain: "sat-math-geometry",
    skill: "sat-math-geometry-area-perimeter",
    difficulty: "hard",
    stem: "FIXTURE. Enter the value of $3 + 4$.",
    sprAnswer: "7",
    correctAnswer: "7",
    explanation: "FIXTURE explanation. The value is 7. This text is not an SAT explanation.",
    source: FIXTURE_SOURCE,
  },
];
