import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  attemptFactFromRow,
  canViewSatAttempts,
  gradeSatResponse,
  isMissingAttemptsTable,
  parseAttemptBody,
  plainStem,
  readGradeResponse,
  summarizeAttempts,
  type AttemptFact,
} from "./attempts.ts";
import { createSession, sessionScore, summarizeSession } from "./session.ts";
import type { SatQuestion } from "./types.ts";

const rw: SatQuestion = {
  id: "Q-RW",
  section: "reading_writing",
  domain: "Craft and Structure",
  skill: "Words in Context",
  difficulty: "easy",
  stem: "Which word?",
  choices: [
    { label: "A", text: "one" },
    { label: "B", text: "two" },
  ],
  correctAnswer: "A",
  explanation: "A.",
  format: "text",
  source: "metaminds",
};

describe("gradeSatResponse", () => {
  it("grades multiple choice by the choice label and ignores the client's opinion", () => {
    const question = { type: "mcq" as const, answer: "B" };
    assert.equal(gradeSatResponse(question, "B"), true);
    assert.equal(gradeSatResponse(question, "b"), false);
    assert.equal(gradeSatResponse(question, " A "), false);
    assert.equal(gradeSatResponse(question, "1.0"), false);
    assert.equal(gradeSatResponse(question, ""), false);
  });

  it("accepts equivalent student-produced responses", () => {
    const question = { type: "spr" as const, answer: "1/2" };
    assert.equal(gradeSatResponse(question, "1/2"), true);
    assert.equal(gradeSatResponse(question, "0.5"), true);
    assert.equal(gradeSatResponse(question, " 1 / 2 "), true);
    assert.equal(gradeSatResponse(question, "2/4"), true);
    assert.equal(gradeSatResponse(question, "3"), false);
    assert.equal(gradeSatResponse(question, ""), false);
    assert.equal(gradeSatResponse({ type: "spr", answer: "-1" }, "-1.0"), true);
    assert.equal(gradeSatResponse({ type: "spr", answer: "-1" }, "-2/2"), true);
  });
});

describe("parseAttemptBody", () => {
  it("accepts a trimmed answer and an optional set id", () => {
    const parsed = parseAttemptBody({
      questionId: " MM-001 ",
      selectedAnswer: " B ",
      timeSpentSeconds: 42,
      practiceSetId: "11111111-1111-4111-8111-111111111111",
      isCorrect: true,
    });
    assert.deepEqual(parsed, {
      questionId: "MM-001",
      selectedAnswer: "B",
      timeSpentSeconds: 42,
      practiceSetId: "11111111-1111-4111-8111-111111111111",
    });
  });

  it("rejects a client grade standing in for a real answer, and rejects bad timing", () => {
    assert.equal(parseAttemptBody({ questionId: "MM-001", selectedAnswer: "   " }), null);
    assert.equal(parseAttemptBody({ questionId: "", selectedAnswer: "A" }), null);
    assert.equal(parseAttemptBody({ questionId: "MM-001", selectedAnswer: "A", timeSpentSeconds: 1.5 }), null);
    assert.equal(parseAttemptBody({ questionId: "MM-001", selectedAnswer: "A", timeSpentSeconds: -1 }), null);
    assert.equal(parseAttemptBody({ questionId: "MM-001", selectedAnswer: "A", practiceSetId: "set-1" }), null);
    assert.equal(parseAttemptBody(null), null);
  });
});

describe("canViewSatAttempts", () => {
  it("lets a student read only their row, a tutor read assigned students, and an admin read all", () => {
    assert.equal(canViewSatAttempts({ role: "student", linkedId: 4 }, 4, 9), true);
    assert.equal(canViewSatAttempts({ role: "student", linkedId: 4 }, 5, 9), false);
    assert.equal(canViewSatAttempts({ role: "tutor", linkedId: 9 }, 4, 9), true);
    assert.equal(canViewSatAttempts({ role: "tutor", linkedId: 9 }, 4, 3), false);
    assert.equal(canViewSatAttempts({ role: "tutor", linkedId: null }, 4, 9), false);
    assert.equal(canViewSatAttempts({ role: "admin", linkedId: null }, 4, null), true);
    assert.equal(canViewSatAttempts({ role: "parent", linkedId: 4 }, 4, 9), false);
  });
});

describe("summarizeAttempts", () => {
  const rows: AttemptFact[] = [
    {
      id: "b",
      questionId: "Q-2",
      selectedAnswer: "A",
      isCorrect: false,
      createdAt: "2026-10-19T12:00:00.000Z",
      section: "math",
      domain: "Algebra",
      skill: "Linear equations",
      difficulty: "medium",
      stem: "<p>What is x?</p>",
      correctAnswer: "B",
      source: "college_board_test",
    },
    {
      id: "a",
      questionId: "Q-1",
      selectedAnswer: "A",
      isCorrect: true,
      createdAt: "2026-10-18T12:00:00.000Z",
      section: "reading_writing",
      domain: "Craft and Structure",
      skill: "Words in Context",
      difficulty: "easy",
      stem: "Which word?",
      correctAnswer: "A",
      source: "metaminds",
    },
    {
      id: "c",
      questionId: "Q-3",
      selectedAnswer: "1",
      isCorrect: false,
      createdAt: "2026-10-20T12:00:00.000Z",
      section: "math",
      domain: "Algebra",
      skill: "Linear equations",
      difficulty: "hard",
      stem: "Enter a value.",
      correctAnswer: "2",
      source: "metaminds",
    },
  ];

  it("counts attempts, groups section domain and skill, and lists the newest misses", () => {
    const summary = summarizeAttempts(4, rows, { includeSource: false, missedLimit: 1 });
    assert.equal(summary.attempted, 3);
    assert.equal(summary.correct, 1);
    assert.equal(summary.percentCorrect, 33);
    assert.deepEqual(summary.bySection, [
      { key: "math", attempted: 2, correct: 0 },
      { key: "reading_writing", attempted: 1, correct: 1 },
    ]);
    assert.deepEqual(summary.byDomain[0], { key: "Algebra", attempted: 2, correct: 0 });
    assert.deepEqual(summary.bySkill[0], { key: "Linear equations", attempted: 2, correct: 0 });
    assert.equal(summary.missed.length, 1);
    assert.equal(summary.missed[0]?.questionId, "Q-3");
    assert.equal(summary.missed[0]?.stem, "Enter a value.");
    assert.equal("source" in (summary.missed[0] ?? {}), false);
  });

  it("includes question source only for an admin summary", () => {
    const summary = summarizeAttempts(4, rows, { includeSource: true });
    assert.equal(summary.missed[0]?.source, "metaminds");
    assert.equal(summary.missed[1]?.questionId, "Q-2");
    assert.equal(summary.missed[1]?.source, "college_board_test");
    assert.equal(summary.missed[1]?.stem, "What is x?");
    assert.equal(plainStem("<p>Hello&nbsp;there</p>"), "Hello there");
    assert.equal(plainStem("&lt;p&gt;Hello&amp;nbsp;there&#39;s&lt;/p&gt;"), "Hello there's");
    assert.equal(
      plainStem("<p>The function <math><mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><mn>25</mn><mi>x</mi><mo>+</mo><mn>30</mn></math>.</p>"),
      "The function f(x) = 25x + 30.",
    );
    assert.equal(
      plainStem("<math><mfrac><mrow><mn>12</mn><mi>x</mi><mo>+</mo><mn>28</mn></mrow><mn>4</mn></mfrac></math>"),
      "(12x + 28)/4",
    );
  });

  it("returns an empty summary when the student has no attempts", () => {
    const summary = summarizeAttempts(4, [], { includeSource: true });
    assert.equal(summary.attempted, 0);
    assert.equal(summary.percentCorrect, null);
    assert.deepEqual(summary.missed, []);
  });
});

describe("session score", () => {
  it("adds a practice set id and scores checked answers", () => {
    const session = createSession([rw], false, new Date("2026-10-19T12:00:00Z"));
    assert.match(session.practiceSetId ?? "", /^[0-9a-f-]{36}$/i);
    session.answers["Q-RW"] = {
      response: "B",
      checked: true,
      correct: false,
      marked: false,
      crossedOut: [],
    };
    const summary = summarizeSession(session, [rw]);
    assert.deepEqual(sessionScore(summary), { correct: 0, checked: 1 });
    assert.deepEqual(summary.missed.map((item) => item.questionId), ["Q-RW"]);
  });
});

describe("attempt rows", () => {
  it("reads a joined row and leaves source off unless asked", () => {
    const row = {
      id: "a",
      question_id: "Q-1",
      selected_answer: "B",
      is_correct: false,
      created_at: "2026-10-20T00:00:00.000Z",
      sat_questions: {
        section: "math",
        domain: "Algebra",
        skill: "Linear equations",
        difficulty: "easy",
        question: "<b>Stem</b>",
        answer: "A",
        source: "college_board_test",
      },
    };
    const hidden = attemptFactFromRow(row, false);
    assert.equal(hidden?.source, undefined);
    const shown = attemptFactFromRow(row, true);
    assert.equal(shown?.source, "college_board_test");
    assert.equal(shown?.stem, "<b>Stem</b>");
    assert.deepEqual(readGradeResponse({ isCorrect: false, recorded: true }), { isCorrect: false, recorded: true });
    assert.equal(readGradeResponse({ isCorrect: "yes" }), null);
    assert.deepEqual(readGradeResponse({ isCorrect: true }), { isCorrect: true, recorded: false });
  });
});

describe("isMissingAttemptsTable", () => {
  it("recognizes a missing sat_attempts relation", () => {
    assert.equal(isMissingAttemptsTable({ code: "42P01", message: "relation sat_attempts does not exist" }), true);
    assert.equal(isMissingAttemptsTable({ code: "PGRST205", message: "Could not find the table public.sat_attempts in the schema cache" }), true);
    assert.equal(isMissingAttemptsTable({ message: "permission denied" }), false);
    assert.equal(isMissingAttemptsTable(null), false);
  });
});
