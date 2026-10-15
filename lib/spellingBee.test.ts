import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { games } from "./games.ts";
import {
  GRADE_4_WORDS,
  GRADE_5_WORDS,
  blankExample,
  buildRound,
  findWholeWord,
  isCorrectSpelling,
  requeueCurrent,
  wordsForGrade,
  type SpellingWord,
} from "./spellingBee.ts";

const GRADE_4_SPELLINGS = [
  "buttons",
  "cuddle",
  "puffy",
  "tiptoed",
  "clever",
  "basement",
  "burlap",
  "wetlands",
  "invite",
  "butterflies",
  "kelp",
  "property",
  "carefully",
  "sniffling",
  "beneath",
  "tractor",
  "permit",
  "awning",
  "fickle",
  "relief",
  "lunar",
  "boycotting",
  "molten",
  "elite",
  "woven",
  "proclaim",
  "thimble",
  "custody",
  "granola",
  "warrior",
  "rigid",
  "fierce",
  "laughter",
  "salary",
  "disappear",
  "hurdler",
  "lounge",
  "jovial",
  "inferior",
  "December",
  "duration",
  "dictionary",
  "business",
  "reinstate",
  "examine",
  "versus",
  "lullaby",
  "opposite",
  "tissues",
  "marlin",
];

const GRADE_5_SPELLINGS = [
  "Halloween",
  "compliment",
  "compromise",
  "incident",
  "Japanese",
  "investment",
  "bifocals",
  "cutlery",
  "chisel",
  "fundraiser",
  "geologist",
  "bellowed",
  "organism",
  "quail",
  "atmosphere",
  "disappointment",
  "truant",
  "pamphlet",
  "helium",
  "suggested",
  "chimpanzees",
  "desperate",
  "annoyance",
  "interruption",
  "concentrate",
  "piñata",
  "territory",
  "stragglers",
  "albino",
  "ridiculous",
  "monorail",
  "exploratory",
  "indigo",
  "bratwurst",
  "alphabetical",
  "integrity",
  "Oregon",
  "rebuttal",
  "prejudice",
  "solidarity",
  "calico",
  "sputnik",
  "cartridge",
  "segregation",
  "tortillas",
  "civilian",
  "fertilizer",
  "apprentice",
  "synthetic",
  "Caesar",
];

function wordNamed(spelling: string): SpellingWord {
  const found = [...GRADE_4_WORDS, ...GRADE_5_WORDS].find((entry) => entry.spelling === spelling);
  assert.ok(found, spelling);
  return found;
}

describe("games registry", () => {
  it("lists Spelling Bee Practice for grades 4 and 5", () => {
    const game = games.find((entry) => entry.slug === "spelling-bee");
    assert.ok(game);
    assert.equal(game.title, "Spelling Bee Practice");
    assert.equal(game.gradeRange, "Grades 4 and 5");
    assert.equal(game.href, "/games/spelling-bee");
    assert.equal(/[-–—]/.test(`${game.title} ${game.description} ${game.gradeRange}`), false);
  });
});

describe("word lists", () => {
  it("matches the grade 4 and grade 5 lists", () => {
    assert.deepEqual(GRADE_4_WORDS.map((entry) => entry.spelling), GRADE_4_SPELLINGS);
    assert.deepEqual(GRADE_5_WORDS.map((entry) => entry.spelling), GRADE_5_SPELLINGS);
  });

  it("marks only the proper nouns", () => {
    const proper = [...GRADE_4_WORDS, ...GRADE_5_WORDS].filter((entry) => entry.proper).map((entry) => entry.spelling);
    assert.deepEqual(proper, ["December", "Halloween", "Japanese", "Oregon", "Caesar"]);
  });

  it("builds a mixed round from both grades without duplicates", () => {
    const round = buildRound("mixed", () => 0);
    assert.equal(round.length, GRADE_4_SPELLINGS.length + GRADE_5_SPELLINGS.length);
    assert.equal(new Set(round.map((entry) => entry.spelling)).size, round.length);
    assert.deepEqual(
      wordsForGrade("4").map((entry) => entry.spelling),
      GRADE_4_SPELLINGS,
    );
  });

  it("gives every word a neutral sentence that hides cleanly", () => {
    for (const entry of [...GRADE_4_WORDS, ...GRADE_5_WORDS]) {
      assert.equal(findWholeWord(entry.sentence, entry.spelling) !== null, true, entry.spelling);
      assert.equal(/[-–—]/.test(entry.sentence), false, entry.sentence);
      const hidden = blankExample(entry.sentence, entry.spelling);
      assert.equal(hidden.includes("______"), true);
      assert.equal(findWholeWord(hidden, entry.spelling), null, entry.spelling);
    }
  });
});

describe("isCorrectSpelling", () => {
  it("trims whitespace and ignores case for ordinary words", () => {
    const buttons = wordNamed("buttons");
    assert.equal(isCorrectSpelling("  buttons  ", buttons), true);
    assert.equal(isCorrectSpelling("BUTTONS", buttons), true);
    assert.equal(isCorrectSpelling("Buttons", buttons), true);
    assert.equal(isCorrectSpelling("   ", buttons), false);
    assert.equal(isCorrectSpelling("button", buttons), false);
    assert.equal(isCorrectSpelling("buttons.", buttons), false);
  });

  it("requires capitalization for proper nouns", () => {
    for (const spelling of ["December", "Halloween", "Japanese", "Oregon", "Caesar"]) {
      const entry = wordNamed(spelling);
      assert.equal(isCorrectSpelling(`  ${spelling}  `, entry), true);
      assert.equal(isCorrectSpelling(spelling.toLocaleLowerCase("en-US"), entry), false);
      assert.equal(isCorrectSpelling(spelling.toLocaleUpperCase("en-US"), entry), false);
    }
    assert.equal(isCorrectSpelling("DeCember", wordNamed("December")), false);
  });

  it("accepts fertilizer or fertiliser, and piñata or pinata", () => {
    const fertilizer = wordNamed("fertilizer");
    assert.equal(isCorrectSpelling("fertilizer", fertilizer), true);
    assert.equal(isCorrectSpelling("Fertiliser", fertilizer), true);
    assert.equal(isCorrectSpelling("FERTILIZER", fertilizer), true);
    assert.equal(isCorrectSpelling("fertilize", fertilizer), false);

    const pinata = wordNamed("piñata");
    assert.equal(pinata.spelling.normalize("NFC"), "pi\u00F1ata");
    assert.equal(isCorrectSpelling("piñata", pinata), true);
    assert.equal(isCorrectSpelling("pinata", pinata), true);
    assert.equal(isCorrectSpelling("PIÑATA", pinata), true);
    assert.equal(isCorrectSpelling("Pinata", pinata), true);
    assert.equal(isCorrectSpelling("pin\u0303ata", pinata), true);
    assert.equal(isCorrectSpelling("pinyata", pinata), false);
  });
});

describe("requeueCurrent", () => {
  it("asks at least one other word before a miss when any remain", () => {
    const original = ["a", "b", "c", "d"];
    assert.deepEqual(requeueCurrent(original, 0), ["b", "a", "c", "d"]);
    assert.deepEqual(requeueCurrent(original, 0.99), ["b", "c", "d", "a"]);
    assert.deepEqual(original, ["a", "b", "c", "d"]);
    assert.deepEqual(requeueCurrent(["only"], 0.2), ["only"]);
    const later = requeueCurrent(["miss", "next"], 0);
    assert.equal(later[0], "next");
    assert.deepEqual(later, ["next", "miss"]);
  });
});
