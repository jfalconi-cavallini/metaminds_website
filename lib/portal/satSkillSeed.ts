/**
 * SAT Skill Tree — canonical seed data.
 *
 * Each node has a stable `slug` used as the ON CONFLICT key, so this function
 * is fully idempotent: safe to call multiple times without creating duplicates.
 *
 * Hierarchy (two levels):
 *   Domain node  — parentSlug: null    (e.g., "Algebra")
 *   Skill node   — parentSlug: domain  (e.g., "Linear Equations (1 variable)")
 *
 * Source of truth: knowledge/SAT/README.md + College Board SAT specification.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface SkillNodeSeed {
  slug:         string;
  course:       string;
  category:     string;          // "Math" | "Reading & Writing"
  parentSlug:   string | null;
  title:        string;
  description?: string;
  displayOrder: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// SAT Math
// ─────────────────────────────────────────────────────────────────────────────

const MATH_DOMAINS: SkillNodeSeed[] = [
  {
    slug: "sat-math-algebra", course: "SAT", category: "Math", parentSlug: null,
    title: "Algebra",
    description: "Linear equations, functions, systems, and inequalities.",
    displayOrder: 1,
  },
  {
    slug: "sat-math-advanced", course: "SAT", category: "Math", parentSlug: null,
    title: "Advanced Math",
    description: "Quadratics, polynomials, exponentials, and function analysis.",
    displayOrder: 2,
  },
  {
    slug: "sat-math-data", course: "SAT", category: "Math", parentSlug: null,
    title: "Problem-Solving & Data Analysis",
    description: "Ratios, percentages, statistics, probability, and data interpretation.",
    displayOrder: 3,
  },
  {
    slug: "sat-math-geometry", course: "SAT", category: "Math", parentSlug: null,
    title: "Geometry & Trigonometry",
    description: "Area, volume, triangles, circles, and right-triangle trigonometry.",
    displayOrder: 4,
  },
];

const MATH_SKILLS: SkillNodeSeed[] = [
  // Algebra
  { slug: "sat-math-algebra-variables-expressions",    course: "SAT", category: "Math", parentSlug: "sat-math-algebra", title: "Variables & Expressions",                 displayOrder: 1 },
  { slug: "sat-math-algebra-linear-equations-1v",      course: "SAT", category: "Math", parentSlug: "sat-math-algebra", title: "Linear Equations (1 variable)",           displayOrder: 2 },
  { slug: "sat-math-algebra-linear-equations-2v",      course: "SAT", category: "Math", parentSlug: "sat-math-algebra", title: "Linear Equations (2 variables)",          displayOrder: 3 },
  { slug: "sat-math-algebra-slope-intercept",          course: "SAT", category: "Math", parentSlug: "sat-math-algebra", title: "Slope-Intercept Form",                    displayOrder: 4 },
  { slug: "sat-math-algebra-writing-linear-equations", course: "SAT", category: "Math", parentSlug: "sat-math-algebra", title: "Writing Linear Equations",                displayOrder: 5 },
  { slug: "sat-math-algebra-systems-substitution",     course: "SAT", category: "Math", parentSlug: "sat-math-algebra", title: "Systems of Equations (Substitution)",     displayOrder: 6 },
  { slug: "sat-math-algebra-systems-elimination",      course: "SAT", category: "Math", parentSlug: "sat-math-algebra", title: "Systems of Equations (Elimination)",      displayOrder: 7 },
  { slug: "sat-math-algebra-systems-word-problems",    course: "SAT", category: "Math", parentSlug: "sat-math-algebra", title: "Systems Word Problems",                   displayOrder: 8 },
  { slug: "sat-math-algebra-linear-inequalities",      course: "SAT", category: "Math", parentSlug: "sat-math-algebra", title: "Linear Inequalities",                     displayOrder: 9 },
  { slug: "sat-math-algebra-absolute-value",           course: "SAT", category: "Math", parentSlug: "sat-math-algebra", title: "Absolute Value",                          displayOrder: 10 },

  // Advanced Math
  { slug: "sat-math-advanced-quadratic-functions",     course: "SAT", category: "Math", parentSlug: "sat-math-advanced", title: "Quadratic Functions",                   displayOrder: 1 },
  { slug: "sat-math-advanced-factoring-gcf",           course: "SAT", category: "Math", parentSlug: "sat-math-advanced", title: "Factoring: GCF & Grouping",             displayOrder: 2 },
  { slug: "sat-math-advanced-factoring-trinomials",    course: "SAT", category: "Math", parentSlug: "sat-math-advanced", title: "Factoring: Trinomials",                 displayOrder: 3 },
  { slug: "sat-math-advanced-quadratic-formula",       course: "SAT", category: "Math", parentSlug: "sat-math-advanced", title: "Quadratic Formula",                     displayOrder: 4 },
  { slug: "sat-math-advanced-completing-square",       course: "SAT", category: "Math", parentSlug: "sat-math-advanced", title: "Completing the Square",                 displayOrder: 5 },
  { slug: "sat-math-advanced-exponential-functions",   course: "SAT", category: "Math", parentSlug: "sat-math-advanced", title: "Exponential Functions",                 displayOrder: 6 },
  { slug: "sat-math-advanced-polynomial-functions",    course: "SAT", category: "Math", parentSlug: "sat-math-advanced", title: "Polynomial Functions",                  displayOrder: 7 },
  { slug: "sat-math-advanced-rational-equations",      course: "SAT", category: "Math", parentSlug: "sat-math-advanced", title: "Rational Equations",                    displayOrder: 8 },
  { slug: "sat-math-advanced-radical-equations",       course: "SAT", category: "Math", parentSlug: "sat-math-advanced", title: "Radical Equations",                     displayOrder: 9 },
  { slug: "sat-math-advanced-function-notation",       course: "SAT", category: "Math", parentSlug: "sat-math-advanced", title: "Function Notation",                     displayOrder: 10 },
  { slug: "sat-math-advanced-function-transformations",course: "SAT", category: "Math", parentSlug: "sat-math-advanced", title: "Function Transformations",              displayOrder: 11 },
  { slug: "sat-math-advanced-complex-numbers",         course: "SAT", category: "Math", parentSlug: "sat-math-advanced", title: "Complex Numbers",                       displayOrder: 12 },

  // Problem-Solving & Data Analysis
  { slug: "sat-math-data-mean-median-mode",    course: "SAT", category: "Math", parentSlug: "sat-math-data", title: "Mean, Median, Mode & Range",       displayOrder: 1 },
  { slug: "sat-math-data-ratios-proportions",  course: "SAT", category: "Math", parentSlug: "sat-math-data", title: "Ratios & Proportions",             displayOrder: 2 },
  { slug: "sat-math-data-percentages",         course: "SAT", category: "Math", parentSlug: "sat-math-data", title: "Percentages & Percent Change",     displayOrder: 3 },
  { slug: "sat-math-data-unit-rates",          course: "SAT", category: "Math", parentSlug: "sat-math-data", title: "Unit Rates & Conversion",          displayOrder: 4 },
  { slug: "sat-math-data-scatterplots",        course: "SAT", category: "Math", parentSlug: "sat-math-data", title: "Scatterplots & Line of Best Fit",  displayOrder: 5 },
  { slug: "sat-math-data-interpretation",      course: "SAT", category: "Math", parentSlug: "sat-math-data", title: "Data Interpretation",              displayOrder: 6 },
  { slug: "sat-math-data-probability",         course: "SAT", category: "Math", parentSlug: "sat-math-data", title: "Probability",                      displayOrder: 7 },
  { slug: "sat-math-data-counting-methods",    course: "SAT", category: "Math", parentSlug: "sat-math-data", title: "Counting Methods",                 displayOrder: 8 },
  { slug: "sat-math-data-two-variable",        course: "SAT", category: "Math", parentSlug: "sat-math-data", title: "Two-Variable Data & Correlation",  displayOrder: 9 },
  { slug: "sat-math-data-statistical-claims",  course: "SAT", category: "Math", parentSlug: "sat-math-data", title: "Evaluating Statistical Claims",    displayOrder: 10 },

  // Geometry & Trigonometry
  { slug: "sat-math-geometry-area-perimeter",      course: "SAT", category: "Math", parentSlug: "sat-math-geometry", title: "Area & Perimeter",                    displayOrder: 1 },
  { slug: "sat-math-geometry-triangle-properties", course: "SAT", category: "Math", parentSlug: "sat-math-geometry", title: "Triangle Properties",                  displayOrder: 2 },
  { slug: "sat-math-geometry-pythagorean-theorem", course: "SAT", category: "Math", parentSlug: "sat-math-geometry", title: "Pythagorean Theorem",                  displayOrder: 3 },
  { slug: "sat-math-geometry-similarity",          course: "SAT", category: "Math", parentSlug: "sat-math-geometry", title: "Similarity & Congruence",              displayOrder: 4 },
  { slug: "sat-math-geometry-angles",              course: "SAT", category: "Math", parentSlug: "sat-math-geometry", title: "Lines & Angles",                       displayOrder: 5 },
  { slug: "sat-math-geometry-circles",             course: "SAT", category: "Math", parentSlug: "sat-math-geometry", title: "Circle Theorems",                      displayOrder: 6 },
  { slug: "sat-math-geometry-coordinate",          course: "SAT", category: "Math", parentSlug: "sat-math-geometry", title: "Coordinate Geometry",                  displayOrder: 7 },
  { slug: "sat-math-geometry-volume-surface",      course: "SAT", category: "Math", parentSlug: "sat-math-geometry", title: "Volume & Surface Area",                displayOrder: 8 },
  { slug: "sat-math-geometry-right-triangle-trig", course: "SAT", category: "Math", parentSlug: "sat-math-geometry", title: "Right Triangle Trigonometry",          displayOrder: 9 },
  { slug: "sat-math-geometry-unit-circle",         course: "SAT", category: "Math", parentSlug: "sat-math-geometry", title: "Unit Circle & Radian Measure",         displayOrder: 10 },
];

// ─────────────────────────────────────────────────────────────────────────────
// SAT Reading & Writing
// ─────────────────────────────────────────────────────────────────────────────

const RW_DOMAINS: SkillNodeSeed[] = [
  {
    slug: "sat-rw-information-ideas", course: "SAT", category: "Reading & Writing", parentSlug: null,
    title: "Information & Ideas",
    description: "Central ideas, supporting details, inferences, and quantitative evidence.",
    displayOrder: 1,
  },
  {
    slug: "sat-rw-craft-structure", course: "SAT", category: "Reading & Writing", parentSlug: null,
    title: "Craft & Structure",
    description: "Vocabulary in context, text structure, purpose, and cross-text connections.",
    displayOrder: 2,
  },
  {
    slug: "sat-rw-expression-ideas", course: "SAT", category: "Reading & Writing", parentSlug: null,
    title: "Expression of Ideas",
    description: "Rhetorical synthesis, transitions, and sentence-level style.",
    displayOrder: 3,
  },
  {
    slug: "sat-rw-standard-english", course: "SAT", category: "Reading & Writing", parentSlug: null,
    title: "Standard English Conventions",
    description: "Grammar, punctuation, sentence boundaries, and usage rules.",
    displayOrder: 4,
  },
];

const RW_SKILLS: SkillNodeSeed[] = [
  // Information & Ideas
  { slug: "sat-rw-ii-central-ideas",          course: "SAT", category: "Reading & Writing", parentSlug: "sat-rw-information-ideas", title: "Central Ideas & Details",              displayOrder: 1 },
  { slug: "sat-rw-ii-inferences",             course: "SAT", category: "Reading & Writing", parentSlug: "sat-rw-information-ideas", title: "Inferences",                           displayOrder: 2 },
  { slug: "sat-rw-ii-command-textual",        course: "SAT", category: "Reading & Writing", parentSlug: "sat-rw-information-ideas", title: "Command of Evidence (Textual)",        displayOrder: 3 },
  { slug: "sat-rw-ii-command-quantitative",   course: "SAT", category: "Reading & Writing", parentSlug: "sat-rw-information-ideas", title: "Command of Evidence (Quantitative)",   displayOrder: 4 },

  // Craft & Structure
  { slug: "sat-rw-cs-vocabulary",             course: "SAT", category: "Reading & Writing", parentSlug: "sat-rw-craft-structure", title: "Vocabulary in Context",                  displayOrder: 1 },
  { slug: "sat-rw-cs-text-structure",         course: "SAT", category: "Reading & Writing", parentSlug: "sat-rw-craft-structure", title: "Text Structure & Purpose",               displayOrder: 2 },
  { slug: "sat-rw-cs-cross-text",             course: "SAT", category: "Reading & Writing", parentSlug: "sat-rw-craft-structure", title: "Cross-Text Connections",                 displayOrder: 3 },

  // Expression of Ideas
  { slug: "sat-rw-ei-rhetorical-synthesis",   course: "SAT", category: "Reading & Writing", parentSlug: "sat-rw-expression-ideas", title: "Rhetorical Synthesis",                  displayOrder: 1 },
  { slug: "sat-rw-ei-transitions",            course: "SAT", category: "Reading & Writing", parentSlug: "sat-rw-expression-ideas", title: "Transitions",                           displayOrder: 2 },
  { slug: "sat-rw-ei-sentence-combining",     course: "SAT", category: "Reading & Writing", parentSlug: "sat-rw-expression-ideas", title: "Sentence Combining & Style",            displayOrder: 3 },

  // Standard English Conventions
  { slug: "sat-rw-sec-boundaries",            course: "SAT", category: "Reading & Writing", parentSlug: "sat-rw-standard-english", title: "Sentence Boundaries",                   displayOrder: 1 },
  { slug: "sat-rw-sec-subject-verb",          course: "SAT", category: "Reading & Writing", parentSlug: "sat-rw-standard-english", title: "Subject-Verb Agreement",                displayOrder: 2 },
  { slug: "sat-rw-sec-pronoun-agreement",     course: "SAT", category: "Reading & Writing", parentSlug: "sat-rw-standard-english", title: "Pronoun Agreement",                     displayOrder: 3 },
  { slug: "sat-rw-sec-verb-tense",            course: "SAT", category: "Reading & Writing", parentSlug: "sat-rw-standard-english", title: "Verb Tense & Form",                     displayOrder: 4 },
  { slug: "sat-rw-sec-modifiers",             course: "SAT", category: "Reading & Writing", parentSlug: "sat-rw-standard-english", title: "Modifier Placement",                    displayOrder: 5 },
  { slug: "sat-rw-sec-parallelism",           course: "SAT", category: "Reading & Writing", parentSlug: "sat-rw-standard-english", title: "Parallelism",                           displayOrder: 6 },
  { slug: "sat-rw-sec-commas",                course: "SAT", category: "Reading & Writing", parentSlug: "sat-rw-standard-english", title: "Commas",                                displayOrder: 7 },
  { slug: "sat-rw-sec-semicolons-colons",     course: "SAT", category: "Reading & Writing", parentSlug: "sat-rw-standard-english", title: "Semicolons & Colons",                   displayOrder: 8 },
  { slug: "sat-rw-sec-dashes-parentheses",    course: "SAT", category: "Reading & Writing", parentSlug: "sat-rw-standard-english", title: "Dashes & Parentheses",                  displayOrder: 9 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Full tree — exported for use in tests or admin inspection
// ─────────────────────────────────────────────────────────────────────────────

export const SAT_SKILL_TREE: SkillNodeSeed[] = [
  ...MATH_DOMAINS,
  ...RW_DOMAINS,
  ...MATH_SKILLS,
  ...RW_SKILLS,
];

// ─────────────────────────────────────────────────────────────────────────────
// Seed function — uses the admin (service-role) client to bypass RLS.
// ─────────────────────────────────────────────────────────────────────────────

export interface SeedResult {
  inserted: number;
  skipped:  number;
  total:    number;
  errors:   string[];
}

export async function seedSATSkillTree(admin: SupabaseClient): Promise<SeedResult> {
  // Fetch all existing SAT slugs in one round-trip.
  const { data: existing, error: fetchErr } = await admin
    .from("skill_nodes")
    .select("id, slug")
    .eq("course", "SAT");
  if (fetchErr) throw fetchErr;

  const slugToId = new Map<string, number>(
    (existing ?? []).map((r: { id: number; slug: string }) => [r.slug, r.id]),
  );

  let inserted = 0;
  let skipped  = 0;
  const errors: string[] = [];

  // Pass 1: domain nodes (parentSlug === null).
  const domains = SAT_SKILL_TREE.filter((n) => n.parentSlug === null);
  for (const node of domains) {
    if (slugToId.has(node.slug)) { skipped++; continue; }
    const { data, error } = await admin
      .from("skill_nodes")
      .insert({
        slug:          node.slug,
        course:        node.course,
        category:      node.category,
        parent_id:     null,
        title:         node.title,
        description:   node.description ?? null,
        display_order: node.displayOrder,
      })
      .select("id, slug")
      .single();
    if (error) { errors.push(`${node.slug}: ${error.message}`); continue; }
    slugToId.set(data.slug, data.id);
    inserted++;
  }

  // Pass 2: skill nodes (parentSlug !== null).
  const skills = SAT_SKILL_TREE.filter((n) => n.parentSlug !== null);
  for (const node of skills) {
    if (slugToId.has(node.slug)) { skipped++; continue; }
    const parentId = node.parentSlug ? (slugToId.get(node.parentSlug) ?? null) : null;
    const { error } = await admin
      .from("skill_nodes")
      .insert({
        slug:          node.slug,
        course:        node.course,
        category:      node.category,
        parent_id:     parentId,
        title:         node.title,
        description:   node.description ?? null,
        display_order: node.displayOrder,
      });
    if (error) { errors.push(`${node.slug}: ${error.message}`); continue; }
    inserted++;
  }

  return { inserted, skipped, total: SAT_SKILL_TREE.length, errors };
}
