"use client";

import { useState } from "react";
import Link from "next/link";
import { GRADE_BANDS, gameSubjects, gamesInGroup, type GradeBand, type GradeFilter } from "@/lib/games";

const subjects = gameSubjects();

function bandDomId(band: string): string {
  return `grade-${band.toLowerCase().replace(/\s+/g, "-")}`;
}

function FilterButton({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-h-11 touch-manipulation rounded-xl px-3 py-2 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
        pressed ? "bg-blue-600 text-white" : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

export default function GamesCatalog() {
  const [grade, setGrade] = useState<GradeFilter>("All");
  const [subject, setSubject] = useState("All");
  const bands: readonly GradeBand[] = grade === "All" ? GRADE_BANDS : [grade];

  return (
    <div>
      <div className="mt-6">
        <p id="grade-filter-label" className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Grade
        </p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="grade-filter-label">
          <FilterButton pressed={grade === "All"} onClick={() => setGrade("All")}>
            All grades
          </FilterButton>
          {GRADE_BANDS.map((band) => (
            <FilterButton key={band} pressed={grade === band} onClick={() => setGrade(band)}>
              {band}
            </FilterButton>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p id="subject-filter-label" className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Subject
        </p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="subject-filter-label">
          <FilterButton pressed={subject === "All"} onClick={() => setSubject("All")}>
            All subjects
          </FilterButton>
          {subjects.map((name) => (
            <FilterButton key={name} pressed={subject === name} onClick={() => setSubject(name)}>
              {name}
            </FilterButton>
          ))}
        </div>
      </div>

      {bands.map((band) => {
        const items = gamesInGroup(band, subject);
        return (
          <section key={band} className="mt-8" aria-labelledby={bandDomId(band)}>
            <h2 id={bandDomId(band)} className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {band}
            </h2>
            {items.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600">No games in this group yet.</p>
            ) : (
              <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                      <h3 className="text-base font-bold text-gray-900">{game.title}</h3>
                      {game.skillLabel && (
                        <p className="mt-1 text-xs font-bold text-gray-500">{game.skillLabel}</p>
                      )}
                      <p className="mt-2 flex-1 text-sm text-gray-600">{game.description}</p>
                      <Link
                        href={game.href}
                        aria-label={`Play ${game.title}`}
                        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                      >
                        Play
                      </Link>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
