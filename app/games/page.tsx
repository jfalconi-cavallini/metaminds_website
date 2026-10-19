import type { Metadata } from "next";
import Link from "next/link";
import { LEVELS, levelHref } from "@/lib/games";
import GamesShell from "./GamesShell";

export const metadata: Metadata = {
  title: "Games | MetaMinds STEM Academy",
  description: "Practice games for MetaMinds students. No login required.",
};

export default function GamesPage() {
  return (
    <GamesShell
      crumb={[{ label: "Games" }]}
      kicker="Practice"
      title="Games"
      lede="Short practice games students can open from school. No login required. Choose a level."
    >
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {LEVELS.map((level) => (
          <li key={level.slug}>
            <Link
              href={levelHref(level.slug)}
              className="flex min-h-14 items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:p-6"
            >
              <span className="text-base font-bold text-gray-900">{level.label}</span>
              <span className="text-sm font-bold text-blue-600">Open</span>
            </Link>
          </li>
        ))}
      </ul>
    </GamesShell>
  );
}
