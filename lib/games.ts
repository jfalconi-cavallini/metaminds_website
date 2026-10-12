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
];
