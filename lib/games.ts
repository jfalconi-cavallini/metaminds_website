export const LEVELS = [
  { slug: "elementary", label: "Elementary" },
  { slug: "middle", label: "Middle School" },
  { slug: "high", label: "High School" },
  { slug: "sat", label: "SAT" },
] as const;

export type LevelSlug = (typeof LEVELS)[number]["slug"];

export const MATH_SUBJECT = "Math";

export type ReactGameSlug = "spelling-bee" | "linear-equations";

type GameBase = {
  title: string;
  level: LevelSlug;
  subject: string;
  /** Finer label already used on the game, such as Spanish 1 or Grades 4 and 5. */
  gradeRange: string;
  /** Canonical skill id or TEKS code. Null when the published game has no code. */
  skill: string | null;
  /** Plain skill name for the card. Null when no skill is on file. */
  skillLabel: string | null;
  description: string;
  /** Previous public URL. Permanent redirect target is gameHref(game). */
  legacyPath: string;
};

export type Game =
  | (GameBase & { kind: "react"; slug: ReactGameSlug })
  | (GameBase & { kind: "static"; slug: string; staticFile: string });

// Verbo Rush and Lanza Loros are on open PR #25, not on main, so they are not listed.
// Middle School math has no game. Vault math course files have no question set and no TEKS code.
export const games: readonly Game[] = [
  {
    kind: "static",
    slug: "palabras-park",
    title: "Palabras Park",
    subject: "Spanish",
    // The game calls itself Spanish 1. No TEKS code is published with it.
    level: "high",
    gradeRange: "Spanish 1",
    skill: null,
    skillLabel: null,
    description:
      "Spanish vocabulary practice for personality words, telling time, ser, dates, and conversation questions. Answer fast to hit the ball farther.",
    legacyPath: "/games/palabras-park",
    staticFile: "/games/palabras-park/index.html",
  },
  {
    kind: "react",
    slug: "spelling-bee",
    title: "Spelling Bee Practice",
    subject: "Spelling",
    level: "elementary",
    gradeRange: "Grades 4 and 5",
    skill: null,
    skillLabel: null,
    description:
      "Listen to each word and type the spelling. Practice for grade 4, grade 5, or a mix of both.",
    legacyPath: "/games/spelling-bee",
  },
  {
    kind: "react",
    slug: "linear-equations",
    title: "Linear Equations",
    subject: MATH_SUBJECT,
    level: "sat",
    gradeRange: "SAT Algebra",
    skill: "sat-math-algebra-linear-equations-1v",
    skillLabel: "Linear equations in one variable",
    description:
      "Solve linear equations in one variable. Three levels. You see the correct answer after each try.",
    legacyPath: "/games/linear-equations",
  },
];

export type SubjectCard = {
  name: string;
  slug: string;
  /** Math is always open. Another subject is open only when this level has a game for it. */
  live: boolean;
  href: string;
};

export function isLevelSlug(value: string): value is LevelSlug {
  return LEVELS.some((level) => level.slug === value);
}

export function levelBySlug(slug: string): (typeof LEVELS)[number] | undefined {
  return LEVELS.find((level) => level.slug === slug);
}

export function subjectSlug(subject: string): string {
  return subject.trim().toLowerCase().replace(/\s+/g, "-");
}

export function subjectNames(list: readonly Game[] = games): string[] {
  return [...new Set([MATH_SUBJECT, ...list.map((game) => game.subject)])];
}

export function subjectFromSlug(slug: string, list: readonly Game[] = games): string | undefined {
  return subjectNames(list).find((name) => subjectSlug(name) === slug);
}

export function gameHref(game: Game): string {
  return `/games/${game.level}/${subjectSlug(game.subject)}/${game.slug}`;
}

export function levelHref(level: LevelSlug): string {
  return `/games/${level}`;
}

export function subjectHref(level: LevelSlug, subject: string): string {
  return `/games/${level}/${subjectSlug(subject)}`;
}

export type Crumb = { label: string; href?: string };

export function trail(level: LevelSlug, subject?: string, current?: string): Crumb[] {
  const levelInfo = levelBySlug(level);
  const items: Crumb[] = [{ label: "Games", href: "/games" }];
  if (!levelInfo) return items;
  if (!subject) {
    items.push({ label: levelInfo.label });
    return items;
  }
  items.push({ label: levelInfo.label, href: levelHref(level) });
  if (!current) {
    items.push({ label: subject });
    return items;
  }
  items.push({ label: subject, href: subjectHref(level, subject) });
  items.push({ label: current });
  return items;
}

export function subjectsForLevel(level: LevelSlug, list: readonly Game[] = games): SubjectCard[] {
  return subjectNames(list)
    .map((name) => {
      const live = name === MATH_SUBJECT || list.some((game) => game.level === level && game.subject === name);
      return {
        name,
        slug: subjectSlug(name),
        live,
        href: subjectHref(level, name),
      };
    })
    .sort((a, b) => {
      if (a.name === MATH_SUBJECT) return -1;
      if (b.name === MATH_SUBJECT) return 1;
      if (a.live !== b.live) return a.live ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

export function gamesFor(level: LevelSlug, subject: string, list: readonly Game[] = games): Game[] {
  return list.filter((game) => game.level === level && game.subject === subject);
}

export function findGame(level: string, subject: string, slug: string, list: readonly Game[] = games): Game | undefined {
  return list.find(
    (game) => game.level === level && subjectSlug(game.subject) === subject && game.slug === slug,
  );
}

export const legacyRedirects: readonly { source: string; destination: string }[] = games.flatMap((game) => {
  const destination = gameHref(game);
  return [
    { source: game.legacyPath, destination },
    { source: `${game.legacyPath}/`, destination },
  ];
});

export const staticRewrites: readonly { source: string; destination: string }[] = games.flatMap((game) => {
  if (game.kind !== "static") return [];
  const source = gameHref(game);
  return [
    { source, destination: game.staticFile },
    { source: `${source}/`, destination: game.staticFile },
  ];
});
