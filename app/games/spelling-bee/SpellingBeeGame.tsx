"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { games, trail } from "@/lib/games";
import GamesBreadcrumb from "../GamesBreadcrumb";
import {
  GRADE_4_WORDS,
  GRADE_5_WORDS,
  blankExample,
  buildRound,
  isCorrectSpelling,
  requeueCurrent,
  type GradeChoice,
  type SpellingWord,
} from "@/lib/spellingBee";

const spellingGame = games.find((entry) => entry.slug === "spelling-bee");

const HEAR_RATE = 0.95;
const SLOW_RATE = 0.6;
const SENTENCE_RATE = 0.9;

const SPEECH_NOTE = "Sound is off on this device. The example hides the word.";

type Feedback =
  | { kind: "correct" | "miss"; spelling: string; typed: string }
  | { kind: "empty" }
  | null;

type Phase = "pick" | "play" | "done";

const goldButton =
  "inline-flex min-h-14 w-full touch-manipulation items-center justify-center rounded-xl bg-[#E0B44A] px-4 text-center text-[16px] font-bold text-[#071426] hover:bg-[#C9962E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6F0E4] active:bg-[#C9962E]";

const navyButton =
  "inline-flex min-h-14 w-full min-w-0 touch-manipulation items-center justify-center rounded-xl border-2 border-[#E0B44A] bg-[#10243F] px-3 py-3 text-center text-[16px] font-bold leading-tight text-[#F6F0E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E0B44A] active:bg-[#183456]";

function listLabel(choice: GradeChoice): string {
  if (choice === "4") return "Grade 4";
  if (choice === "5") return "Grade 5";
  return "Mixed";
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-xl bg-[#10243F] px-2 py-1.5 text-center">
      <p className="break-words text-[11px] font-bold uppercase leading-tight tracking-widest text-[#D5C7A8]">{label}</p>
      <p className="mt-1 text-[20px] font-bold leading-none text-[#F6F0E4]">{value}</p>
    </div>
  );
}

export default function SpellingBeeGame() {
  const [phase, setPhase] = useState<Phase>("pick");
  const [choice, setChoice] = useState<GradeChoice>("4");
  const [queue, setQueue] = useState<SpellingWord[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [exampleShown, setExampleShown] = useState(false);
  const [speechOk, setSpeechOk] = useState<boolean | null>(null);

  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lastSpeechRef = useRef<{ text: string; rate: number } | null>(null);
  const busyRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);
  const exampleRef = useRef<HTMLParagraphElement>(null);
  const inputId = useId();
  const feedbackId = useId();

  const awaitingNext = feedback?.kind === "correct" || feedback?.kind === "miss";
  const current = queue[0];
  const showExample = exampleShown || speechOk === false;

  useEffect(() => {
    busyRef.current = false;
  }, [feedback, queue, phase]);

  useEffect(() => {
    const supported = "speechSynthesis" in window && typeof SpeechSynthesisUtterance === "function";
    const timer = window.setTimeout(() => setSpeechOk(supported), 0);
    if (!supported) return () => window.clearTimeout(timer);
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find((voice) => voice.lang === "en-US") ??
        voices.find((voice) => voice.lang.toLowerCase().replace(/_/g, "-").startsWith("en-us")) ??
        voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ??
        null;
    };
    pickVoice();
    window.speechSynthesis.addEventListener("voiceschanged", pickVoice);
    return () => {
      window.clearTimeout(timer);
      window.speechSynthesis.removeEventListener("voiceschanged", pickVoice);
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const keepInputVisible = () => {
      const input = inputRef.current;
      if (!input || document.activeElement !== input) return;
      const rect = input.getBoundingClientRect();
      const visibleBottom = viewport.offsetTop + viewport.height - 16;
      const overlap = rect.bottom - visibleBottom;
      if (overlap > 0) window.scrollBy({ top: overlap });
    };
    viewport.addEventListener("resize", keepInputVisible);
    viewport.addEventListener("scroll", keepInputVisible);
    return () => {
      viewport.removeEventListener("resize", keepInputVisible);
      viewport.removeEventListener("scroll", keepInputVisible);
    };
  }, []);

  useEffect(() => {
    if (exampleShown) exampleRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [exampleShown]);

  useEffect(() => {
    if (awaitingNext) actionRef.current?.focus();
  }, [awaitingNext, feedback]);

  function cancelSpeech() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  function speak(text: string, rate: number) {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance !== "function") {
      setSpeechOk(false);
      return;
    }
    try {
      const synth = window.speechSynthesis;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-US";
      utter.rate = rate;
      if (voiceRef.current) utter.voice = voiceRef.current;
      utter.onerror = (event) => {
        if (event.error === "canceled" || event.error === "interrupted") return;
        setSpeechOk(false);
      };
      utteranceRef.current = utter;
      lastSpeechRef.current = { text, rate };
      const start = () => {
        try {
          synth.speak(utter);
        } catch {
          setSpeechOk(false);
        }
      };
      if (synth.speaking || synth.pending) {
        synth.cancel();
        window.setTimeout(start, 60);
      } else {
        start();
      }
    } catch {
      setSpeechOk(false);
    }
  }

  function replay() {
    const last = lastSpeechRef.current;
    if (last) speak(last.text, last.rate);
    else if (current) speak(current.spelling, HEAR_RATE);
  }

  function playExample() {
    if (!current) return;
    setExampleShown(true);
    if (speechOk !== false) speak(current.sentence, SENTENCE_RATE);
  }

  function startRound() {
    const round = buildRound(choice);
    const first = round[0];
    if (!first) return;
    busyRef.current = false;
    setQueue(round);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setMissed([]);
    setAnswer("");
    setFeedback(null);
    setExampleShown(false);
    setPhase("play");
    speak(first.spelling, HEAR_RATE);
  }

  function checkAnswer() {
    if (busyRef.current || awaitingNext) return;
    const word = queue[0];
    if (!word) return;
    if (!answer.trim()) {
      setFeedback({ kind: "empty" });
      return;
    }
    busyRef.current = true;
    const typed = answer.trim();
    if (isCorrectSpelling(answer, word)) {
      const nextStreak = streak + 1;
      setScore((value) => value + 1);
      setStreak(nextStreak);
      setBestStreak((value) => Math.max(value, nextStreak));
      setFeedback({ kind: "correct", spelling: word.spelling, typed });
      return;
    }
    setStreak(0);
    setMissed((prev) => (prev.includes(word.spelling) ? prev : [...prev, word.spelling]));
    setFeedback({ kind: "miss", spelling: word.spelling, typed });
  }

  function goToNext() {
    if (busyRef.current) return;
    if (feedback?.kind !== "correct" && feedback?.kind !== "miss") return;
    const word = queue[0];
    if (!word) return;
    busyRef.current = true;
    const nextQueue = feedback.kind === "correct" ? queue.slice(1) : requeueCurrent(queue);
    setAnswer("");
    setFeedback(null);
    setExampleShown(false);
    if (nextQueue.length === 0) {
      setQueue([]);
      setPhase("done");
      cancelSpeech();
      return;
    }
    setQueue(nextQueue);
    const upcoming = nextQueue[0];
    if (upcoming) speak(upcoming.spelling, HEAR_RATE);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (awaitingNext) goToNext();
    else checkAnswer();
  }

  function keepInputInView() {
    window.setTimeout(() => {
      inputRef.current?.scrollIntoView({ block: "start", inline: "nearest" });
    }, 280);
  }

  const choices: { id: GradeChoice; label: string; detail: string }[] = [
    { id: "4", label: "Grade 4", detail: `${GRADE_4_WORDS.length} words` },
    { id: "5", label: "Grade 5", detail: `${GRADE_5_WORDS.length} words` },
    { id: "mixed", label: "Mixed", detail: `${GRADE_4_WORDS.length + GRADE_5_WORDS.length} words` },
  ];

  const finishing = feedback?.kind === "correct" && queue.length === 1;

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#071426] text-[#F6F0E4]">
      <div className="h-1.5 bg-[#E0B44A]" aria-hidden="true" />
      <div
        className="mx-auto w-full min-w-0 max-w-lg px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]"
      >
        {spellingGame && (
          <GamesBreadcrumb tone="game" items={trail(spellingGame.level, spellingGame.subject, spellingGame.title)} />
        )}
        <div className="mt-2 min-w-0">
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#E0B44A]">
            {phase === "play" ? listLabel(choice) : "Practice"}
          </p>
          <h1 className={`break-words font-bold leading-tight ${phase === "play" ? "text-[18px]" : "text-[24px]"}`}>
            Spelling Bee Practice
          </h1>
        </div>

        {phase === "pick" && (
          <div className="mt-6">
            <p className="text-[18px] leading-snug text-[#D5C7A8]">
              Hear the word, then type it. Missed words come back later in the round.
            </p>
            {speechOk === false && (
              <p className="mt-4 break-words rounded-xl bg-[#10243F] px-4 py-3 text-[16px] leading-snug text-[#F6F0E4]">
                {SPEECH_NOTE}
              </p>
            )}
            <p className="mt-6 text-[12px] font-bold uppercase tracking-widest text-[#D5C7A8]">Choose a list</p>
            <div className="mt-2 grid gap-3" role="group" aria-label="Choose a list">
              {choices.map((option) => {
                const selected = choice === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setChoice(option.id)}
                    className={`flex min-h-14 w-full touch-manipulation flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border-2 border-[#E0B44A] px-4 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6F0E4] ${
                      selected ? "bg-[#E0B44A] text-[#071426]" : "bg-[#10243F] text-[#F6F0E4]"
                    }`}
                  >
                    <span className="text-[18px] font-bold">{option.label}</span>
                    <span className={`text-[16px] ${selected ? "text-[#071426]" : "text-[#D5C7A8]"}`}>{option.detail}</span>
                  </button>
                );
              })}
            </div>
            <button type="button" className={`${goldButton} mt-6`} onClick={startRound}>
              Start
            </button>
          </div>
        )}

        {phase === "play" && current && (
          <div className="mt-4">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Score" value={score} />
              <Stat label="Streak" value={streak} />
              <Stat label="Misses" value={missed.length} />
            </div>

            {speechOk === false && (
              <p className="mt-3 break-words rounded-xl bg-[#10243F] px-4 py-3 text-[16px] leading-snug">{SPEECH_NOTE}</p>
            )}

            {showExample && (
              <div className="mt-3 rounded-xl bg-[#10243F] px-4 py-3">
                <p className="text-[12px] font-bold uppercase tracking-widest text-[#E0B44A]">Example sentence</p>
                <p ref={exampleRef} className="mt-1 break-words text-[18px] leading-snug">
                  {blankExample(current.sentence, current.spelling)}
                </p>
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-3 w-full min-w-0">
              <label htmlFor={inputId} className="text-[16px] font-bold text-[#F6F0E4]">
                Type the spelling
              </label>
              <input
                ref={inputRef}
                id={inputId}
                value={answer}
                onChange={(event) => {
                  setAnswer(event.target.value);
                  if (feedback?.kind === "empty") setFeedback(null);
                }}
                onFocus={keepInputInView}
                readOnly={awaitingNext}
                maxLength={40}
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                enterKeyHint={awaitingNext ? "next" : "done"}
                inputMode="text"
                placeholder="Type here"
                aria-describedby={feedback ? feedbackId : undefined}
                className="mt-1 box-border h-14 w-full min-w-0 scroll-mt-3 rounded-xl border-2 border-[#E0B44A] bg-[#F6F0E4] px-4 text-[16px] font-semibold text-[#071426] placeholder:text-[#6E624C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#071426]"
              />

              {feedback?.kind === "correct" && (
                <div id={feedbackId} role="status" aria-live="polite" className="mt-3 rounded-xl border-2 border-[#E0B44A] bg-[#10243F] px-4 py-3">
                  <p className="text-[12px] font-bold uppercase tracking-widest text-[#E0B44A]">Correct</p>
                  <p className="mt-1 break-words text-[32px] font-bold leading-tight">{feedback.spelling}</p>
                </div>
              )}
              {feedback?.kind === "miss" && (
                <div id={feedbackId} role="status" aria-live="polite" className="mt-3 rounded-xl border-2 border-[#E7A08C] bg-[#10243F] px-4 py-3">
                  <p className="text-[12px] font-bold uppercase tracking-widest text-[#E7A08C]">Not quite</p>
                  <p className="mt-2 text-[12px] font-bold uppercase tracking-widest text-[#D5C7A8]">You typed</p>
                  <p className="break-all text-[20px] font-semibold">{feedback.typed}</p>
                  <p className="mt-2 text-[12px] font-bold uppercase tracking-widest text-[#E0B44A]">Correct spelling</p>
                  <p className="break-words text-[32px] font-bold leading-tight">{feedback.spelling}</p>
                </div>
              )}
              {feedback?.kind === "empty" && (
                <p id={feedbackId} role="status" aria-live="polite" className="mt-3 text-[16px] text-[#E0B44A]">
                  Type the spelling, then submit.
                </p>
              )}

              <button ref={actionRef} type="submit" className={`${goldButton} mt-3`}>
                {awaitingNext ? (finishing ? "See results" : "Next word") : "Submit"}
              </button>
            </form>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className={navyButton} onClick={() => speak(current.spelling, HEAR_RATE)}>
                Hear word
              </button>
              <button type="button" className={navyButton} onClick={replay}>
                Replay
              </button>
              <button type="button" className={navyButton} onClick={() => speak(current.spelling, SLOW_RATE)}>
                Slow
              </button>
              <button type="button" className={navyButton} onClick={playExample}>
                Example sentence
              </button>
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="mt-6">
            <h2 className="text-[28px] font-bold leading-tight">Round complete</h2>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Stat label="Score" value={score} />
              <Stat label="Best streak" value={bestStreak} />
              <Stat label="Misses" value={missed.length} />
            </div>
            <h3 className="mt-6 text-[12px] font-bold uppercase tracking-widest text-[#E0B44A]">Missed words</h3>
            {missed.length === 0 ? (
              <p className="mt-2 text-[18px] text-[#F6F0E4]">No missed words.</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {missed.map((spelling) => (
                  <li key={spelling} className="max-w-full break-words rounded-xl bg-[#10243F] px-3 py-2 text-[18px]">
                    {spelling}
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className={`${goldButton} mt-6`} onClick={startRound}>
              Play again
            </button>
            <button
              type="button"
              className={`${navyButton} mt-3`}
              onClick={() => {
                cancelSpeech();
                setPhase("pick");
              }}
            >
              Choose another list
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
