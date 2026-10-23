import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  answeredScoreLabel,
  ATTEMPT_PAGE_SIZE,
  attemptFactFromRow,
  canViewSatAttempts,
  earliestSavedAnswer,
  gradeSatResponse,
  groupPracticeAttempts,
  historyFromPayload,
  historyPageFromPayload,
  isMissingAttemptsTable,
  LEGACY_ATTEMPT_GAP_MS,
  parseAttemptBody,
  plainStem,
  questionsForAttempt,
  questionsFromPayload,
  readGradeResponse,
  sliceAttemptHistory,
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
  it("accepts a trimmed answer and a practice set id", () => {
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
    assert.equal(parseAttemptBody({ questionId: "MM-001", selectedAnswer: "A" }), null);
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
    assert.equal(canViewSatAttempts({ role: "parent", linkedId: null }, 4, null), false);
    assert.equal(canViewSatAttempts({ role: "parent", linkedId: 4 }, 8, 9), false);
    assert.equal(canViewSatAttempts({ role: "parent", linkedId: 4 }, 0, null), false);
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
      practiceSetId: "11111111-1111-4111-8111-111111111111",
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
      practiceSetId: "11111111-1111-4111-8111-111111111111",
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
      practiceSetId: "11111111-1111-4111-8111-111111111111",
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
    assert.equal(summary.history.length, 1);
    assert.equal(summary.history[0]?.correct, 1);
    assert.equal(summary.history[0]?.answered, 3);
    assert.equal(summary.history[0]?.percentCorrect, 33);
    assert.equal("questions" in (summary.history[0] ?? {}), false);
    assert.equal("total" in (summary.history[0] ?? {}), false);
    assert.equal("completedAt" in (summary.history[0] ?? {}), false);
    const questions = questionsForAttempt(rows, summary.history[0]?.id ?? "", { includeSource: false });
    assert.deepEqual(questions?.map((question) => question.questionId), ["Q-1", "Q-2", "Q-3"]);
    assert.equal("source" in (questions?.[1] ?? {}), false);
    assert.equal(answeredScoreLabel(summary.history[0] ?? { answered: 0, correct: 0, percentCorrect: 0 }), "3 answered, 1 correct (33%)");
  });

  it("includes question source only for an admin summary", () => {
    const summary = summarizeAttempts(4, rows, { includeSource: true });
    assert.equal(summary.missed[0]?.source, "metaminds");
    assert.equal(summary.missed[1]?.questionId, "Q-2");
    assert.equal(summary.missed[1]?.source, "college_board_test");
    assert.equal(summary.missed[1]?.stem, "What is x?");
    const questions = questionsForAttempt(rows, summary.history[0]?.id ?? "", { includeSource: true });
    assert.equal(questions?.[1]?.source, "college_board_test");
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
    assert.equal(
      plainStem('<p><svg><text>2040</text></svg><span aria-hidden="true">______</span><span class="sr-only">blank</span> have</p>'),
      "______ have",
    );
  });

  it("returns an empty summary when the student has no attempts", () => {
    const summary = summarizeAttempts(4, [], { includeSource: true });
    assert.equal(summary.attempted, 0);
    assert.equal(summary.percentCorrect, null);
    assert.deepEqual(summary.missed, []);
    assert.deepEqual(summary.history, []);
  });
});

function fact(overrides: Partial<AttemptFact> & Pick<AttemptFact, "id" | "createdAt">): AttemptFact {
  return {
    questionId: overrides.id,
    selectedAnswer: "A",
    isCorrect: false,
    section: "math",
    domain: "Algebra",
    skill: "Linear equations",
    difficulty: "medium",
    stem: "<p>Stem</p>",
    correctAnswer: "B",
    practiceSetId: null,
    ...overrides,
  };
}

describe("groupPracticeAttempts", () => {
  const setA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const setB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

  it("groups a practice set, scores it, and lists questions in answer order", () => {
    const rows = [
      fact({ id: "2", questionId: "Q-2", createdAt: "2026-10-20T12:05:00.000Z", isCorrect: false, practiceSetId: setA, selectedAnswer: "C" }),
      fact({ id: "1", questionId: "Q-1", createdAt: "2026-10-20T12:00:00.000Z", isCorrect: true, practiceSetId: setA, selectedAnswer: "B", correctAnswer: "B" }),
      fact({ id: "3", questionId: "Q-3", createdAt: "2026-10-20T13:00:00.000Z", isCorrect: true, practiceSetId: setB, stem: "<b>Later</b>" }),
    ];
    const attempts = groupPracticeAttempts(rows);
    assert.deepEqual(attempts.map((attempt) => attempt.id), [setB, setA]);
    assert.equal(attempts[1]?.correct, 1);
    assert.equal(attempts[1]?.answered, 2);
    assert.equal(attempts[1]?.percentCorrect, 50);
    assert.equal(attempts[0]?.startedAt, "2026-10-20T13:00:00.000Z");
    assert.equal(attempts[0]?.latestAnswerAt, "2026-10-20T13:00:00.000Z");
    assert.equal(attempts[1]?.latestAnswerAt, "2026-10-20T12:05:00.000Z");
    assert.equal(attempts[1]?.latestAnswerId, "2");
    const questions = questionsForAttempt(rows, setA, { includeSource: false });
    assert.deepEqual(questions?.map((question) => question.questionId), ["Q-1", "Q-2"]);
    assert.equal(questions?.[0]?.selectedAnswer, "B");
    assert.equal(questions?.[0]?.isCorrect, true);
    assert.equal(questionsForAttempt(rows, setB, { includeSource: false })?.[0]?.stem, "Later");
    assert.equal(answeredScoreLabel(attempts[1]!), "2 answered, 1 correct (50%)");
    assert.equal(answeredScoreLabel(attempts[1]!).includes("complete"), false);
  });

  it("scores a partial set from the answers that were saved", () => {
    const attempts = groupPracticeAttempts([
      fact({ id: "only", questionId: "Q-1", createdAt: "2026-10-20T12:00:00.000Z", isCorrect: false, practiceSetId: setA }),
    ]);
    assert.equal(attempts.length, 1);
    assert.equal(attempts[0]?.answered, 1);
    assert.equal(attempts[0]?.correct, 0);
    assert.equal(attempts[0]?.percentCorrect, 0);
    assert.equal(answeredScoreLabel(attempts[0]!), "1 answered, 0 correct (0%)");
  });

  it("counts the first answer when the same question is saved twice", () => {
    const rows = [
      fact({ id: "second", questionId: "Q-1", createdAt: "2026-10-20T12:02:00.000Z", isCorrect: true, practiceSetId: setA, selectedAnswer: "B", correctAnswer: "B" }),
      fact({ id: "first", questionId: "Q-1", createdAt: "2026-10-20T12:00:00.000Z", isCorrect: false, practiceSetId: setA, selectedAnswer: "C" }),
      fact({ id: "other", questionId: "Q-2", createdAt: "2026-10-20T12:01:00.000Z", isCorrect: true, practiceSetId: setA, correctAnswer: "A", selectedAnswer: "A" }),
    ];
    const attempts = groupPracticeAttempts(rows);
    assert.equal(attempts.length, 1);
    assert.equal(attempts[0]?.answered, 2);
    assert.equal(attempts[0]?.correct, 1);
    assert.equal(attempts[0]?.latestAnswerAt, "2026-10-20T12:02:00.000Z");
    assert.equal(attempts[0]?.latestAnswerId, "second");
    const questions = questionsForAttempt(rows, setA, { includeSource: false });
    assert.deepEqual(questions?.map((question) => question.id), ["first", "other"]);
    assert.equal(questions?.[0]?.isCorrect, false);
  });

  it("orders groups by the newest saved answer, then that row id", () => {
    const attempts = groupPracticeAttempts([
      fact({ id: "a-row", questionId: "Q-1", createdAt: "2026-10-20T12:00:00.000Z", practiceSetId: setA }),
      fact({ id: "b-row", questionId: "Q-1", createdAt: "2026-10-20T12:00:00.000Z", practiceSetId: setB }),
    ]);
    assert.deepEqual(attempts.map((attempt) => attempt.latestAnswerId), ["b-row", "a-row"]);
  });

  it("splits null practice set ids on a 30 minute gap and keeps a gap of exactly 30 minutes together", () => {
    const start = Date.parse("2026-10-20T12:00:00.000Z");
    const inside = new Date(start + LEGACY_ATTEMPT_GAP_MS).toISOString();
    const outside = new Date(start + LEGACY_ATTEMPT_GAP_MS + 1).toISOString();
    const togetherRows = [
      fact({ id: "late", createdAt: inside, isCorrect: true }),
      fact({ id: "early", createdAt: "2026-10-20T12:00:00.000Z", isCorrect: false }),
    ];
    const together = groupPracticeAttempts(togetherRows);
    assert.equal(together.length, 1);
    assert.equal(together[0]?.id, "legacy:early");
    assert.equal(together[0]?.practiceSetId, null);
    assert.equal(together[0]?.correct, 1);
    assert.equal(together[0]?.answered, 2);
    assert.deepEqual(questionsForAttempt(togetherRows, "legacy:early", { includeSource: false })?.map((question) => question.id), ["early", "late"]);

    const splitRows = [
      fact({ id: "early", createdAt: "2026-10-20T12:00:00.000Z", questionId: "Q-same" }),
      fact({ id: "late", createdAt: outside, isCorrect: true, questionId: "Q-same" }),
    ];
    const split = groupPracticeAttempts(splitRows);
    assert.equal(split.length, 2);
    assert.equal(split[0]?.id, "legacy:late");
    assert.equal(split[1]?.id, "legacy:early");
    assert.equal(split[0]?.percentCorrect, 100);
    assert.equal(split[0]?.answered, 1);
    assert.equal(split[1]?.percentCorrect, 0);
    assert.equal(split[1]?.answered, 1);
  });

  it("does not fold a null row into a nearby practice set", () => {
    const attempts = groupPracticeAttempts([
      fact({ id: "set-row", createdAt: "2026-10-20T12:01:00.000Z", practiceSetId: setA, isCorrect: true }),
      fact({ id: "null-row", createdAt: "2026-10-20T12:02:00.000Z", practiceSetId: "  ", isCorrect: false }),
    ]);
    assert.equal(attempts.length, 2);
    assert.deepEqual(attempts.map((attempt) => attempt.practiceSetId), [null, setA]);
  });
});

describe("historyFromPayload", () => {
  const summary = {
    id: "set-1",
    practiceSetId: "set-1",
    startedAt: "2026-10-20T12:00:00.000Z",
    latestAnswerAt: "2026-10-20T12:05:00.000Z",
    latestAnswerId: "row-1",
    answered: 1,
    correct: 1,
    percentCorrect: 100,
  };

  it("reads a history summary without question detail", () => {
    const parsed = historyFromPayload({ history: [summary] });
    assert.equal(parsed?.length, 1);
    assert.equal(parsed?.[0]?.answered, 1);
    assert.equal(parsed?.[0]?.latestAnswerId, "row-1");
    assert.equal("questions" in (parsed?.[0] ?? {}), false);
    assert.equal(historyFromPayload({ history: [] })?.length, 0);
    assert.equal(historyFromPayload({ attempted: 1 }), null);
    assert.equal(historyFromPayload({}), null);
    assert.equal(historyFromPayload({ history: [{ id: "x" }] }), null);
    const page = historyPageFromPayload({
      history: [summary],
      historyOffset: 0,
      historyHasMore: true,
      historyNextOffset: 20,
    });
    assert.equal(page?.hasMore, true);
    assert.equal(page?.nextOffset, 20);
    assert.equal(historyPageFromPayload({ attempted: 3 }), null);
  });

  it("reads questions for an expanded attempt", () => {
    const questions = questionsFromPayload({
      questions: [{
        id: "row-1",
        questionId: "Q-1",
        selectedAnswer: "A",
        isCorrect: true,
        createdAt: "2026-10-20T12:00:00.000Z",
        section: "math",
        domain: "Algebra",
        skill: "Linear equations",
        difficulty: "easy",
        stem: "Plain stem",
        correctAnswer: "A",
        source: "college_board_test",
      }],
    });
    assert.equal(questions?.[0]?.questionId, "Q-1");
    assert.equal(questions?.[0]?.source, "college_board_test");
    assert.equal(questionsFromPayload({ history: [] }), null);
  });
});

describe("attempt history pages", () => {
  it("returns the latest 20 groups and a cursor for the rest", () => {
    const rows = Array.from({ length: ATTEMPT_PAGE_SIZE + 1 }, (_, index) => {
      const stamp = new Date(Date.parse("2026-10-20T12:00:00.000Z") + index * 60_000).toISOString();
      return fact({
        id: `row-${index}`,
        questionId: `Q-${index}`,
        createdAt: stamp,
        practiceSetId: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
        isCorrect: index % 2 === 0,
      });
    });
    const attempts = groupPracticeAttempts(rows);
    assert.equal(attempts.length, ATTEMPT_PAGE_SIZE + 1);
    assert.equal(attempts[0]?.id, rows[ATTEMPT_PAGE_SIZE]?.practiceSetId);
    const first = sliceAttemptHistory(attempts, 0);
    assert.equal(first.history.length, ATTEMPT_PAGE_SIZE);
    assert.equal(first.hasMore, true);
    assert.equal(first.nextOffset, ATTEMPT_PAGE_SIZE);
    const second = sliceAttemptHistory(attempts, first.nextOffset ?? 0);
    assert.equal(second.history.length, 1);
    assert.equal(second.hasMore, false);
    assert.equal(second.nextOffset, null);
    const empty = sliceAttemptHistory([], 0);
    assert.deepEqual(empty.history, []);
    assert.equal(empty.hasMore, false);
  });
});

describe("earliestSavedAnswer", () => {
  it("keeps the first stored grade when a duplicate post is checked", () => {
    const first = earliestSavedAnswer([
      { id: "b", is_correct: true, created_at: "2026-10-20T12:01:00.000Z" },
      { id: "a", is_correct: false, created_at: "2026-10-20T12:00:00.000Z" },
    ]);
    assert.deepEqual(first, { id: "a", isCorrect: false, createdAt: "2026-10-20T12:00:00.000Z" });
    const tied = earliestSavedAnswer([
      { id: "b", is_correct: true, created_at: "2026-10-20T12:00:00.000Z" },
      { id: "a", is_correct: false, created_at: "2026-10-20T12:00:00.000Z" },
    ]);
    assert.equal(tied?.id, "a");
    assert.equal(tied?.isCorrect, false);
    assert.equal(earliestSavedAnswer([]), null);
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
      practice_set_id: "11111111-1111-4111-8111-111111111111",
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
    assert.equal(hidden?.practiceSetId, "11111111-1111-4111-8111-111111111111");
    assert.equal(hidden?.source, undefined);
    assert.equal(attemptFactFromRow({ ...row, practice_set_id: null }, false)?.practiceSetId, null);
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
