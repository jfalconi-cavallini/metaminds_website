/**
 * Linear Equations practice items.
 *
 * CURRICULUM REVIEW: these items are copied for an MVP game and still need
 * Director of Curriculum review. They are not an approved CMS lesson.
 *
 * Skill: sat-math-algebra-linear-equations-1v
 * SAT domain: Algebra (sat-math-algebra)
 * Vault repo: jfalconi-cavallini/Metaminds-vault
 *
 * Each source file says the items are original MetaMinds work, not College
 * Board question bank copies, and not a school Algebra 1 or TEKS worksheet.
 *
 * Level 1: curriculum/sat/math/algebra/Algebra_Linear_Equations/Solving_Linear_Equations/homework/level-1.md
 * Level 2: curriculum/sat/math/algebra/Algebra_Linear_Equations/Solving_Linear_Equations/homework/level-2.md
 * Level 3: curriculum/sat/math/algebra/Algebra_Linear_Equations/Solving_Linear_Equations/homework/level-3.md
 *
 * Prompts and correct answers are the question lines and Correct answer lines
 * from those files. Steps are the solution sentences from each Why line.
 * Tutor pattern labels such as "One-step isolate" stay out of the student
 * string, and em dashes in the Why lines are written as sentences here.
 */

export const LINEAR_SKILL_ID = "sat-math-algebra-linear-equations-1v";

export const LINEAR_SAT_DOMAIN = "Algebra";

export type LinearLevelId = "1" | "2" | "3";

export type LinearQuestion = {
  id: string;
  prompt: string;
  answer: string;
  accept: readonly string[];
  steps: string;
};

export type LinearLevel = {
  id: LinearLevelId;
  label: string;
  detail: string;
  source: string;
  questions: readonly LinearQuestion[];
};

const LEVEL_1_SOURCE =
  "curriculum/sat/math/algebra/Algebra_Linear_Equations/Solving_Linear_Equations/homework/level-1.md";
const LEVEL_2_SOURCE =
  "curriculum/sat/math/algebra/Algebra_Linear_Equations/Solving_Linear_Equations/homework/level-2.md";
const LEVEL_3_SOURCE =
  "curriculum/sat/math/algebra/Algebra_Linear_Equations/Solving_Linear_Equations/homework/level-3.md";

export const LINEAR_LEVELS: readonly LinearLevel[] = [
  {
    id: "1",
    label: "Level 1",
    detail: "Foundations",
    source: LEVEL_1_SOURCE,
    questions: [
      {
        id: "l1-q1",
        prompt: "Solve: x + 9 = 15",
        answer: "x = 6",
        accept: ["x = 6", "6"],
        steps: "Subtract 9 from both sides.",
      },
      {
        id: "l1-q2",
        prompt: "Solve: 4x = 28",
        answer: "x = 7",
        accept: ["x = 7", "7"],
        steps: "Divide both sides by 4.",
      },
      {
        id: "l1-q3",
        prompt: "Solve: 3x + 5 = 20",
        answer: "x = 5",
        accept: ["x = 5", "5"],
        steps: "Subtract 5: 3x = 15. Divide by 3.",
      },
      {
        id: "l1-q4",
        prompt: "Solve: 2x - 11 = 7",
        answer: "x = 9",
        accept: ["x = 9", "9"],
        steps: "Add 11: 2x = 18. Divide by 2.",
      },
      {
        id: "l1-q5",
        prompt: "Solve: 7x - 4 = 17",
        answer: "x = 3",
        accept: ["x = 3", "3"],
        steps: "Add 4: 7x = 21. Divide by 7.",
      },
    ],
  },
  {
    id: "2",
    label: "Level 2",
    detail: "Standard",
    source: LEVEL_2_SOURCE,
    questions: [
      {
        id: "l2-q1",
        prompt: "Solve: 6x - 4 = 2x + 12",
        answer: "x = 4",
        accept: ["x = 4", "4"],
        steps: "Subtract 2x: 4x - 4 = 12. Add 4: 4x = 16. Divide by 4.",
      },
      {
        id: "l2-q2",
        prompt: "Solve: (x + 3)/2 = 5",
        answer: "x = 7",
        accept: ["x = 7", "7"],
        steps: "Multiply every term by 2: x + 3 = 10. Subtract 3.",
      },
      {
        id: "l2-q3",
        prompt: "Solve: (2x - 1)/3 = (x + 4)/2",
        answer: "x = 14",
        accept: ["x = 14", "14"],
        steps: "Multiply every term by 6: 2(2x - 1) = 3(x + 4). That is 4x - 2 = 3x + 12. Subtract 3x: x - 2 = 12. Add 2.",
      },
      {
        id: "l2-q4",
        prompt: "Solve: 0.5x + 3 = 1.5x - 5",
        answer: "x = 8",
        accept: ["x = 8", "8"],
        steps: "Multiply every term by 2: x + 6 = 3x - 10. Subtract x: 6 = 2x - 10. Add 10: 16 = 2x. Divide by 2.",
      },
      {
        id: "l2-q5",
        prompt: "Solve: 4(x - 3) - (x + 2) = 2x - 8",
        answer: "x = 6",
        accept: ["x = 6", "6"],
        steps: "Distribute: 4x - 12 - x - 2 = 2x - 8. Subtracting (x + 2) means subtracting x and subtracting 2. Combine: 3x - 14 = 2x - 8. Subtract 2x: x - 14 = -8. Add 14.",
      },
    ],
  },
  {
    id: "3",
    label: "Level 3",
    detail: "Advanced",
    source: LEVEL_3_SOURCE,
    questions: [
      {
        id: "l3-q1",
        prompt: "Solve: 5(x + 1) = 5x + 3",
        answer: "no solution",
        accept: ["no solution", "no solutions", "there is no solution"],
        steps: "Distribute: 5x + 5 = 5x + 3. Subtract 5x: 5 = 3. That statement is false.",
      },
      {
        id: "l3-q2",
        prompt: "If 4x + 3 = 15, what is the value of 8x + 6?",
        answer: "30",
        accept: ["30"],
        steps: "The question asks for 8x + 6, not x. 8x + 6 = 2(4x + 3) = 2(15) = 30.",
      },
      {
        id: "l3-q3",
        prompt: "Solve: 2(2x - 5) = 4x - 10",
        answer: "infinitely many solutions",
        accept: ["infinitely many solutions", "infinitely many", "infinite solutions"],
        steps: "Distribute: 4x - 10 = 4x - 10. Subtract 4x: -10 = -10. That statement is true for every x.",
      },
      {
        id: "l3-q4",
        prompt: "If 2x - 9 = 5, what is the value of 2x + 3?",
        answer: "17",
        accept: ["17"],
        steps: "The question asks for 2x + 3, not x. 2x - 9 = 5, so 2x = 14. Then 2x + 3 = 14 + 3 = 17.",
      },
      {
        id: "l3-q5",
        prompt: "Solve: (x + 2)/3 = (x - 1)/3 + 2",
        answer: "no solution",
        accept: ["no solution", "no solutions", "there is no solution"],
        steps: "Multiply every term by 3: x + 2 = x - 1 + 6, so x + 2 = x + 5. Subtract x: 2 = 5. That statement is false.",
      },
    ],
  },
];

export function levelById(id: LinearLevelId): LinearLevel {
  const found = LINEAR_LEVELS.find((level) => level.id === id);
  if (!found) throw new Error(`Unknown linear equations level: ${id}`);
  return found;
}

export function normalizeAnswer(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, "");
}

export function isCorrectAnswer(input: string, question: LinearQuestion): boolean {
  const typed = normalizeAnswer(input);
  if (!typed) return false;
  return question.accept.some((form) => normalizeAnswer(form) === typed);
}
