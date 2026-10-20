import type { SatQuestion } from "./types.ts";
import type { GradeKey } from "./attempts.ts";

/**
 * Local preview questions used only when SAT_PRACTICE_DEV_BYPASS=1 and the
 * question bank cannot be loaded. Production never reads this.
 */
export function mockPracticeQuestions(): SatQuestion[] {
  return [
    {
      id: "SAMPLE-RW",
      section: "reading_writing",
      domain: "Craft and Structure",
      skill: "Words in Context",
      difficulty: "easy",
      stem: "Sample: which word completes the sentence?",
      choices: [
        { label: "A", text: "precise" },
        { label: "B", text: "unrelated" },
      ],
      correctAnswer: "A",
      explanation: "Sample explanation. The word is precise.",
      format: "text",
      source: "metaminds",
    },
    {
      id: "SAMPLE-MCQ",
      section: "math",
      domain: "Algebra",
      skill: "Linear equations in one variable",
      difficulty: "medium",
      stem: "Sample: if x + 1 = 3, what is x?",
      choices: [
        { label: "A", text: "1" },
        { label: "B", text: "2" },
      ],
      correctAnswer: "B",
      explanation: "Sample explanation. x is 2.",
      format: "text",
      source: "metaminds",
    },
    {
      id: "SAMPLE-SPR",
      section: "math",
      domain: "Algebra",
      skill: "Linear functions",
      difficulty: "hard",
      stem: "Sample: enter the value of 4 divided by 2.",
      sprAnswer: "2",
      correctAnswer: "2",
      explanation: "Sample explanation. 4/2 equals 2.",
      format: "text",
      source: "metaminds",
    },
  ];
}

export function mockQuestionKey(id: string): GradeKey | null {
  const question = mockPracticeQuestions().find((item) => item.id === id);
  if (!question) return null;
  return {
    type: question.choices ? "mcq" : "spr",
    answer: question.correctAnswer,
  };
}
