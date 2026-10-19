export const GRADE_BANDS = ["Elementary", "Middle", "High School"] as const;

export type GradeBand = (typeof GRADE_BANDS)[number];

export type GradeFilter = GradeBand | "All";

export type Game = {
  slug: string;
  title: string;
  subject: string;
  gradeBand: GradeBand;
  /** Finer label already used on the game, such as Spanish 1 or Grades 4 and 5. */
  gradeRange: string;
  /** Canonical skill id or TEKS code. Null when the published game has none. */
  skill: string | null;
  /** Plain skill name for the card. Null when no skill is on file. */
  skillLabel: string | null;
  description: string;
  href: string;
};

// Verbo Rush and Lanza Loros are on open PR #25, not on main, so they are not listed.
// Middle has no game. Vault math course files are outlines without questions or TEKS codes.
export const games: readonly Game[] = [
  {
    slug: "palabras-park",
    title: "Palabras Park",
    subject: "Spanish",
    // The game calls itself Spanish 1. No TEKS code is published with it.
    gradeBand: "High School",
    gradeRange: "Spanish 1",
    skill: null,
    skillLabel: null,
    description:
      "Spanish vocabulary practice for personality words, telling time, ser, dates, and conversation questions. Answer fast to hit the ball farther.",
    href: "/games/palabras-park",
  },
  {
    slug: "spelling-bee",
    title: "Spelling Bee Practice",
    subject: "Spelling",
    gradeBand: "Elementary",
    gradeRange: "Grades 4 and 5",
    skill: null,
    skillLabel: null,
    description:
      "Listen to each word and type the spelling. Practice for grade 4, grade 5, or a mix of both.",
    href: "/games/spelling-bee",
  },
  {
    slug: "linear-equations",
    title: "Linear Equations",
    subject: "SAT",
    gradeBand: "High School",
    gradeRange: "SAT Algebra",
    skill: "sat-math-algebra-linear-equations-1v",
    skillLabel: "Linear equations in one variable",
    description:
      "Solve linear equations in one variable. Three levels. You see the correct answer after each try.",
    href: "/games/linear-equations",
  },
];

export function gameSubjects(list: readonly Game[] = games): string[] {
  return [...new Set(list.map((game) => game.subject))].sort((a, b) => a.localeCompare(b));
}

export function gamesInGroup(
  grade: GradeBand,
  subject: string,
  list: readonly Game[] = games,
): Game[] {
  return list.filter((game) => game.gradeBand === grade && (subject === "All" || game.subject === subject));
}
