"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { games, trail } from "@/lib/games";
import GamesBreadcrumb from "../GamesBreadcrumb";
import {
  GRADE7_LEVELS,
  grade7AnswerLabel,
  grade7ChoiceText,
  grade7LevelById,
  isCorrectGrade7Answer,
  type Grade7Choice,
  type Grade7LevelId,
  type Grade7Question,
} from "@/lib/grade7Math";

type Feedback =
  | { kind: "correct" | "miss"; typed: string; answer: string; explanation: string }
  | { kind: "empty" }
  | null;

type Phase = "pick" | "play" | "done";

type Miss = {
  id: string;
  prompt: string;
  teks: string;
  typed: string;
  answer: string;
};

const CHOICES: readonly Grade7Choice[] = ["A", "B", "C", "D"];

const mixGame = games.find((entry) => entry.slug === "grade-7-math-mix");

const goldButton =
  "inline-flex min-h-14 w-full touch-manipulation items-center justify-center rounded-xl bg-[#E0B44A] px-4 text-center text-[16px] font-bold text-[#071426] hover:bg-[#C9962E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6F0E4] active:bg-[#C9962E] disabled:opacity-60";

const navyButton =
  "inline-flex min-h-14 w-full min-w-0 touch-manipulation items-center justify-center rounded-xl border-2 border-[#E0B44A] bg-[#10243F] px-3 py-3 text-center text-[16px] font-bold leading-tight text-[#F6F0E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E0B44A] active:bg-[#183456]";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-xl bg-[#10243F] px-2 py-1.5 text-center">
      <p className="break-words text-[11px] font-bold uppercase leading-tight tracking-widest text-[#D5C7A8]">{label}</p>
      <p className="mt-1 text-[20px] font-bold leading-none text-[#F6F0E4]">{value}</p>
    </div>
  );
}

function typedLabel(question: Grade7Question, raw: string): string {
  if (question.type === "mcq") {
    const letter = raw.trim().toUpperCase();
    return `${letter}. ${grade7ChoiceText(question, letter)}`;
  }
  return raw.trim();
}

export default function Grade7MathGame() {
  const [phase, setPhase] = useState<Phase>("pick");
  const [levelId, setLevelId] = useState<Grade7LevelId>("level1");
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<Miss[]>([]);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);
  const inputId = useId();
  const feedbackId = useId();

  const level = grade7LevelById(levelId);
  const questions = level.questions;
  const current: Grade7Question | undefined = questions[index];
  const awaitingNext = feedback?.kind === "correct" || feedback?.kind === "miss";
  const finishing = awaitingNext && index === questions.length - 1;

  function startRound(nextLevel: Grade7LevelId = levelId) {
    setLevelId(nextLevel);
    setIndex(0);
    setScore(0);
    setMissed([]);
    setAnswer("");
    setFeedback(null);
    setPhase("play");
  }

  function settle(question: Grade7Question, raw: string) {
    const typed = raw.trim();
    if (!typed) {
      setFeedback({ kind: "empty" });
      return;
    }
    const label = typedLabel(question, typed);
    const correct = grade7AnswerLabel(question);
    if (isCorrectGrade7Answer(typed, question)) {
      setScore((value) => value + 1);
      setFeedback({ kind: "correct", typed: label, answer: correct, explanation: question.explanation });
    } else {
      setMissed((prev) => [
        ...prev,
        { id: question.id, prompt: question.question, teks: question.teks, typed: label, answer: correct },
      ]);
      setFeedback({ kind: "miss", typed: label, answer: correct, explanation: question.explanation });
    }
    window.setTimeout(() => actionRef.current?.focus(), 0);
  }

  function checkAnswer() {
    if (awaitingNext || !current) return;
    settle(current, answer);
  }

  function choose(letter: Grade7Choice) {
    if (awaitingNext || !current || current.type !== "mcq") return;
    settle(current, letter);
  }

  function goToNext() {
    if (!awaitingNext) return;
    const next = index + 1;
    setAnswer("");
    setFeedback(null);
    if (next >= questions.length) {
      setPhase("done");
      return;
    }
    setIndex(next);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (awaitingNext) goToNext();
    else checkAnswer();
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#071426] text-[#F6F0E4]">
      <div className="h-1.5 bg-[#E0B44A]" aria-hidden="true" />
      <div className="mx-auto w-full min-w-0 max-w-lg px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
        {mixGame && (
          <GamesBreadcrumb tone="game" items={trail(mixGame.level, mixGame.subject, mixGame.title)} />
        )}
        <div className="mt-2 min-w-0">
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#E0B44A]">
            {phase === "play" ? `${level.label} ${level.detail}` : "Grade 7"}
          </p>
          <h1 className={`break-words font-bold leading-tight ${phase === "play" ? "text-[18px]" : "text-[24px]"}`}>
            Grade 7 Math Mix
          </h1>
        </div>

        {phase === "pick" && (
          <div className="mt-6">
            <p className="text-[18px] leading-snug text-[#D5C7A8]">
              Pick a level. Answer each question. The explanation shows right away.
            </p>
            <p className="mt-6 text-[12px] font-bold uppercase tracking-widest text-[#D5C7A8]">Choose a level</p>
            <div className="mt-2 grid gap-3" role="group" aria-label="Choose a level">
              {GRADE7_LEVELS.map((option) => {
                const selected = levelId === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setLevelId(option.id)}
                    className={`flex min-h-14 w-full touch-manipulation flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border-2 border-[#E0B44A] px-4 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6F0E4] ${
                      selected ? "bg-[#E0B44A] text-[#071426]" : "bg-[#10243F] text-[#F6F0E4]"
                    }`}
                  >
                    <span className="text-[18px] font-bold">
                      {option.label} {option.detail}
                    </span>
                    <span className={`text-[16px] ${selected ? "text-[#071426]" : "text-[#D5C7A8]"}`}>
                      {option.questions.length} questions
                    </span>
                  </button>
                );
              })}
            </div>
            <button type="button" className={`${goldButton} mt-6`} onClick={() => startRound(levelId)}>
              Start
            </button>
          </div>
        )}

        {phase === "play" && current && (
          <div className="mt-4">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Score" value={score} />
              <Stat label="Question" value={index + 1} />
            </div>
            <p className="mt-2 text-center text-[14px] text-[#D5C7A8]">
              Question {index + 1} of {questions.length}
            </p>

            <div className="mt-3 rounded-xl bg-[#10243F] px-4 py-4">
              <p className="text-[12px] leading-none text-[#D5C7A8]">{current.teks}</p>
              <p className="mt-2 break-words text-[22px] font-bold leading-snug">{current.question}</p>
            </div>

            {current.type === "mcq" && current.choices && (
              <div className="mt-3 grid gap-2" role="group" aria-label="Answer choices">
                {CHOICES.map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    disabled={awaitingNext}
                    onClick={() => choose(letter)}
                    className={`${navyButton} justify-start gap-2 px-4 text-left disabled:opacity-70`}
                  >
                    <span className="text-[#E0B44A]">{letter}.</span>
                    <span className="break-words">{current.choices?.[letter]}</span>
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-3 w-full min-w-0">
              {current.type === "spr" && (
                <>
                  <label htmlFor={inputId} className="text-[16px] font-bold text-[#F6F0E4]">
                    Type your answer
                  </label>
                  <input
                    ref={inputRef}
                    id={inputId}
                    value={answer}
                    onChange={(event) => {
                      setAnswer(event.target.value);
                      if (feedback?.kind === "empty") setFeedback(null);
                    }}
                    readOnly={awaitingNext}
                    autoCapitalize="off"
                    autoCorrect="off"
                    autoComplete="off"
                    spellCheck={false}
                    enterKeyHint={awaitingNext ? "next" : "done"}
                    inputMode="text"
                    placeholder="Type here"
                    aria-describedby={feedback ? feedbackId : undefined}
                    className="mt-1 box-border h-14 w-full min-w-0 rounded-xl border-2 border-[#E0B44A] bg-[#F6F0E4] px-4 text-[16px] font-semibold text-[#071426] placeholder:text-[#6E624C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#071426]"
                  />
                </>
              )}

              {feedback?.kind === "correct" && (
                <div id={feedbackId} role="status" aria-live="polite" className="mt-3 rounded-xl border-2 border-[#E0B44A] bg-[#10243F] px-4 py-3">
                  <p className="text-[12px] font-bold uppercase tracking-widest text-[#E0B44A]">Correct</p>
                  <p className="mt-1 text-[12px] font-bold uppercase tracking-widest text-[#D5C7A8]">Correct answer</p>
                  <p className="break-words text-[28px] font-bold leading-tight">{feedback.answer}</p>
                  <p className="mt-2 break-words text-[16px] leading-snug text-[#F6F0E4]">{feedback.explanation}</p>
                </div>
              )}
              {feedback?.kind === "miss" && (
                <div id={feedbackId} role="status" aria-live="polite" className="mt-3 rounded-xl border-2 border-[#E7A08C] bg-[#10243F] px-4 py-3">
                  <p className="text-[12px] font-bold uppercase tracking-widest text-[#E7A08C]">Not quite</p>
                  <p className="mt-2 text-[12px] font-bold uppercase tracking-widest text-[#D5C7A8]">
                    {current.type === "mcq" ? "You chose" : "You typed"}
                  </p>
                  <p className="break-all text-[20px] font-semibold">{feedback.typed}</p>
                  <p className="mt-2 text-[12px] font-bold uppercase tracking-widest text-[#E0B44A]">Correct answer</p>
                  <p className="break-words text-[28px] font-bold leading-tight">{feedback.answer}</p>
                  <p className="mt-2 break-words text-[16px] leading-snug text-[#F6F0E4]">{feedback.explanation}</p>
                </div>
              )}
              {feedback?.kind === "empty" && (
                <p id={feedbackId} role="status" aria-live="polite" className="mt-3 text-[16px] text-[#E0B44A]">
                  Type an answer, then submit.
                </p>
              )}

              {(current.type === "spr" || awaitingNext) && (
                <button ref={actionRef} type="submit" className={`${goldButton} mt-3`}>
                  {awaitingNext ? (finishing ? "See results" : "Next question") : "Submit"}
                </button>
              )}
            </form>
          </div>
        )}

        {phase === "done" && (
          <div className="mt-6">
            <h2 className="text-[28px] font-bold leading-tight">Round complete</h2>
            <p className="mt-2 text-[18px] text-[#D5C7A8]">
              {level.label} {level.detail}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Stat label="Score" value={score} />
              <Stat label="Misses" value={missed.length} />
            </div>
            <p className="mt-3 text-[16px] text-[#F6F0E4]">
              {score} of {questions.length}
            </p>
            <h3 className="mt-6 text-[12px] font-bold uppercase tracking-widest text-[#E0B44A]">Missed questions</h3>
            {missed.length === 0 ? (
              <p className="mt-2 text-[18px] text-[#F6F0E4]">No missed questions.</p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {missed.map((item) => (
                  <li key={item.id} className="rounded-xl bg-[#10243F] px-4 py-3">
                    <p className="text-[12px] leading-none text-[#D5C7A8]">{item.teks}</p>
                    <p className="mt-2 break-words text-[16px] leading-snug">{item.prompt}</p>
                    <p className="mt-2 text-[12px] font-bold uppercase tracking-widest text-[#D5C7A8]">Your answer</p>
                    <p className="break-all text-[16px]">{item.typed}</p>
                    <p className="mt-2 text-[12px] font-bold uppercase tracking-widest text-[#E0B44A]">Correct answer</p>
                    <p className="break-words text-[20px] font-bold">{item.answer}</p>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className={`${goldButton} mt-6`} onClick={() => startRound(levelId)}>
              Play again
            </button>
            <button
              type="button"
              className={`${navyButton} mt-3`}
              onClick={() => {
                setPhase("pick");
                setFeedback(null);
                setAnswer("");
              }}
            >
              Choose another level
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
