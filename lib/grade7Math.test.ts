import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MATH_SUBJECT, findGame, gameHref, games, gamesFor } from "./games.ts";
import {
  GRADE7_LEVELS,
  GRADE7_SOURCE,
  GRADE7_TEKS,
  grade7AnswerLabel,
  isCorrectGrade7Answer,
  type Grade7Question,
} from "./grade7Math.ts";

function item(id: string): Grade7Question {
  const found = GRADE7_LEVELS.flatMap((level) => level.questions).find((entry) => entry.id === id);
  assert.ok(found, id);
  return found;
}

describe("grade 7 math mix", () => {
  it("keeps 12 questions on each level in the given order", () => {
    assert.deepEqual(
      GRADE7_LEVELS.map((level) => level.questions.map((question) => question.id)),
      [
        [
          "MS7-001",
          "MS7-003",
          "MS7-005",
          "MS7-006",
          "MS7-008",
          "MS7-010",
          "MS7-013",
          "MS7-015",
          "MS7-017",
          "MS7-020",
          "MS7-021",
          "MS7-024",
        ],
        [
          "MS7-002",
          "MS7-004",
          "MS7-007",
          "MS7-009",
          "MS7-011",
          "MS7-012",
          "MS7-014",
          "MS7-016",
          "MS7-018",
          "MS7-019",
          "MS7-022",
          "MS7-023",
        ],
      ],
    );
    for (const question of GRADE7_LEVELS.flatMap((level) => level.questions)) {
      assert.equal(question.grade, 7);
      assert.equal(question.teks.length > 0, true);
      assert.equal(question.explanation.length > 0, true);
    }
  });

  it("keeps the director wording on a sample from each level", () => {
    const first = item("MS7-001");
    assert.equal(first.question, "What is -3/4 + 1/2?");
    assert.equal(first.answer, "B");
    assert.equal(first.choices?.B, "-1/4");
    assert.equal(first.explanation, "Write 1/2 as 2/4. Then -3/4 + 2/4 = -1/4.");
    assert.equal(grade7AnswerLabel(first), "B. -1/4");

    const probability = item("MS7-024");
    assert.equal(probability.type, "spr");
    assert.equal(probability.teks, "7.6I");
    assert.equal(probability.answer, "1/2");
    assert.equal(
      probability.explanation,
      "There are 3 + 5 + 2 = 10 marbles and 5 are blue. 5/10 = 1/2.",
    );

    const percent = item("MS7-012");
    assert.equal(
      percent.question,
      "The price of a game went up from $50 to $62. What is the percent increase? (Type the number only.)",
    );
    assert.equal(percent.answer, "24");
    assert.equal(
      percent.explanation,
      "The price went up 62 - 50 = 12 dollars. 12 ÷ 50 = 0.24, which is 24%.",
    );
  });

  it("accepts equivalent student produced answers", () => {
    const probability = item("MS7-024");
    assert.equal(isCorrectGrade7Answer("1/2", probability), true);
    assert.equal(isCorrectGrade7Answer("0.5", probability), true);
    assert.equal(isCorrectGrade7Answer("0.50", probability), true);
    assert.equal(isCorrectGrade7Answer(" 1 / 2 ", probability), true);
    assert.equal(isCorrectGrade7Answer("2/4", probability), true);
    assert.equal(isCorrectGrade7Answer("1/3", probability), false);
    assert.equal(isCorrectGrade7Answer("blue", probability), false);

    const percent = item("MS7-012");
    assert.equal(isCorrectGrade7Answer("24", percent), true);
    assert.equal(isCorrectGrade7Answer("24%", percent), true);
    assert.equal(isCorrectGrade7Answer("24 %", percent), true);
    assert.equal(isCorrectGrade7Answer("25", percent), false);

    const area = item("MS7-019");
    assert.equal(isCorrectGrade7Answer("96", area), true);
    assert.equal(isCorrectGrade7Answer("96%", area), true);
    assert.equal(isCorrectGrade7Answer("95", area), false);

    const choice = item("MS7-002");
    assert.equal(isCorrectGrade7Answer("c", choice), true);
    assert.equal(isCorrectGrade7Answer("C", choice), true);
    assert.equal(isCorrectGrade7Answer("-1", choice), false);
  });

  it("registers the game under middle school math with the TEKS list", () => {
    const game = games.find((entry) => entry.slug === "grade-7-math-mix");
    assert.ok(game);
    assert.equal(game.kind, "react");
    assert.equal(game.level, "middle");
    assert.equal(game.subject, MATH_SUBJECT);
    assert.equal(game.grade, 7);
    assert.equal(game.source, GRADE7_SOURCE);
    assert.deepEqual(game.teks, [...GRADE7_TEKS]);
    assert.equal(gameHref(game), "/games/middle/math/grade-7-math-mix");
    assert.deepEqual(
      gamesFor("middle", "Math").map((entry) => entry.slug),
      ["grade-7-math-mix"],
    );
    assert.equal(findGame("middle", "math", "grade-7-math-mix")?.title, "Grade 7 Math Mix");
    assert.equal(game.legacyPath, undefined);
  });
});
