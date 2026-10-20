import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SAT_PRACTICE_ACCESS,
  allowsPracticeDevBypass,
  canEnterPractice,
  decidePracticeAccess,
  destinationAfterLogin,
  practiceLoginPath,
  practiceReturnPath,
} from "./access.ts";
import {
  domainOptions,
  domainsInQuestions,
  sectionLabel,
  skillOptions,
  skillTitle,
  skillsInQuestions,
} from "./catalog.ts";
import { splitMath } from "./math.ts";
import { SAT_PROGRESS_STORAGE_KEY, loadProgress, progressStorageKey, readProgress, saveProgress, type ProgressStorage } from "./progress.ts";
import { parseQuestion, parseQuestionBank } from "./schema.ts";
import {
  checkAnswer,
  createSession,
  filterQuestions,
  formatClock,
  responsesMatch,
  summarizeSession,
  summarizeSessions,
  takeQuestions,
  timeBudgetSeconds,
} from "./session.ts";
import type { SatQuestion } from "./types.ts";

function memoryStorage(): ProgressStorage & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

const passageQuestion: SatQuestion = {
  id: "Q-RW",
  section: "reading_writing",
  domain: "Craft and Structure",
  skill: "Words in context",
  difficulty: "easy",
  passage: "A short passage.",
  stem: "Which choice?",
  choices: [
    { label: "A", text: "one" },
    { label: "B", text: "two" },
  ],
  correctAnswer: "A",
  explanation: "A fits.",
  format: "text",
  source: "metaminds",
};

const mathChoiceQuestion: SatQuestion = {
  id: "Q-M",
  section: "math",
  domain: "Algebra",
  skill: "Linear equations in one variable",
  difficulty: "medium",
  stem: "What is x?",
  choices: [
    { label: "A", text: "1" },
    { label: "B", text: "2" },
  ],
  correctAnswer: "B",
  explanation: "x is 2.",
  format: "text",
  source: "metaminds",
};

const sprQuestion: SatQuestion = {
  id: "Q-SPR",
  section: "math",
  domain: "Algebra",
  skill: "Linear functions",
  difficulty: "hard",
  stem: "Enter the value.",
  sprAnswer: "-1",
  correctAnswer: "-1",
  explanation: "The value is -1.",
  format: "text",
  source: "college_board_test",
};

const practiceSet = [passageQuestion, mathChoiceQuestion, sprQuestion];

describe("parseQuestion", () => {
  it("accepts a multiple choice question and a student produced response", () => {
    assert.equal(parseQuestion(passageQuestion, 0).id, "Q-RW");
    assert.equal(parseQuestion(sprQuestion, 2).sprAnswer, "-1");
  });

  it("rejects a question with both choices and sprAnswer", () => {
    assert.throws(
      () => parseQuestion({ ...passageQuestion, sprAnswer: "A" }, 0),
      /choices or sprAnswer/,
    );
  });

  it("rejects a question with neither choices nor sprAnswer", () => {
    assert.throws(
      () => parseQuestion({ ...passageQuestion, choices: undefined }, 0),
      /choices or sprAnswer/,
    );
  });

  it("rejects a correct answer that is not one of the choices", () => {
    assert.throws(
      () => parseQuestion({ ...passageQuestion, correctAnswer: "Z" }, 0),
      /correctAnswer/,
    );
  });

  it("rejects a duplicate id in the bank", () => {
    assert.throws(
      () => parseQuestionBank({ batchId: "batch 01", questions: [passageQuestion, passageQuestion] }),
      /Duplicate/,
    );
  });
});

describe("practice session", () => {
  it("filters by section, domain, skill, and difficulty across every source", () => {
    const mixed = filterQuestions(practiceSet, {
      section: "any",
      domain: "any",
      skill: "any",
      difficulty: "any",
    });
    assert.deepEqual(mixed.map((question) => question.id), ["Q-RW", "Q-M", "Q-SPR"]);

    const mathOnly = filterQuestions(practiceSet, {
      section: "math",
      domain: "any",
      skill: "any",
      difficulty: "any",
    });
    assert.deepEqual(mathOnly.map((question) => question.id), ["Q-M", "Q-SPR"]);
    assert.deepEqual(mathOnly.map((question) => question.source), ["metaminds", "college_board_test"]);

    const oneSkill = filterQuestions(practiceSet, {
      section: "math",
      domain: "Algebra",
      skill: "Linear equations in one variable",
      difficulty: "medium",
    });
    assert.deepEqual(oneSkill.map((question) => question.id), ["Q-M"]);
  });

  it("takes the requested count in bank order", () => {
    assert.equal(takeQuestions(practiceSet, 2).length, 2);
    assert.equal(takeQuestions(practiceSet, 0).length, 0);
    assert.equal(takeQuestions(practiceSet, 9).length, 3);
  });

  it("checks choice labels exactly and student produced responses numerically", () => {
    assert.equal(checkAnswer(passageQuestion, "A"), true);
    assert.equal(checkAnswer(passageQuestion, "a"), false);
    assert.equal(checkAnswer(sprQuestion, "-1"), true);
    assert.equal(checkAnswer(sprQuestion, "-1.0"), true);
    assert.equal(checkAnswer(sprQuestion, "-2/2"), true);
    assert.equal(checkAnswer(sprQuestion, "8"), false);
    assert.equal(checkAnswer(sprQuestion, " "), false);
    assert.equal(responsesMatch("1/2", "0.5"), true);
  });

  it("budgets 95 seconds for math and 71 seconds for reading and writing", () => {
    assert.equal(timeBudgetSeconds(practiceSet), 71 + 95 + 95);
    assert.equal(formatClock(71), "01:11");
    assert.equal(formatClock(-4), "00:00");
  });

  it("summarizes accuracy, missed questions, and marked questions", () => {
    const session = createSession(practiceSet, true, new Date("2026-10-19T12:00:00Z"));
    session.answers["Q-RW"] = {
      response: "B",
      checked: true,
      correct: false,
      marked: true,
      crossedOut: ["C"],
    };
    session.answers["Q-M"] = {
      response: "B",
      checked: true,
      correct: true,
      marked: false,
      crossedOut: [],
    };
    session.answers["Q-SPR"] = {
      response: "",
      checked: false,
      correct: null,
      marked: true,
      crossedOut: [],
    };

    const summary = summarizeSession(session, practiceSet);
    assert.deepEqual(summary.bySection, [
      { key: "math", correct: 1, checked: 1 },
      { key: "reading_writing", correct: 0, checked: 1 },
    ]);
    assert.deepEqual(summary.bySkill, [
      { key: "Words in context", correct: 0, checked: 1 },
      { key: "Linear equations in one variable", correct: 1, checked: 1 },
    ]);
    assert.deepEqual(summary.byDifficulty, [
      { key: "easy", correct: 0, checked: 1 },
      { key: "medium", correct: 1, checked: 1 },
    ]);
    assert.deepEqual(summary.missed.map((item) => item.questionId), ["Q-RW"]);
    assert.deepEqual(summary.marked.map((item) => item.questionId), ["Q-RW", "Q-SPR"]);
    assert.deepEqual(summary.unchecked.map((item) => item.questionId), ["Q-SPR"]);

    const progress = summarizeSessions([session, session], practiceSet);
    assert.deepEqual(progress.bySkill[0], {
      key: "Words in context",
      correct: 0,
      checked: 2,
    });
  });
});

describe("progress storage", () => {
  it("round trips under a per user key and ignores other versions", () => {
    const storage = memoryStorage();
    const session = createSession([sprQuestion], false, new Date("2026-10-19T12:00:00Z"));
    const userId = "11111111-1111-4111-8111-111111111111";
    saveProgress(storage, { version: 1, active: session, completed: [] }, userId);
    const key = progressStorageKey(userId);
    assert.equal(storage.map.has(key), true);
    assert.equal(key, `${SAT_PROGRESS_STORAGE_KEY}.${userId}`);
    const loaded = loadProgress(storage, userId);
    assert.equal(loaded.active?.id, session.id);
    assert.deepEqual(loaded.completed, []);

    storage.setItem(key, JSON.stringify({ version: 2, active: session, completed: [] }));
    assert.equal(readProgress(storage.getItem(key)).active, null);
    assert.equal(readProgress("not json").active, null);
  });

  it("keeps one student's progress out of another student's key", () => {
    const storage = memoryStorage();
    const session = createSession([sprQuestion], false, new Date("2026-10-19T12:00:00Z"));
    const first = "11111111-1111-4111-8111-111111111111";
    const second = "22222222-2222-4222-8222-222222222222";
    saveProgress(storage, { version: 1, active: session, completed: [] }, first);
    const other = loadProgress(storage, second);
    assert.equal(other.active, null);
    assert.deepEqual(other.completed, []);
    assert.throws(() => progressStorageKey(""), /Invalid practice progress user id/);
  });
});

describe("access", () => {
  it("defaults to students and allows students, tutors, and admins", () => {
    assert.equal(SAT_PRACTICE_ACCESS, "students");
    assert.equal(canEnterPractice("students", "student"), true);
    assert.equal(canEnterPractice("students", "tutor"), true);
    assert.equal(canEnterPractice("students", "admin"), true);
    assert.equal(canEnterPractice("students", "parent"), false);
    assert.equal(canEnterPractice("students", null), false);
    assert.equal(canEnterPractice("public", null), true);
  });

  it("sends everyone else to login with the practice return path", () => {
    assert.equal(practiceLoginPath(), "/login?next=%2Fsat-practice");
    assert.equal(practiceReturnPath("/sat-practice"), "/sat-practice");
    assert.equal(practiceReturnPath("https://example.com"), null);
    assert.equal(practiceReturnPath("//example.com"), null);
    assert.equal(practiceReturnPath("/portal/admin"), null);

    const parent = decidePracticeAccess({
      access: "students",
      nodeEnv: "production",
      devBypass: "1",
      userId: "33333333-3333-4333-8333-333333333333",
      role: "parent",
    });
    assert.deepEqual(parent, { type: "redirect", location: "/login?next=%2Fsat-practice" });

    const student = decidePracticeAccess({
      access: "students",
      nodeEnv: "production",
      devBypass: "1",
      userId: "33333333-3333-4333-8333-333333333333",
      role: "student",
    });
    assert.deepEqual(student, { type: "allow", userId: "33333333-3333-4333-8333-333333333333" });
  });

  it("bypasses auth only outside production when the local flag is set", () => {
    assert.equal(allowsPracticeDevBypass("development", "1"), true);
    assert.equal(allowsPracticeDevBypass("production", "1"), false);
    assert.equal(allowsPracticeDevBypass("development", undefined), false);
    const bypass = decidePracticeAccess({
      access: "students",
      nodeEnv: "development",
      devBypass: "1",
      userId: null,
      role: null,
    });
    assert.deepEqual(bypass, { type: "allow", userId: "local-dev" });
  });

  it("returns signed-in students to practice and keeps other roles on their portals", () => {
    assert.equal(destinationAfterLogin("student", "/sat-practice"), "/sat-practice");
    assert.equal(destinationAfterLogin("tutor", "/sat-practice"), "/sat-practice");
    assert.equal(destinationAfterLogin("admin", "/sat-practice"), "/sat-practice");
    assert.equal(destinationAfterLogin("parent", "/sat-practice"), "/portal/parent");
    assert.equal(destinationAfterLogin("student", null), "/portal/student");
    assert.equal(destinationAfterLogin("student", "https://example.com"), "/portal/student");
  });
});

describe("catalog", () => {
  it("lists math domains and the skill title used by filters", () => {
    assert.equal(sectionLabel("reading_writing"), "Reading and Writing");
    assert.deepEqual(
      domainOptions("math").map((domain) => domain.slug),
      ["sat-math-algebra", "sat-math-advanced", "sat-math-data", "sat-math-geometry"],
    );
    const algebraSkills = skillOptions("math", "sat-math-algebra");
    assert.equal(
      algebraSkills.some((skill) => skill.slug === "sat-math-algebra-linear-equations-1v"),
      true,
    );
    assert.equal(skillTitle("sat-math-algebra-linear-equations-1v"), "Linear Equations (1 variable)");
  });

  it("lists domains and skills from the loaded questions in first-seen order", () => {
    assert.deepEqual(domainsInQuestions(practiceSet, "math"), ["Algebra"]);
    assert.deepEqual(skillsInQuestions(practiceSet, "math", "Algebra"), [
      "Linear equations in one variable",
      "Linear functions",
    ]);
  });
});

describe("math text", () => {
  it("leaves a single leading dollar sign as prose", () => {
    const jacket = "A jacket costs $40.";
    assert.deepEqual(splitMath(jacket), [{ kind: "text", value: jacket }]);
  });

  it("splits inline and display math from prose", () => {
    assert.deepEqual(splitMath("Value $2 + 2$ today"), [
      { kind: "text", value: "Value " },
      { kind: "math", value: "2 + 2", display: false },
      { kind: "text", value: " today" },
    ]);
    assert.deepEqual(splitMath("$$3 + 4$$"), [
      { kind: "math", value: "3 + 4", display: true },
    ]);
  });
});
