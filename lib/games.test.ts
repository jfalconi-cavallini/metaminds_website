import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GRADE_BANDS, gameSubjects, games, gamesInGroup } from "./games.ts";

const DASH = /[-–—]/;

describe("games registry", () => {
  it("keeps the games that are on main and leaves the open PR games out", () => {
    assert.deepEqual(
      games.map((game) => game.slug),
      ["palabras-park", "spelling-bee", "linear-equations"],
    );
    assert.equal(games.some((game) => game.slug === "verbo-rush" || game.slug === "lanza-loros"), false);
  });

  it("types every game with a grade band, subject, and skill when one is known", () => {
    for (const game of games) {
      assert.equal(GRADE_BANDS.includes(game.gradeBand), true);
      assert.equal(game.subject.length > 0, true);
      assert.equal(DASH.test(`${game.title} ${game.description} ${game.gradeRange} ${game.gradeBand} ${game.skillLabel ?? ""}`), false);
    }

    const park = games.find((game) => game.slug === "palabras-park");
    const spelling = games.find((game) => game.slug === "spelling-bee");
    const linear = games.find((game) => game.slug === "linear-equations");
    assert.ok(park);
    assert.ok(spelling);
    assert.ok(linear);

    assert.equal(park.subject, "Spanish");
    assert.equal(park.gradeBand, "High School");
    assert.equal(park.skill, null);

    assert.equal(spelling.subject, "Spelling");
    assert.equal(spelling.gradeBand, "Elementary");
    assert.equal(spelling.gradeRange, "Grades 4 and 5");
    assert.equal(spelling.skill, null);

    assert.equal(linear.subject, "SAT");
    assert.equal(linear.gradeBand, "High School");
    assert.equal(linear.skill, "sat-math-algebra-linear-equations-1v");
    assert.equal(linear.skillLabel, "Linear equations in one variable");
    assert.equal(linear.href, "/games/linear-equations");
  });

  it("filters by grade band and subject", () => {
    assert.deepEqual(gameSubjects(), ["SAT", "Spanish", "Spelling"]);
    assert.deepEqual(
      gamesInGroup("Elementary", "All").map((game) => game.slug),
      ["spelling-bee"],
    );
    assert.deepEqual(gamesInGroup("Middle", "All"), []);
    assert.deepEqual(
      gamesInGroup("High School", "SAT").map((game) => game.slug),
      ["linear-equations"],
    );
    assert.deepEqual(gamesInGroup("High School", "Spelling"), []);
  });
});
