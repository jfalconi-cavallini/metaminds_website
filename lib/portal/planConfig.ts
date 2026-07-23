// Skill baseline configuration for the plan wizard.
// Maps SAT/ACT category names → subskills and defines score → status mapping.

/** Subskills grouped by SAT category name (case-insensitive match). */
export const SAT_SUBSKILLS: Record<string, string[]> = {
  "Information and Ideas": [
    "Central Ideas and Details",
    "Command of Evidence (Textual)",
    "Command of Evidence (Quantitative)",
    "Inferences",
  ],
  "Craft and Structure": [
    "Words in Context",
    "Text Structure and Purpose",
    "Cross-Text Connections",
  ],
  "Expression of Ideas": [
    "Rhetorical Synthesis",
    "Transitions",
  ],
  "Standard English Conventions": [
    "Sentence Boundaries",
    "Commas",
    "Semicolons",
    "Colons",
    "Dashes",
    "Apostrophes",
    "Verbs",
    "Pronouns",
    "Modifiers",
  ],
  "Algebra": [
    "Linear equations in 1 variable",
    "Linear equations in 2 variables",
    "Linear functions",
    "Systems of 2 linear equations",
    "Linear inequalities",
  ],
  "Advanced Math": [
    "Nonlinear functions",
    "Nonlinear equations in 1 variable",
    "Equivalent expressions",
  ],
  "Geometry and Trigonometry": [
    "Area and volume",
    "Lines, angles, and triangles",
    "Right triangles and trigonometry",
    "Circles",
  ],
  "Problem Solving and Data Analysis": [
    "Ratios, rates, proportional relationships, and units",
    "Percentages",
    "One-variable data",
    "Two-variable data",
    "Probability",
    "Sample statistics and margin of error",
  ],
};

/** Returns subskills for a given category title (case-insensitive, partial match). */
export function getSubskills(categoryTitle: string): string[] {
  const lower = categoryTitle.toLowerCase();
  for (const [key, skills] of Object.entries(SAT_SUBSKILLS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return skills;
    }
  }
  return [];
}

/**
 * Maps each SAT_SUBSKILLS display-name string to its canonical skill_node slug.
 * This bridges the roadmap's legacy display strings with the skill_nodes catalog.
 */
export const SUBSKILL_SLUG_MAP: Record<string, string> = {
  // Algebra
  "Linear equations in 1 variable":                       "sat-math-algebra-linear-equations-1v",
  "Linear equations in 2 variables":                      "sat-math-algebra-linear-equations-2v",
  "Linear functions":                                     "sat-math-algebra-slope-intercept",
  "Systems of 2 linear equations":                        "sat-math-algebra-systems-substitution",
  "Linear inequalities":                                  "sat-math-algebra-linear-inequalities",
  // Advanced Math
  "Nonlinear functions":                                  "sat-math-advanced-exponential-functions",
  "Nonlinear equations in 1 variable":                    "sat-math-advanced-quadratic-formula",
  "Equivalent expressions":                               "sat-math-advanced-rational-equations",
  // Problem-Solving & Data Analysis
  "Ratios, rates, proportional relationships, and units": "sat-math-data-ratios-proportions",
  "Percentages":                                          "sat-math-data-percentages",
  "One-variable data":                                    "sat-math-data-mean-median-mode",
  "Two-variable data":                                    "sat-math-data-two-variable",
  "Probability":                                          "sat-math-data-probability",
  "Sample statistics and margin of error":                "sat-math-data-statistical-claims",
  // Geometry & Trigonometry
  "Area and volume":                                      "sat-math-geometry-volume-surface",
  "Lines, angles, and triangles":                         "sat-math-geometry-angles",
  "Right triangles and trigonometry":                     "sat-math-geometry-right-triangle-trig",
  "Circles":                                              "sat-math-geometry-circles",
  // Information & Ideas
  "Central Ideas and Details":                            "sat-rw-ii-central-ideas",
  "Command of Evidence (Textual)":                        "sat-rw-ii-command-textual",
  "Command of Evidence (Quantitative)":                   "sat-rw-ii-command-quantitative",
  "Inferences":                                           "sat-rw-ii-inferences",
  // Craft & Structure
  "Words in Context":                                     "sat-rw-cs-vocabulary",
  "Text Structure and Purpose":                           "sat-rw-cs-text-structure",
  "Cross-Text Connections":                               "sat-rw-cs-cross-text",
  // Expression of Ideas
  "Rhetorical Synthesis":                                 "sat-rw-ei-rhetorical-synthesis",
  "Transitions":                                          "sat-rw-ei-transitions",
  // Standard English Conventions
  "Sentence Boundaries":                                  "sat-rw-sec-boundaries",
  "Commas":                                               "sat-rw-sec-commas",
  "Semicolons":                                           "sat-rw-sec-semicolons-colons",
  "Colons":                                               "sat-rw-sec-semicolons-colons",
  "Dashes":                                               "sat-rw-sec-dashes-parentheses",
  "Apostrophes":                                          "sat-rw-sec-pronoun-agreement",
  "Verbs":                                                "sat-rw-sec-verb-tense",
  "Pronouns":                                             "sat-rw-sec-pronoun-agreement",
  "Modifiers":                                            "sat-rw-sec-modifiers",
};

// ── Score → Status ────────────────────────────────────────────────────────────

export type SkillStatus = "not-assessed" | "needs-attention" | "developing" | "proficient" | "strong";

export function scoreToStatus(score: number | undefined): SkillStatus {
  if (score === undefined || score === null) return "not-assessed";
  if (score <= 1) return "needs-attention";
  if (score <= 3) return "developing";
  if (score <= 5) return "proficient";
  return "strong";
}

export const STATUS_LABEL: Record<SkillStatus, string> = {
  "not-assessed":    "Not Assessed",
  "needs-attention": "Needs Attention",
  "developing":      "Developing",
  "proficient":      "Proficient",
  "strong":          "Strong",
};

export const STATUS_DOT: Record<SkillStatus, string> = {
  "not-assessed":    "bg-gray-200",
  "needs-attention": "bg-red-400",
  "developing":      "bg-amber-400",
  "proficient":      "bg-blue-400",
  "strong":          "bg-emerald-400",
};

export const STATUS_BADGE: Record<SkillStatus, string> = {
  "not-assessed":    "bg-gray-100 text-gray-400",
  "needs-attention": "bg-red-50 text-red-600",
  "developing":      "bg-amber-50 text-amber-600",
  "proficient":      "bg-blue-50 text-blue-600",
  "strong":          "bg-emerald-50 text-emerald-600",
};

// ── ACT Section Fields ────────────────────────────────────────────────────────

export const ACT_SECTIONS = [
  { key: "english",   label: "English",   max: 36 },
  { key: "math",      label: "Math",      max: 36 },
  { key: "reading",   label: "Reading",   max: 36 },
  { key: "science",   label: "Science",   max: 36 },
  { key: "composite", label: "Composite", max: 36 },
] as const;
