"use client";

import { difficultyLabel, skillTitle } from "@/lib/sat/catalog";
import type { AccuracyRow, QuestionRef, SessionSummary, StoredSession } from "@/lib/sat/session";
import type { SatQuestion } from "@/lib/sat/types";
import { MathText } from "./MathText";
import { cardClass, labelClass, primaryClass, secondaryClass } from "./styles";

function AccuracyList({
  rows,
  labelFor,
}: {
  rows: AccuracyRow[];
  labelFor: (key: string) => string;
}) {
  if (rows.length === 0) {
    return <p className="mt-3 text-sm text-gray-500">No answers checked</p>;
  }
  return (
    <ul className="mt-3 divide-y divide-gray-100">
      {rows.map((row) => (
        <li key={row.key} className="flex items-center justify-between gap-3 py-2 text-sm text-gray-900">
          <span>{labelFor(row.key)}</span>
          <span className="shrink-0 font-semibold text-gray-900">{row.correct} of {row.checked}</span>
        </li>
      ))}
    </ul>
  );
}

function QuestionList({
  title,
  items,
  questions,
  session,
  emptyLabel,
}: {
  title: string;
  items: QuestionRef[];
  questions: readonly SatQuestion[];
  session: StoredSession;
  emptyLabel: string;
}) {
  return (
    <section className={cardClass}>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">{emptyLabel}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {items.map((item) => {
            const question = questions.find((entry) => entry.id === item.questionId);
            const answer = session.answers[item.questionId];
            const status = !answer?.checked ? "Not checked" : answer.correct ? "Correct" : "Incorrect";
            const statusClass = !answer?.checked
              ? "text-gray-500"
              : answer.correct
                ? "font-semibold text-emerald-700"
                : "font-semibold text-red-600";
            return (
              <li key={item.questionId} className="border-t border-gray-100 pt-3 first:border-0 first:pt-0">
                <p className={labelClass}>
                  {skillTitle(item.skill)}, {difficultyLabel(item.difficulty)}
                </p>
                <div className="mt-1 text-sm leading-6 text-gray-900">
                  <MathText text={question?.stem?.trim() ? question.stem : "Question"} />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  <span className={statusClass}>{status}</span>
                  . Your answer: {item.response.trim() || "none"}. Correct answer: {item.correctAnswer}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function ResultsScreen({
  session,
  questions,
  summary,
  saved,
  onRetry,
  onNewPractice,
}: {
  session: StoredSession;
  questions: readonly SatQuestion[];
  summary: SessionSummary;
  saved: Pick<SessionSummary, "bySkill" | "byDifficulty">;
  onRetry: () => void;
  onNewPractice: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={labelClass}>Practice</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">Results</h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" className={primaryClass} onClick={onRetry}>Retry</button>
          <button type="button" className={secondaryClass} onClick={onNewPractice}>New practice</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className={cardClass}>
          <h3 className="text-base font-semibold text-gray-900">This set</h3>
          <h4 className={`mt-4 ${labelClass}`}>Accuracy by skill</h4>
          <AccuracyList rows={summary.bySkill} labelFor={skillTitle} />
          <h4 className={`mt-5 ${labelClass}`}>Accuracy by difficulty</h4>
          <AccuracyList rows={summary.byDifficulty} labelFor={(key) => difficultyLabel(key as "easy" | "medium" | "hard")} />
        </section>
        <section className={cardClass}>
          <h3 className="text-base font-semibold text-gray-900">Saved progress</h3>
          <h4 className={`mt-4 ${labelClass}`}>Accuracy by skill</h4>
          <AccuracyList rows={saved.bySkill} labelFor={skillTitle} />
          <h4 className={`mt-5 ${labelClass}`}>Accuracy by difficulty</h4>
          <AccuracyList rows={saved.byDifficulty} labelFor={(key) => difficultyLabel(key as "easy" | "medium" | "hard")} />
        </section>
      </div>

      <QuestionList
        title="Missed questions"
        items={summary.missed}
        questions={questions}
        session={session}
        emptyLabel="None"
      />
      <QuestionList
        title="Marked questions"
        items={summary.marked}
        questions={questions}
        session={session}
        emptyLabel="None"
      />
      {summary.unchecked.length > 0 && (
        <QuestionList
          title="Not checked"
          items={summary.unchecked}
          questions={questions}
          session={session}
          emptyLabel="None"
        />
      )}
    </div>
  );
}
