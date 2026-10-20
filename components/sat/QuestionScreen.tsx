"use client";

import { difficultyLabel, sectionLabel, skillTitle } from "@/lib/sat/catalog";
import { formatClock, secondsRemaining, type StoredAnswer, type StoredSession } from "@/lib/sat/session";
import type { SatQuestion } from "@/lib/sat/types";
import { QuestionContent } from "./QuestionContent";
import { cardClass, labelClass, primaryClass, secondaryClass } from "./styles";

export function QuestionScreen({
  session,
  questions,
  index,
  now,
  timerHidden,
  onToggleTimer,
  onSelect,
  onResponse,
  onToggleCross,
  onToggleMark,
  onCheck,
  checkPending = false,
  onPrevious,
  onNext,
  onJump,
  onFinish,
}: {
  session: StoredSession;
  questions: readonly SatQuestion[];
  index: number;
  now: number | null;
  timerHidden: boolean;
  onToggleTimer: () => void;
  onSelect: (label: string) => void;
  onResponse: (value: string) => void;
  onToggleCross: (label: string) => void;
  onToggleMark: () => void;
  onCheck: () => void;
  checkPending?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onJump: (index: number) => void;
  onFinish: () => void;
}) {
  const question = questions[index];
  if (!question) {
    return <p className="text-sm">This question is unavailable.</p>;
  }
  const answer: StoredAnswer = session.answers[question.id] ?? {
    response: "",
    checked: false,
    correct: null,
    marked: false,
    crossedOut: [],
  };
  const last = index === questions.length - 1;
  const elapsed = now === null ? 0 : (now - Date.parse(session.startedAt)) / 1000;
  const remaining = secondsRemaining(session.startedAt, session.durationSeconds, now ?? Date.parse(session.startedAt));
  const clock = session.timed ? formatClock(remaining) : formatClock(elapsed);
  const timeUp = session.timed && now !== null && remaining <= 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className={labelClass}>
            Question {index + 1} of {questions.length}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {sectionLabel(question.section)}, {skillTitle(question.skill)}, {difficultyLabel(question.difficulty)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={answer.marked ? primaryClass : secondaryClass}
            aria-pressed={answer.marked}
            onClick={onToggleMark}
          >
            {answer.marked ? "Marked for review" : "Mark for review"}
          </button>
          <button type="button" className={secondaryClass} onClick={onFinish}>
            End practice
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
        {timerHidden ? (
          <button type="button" className={secondaryClass} onClick={onToggleTimer}>
            Show timer
          </button>
        ) : (
          <>
            <div>
              <p className={labelClass}>
                {session.timed ? "Time left" : "Elapsed"}
              </p>
              <p className="text-3xl font-bold text-gray-900">{clock}</p>
              {timeUp && <p className="text-xs font-semibold text-red-600">Time is up</p>}
            </div>
            <button type="button" className={secondaryClass} onClick={onToggleTimer}>
              Hide timer
            </button>
          </>
        )}
      </div>

      <section aria-label="Questions" className={cardClass}>
        <div className="mb-3 flex flex-wrap gap-4 text-xs text-gray-500">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm ring-2 ring-blue-600" />
            Current
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-blue-600" />
            Answered
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            Marked
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
          {questions.map((item, itemIndex) => {
            const itemAnswer = session.answers[item.id];
            const answered = Boolean(itemAnswer?.response.trim());
            const marked = Boolean(itemAnswer?.marked);
            const current = itemIndex === index;
            const classes = [
              "relative flex h-11 items-center justify-center rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              current ? "ring-2 ring-blue-600" : "",
              answered ? "bg-blue-600 text-white" : "border border-gray-200 bg-white text-gray-700",
            ].join(" ");
            const status = [
              `Question ${itemIndex + 1}`,
              answered ? "answered" : "unanswered",
              marked ? "marked" : "",
              current ? "current" : "",
            ].filter(Boolean).join(", ");
            return (
              <button
                key={item.id}
                type="button"
                className={classes}
                aria-label={status}
                aria-current={current ? "true" : undefined}
                onClick={() => onJump(itemIndex)}
              >
                {itemIndex + 1}
                {marked && (
                  <span
                    className={`absolute right-1 top-1 h-1.5 w-1.5 rounded-full ${answered ? "bg-white" : "bg-amber-500"}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <div className={`grid grid-cols-1 gap-4 ${question.passage ? "lg:grid-cols-2" : ""}`}>
        {question.passage && (
          <section aria-label="Passage" className={`${cardClass} lg:max-h-[70vh] lg:overflow-y-auto`}>
            <p className={labelClass}>Passage</p>
            <div className="mt-3 text-sm leading-7 text-gray-900">
              <QuestionContent format={question.format} text={question.passage} />
            </div>
          </section>
        )}

        <section aria-label="Question" className={`${cardClass} ${question.passage ? "" : "lg:max-w-3xl"}`}>
          <h2 className="text-base font-medium leading-7 text-gray-900">
            <QuestionContent format={question.format} text={question.stem} />
          </h2>

          {question.choices ? (
            <ul className="mt-5 flex flex-col gap-3">
              {question.choices.map((choice) => {
                const selected = answer.response === choice.label;
                const crossed = answer.crossedOut.includes(choice.label);
                const showCorrect = answer.checked && choice.label === question.correctAnswer;
                const showWrong = answer.checked && selected && answer.correct === false;
                const choiceClass = [
                  "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  showCorrect
                    ? "border-emerald-500 bg-emerald-50"
                    : showWrong
                      ? "border-red-300 bg-red-50"
                      : selected
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 bg-white",
                  crossed ? "line-through opacity-60" : "",
                ].join(" ");
                return (
                  <li key={choice.label} className="flex items-stretch gap-2">
                    <button
                      type="button"
                      className={`${choiceClass} min-w-0 flex-1`}
                      aria-pressed={selected}
                      disabled={answer.checked}
                      onClick={() => onSelect(choice.label)}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                        showCorrect
                          ? "border-emerald-600 text-emerald-700"
                          : showWrong
                            ? "border-red-400 text-red-600"
                            : selected
                              ? "border-blue-600 text-blue-700"
                              : "border-gray-300 text-gray-700"
                      }`}>
                        {choice.label}
                      </span>
                      <span className="pt-1 text-sm leading-6 text-gray-900">
                        <QuestionContent format={question.format} text={choice.text} />
                        {showCorrect && <span className="mt-1 block text-xs font-semibold text-emerald-700">Correct answer</span>}
                        {showWrong && <span className="mt-1 block text-xs font-semibold text-red-600">Your answer</span>}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`${secondaryClass} shrink-0 px-3`}
                      aria-pressed={crossed}
                      aria-label={crossed ? `Restore choice ${choice.label}` : `Cross out choice ${choice.label}`}
                      disabled={answer.checked}
                      onClick={() => onToggleCross(choice.label)}
                    >
                      {crossed ? "Restore" : "Cross out"}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-5">
              <label className={labelClass} htmlFor="sat-spr">
                Your answer
              </label>
              <input
                id="sat-spr"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:opacity-70"
                value={answer.response}
                inputMode="text"
                autoComplete="off"
                disabled={answer.checked}
                onChange={(event) => onResponse(event.target.value)}
              />
              <p className="mt-2 text-xs text-gray-500">Number or fraction.</p>
              {answer.checked && answer.correct === false && (
                <p className="mt-2 text-sm text-gray-900">Correct answer: {question.correctAnswer}</p>
              )}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              className={primaryClass}
              disabled={answer.response.trim() === "" || answer.checked || checkPending}
              onClick={onCheck}
            >
              {checkPending ? "Checking…" : "Check answer"}
            </button>
            {answer.checked && (
              <p role="status" className={`text-sm font-semibold ${answer.correct ? "text-emerald-700" : "text-red-600"}`}>
                {answer.correct ? "Correct" : "Incorrect"}
              </p>
            )}
          </div>

          {answer.checked && (
            <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className={labelClass}>Explanation</p>
              <div className="mt-2 text-sm leading-6 text-gray-900">
                <QuestionContent format={question.format} text={question.explanation} />
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 flex gap-3 border-t border-gray-200 bg-white px-4 py-3 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0">
        <button type="button" className={`${secondaryClass} flex-1`} disabled={index === 0} onClick={onPrevious}>
          Previous
        </button>
        <button type="button" className={`${primaryClass} flex-1`} onClick={last ? onFinish : onNext}>
          {last ? "See results" : "Next"}
        </button>
      </div>
    </div>
  );
}
