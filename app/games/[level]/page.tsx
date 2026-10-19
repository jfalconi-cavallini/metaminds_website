import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LEVELS, isLevelSlug, levelBySlug, subjectsForLevel, trail } from "@/lib/games";
import GamesShell from "../GamesShell";

type Props = { params: Promise<{ level: string }> };

export function generateStaticParams() {
  return LEVELS.map((level) => ({ level: level.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { level: levelSlug } = await params;
  const level = levelBySlug(levelSlug);
  if (!level) return { title: "Games | MetaMinds STEM Academy" };
  return {
    title: `${level.label} Games | MetaMinds STEM Academy`,
    description: `Choose a subject for ${level.label} practice games. No login required.`,
  };
}

export default async function GameLevelPage({ params }: Props) {
  const { level: levelSlug } = await params;
  if (!isLevelSlug(levelSlug)) notFound();
  const level = levelBySlug(levelSlug);
  if (!level) notFound();
  const subjects = subjectsForLevel(level.slug);

  return (
    <GamesShell
      crumb={trail(level.slug)}
      kicker="Games"
      title={level.label}
      lede="Choose a subject."
    >
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => (
          <li key={subject.slug}>
            {subject.live ? (
              <Link
                href={subject.href}
                className="flex h-full min-h-14 flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:p-6"
              >
                <span className="text-base font-bold text-gray-900">{subject.name}</span>
                <span className="mt-4 text-sm font-bold text-blue-600">Open</span>
              </Link>
            ) : (
              <article className="flex h-full min-h-14 flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-base font-bold text-gray-900">{subject.name}</h2>
                <p className="mt-2 text-sm text-gray-500">Coming soon</p>
              </article>
            )}
          </li>
        ))}
      </ul>
    </GamesShell>
  );
}
