import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { games } from "./games.ts";
import {
  LINEAR_LEVELS,
  LINEAR_SAT_DOMAIN,
  LINEAR_SKILL_ID,
  isCorrectAnswer,
  levelById,
  type LinearQuestion,
} from "./linearEquations.ts";

const PROSE_DASH = /[–—]/;

function question(id: string): LinearQuestion {
  const found = LINEAR_LEVELS.flatMap((level) => level.questions).find((item) => item.id === id);
  assert.ok(found, id);
  return found;
}

describe("linear equations vault items", () => {
  it("uses the SAT Algebra skill and the three homework files", () => {
    assert.equal(LINEAR_SKILL_ID, "sat-math-algebra-linear-equations-1v");
    assert.equal(LINEAR_SAT_DOMAIN, "Algebra");
    assert.equal(games.find((game) => game.slug === "linear-equations")?.skill, LINEAR_SKILL_ID);
    assert.deepEqual(
      LINEAR_LEVELS.map((level) => level.source),
      [
        "curriculum/sat/math/algebra/Algebra_Linear_Equations/Solving_Linear_Equations/homework/level-1.md",
        "curriculum/sat/math/algebra/Algebra_Linear_Equations/Solving_Linear_Equations/homework/level-2.md",
        "curriculum/sat/math/algebra/Algebra_Linear_Equations/Solving_Linear_Equations/homework/level-3.md",
      ],
    );
    assert.deepEqual(
      LINEAR_LEVELS.map((level) => level.questions.length),
      [5, 5, 5],
    );
  });

  it("keeps the vault prompts and correct answers", () => {
    assert.equal(question("l1-q1").prompt, "Solve: x + 9 = 15");
    assert.equal(question("l1-q1").answer, "x = 6");
    assert.equal(question("l2-q3").prompt, "Solve: (2x - 1)/3 = (x + 4)/2");
    assert.equal(question("l2-q3").answer, "x = 14");
    assert.equal(question("l3-q1").answer, "no solution");
    assert.equal(question("l3-q2").prompt, "If 4x + 3 = 15, what is the value of 8x + 6?");
    assert.equal(question("l3-q2").answer, "30");
    assert.equal(question("l3-q3").answer, "infinitely many solutions");
    assert.equal(question("l3-q4").answer, "17");
    assert.equal(question("l3-q5").answer, "no solution");

    for (const level of LINEAR_LEVELS) {
      assert.equal(levelById(level.id).id, level.id);
      for (const item of level.questions) {
        assert.equal(item.accept.includes(item.answer), true);
        assert.equal(PROSE_DASH.test(item.steps), false);
        assert.equal(isCorrectAnswer(item.answer, item), true);
        assert.equal(isCorrectAnswer("   ", item), false);
      }
    }
  });

  it("accepts equivalent forms and rejects the vault traps", () => {
    const direct = question("l1-q4");
    assert.equal(isCorrectAnswer("x = 9", direct), true);
    assert.equal(isCorrectAnswer("X=9", direct), true);
    assert.equal(isCorrectAnswer("9", direct), true);
    assert.equal(isCorrectAnswer("8", direct), false);

    const derived = question("l3-q2");
    assert.equal(isCorrectAnswer("30", derived), true);
    assert.equal(isCorrectAnswer("x = 3", derived), false);
    assert.equal(isCorrectAnswer("3", derived), false);

    const otherDerived = question("l3-q4");
    assert.equal(isCorrectAnswer("17", otherDerived), true);
    assert.equal(isCorrectAnswer("x = 7", otherDerived), false);
    assert.equal(isCorrectAnswer("7", otherDerived), false);

    const none = question("l3-q1");
    assert.equal(isCorrectAnswer("No solution", none), true);
    assert.equal(isCorrectAnswer("there is no solution", none), true);
    assert.equal(isCorrectAnswer("0", none), false);

    const many = question("l3-q3");
    assert.equal(isCorrectAnswer("Infinitely many solutions", many), true);
    assert.equal(isCorrectAnswer("infinite solutions", many), true);
    assert.equal(isCorrectAnswer("0", many), false);
  });
});
