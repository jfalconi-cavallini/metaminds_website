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
