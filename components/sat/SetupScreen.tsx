"use client";

import {
  difficultyLabel,
  domainsInQuestions,
  sectionLabel,
  skillsInQuestions,
} from "@/lib/sat/catalog";
import type { PracticeFilters } from "@/lib/sat/session";
import type { SatDifficulty, SatQuestion, SatSection } from "@/lib/sat/types";
import { cardClass, fieldClass, labelClass, primaryClass, secondaryClass } from "./styles";

const SECTIONS: SatSection[] = ["math", "reading_writing"];
const DIFFICULTIES: SatDifficulty[] = ["easy", "medium", "hard"];

export function SetupScreen({
  filters,
  questions,
  available,
  bankEmpty,
  canContinue,
  canReview,
  onChange,
  onStart,
  onContinue,
  onReview,
}: {
  filters: PracticeFilters;
  questions: readonly SatQuestion[];
  available: number;
  bankEmpty: boolean;
  canContinue: boolean;
  canReview: boolean;
  onChange: (filters: PracticeFilters) => void;
  onStart: () => void;
  onContinue: () => void;
  onReview: () => void;
}) {
  if (bankEmpty) {
    return (
      <section aria-labelledby="sat-empty-title">
        <h2 id="sat-empty-title" className="text-2xl font-bold text-gray-900">
          Questions coming soon
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">
          Practice questions will appear here once the bank is ready.
        </p>
      </section>
    );
  }

  const domains = domainsInQuestions(questions, filters.section);
  const skills = skillsInQuestions(questions, filters.section, filters.domain);
  const startCount = Math.min(filters.count, available);

  return (
    <section aria-labelledby="sat-setup-title">
      <h2 id="sat-setup-title" className="text-2xl font-bold text-gray-900">
        Set up practice
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
        Choose a section, domain, skill, and difficulty. Then choose how many questions and whether the set is timed.
      </p>

      <form
        className={`${cardClass} mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2`}
        onSubmit={(event) => {
          event.preventDefault();
          if (startCount > 0) onStart();
        }}
      >
        <div>
          <label className={labelClass} htmlFor="sat-section">Section</label>
          <select
            id="sat-section"
            className={fieldClass}
            value={filters.section}
            onChange={(event) => onChange({
              ...filters,
              section: event.target.value as PracticeFilters["section"],
              domain: "any",
              skill: "any",
            })}
          >
            {[
              <option key="any" value="any">Any</option>,
              ...SECTIONS.map((section) => (
                <option key={section} value={section}>{sectionLabel(section)}</option>
              )),
            ]}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="sat-domain">Domain</label>
          <select
            id="sat-domain"
            className={fieldClass}
            value={filters.domain}
            onChange={(event) => onChange({
              ...filters,
              domain: event.target.value,
              skill: "any",
            })}
          >
            {[
              <option key="any" value="any">Any</option>,
              ...domains.map((domain) => (
                <option key={domain} value={domain}>{domain}</option>
              )),
            ]}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="sat-skill">Skill</label>
          <select
            id="sat-skill"
            className={fieldClass}
            value={filters.skill}
            onChange={(event) => onChange({ ...filters, skill: event.target.value })}
          >
            {[
              <option key="any" value="any">Any</option>,
              ...skills.map((skill) => (
                <option key={skill} value={skill}>{skill}</option>
              )),
            ]}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="sat-difficulty">Difficulty</label>
          <select
            id="sat-difficulty"
            className={fieldClass}
            value={filters.difficulty}
            onChange={(event) => onChange({
              ...filters,
              difficulty: event.target.value as PracticeFilters["difficulty"],
            })}
          >
            {[
              <option key="any" value="any">Any</option>,
              ...DIFFICULTIES.map((difficulty) => (
                <option key={difficulty} value={difficulty}>{difficultyLabel(difficulty)}</option>
              )),
            ]}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="sat-count">Question count</label>
          <input
            id="sat-count"
            className={fieldClass}
            type="number"
            inputMode="numeric"
            min={1}
            max={Math.max(available, 1)}
            value={filters.count}
            onChange={(event) => {
              const next = Number(event.target.value);
              onChange({
                ...filters,
                count: Number.isFinite(next) ? Math.max(1, Math.floor(next)) : 1,
              });
            }}
          />
          <p className="mt-2 text-xs text-gray-500">{available} available</p>
        </div>

        <fieldset>
          <legend className={labelClass}>Timing</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              className={filters.timed ? primaryClass : secondaryClass}
              aria-pressed={filters.timed}
              onClick={() => onChange({ ...filters, timed: true })}
            >
              Timed
            </button>
            <button
              type="button"
              className={!filters.timed ? primaryClass : secondaryClass}
              aria-pressed={!filters.timed}
              onClick={() => onChange({ ...filters, timed: false })}
            >
              Untimed
            </button>
          </div>
        </fieldset>

        {available === 0 && (
          <p className="sm:col-span-2 text-sm text-gray-500" role="status">
            No questions match these filters.
          </p>
        )}

        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
          <button type="submit" className={primaryClass} disabled={startCount === 0}>
            Start practice
          </button>
          {canContinue && (
            <button type="button" className={secondaryClass} onClick={onContinue}>
              Continue practice
            </button>
          )}
          {canReview && (
            <button type="button" className={secondaryClass} onClick={onReview}>
              Latest results
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
