import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  LEVELS,
  gameHref,
  gamesFor,
  isLevelSlug,
  levelBySlug,
  subjectFromSlug,
  subjectNames,
  subjectSlug,
  subjectsForLevel,
  trail,
} from "@/lib/games";
import GamesShell from "../../GamesShell";

type Props = { params: Promise<{ level: string; subject: string }> };

export function generateStaticParams() {
  return LEVELS.flatMap((level) =>
    subjectNames().map((name) => ({
      level: level.slug,
      subject: subjectSlug(name),
    })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { level: levelSlug, subject: subjectSlug } = await params;
  const level = levelBySlug(levelSlug);
  const subject = subjectFromSlug(subjectSlug);
  if (!level || !subject) return { title: "Games | MetaMinds STEM Academy" };
  return {
    title: `${level.label} ${subject} Games | MetaMinds STEM Academy`,
    description: `${subject} practice games for ${level.label}. No login required.`,
  };
}

export default async function GameSubjectPage({ params }: Props) {
  const { level: levelSlug, subject: subjectSlug } = await params;
  if (!isLevelSlug(levelSlug)) notFound();
  const level = levelBySlug(levelSlug);
  const subject = subjectFromSlug(subjectSlug);
  if (!level || !subject) notFound();

  const card = subjectsForLevel(level.slug).find((entry) => entry.slug === subjectSlug);
  if (!card) notFound();
  const items = gamesFor(level.slug, subject);

  return (
    <GamesShell
      crumb={trail(level.slug, subject)}
      kicker={level.label}
      title={subject}
      lede={card.live ? "Choose a game." : "Coming soon"}
    >
      {card.live && items.length === 0 ? (
        <p className="mt-6 text-sm text-gray-600">No games for this subject yet.</p>
      ) : card.live ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((game) => (
            <li key={game.slug} className="h-full">
              <article className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-xl bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-700">
                    {game.subject}
                  </span>
                  <span className="rounded-xl bg-gray-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    {game.gradeRange}
                  </span>
                </div>
                <h2 className="text-base font-bold text-gray-900">{game.title}</h2>
                {game.skillLabel && <p className="mt-1 text-xs font-bold text-gray-500">{game.skillLabel}</p>}
                <p className="mt-2 flex-1 text-sm text-gray-600">{game.description}</p>
                <Link
                  href={gameHref(game)}
                  aria-label={`Play ${game.title}`}
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                >
                  Play
                </Link>
              </article>
            </li>
          ))}
        </ul>
      ) : null}
    </GamesShell>
  );
}
