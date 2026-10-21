import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { prepareSatHtml, sanitizeSatHtml } from "./html.ts";
import { mathmlToLatex, renderSatMath } from "./mathml.ts";
import {
  mapImportDocument,
  mergeImportFiles,
  parseImportArgs,
  sectionFromFileName,
  summarizeImport,
} from "./importRows.ts";
import { fetchSatQuestions } from "./query.ts";
import { parseQuestionRow, rowToQuestion } from "./rows.ts";

const director = {
  id: "SAMPLE-001",
  section: "Math",
  domain: "Sample domain",
  skill: "Sample skill",
  difficulty: "easy",
  type: "mcq",
  passage: "A jacket costs $40. Keep x \u2212 y.",
  question: "PLACEHOLDER question text",
  choices: {
    A: "PLACEHOLDER A",
    B: "PLACEHOLDER B",
    C: "PLACEHOLDER C",
    D: "PLACEHOLDER D",
  },
  answer: "A",
  explanation: "PLACEHOLDER explanation",
};

describe("import rows", () => {
  it("maps a MetaMinds batch record without rewriting its text", () => {
    const mapped = mapImportDocument([director], "data/sat/sample-batch-01.json");
    assert.equal(mapped.warnings.length, 0);
    const row = mapped.rows[0];
    assert.equal(row?.id, "SAMPLE-001");
    assert.equal(row?.section, "math");
    assert.equal(row?.question, "PLACEHOLDER question text");
    assert.equal(row?.passage, "A jacket costs $40. Keep x \u2212 y.");
    assert.equal(row?.explanation, "PLACEHOLDER explanation");
    assert.equal(row?.format, "text");
    assert.equal(row?.source, "metaminds");
    assert.equal(row?.source_ref, "sample-batch-01.json#SAMPLE-001");
    assert.deepEqual(row?.choices, [
      { label: "A", text: "PLACEHOLDER A" },
      { label: "B", text: "PLACEHOLDER B" },
      { label: "C", text: "PLACEHOLDER C" },
      { label: "D", text: "PLACEHOLDER D" },
    ]);
  });

  it("rejects spr choices and mcq null choices", () => {
    assert.throws(
      () => mapImportDocument([{
        ...director,
        id: "SAMPLE-SPR",
        type: "spr",
        choices: { A: "1", B: "2" },
        answer: "1",
      }], "sample-batch-01.json"),
      /spr choices must be null/,
    );
    assert.throws(
      () => mapImportDocument([{ ...director, choices: null }], "sample-batch-01.json"),
      /mcq choices must be an object or an array/,
    );
  });

  it("maps an AIPrep record to the test set as html", () => {
    const mapped = mapImportDocument([{
      questionId: "sample-html-1",
      domain_desc: "Sample domain",
      skill_cd: "S.1",
      skill_desc: "Sample skill",
      difficulty: "H",
      type: "mcq",
      stimulus_html: "<p>PLACEHOLDER passage</p>",
      stem_html: "<p>PLACEHOLDER stem <math><mi>x</mi></math></p>",
      rationale_html: "",
      choices: ["PLACEHOLDER A", "PLACEHOLDER B"],
      correct_letters: ["B"],
    }], "english_qa_normalized.json");
    assert.deepEqual(mapped.warnings, ["CB-sample-html-1 has no rationale_html."]);
    const row = mapped.rows[0];
    assert.equal(row?.id, "CB-sample-html-1");
    assert.equal(row?.section, "reading_writing");
    assert.equal(row?.skill_code, "S.1");
    assert.equal(row?.difficulty, "hard");
    assert.equal(row?.answer, "B");
    assert.equal(row?.format, "html");
    assert.equal(row?.source, "college_board_test");
    assert.equal(row?.source_ref, "english_qa_normalized.json#sample-html-1");
    assert.equal(row?.explanation, "");
    assert.equal(sectionFromFileName("math_qa_normalized.json"), "math");

    const withHtmlChoices = mapImportDocument([{
      questionId: "sample-html-choices",
      domain_desc: "Algebra",
      skill_desc: "Linear equations",
      difficulty: "E",
      type: "mcq",
      stem_html: "<p>Which value?</p>",
      choices: [
        { key: "A", text: "plain fifty", text_html: "<p><math><mn>50</mn></math></p>" },
        "<p>2</p>",
      ],
      correct_letters: ["A"],
    }], "math_qa_normalized.json");
    const choiceRow = withHtmlChoices.rows[0];
    assert.equal(choiceRow?.choices?.[0]?.text, "<p><math><mn>50</mn></math></p>");
    assert.equal(choiceRow?.choices?.[1]?.text, "<p>2</p>");
    assert.match(prepareSatHtml(choiceRow?.choices?.[0]?.text ?? ""), /<math><mn>50<\/mn><\/math>/);
  });

  it("rejects a repeated id inside one file and across files", () => {
    assert.throws(
      () => mapImportDocument([director, director], "sample-batch-01.json"),
      /Duplicate question id SAMPLE-001/,
    );
    const first = mapImportDocument([director], "sample-batch-01.json");
    const second = mapImportDocument([{ ...director, id: "SAMPLE-002" }], "sample-batch-02.json");
    assert.throws(
      () => mergeImportFiles([first, mapImportDocument([director], "sample-batch-02.json")]),
      /Duplicate question id SAMPLE-001/,
    );
    assert.deepEqual(mergeImportFiles([first, second]).rows.map((row) => row.id), ["SAMPLE-001", "SAMPLE-002"]);
  });

  it("prints counts by source, section, and difficulty", () => {
    const sample = JSON.parse(readFileSync(new URL("../../scripts/fixtures/sample-math.json", import.meta.url), "utf8"));
    const mapped = mapImportDocument(sample, "scripts/fixtures/sample-math.json");
    assert.equal(summarizeImport(mapped.rows), [
      "rows 2",
      "source",
      "  college_board_test 1",
      "  metaminds 1",
      "section",
      "  math 2",
      "difficulty",
      "  easy 1",
      "  medium 1",
    ].join("\n"));
    const spr = mapped.rows.find((row) => row.id === "CB-sample-html-1");
    assert.equal(spr?.type, "spr");
    assert.equal(spr?.choices, null);
    assert.equal(spr?.answer, "4");
    assert.equal(spr?.format, "html");
  });

  it("dry-runs the sample fixture without Supabase keys", () => {
    assert.deepEqual(parseImportArgs(["--dry-run", "scripts/fixtures/sample-math.json"]), {
      dryRun: true,
      files: ["scripts/fixtures/sample-math.json"],
    });
    const result = spawnSync(process.execPath, [
      "--experimental-strip-types",
      "scripts/import-sat-questions.ts",
      "--dry-run",
      "scripts/fixtures/sample-math.json",
    ], {
      encoding: "utf8",
      env: { PATH: process.env.PATH },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /rows 2/);
    assert.match(result.stdout, /college_board_test 1/);
    assert.match(result.stdout, /metaminds 1/);
    assert.doesNotMatch(result.stderr, /SUPABASE|Error|error/);
  });
});

describe("html questions", () => {
  it("keeps MathML and drops scripts, handlers, and unsafe images", () => {
    const clean = sanitizeSatHtml([
      "<p>ok</p>",
      "<script>alert(1)</script>",
      "<span onclick=\"alert(1)\">click</span>",
      "<a href=\"javascript:alert(1)\">bad</a>",
      "<math><mi>x</mi></math>",
      "<img src=\"https://example.com/a.png\" alt=\"ok\">",
      "<img src=\"http://example.com/a.png\" alt=\"no\">",
      "<img src=\"data:image/png;base64,aaaa\" alt=\"data\">",
      "<img src=\"data:text/html;base64,aaaa\" alt=\"html\">",
    ].join(""));
    assert.match(clean, /<p>ok<\/p>/);
    assert.doesNotMatch(clean, /script|onclick|javascript:/i);
    assert.match(clean, /<math><mi>x<\/mi><\/math>/);
    assert.match(clean, /https:\/\/example.com\/a.png/);
    assert.match(clean, /data:image\/png;base64,aaaa/);
    assert.doesNotMatch(clean, /http:\/\/example.com/);
    assert.doesNotMatch(clean, /data:text\/html/);
  });

  it("decodes escaped html once, then sanitizes", () => {
    const escaped = "&lt;p&gt;Hello&amp;nbsp;there&#39;s &lt;math&gt;&lt;mi&gt;x&lt;/mi&gt;&lt;/math&gt;.&lt;/p&gt;&lt;script&gt;alert(1)&lt;/script&gt;";
    const clean = prepareSatHtml(escaped);
    assert.match(clean, /<p>Hello/);
    assert.match(clean, /there's/);
    assert.match(clean, /<math><mi>x<\/mi><\/math>/);
    assert.doesNotMatch(clean, /script|alert|&lt;p/);
    assert.equal(prepareSatHtml("<p>Already &amp; real</p>"), "<p>Already &amp; real</p>");
  });

  it("keeps MathML structure, display, and mathvariant", () => {
    const clean = prepareSatHtml([
      '<math display="block">',
      '<mstyle mathvariant="bold"><semantics>',
      "<mrow><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo>",
      "<mfrac><mn>1</mn><mn>2</mn></mfrac></mrow>",
      '<annotation encoding="application/x-tex">x^2</annotation>',
      "</semantics></mstyle></math>",
      "<math><mi>f</mi><mfenced><mi>x</mi></mfenced></math>",
    ].join(""));
    assert.match(clean, /<math display="block">/);
    assert.match(clean, /<mstyle mathvariant="bold">/);
    assert.match(clean, /<mrow><msup><mi>x<\/mi><mn>2<\/mn><\/msup>/);
    assert.match(clean, /<mfrac><mn>1<\/mn><mn>2<\/mn><\/mfrac>/);
    assert.match(clean, /<annotation encoding="application\/x-tex">/);
    assert.match(clean, /<mrow><mo>\(<\/mo><mi>x<\/mi><mo>\)<\/mo><\/mrow>/);
    assert.doesNotMatch(clean, /<mfenced/);
  });

  it("keeps figures and hides the screen-reader copy of a blank", () => {
    const clean = prepareSatHtml([
      '<svg viewBox="0 0 10 10" role="img" aria-label="A line">',
      "<style>*{stroke-linecap:butt;} .small { font: italic 13px Crimson; }</style>",
      '<line class="x-axis-line" x1="0" y1="0" x2="10" y2="10"></line>',
      '<use xlink:href="#axis"></use>',
      '<use xlink:href="javascript:alert(1)"></use>',
      "<text>20</text>",
      "</svg>",
      '<span aria-hidden="true">______</span><span class="sr-only">blank</span> have',
      "<script>alert(1)</script>",
    ].join(""));
    assert.match(clean, /<svg[^>]*viewBox="0 0 10 10"/);
    assert.match(clean, /<line[^>]*class="x-axis-line"/);
    assert.match(clean, /<text>20<\/text>/);
    assert.match(clean, /xlink:href="#axis"/);
    assert.match(clean, /aria-hidden="true"/);
    assert.match(clean, /class="sr-only"/);
    assert.match(clean, /______/);
    assert.match(clean, />blank</);
    assert.match(clean, /\.sat-html svg/);
    assert.doesNotMatch(clean, /<script|javascript:/i);
    const visible = clean.replace(/<span class="sr-only">[\s\S]*?<\/span>/g, "");
    assert.doesNotMatch(visible, />blank</);
  });

  it("renders MathML with KaTeX and keeps spoken alt text for screen readers", () => {
    const html = prepareSatHtml(
      '<p><math alttext="7 x plus 18 y equals 630"><mrow><mn>7</mn><mi>x</mi><mo>+</mo><mn>18</mn><mi>y</mi><mo>=</mo><mn>630</mn></mrow></math></p>',
    );
    assert.equal(mathmlToLatex(html.match(/<math[\s\S]*<\/math>/)?.[0] ?? ""), "7x+18y=630");
    const rendered = renderSatMath(html);
    assert.match(rendered, /class="sr-only"/);
    assert.match(rendered, /7 x plus 18 y equals 630/);
    assert.match(rendered, /katex/);
    const visible = rendered.replace(/<span class="sr-only">[\s\S]*?<\/span>/g, "");
    assert.doesNotMatch(visible, /plus|equals/);
    assert.equal(
      mathmlToLatex('<math><mfrac><mrow><mn>12</mn><mi>x</mi><mo>+</mo><mn>28</mn></mrow><mn>4</mn></mfrac></math>'),
      "\\frac{12x+28}{4}",
    );
    assert.equal(
      mathmlToLatex('<math><menclose notation="top"><mi>A</mi><mi>B</mi></menclose></math>'),
      "\\overline{AB}",
    );
    assert.equal(mathmlToLatex('<math><mn>170</mn><mo>°</mo></math>'), "170^{\\circ}");
  });

  it("prefers choice markup over spoken text when both are stored", () => {
    const row = parseQuestionRow({
      id: "SAMPLE-MARKUP",
      section: "math",
      domain: "Algebra",
      skill: "Linear equations",
      skill_code: null,
      difficulty: "easy",
      type: "mcq",
      passage: null,
      question: "<p>Which equation?</p>",
      choices: [
        { label: "A", text: "y equals 7 x plus 18", text_html: "<p><math><mi>y</mi><mo>=</mo><mn>7</mn><mi>x</mi><mo>+</mo><mn>18</mn></math></p>" },
        { label: "B", text: "<p>18</p>" },
      ],
      answer: "A",
      explanation: "",
      format: "html",
      source: "college_board_test",
      source_ref: "sample#markup",
      active: true,
    });
    assert.match(row.choices?.[0]?.text ?? "", /<math>/);
    assert.equal(row.choices?.[1]?.text, "<p>18</p>");
  });
});

describe("question query", () => {
  it("pages active rows and maps them to practice questions", () => {
    const row = parseQuestionRow({
      id: "SAMPLE-001",
      section: "math",
      domain: "Sample domain",
      skill: "Sample skill",
      skill_code: null,
      difficulty: "easy",
      type: "mcq",
      passage: null,
      question: "PLACEHOLDER question text",
      choices: [
        { label: "A", text: "PLACEHOLDER A" },
        { label: "B", text: "PLACEHOLDER B" },
      ],
      answer: "A",
      explanation: "PLACEHOLDER explanation",
      format: "text",
      source: "metaminds",
      source_ref: "sample-batch-01.json#SAMPLE-001",
      active: true,
    });
    const question = rowToQuestion(row);
    assert.equal(question.stem, "PLACEHOLDER question text");
    assert.equal(question.choices?.length, 2);
    assert.equal(question.sprAnswer, undefined);

    const pages = [Array.from({ length: 1000 }, () => row), [row]];
    let call = 0;
    const questions = fetchSatQuestions({
      from(table) {
        assert.equal(table, "sat_questions");
        return {
          select() {
            return {
              eq(column, value) {
                assert.equal(column, "active");
                assert.equal(value, true);
                return {
                  order() {
                    return {
                      range(from, to) {
                        assert.equal(to - from, 999);
                        const data = pages[call] ?? [];
                        call += 1;
                        return Promise.resolve({ data, error: null });
                      },
                    };
                  },
                };
              },
            };
          },
        };
      },
    });
    return questions.then((loaded) => {
      assert.equal(call, 2);
      assert.equal(loaded.length, 1001);
      assert.equal(loaded[0]?.id, "SAMPLE-001");
    });
  });

  it("surfaces a query error", async () => {
    await assert.rejects(
      fetchSatQuestions({
        from() {
          return {
            select() {
              return {
                eq() {
                  return {
                    order() {
                      return {
                        range() {
                          return Promise.resolve({ data: null, error: { message: "relation missing" } });
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        },
      }),
      /relation missing/,
    );
  });
});

describe("public repo", () => {
  it("ignores data/sat so question files stay off the branch", () => {
    const ignore = readFileSync(new URL("../../.gitignore", import.meta.url), "utf8");
    assert.match(ignore, /^\/data\/sat\/$/m);
  });
});
