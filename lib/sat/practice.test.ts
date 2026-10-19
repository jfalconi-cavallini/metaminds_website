import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { canEnterPractice } from "./access.ts";
import { REGISTERED_BATCH_FILES } from "./batchFiles.ts";
import { loadPracticeBatches } from "./batches.ts";
import {
  domainOptions,
  domainsInQuestions,
  sectionLabel,
  skillOptions,
  skillTitle,
  skillsInQuestions,
} from "./catalog.ts";
import { splitMath } from "./math.ts";
import { SAT_PROGRESS_STORAGE_KEY, loadProgress, readProgress, saveProgress, type ProgressStorage } from "./progress.ts";
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

const BATCH_01_SOURCE = "MetaMinds Director of Curriculum, sample batch 01";

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

interface DirectorFileQuestion {
  id: string;
  section: string;
  domain: string;
  skill: string;
  difficulty: string;
  type: string;
  passage: string | null;
  question: string;
  choices: Record<string, string> | null;
  answer: string;
  explanation: string;
}

function readBatch(fileName: string): DirectorFileQuestion[] {
  return JSON.parse(
    readFileSync(new URL(`../../data/sat/${fileName}`, import.meta.url), "utf8"),
  ) as DirectorFileQuestion[];
}

const batch01Raw = readBatch("batch-01.json");
const batch01 = loadPracticeBatches([{ source: BATCH_01_SOURCE, questions: batch01Raw }]);

function byId(id: string): SatQuestion {
  const question = batch01.find((item) => item.id === id);
  if (!question) throw new Error(`Missing ${id}`);
  return question;
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
  source: "test",
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
  source: "test",
};

const sprQuestion: SatQuestion = {
  id: "Q-SPR",
  section: "math",
  domain: "Algebra",
  skill: "Linear functions",
  difficulty: "hard",
  stem: "Enter the value.",
  sprAnswer: "7",
  correctAnswer: "7",
  explanation: "The value is 7.",
  source: "test",
};

const practiceSet = [passageQuestion, mathChoiceQuestion, sprQuestion];

describe("batch 01", () => {
  it("loads every Director question with the sample batch source", () => {
    assert.equal(batch01.length, 20);
    assert.deepEqual(
      batch01.map((question) => question.id),
      batch01Raw.map((question) => question.id),
    );
    for (const question of batch01) {
      assert.equal(question.source, BATCH_01_SOURCE);
      assert.equal(question.id.startsWith("FIXTURE"), false);
    }
  });

  it("keeps the Director text, including the two explanations that still say Only A", () => {
    for (const raw of batch01Raw) {
      const question = byId(raw.id);
      assert.equal(question.stem, raw.question);
      assert.equal(question.explanation, raw.explanation);
      assert.equal(question.domain, raw.domain);
      assert.equal(question.skill, raw.skill);
      assert.equal(question.correctAnswer, raw.answer);
      if (raw.passage === null || raw.passage === "") {
        assert.equal(question.passage, undefined);
      } else {
        assert.equal(question.passage, raw.passage);
      }
      if (raw.type === "spr") {
        assert.equal(raw.choices, null);
        assert.equal(question.choices, undefined);
        assert.equal(question.sprAnswer, raw.answer);
      } else {
        assert.deepEqual(
          question.choices?.map((choice) => [choice.label, choice.text]),
          Object.entries(raw.choices ?? {}),
        );
        assert.equal(question.sprAnswer, undefined);
      }
    }

    const rw004 = byId("RW-004");
    assert.equal(rw004.correctAnswer, "D");
    assert.match(rw004.explanation, /Only A/);
    const rw010 = byId("RW-010");
    assert.equal(rw010.correctAnswer, "B");
    assert.match(rw010.explanation, /Only A/);
    assert.match(rw010.passage ?? "", /waggle dance/);
  });

  it("preserves the written math characters and the student produced response", () => {
    assert.match(byId("MM-002").stem, /x \u2212 y/);
    assert.match(byId("MM-003").explanation, /b = \u22121/);
    assert.equal(byId("MM-003").sprAnswer, "-1");
    assert.equal(byId("MM-003").correctAnswer, "-1");
    assert.match(byId("MM-004").stem, /x\u00B2 \u2212 4x/);
    assert.match(byId("MM-009").explanation, /\u221A/);
  });

  it("leaves a single leading dollar sign as prose", () => {
    const jacket = byId("MM-007");
    assert.match(jacket.stem, /\$40/);
    assert.deepEqual(splitMath(jacket.stem), [{ kind: "text", value: jacket.stem }]);
  });

  it("registers every batch file in data/sat and wires it from the loader", () => {
    const onDisk = readdirSync(new URL("../../data/sat/", import.meta.url))
      .filter((name) => name.startsWith("batch-") && name.endsWith(".json"))
      .sort();
    assert.deepEqual(onDisk, [...REGISTERED_BATCH_FILES].sort());
    const bankSource = readFileSync(new URL("./bank.ts", import.meta.url), "utf8");
    for (const fileName of REGISTERED_BATCH_FILES) {
      assert.match(bankSource, new RegExp(`data/sat/${fileName.replace(".", "\\.")}`));
    }
    assert.match(bankSource, new RegExp(BATCH_01_SOURCE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });

  it("concatenates later batches and rejects a repeated id", () => {
    const second = {
      ...batch01Raw[0],
      id: "MM-101",
    };
    const combined = loadPracticeBatches([
      { source: BATCH_01_SOURCE, questions: [batch01Raw[0]] },
      { source: "MetaMinds Director of Curriculum, sample batch 02", questions: [second] },
    ]);
    assert.deepEqual(combined.map((question) => question.id), ["MM-001", "MM-101"]);
    assert.equal(combined[1]?.source, "MetaMinds Director of Curriculum, sample batch 02");

    assert.throws(
      () => loadPracticeBatches([
        { source: BATCH_01_SOURCE, questions: [batch01Raw[0]] },
        { source: "MetaMinds Director of Curriculum, sample batch 02", questions: [batch01Raw[0]] },
      ]),
      /Duplicate question id MM-001/,
    );
  });

  it("rejects an spr item with choices and an mcq item with null choices", () => {
    const spr = batch01Raw.find((question) => question.id === "MM-003");
    const mcq = batch01Raw.find((question) => question.id === "MM-001");
    assert.throws(
      () => loadPracticeBatches([{
        source: BATCH_01_SOURCE,
        questions: [{ ...spr, choices: { A: "1", B: "2" } }],
      }]),
      /spr choices must be null/,
    );
    assert.throws(
      () => loadPracticeBatches([{
        source: BATCH_01_SOURCE,
        questions: [{ ...mcq, choices: null }],
      }]),
      /mcq choices must be an object/,
    );
  });
});

describe("parseQuestion", () => {
  it("accepts a multiple choice question and a student produced response", () => {
    assert.equal(parseQuestion(passageQuestion, 0).id, "Q-RW");
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

describe("practice session", () => {
  it("filters by section, domain, skill, and difficulty", () => {
    const mathOnly = filterQuestions(batch01, {
      section: "math",
      domain: "any",
      skill: "any",
      difficulty: "any",
    });
    assert.equal(mathOnly.length, 10);
    assert.ok(mathOnly.every((question) => question.id.startsWith("MM-")));

    const oneSkill = filterQuestions(batch01, {
      section: "math",
      domain: "Algebra",
      skill: "Linear equations in one variable",
      difficulty: "easy",
    });
    assert.deepEqual(oneSkill.map((question) => question.id), ["MM-001"]);
  });

  it("takes the requested count in bank order", () => {
    assert.equal(takeQuestions(practiceSet, 2).length, 2);
    assert.equal(takeQuestions(practiceSet, 0).length, 0);
    assert.equal(takeQuestions(practiceSet, 9).length, 3);
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
    assert.equal(checkAnswer(byId("MM-003"), "-1"), true);
    assert.equal(checkAnswer(byId("MM-003"), "-1.0"), true);
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

  it("lists domains and skills from the loaded questions in first-seen order", () => {
    assert.deepEqual(domainsInQuestions(batch01, "math"), [
      "Algebra",
      "Advanced Math",
      "Problem-Solving and Data Analysis",
      "Geometry and Trigonometry",
    ]);
    assert.deepEqual(skillsInQuestions(batch01, "math", "Algebra"), [
      "Linear equations in one variable",
      "Systems of two linear equations",
      "Linear functions",
    ]);
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
