"use client";

import { useState } from "react";
import { Check, ChevronDown, Minus, X } from "lucide-react";
import StatCard from "@/components/portal/StatCard";
import { difficultyLabel, sectionLabel, skillTitle } from "@/lib/sat/catalog";
import { plainStem } from "@/lib/sat/attempts";
import { sessionScore, type SessionSummary, type StoredAnswer, type StoredSession } from "@/lib/sat/session";
import type { SatQuestion, SatSection } from "@/lib/sat/types";
import { QuestionContent } from "./QuestionContent";
import { cardClass, labelClass, primaryClass, secondaryClass } from "./styles";

function percentLabel(correct: number, checked: number): string {
  if (checked === 0) return "—";
  return `${Math.round((correct / checked) * 100)}%`;
}

const displayMath = /\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g;

function plainPreview(text: string): string {
  return plainStem(text.replace(displayMath, " "));
}

function shortAnswer(question: SatQuestion, response: string): string {
  const trimmed = response.trim();
  if (!trimmed) return "none";
  const choice = question.choices?.find((item) => item.label === trimmed);
  return choice ? choice.label : trimmed;
}

function AnswerValue({ question, response }: { question: SatQuestion; response: string }) {
  const trimmed = response.trim();
  if (!trimmed) return <p className="mt-1 text-sm text-gray-500">None</p>;
  const choice = question.choices?.find((item) => item.label === trimmed);
  if (!choice) {
    return (
      <div className="mt-1 text-sm leading-6 text-gray-900">
        <QuestionContent format={question.format} text={trimmed} />
      </div>
    );
  }
  return (
    <div className="mt-1 flex min-w-0 gap-2 text-sm leading-6 text-gray-900">
      <span className="shrink-0 font-semibold">{choice.label}.</span>
      <span className="min-w-0 flex-1">
        <QuestionContent format={question.format} text={choice.text} />
      </span>
    </div>
  );
}

function Breakdown({
  title,
  rows,
  labelFor,
}: {
  title: string;
  rows: SessionSummary["bySkill"];
  labelFor: (key: string) => string;
}) {
  return (
    <section className={cardClass}>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">No answers checked</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {rows.map((row) => {
            const percent = row.checked === 0 ? 0 : Math.round((row.correct / row.checked) * 100);
            const label = labelFor(row.key);
            return (
              <li key={row.key}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 text-gray-800">{label}</span>
                  <span className="shrink-0 font-semibold text-gray-900">
                    {row.correct}/{row.checked} · {percent}%
                  </span>
                </div>
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100"
                  role="img"
                  aria-label={`${label}: ${row.correct} of ${row.checked} correct`}
                >
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const statusStyle = {
  correct: {
    label: "Correct",
    Icon: Check,
    chip: "bg-emerald-50 text-emerald-800",
  },
  incorrect: {
    label: "Incorrect",
    Icon: X,
    chip: "bg-red-50 text-red-800",
  },
  unchecked: {
    label: "Not checked",
    Icon: Minus,
    chip: "bg-gray-100 text-gray-700",
  },
} as const;

function ReviewItem({
  question,
  answer,
  number,
}: {
  question: SatQuestion;
  answer: StoredAnswer;
  number: number;
}) {
  const status = !answer.checked ? "unchecked" : answer.correct ? "correct" : "incorrect";
  const style = statusStyle[status];
  const [open, setOpen] = useState(status === "incorrect");
  const preview = plainPreview(question.stem) || "Question";
  const Icon = style.Icon;

  return (
    <li className="min-w-0 rounded-2xl border border-gray-100 bg-white shadow-sm">
      <button
        type="button"
        className="flex w-full min-w-0 items-start gap-3 rounded-2xl p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${style.chip}`}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {style.label}
        </span>
        <span className="min-w-0 flex-1">
          <span className={labelClass}>
            Question {number} · {sectionLabel(question.section)} · {skillTitle(question.skill)} · {difficultyLabel(question.difficulty)}
          </span>
          <span className="mt-1 block truncate text-sm text-gray-900">{preview}</span>
          <span className="mt-1 block text-xs text-gray-500">
            Your answer {shortAnswer(question, answer.response)}. Correct answer {shortAnswer(question, question.correctAnswer)}.
          </span>
        </span>
        <ChevronDown
          className={`mt-0.5 h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="min-w-0 border-t border-gray-100 px-4 pb-4 pt-3">
          {question.passage?.trim() && (
            <div className="mb-3 text-sm leading-6 text-gray-800">
              <QuestionContent format={question.format} text={question.passage} />
            </div>
          )}
          <div className="text-sm leading-6 text-gray-900">
            <QuestionContent format={question.format} text={question.stem.trim() ? question.stem : "Question"} />
          </div>
          <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className={labelClass}>Your answer</p>
              <AnswerValue question={question} response={answer.response} />
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className={labelClass}>Correct answer</p>
              <AnswerValue question={question} response={question.correctAnswer} />
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-gray-100 p-3">
            <p className={labelClass}>Explanation</p>
            <div className="mt-2 text-sm leading-6 text-gray-800">
              <QuestionContent format={question.format} text={question.explanation.trim() ? question.explanation : "No explanation is stored for this question."} />
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

function SetActions({
  missedCount,
  onRetryMissed,
  onNewSet,
}: {
  missedCount: number;
  onRetryMissed: () => void;
  onNewSet: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        className={`${primaryClass} w-full sm:w-auto`}
        disabled={missedCount === 0}
        onClick={onRetryMissed}
      >
        Retry missed
      </button>
      <button type="button" className={`${secondaryClass} w-full sm:w-auto`} onClick={onNewSet}>
        New set
      </button>
    </div>
  );
}

export function ResultsScreen({
  session,
  questions,
  summary,
  onRetryMissed,
  onNewSet,
}: {
  session: StoredSession;
  questions: readonly SatQuestion[];
  summary: SessionSummary;
  onRetryMissed: () => void;
  onNewSet: () => void;
}) {
  const score = sessionScore(summary);
  const ordered = session.questionIds.flatMap((id) => {
    const question = questions.find((entry) => entry.id === id);
    return question ? [question] : [];
  });

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-4">
      <div>
        <p className={labelClass}>Practice</p>
        <h2 className="mt-1 text-2xl font-bold text-gray-900">Results</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Correct"
          value={score.checked === 0 ? "—" : `${score.correct} of ${score.checked}`}
        />
        <StatCard label="Percent correct" value={percentLabel(score.correct, score.checked)} />
      </div>
      {summary.unchecked.length > 0 && (
        <p className="text-sm text-gray-500">
          {summary.unchecked.length === 1
            ? "1 answer was not checked and is left out of the score."
            : `${summary.unchecked.length} answers were not checked and are left out of the score.`}
        </p>
      )}

      <SetActions missedCount={summary.missed.length} onRetryMissed={onRetryMissed} onNewSet={onNewSet} />
      {score.checked > 0 && summary.missed.length === 0 && (
        <p className="text-sm text-gray-500">Every checked answer was correct.</p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Breakdown
          title="By section"
          rows={summary.bySection}
          labelFor={(key) => sectionLabel(key as SatSection)}
        />
        <Breakdown title="By skill" rows={summary.bySkill} labelFor={skillTitle} />
      </div>

      <section aria-label="Question review">
        <h3 className="text-base font-semibold text-gray-900">Questions</h3>
        <ul className="mt-3 flex flex-col gap-3">
          {ordered.map((question, index) => (
            <ReviewItem
              key={question.id}
              question={question}
              number={index + 1}
              answer={session.answers[question.id] ?? {
                response: "",
                checked: false,
                correct: null,
                marked: false,
                crossedOut: [],
              }}
            />
          ))}
        </ul>
      </section>

      <SetActions missedCount={summary.missed.length} onRetryMissed={onRetryMissed} onNewSet={onNewSet} />
    </div>
  );
}
