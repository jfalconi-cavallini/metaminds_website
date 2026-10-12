export type Game = {
  slug: string;
  title: string;
  subject: string;
  gradeRange: string;
  description: string;
  href: string;
};

export const games: readonly Game[] = [
  {
    slug: "palabras-park",
    title: "Palabras Park",
    subject: "Spanish",
    gradeRange: "Spanish 1",
    description:
      "Spanish vocabulary practice for personality words, telling time, ser, dates, and conversation questions. Answer fast to hit the ball farther.",
    href: "/games/palabras-park",
  },
  {
    slug: "verbo-rush",
    title: "Verbo Rush",
    subject: "Spanish",
    gradeRange: "Spanish 1–2",
    description:
      "Conjugate common -ar, -er, and -ir verbs plus ser, estar, tener, ir, and hacer. Present tense first, with an optional pretérito mode. Type or tap the form before the timer hits zero.",
    href: "/games/verbo-rush",
  },
  {
    slug: "lanza-loros",
    title: "Lanza Loros",
    subject: "Spanish",
    gradeRange: "Spanish 1–3",
    description:
      "Answer a Spanish question to load a parrot, then slingshot it into the blob forts. Faster answers earn MEGA, SÚPER, or GRANDE birds. Six forts, from vocab through the past tense.",
    href: "/games/lanza-loros",
  },
];
