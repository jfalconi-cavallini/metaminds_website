import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LEVELS,
  MATH_SUBJECT,
  findGame,
  gameHref,
  games,
  gamesFor,
  legacyRedirects,
  staticRewrites,
  subjectsForLevel,
  trail,
} from "./games.ts";

const DASH = /[-–—]/;

describe("games registry", () => {
  it("keeps the games that are on main and leaves the open PR games out", () => {
    assert.deepEqual(
      games.map((game) => game.slug),
      ["palabras-park", "spelling-bee", "linear-equations"],
    );
    assert.equal(games.some((game) => game.slug === "verbo-rush" || game.slug === "lanza-loros"), false);
  });

  it("puts each game on a shareable level and subject path", () => {
    const park = games.find((game) => game.slug === "palabras-park");
    const spelling = games.find((game) => game.slug === "spelling-bee");
    const linear = games.find((game) => game.slug === "linear-equations");
    assert.ok(park && spelling && linear);

    assert.equal(park.level, "high");
    assert.equal(park.subject, "Spanish");
    assert.equal(gameHref(park), "/games/high/spanish/palabras-park");

    assert.equal(spelling.level, "elementary");
    assert.equal(spelling.subject, "Spelling");
    assert.equal(spelling.gradeRange, "Grades 4 and 5");
    assert.equal(gameHref(spelling), "/games/elementary/spelling/spelling-bee");

    assert.equal(linear.level, "sat");
    assert.equal(linear.subject, MATH_SUBJECT);
    assert.equal(linear.skill, "sat-math-algebra-linear-equations-1v");
    assert.equal(gameHref(linear), "/games/sat/math/linear-equations");

    for (const game of games) {
      const levelLabel = LEVELS.find((level) => level.slug === game.level)?.label ?? "";
      assert.equal(
        DASH.test(`${game.title} ${game.description} ${game.gradeRange} ${game.subject} ${levelLabel} ${game.skillLabel ?? ""}`),
        false,
      );
    }
  });

  it("redirects the old shared URLs and rewrites the static game", () => {
    assert.deepEqual(
      legacyRedirects.filter((entry) => !entry.source.endsWith("/")),
      [
        { source: "/games/palabras-park", destination: "/games/high/spanish/palabras-park" },
        { source: "/games/spelling-bee", destination: "/games/elementary/spelling/spelling-bee" },
        { source: "/games/linear-equations", destination: "/games/sat/math/linear-equations" },
      ],
    );
    assert.deepEqual(staticRewrites.filter((entry) => !entry.source.endsWith("/")), [
      { source: "/games/high/spanish/palabras-park", destination: "/games/palabras-park/index.html" },
    ]);
  });

  it("keeps Math live and opens another subject only when a game fits", () => {
    const elementary = subjectsForLevel("elementary");
    assert.deepEqual(
      elementary.map((card) => [card.name, card.live]),
      [
        ["Math", true],
        ["Spelling", true],
        ["Spanish", false],
      ],
    );
    assert.equal(elementary[0].href, "/games/elementary/math");

    assert.deepEqual(
      subjectsForLevel("middle").map((card) => [card.name, card.live]),
      [
        ["Math", true],
        ["Spanish", false],
        ["Spelling", false],
      ],
    );
    assert.deepEqual(
      subjectsForLevel("high").map((card) => [card.name, card.live]),
      [
        ["Math", true],
        ["Spanish", true],
        ["Spelling", false],
      ],
    );
    assert.deepEqual(
      subjectsForLevel("sat").map((card) => [card.name, card.live]),
      [
        ["Math", true],
        ["Spanish", false],
        ["Spelling", false],
      ],
    );

    assert.deepEqual(
      gamesFor("sat", "Math").map((game) => game.slug),
      ["linear-equations"],
    );
    assert.deepEqual(gamesFor("middle", "Math"), []);
    assert.equal(findGame("elementary", "spelling", "spelling-bee")?.title, "Spelling Bee Practice");
    assert.equal(findGame("sat", "math", "palabras-park"), undefined);
  });

  it("builds a breadcrumb trail back to Games", () => {
    assert.deepEqual(trail("sat", "Math", "Linear Equations"), [
      { label: "Games", href: "/games" },
      { label: "SAT", href: "/games/sat" },
      { label: "Math", href: "/games/sat/math" },
      { label: "Linear Equations" },
    ]);
    for (const crumb of trail("middle")) {
      assert.equal(DASH.test(crumb.label), false);
    }
  });
});
