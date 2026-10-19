import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { canEnterPractice } from "./access.ts";
import { domainOptions, sectionLabel, skillOptions, skillTitle } from "./catalog.ts";
import { FIXTURE_QUESTIONS } from "./fixtures.ts";
import { splitMath } from "./math.ts";
import { SAT_PROGRESS_STORAGE_KEY, loadProgress, readProgress, saveProgress, type ProgressStorage } from "./progress.ts";
import {
  isFixtureQuestion,
  parseQuestion,
  parseQuestionBank,
  selectPracticeQuestions,
} from "./schema.ts";
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

const passageQuestion = FIXTURE_QUESTIONS[0];
const mathChoiceQuestion = FIXTURE_QUESTIONS[1];
const sprQuestion = FIXTURE_QUESTIONS[2];

describe("question bank file", () => {
  it("ships an empty bank while batch 01 is pending", () => {
    const raw = JSON.parse(
      readFileSync(new URL("../../data/sat/questions.json", import.meta.url), "utf8"),
    ) as unknown;
    const bank = parseQuestionBank(raw);
    assert.equal(bank.batchId, null);
    assert.deepEqual(bank.questions, []);
  });
});

describe("parseQuestion", () => {
  it("accepts a multiple choice question and a student produced response", () => {
    assert.equal(parseQuestion(passageQuestion, 0).id, "FIXTURE-1");
    assert.equal(parseQuestion(sprQuestion, 2).sprAnswer, "7");
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

describe("selectPracticeQuestions", () => {
  it("never returns fixture questions in production", () => {
    const visible = selectPracticeQuestions(
      [passageQuestion, mathChoiceQuestion],
      FIXTURE_QUESTIONS,
      "production",
    );
    assert.deepEqual(visible, []);
  });

  it("uses at most three fixtures in development when the bank is empty", () => {
    const visible = selectPracticeQuestions([], FIXTURE_QUESTIONS, "development");
    assert.equal(visible.length, 3);
    assert.ok(visible.every(isFixtureQuestion));
    for (const question of visible) {
      assert.match(question.stem, /FIXTURE/);
      assert.match(question.explanation, /FIXTURE/);
      assert.equal(question.source, "FIXTURE");
    }
  });

  it("prefers real questions over fixtures outside production", () => {
    const real: SatQuestion = {
      ...mathChoiceQuestion,
      id: "mm-sat-q-real0001",
      source: "question-bank/sat/original/math/example.md",
    };
    const visible = selectPracticeQuestions([real, passageQuestion], FIXTURE_QUESTIONS, "development");
    assert.deepEqual(visible.map((question) => question.id), ["mm-sat-q-real0001"]);
  });
});

describe("practice session", () => {
  it("filters by section, domain, skill, and difficulty", () => {
    const mathOnly = filterQuestions(FIXTURE_QUESTIONS, {
      section: "math",
      domain: "any",
      skill: "any",
      difficulty: "any",
    });
    assert.deepEqual(mathOnly.map((question) => question.id), ["FIXTURE-2", "FIXTURE-3"]);

    const oneSkill = filterQuestions(FIXTURE_QUESTIONS, {
      section: "math",
      domain: "sat-math-algebra",
      skill: "sat-math-algebra-linear-equations-1v",
      difficulty: "medium",
    });
    assert.deepEqual(oneSkill.map((question) => question.id), ["FIXTURE-2"]);
  });

  it("takes the requested count in bank order", () => {
    assert.equal(takeQuestions(FIXTURE_QUESTIONS, 2).length, 2);
    assert.equal(takeQuestions(FIXTURE_QUESTIONS, 0).length, 0);
    assert.equal(takeQuestions(FIXTURE_QUESTIONS, 9).length, 3);
  });

  it("checks choice labels exactly and student produced responses numerically", () => {
    assert.equal(checkAnswer(passageQuestion, "A"), true);
    assert.equal(checkAnswer(passageQuestion, "a"), false);
    assert.equal(checkAnswer(sprQuestion, "7"), true);
    assert.equal(checkAnswer(sprQuestion, "7.0"), true);
    assert.equal(checkAnswer(sprQuestion, "14/2"), true);
    assert.equal(checkAnswer(sprQuestion, "8"), false);
    assert.equal(checkAnswer(sprQuestion, " "), false);
    assert.equal(responsesMatch("1/2", "0.5"), true);
  });

  it("budgets 95 seconds for math and 71 seconds for reading and writing", () => {
    assert.equal(timeBudgetSeconds(FIXTURE_QUESTIONS), 95 + 71 + 95);
    assert.equal(formatClock(71), "01:11");
    assert.equal(formatClock(-4), "00:00");
  });

  it("summarizes accuracy, missed questions, and marked questions", () => {
    const session = createSession(FIXTURE_QUESTIONS, true, new Date("2026-10-19T12:00:00Z"));
    session.answers["FIXTURE-1"] = {
      response: "B",
      checked: true,
      correct: false,
      marked: true,
      crossedOut: ["C"],
    };
    session.answers["FIXTURE-2"] = {
      response: "B",
      checked: true,
      correct: true,
      marked: false,
      crossedOut: [],
    };
    session.answers["FIXTURE-3"] = {
      response: "",
      checked: false,
      correct: null,
      marked: true,
      crossedOut: [],
    };

    const summary = summarizeSession(session, FIXTURE_QUESTIONS);
    assert.deepEqual(summary.bySkill, [
      { key: "sat-rw-cs-vocabulary", correct: 0, checked: 1 },
      { key: "sat-math-algebra-linear-equations-1v", correct: 1, checked: 1 },
    ]);
    assert.deepEqual(summary.byDifficulty, [
      { key: "easy", correct: 0, checked: 1 },
      { key: "medium", correct: 1, checked: 1 },
    ]);
    assert.deepEqual(summary.missed.map((item) => item.questionId), ["FIXTURE-1"]);
    assert.deepEqual(summary.marked.map((item) => item.questionId), ["FIXTURE-1", "FIXTURE-3"]);
    assert.deepEqual(summary.unchecked.map((item) => item.questionId), ["FIXTURE-3"]);

    const progress = summarizeSessions([session, session], FIXTURE_QUESTIONS);
    assert.deepEqual(progress.bySkill[0], {
      key: "sat-rw-cs-vocabulary",
      correct: 0,
      checked: 2,
    });
  });
});

describe("progress storage", () => {
  it("round trips under the versioned key and ignores other versions", () => {
    const storage = memoryStorage();
    const session = createSession([sprQuestion], false, new Date("2026-10-19T12:00:00Z"));
    saveProgress(storage, { version: 1, active: session, completed: [] });
    assert.equal(storage.map.has(SAT_PROGRESS_STORAGE_KEY), true);
    assert.equal(SAT_PROGRESS_STORAGE_KEY, "metaminds.sat-practice.v1");
    const loaded = loadProgress(storage);
    assert.equal(loaded.active?.id, session.id);
    assert.deepEqual(loaded.completed, []);

    storage.setItem(SAT_PROGRESS_STORAGE_KEY, JSON.stringify({ version: 2, active: session, completed: [] }));
    assert.equal(readProgress(storage.getItem(SAT_PROGRESS_STORAGE_KEY)).active, null);
    assert.equal(readProgress("not json").active, null);
  });
});

describe("access", () => {
  it("allows everyone when public and requires a session for students", () => {
    assert.equal(canEnterPractice("public", false), true);
    assert.equal(canEnterPractice("students", false), false);
    assert.equal(canEnterPractice("students", true), true);
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
});

describe("math text", () => {
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
