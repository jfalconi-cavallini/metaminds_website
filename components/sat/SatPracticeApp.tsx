"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getPracticeQuestions } from "@/lib/sat/bank";
import { isFixtureQuestion } from "@/lib/sat/schema";
import { emptyProgress, loadProgress, saveProgress, type SatProgressV1 } from "@/lib/sat/progress";
import {
  checkAnswer,
  createSession,
  emptyAnswer,
  filterQuestions,
  summarizeSession,
  summarizeSessions,
  takeQuestions,
  type PracticeFilters,
  type StoredAnswer,
  type StoredSession,
} from "@/lib/sat/session";
import type { SatQuestion } from "@/lib/sat/types";
import { QuestionScreen } from "./QuestionScreen";
import { ResultsScreen } from "./ResultsScreen";
import { SetupScreen } from "./SetupScreen";

type Phase = "setup" | "practice" | "results";

function questionsForSession(session: StoredSession, byId: Map<string, SatQuestion>): SatQuestion[] | null {
  const picked: SatQuestion[] = [];
  for (const id of session.questionIds) {
    const question = byId.get(id);
    if (!question) return null;
    picked.push(question);
  }
  return picked;
}

export function SatPracticeApp() {
  const bank = useMemo(() => {
    return getPracticeQuestions().filter((question) => (
      process.env.NODE_ENV === "production" ? !isFixtureQuestion(question) : true
    ));
  }, []);
  const byId = useMemo(() => new Map(bank.map((question) => [question.id, question])), [bank]);
  const [filters, setFilters] = useState<PracticeFilters>({
    section: "any",
    domain: "any",
    skill: "any",
    difficulty: "any",
    count: Math.min(5, Math.max(bank.length, 1)),
    timed: false,
  });
  const [phase, setPhase] = useState<Phase>("setup");
  const [session, setSession] = useState<StoredSession | null>(null);
  const [index, setIndex] = useState(0);
  const [timerHidden, setTimerHidden] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [progress, setProgress] = useState<SatProgressV1>(emptyProgress);
  const finishingRef = useRef(false);

  useEffect(() => {
    setProgress(loadProgress(window.localStorage));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (phase !== "practice") return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [phase, session?.id]);

  const matching = filterQuestions(bank, filters);
  const activeQuestions = session ? questionsForSession(session, byId) : null;
  const continueSession = progress.active && questionsForSession(progress.active, byId) ? progress.active : null;
  const latestSession = [...progress.completed].reverse().find((item) => questionsForSession(item, byId)) ?? null;

  function commit(nextSession: StoredSession | null, completed = progress.completed) {
    const stored: SatProgressV1 = {
      version: 1,
      active: nextSession && nextSession.finishedAt === null ? nextSession : null,
      completed: completed.slice(-50),
    };
    setProgress(stored);
    setSession(nextSession);
    saveProgress(window.localStorage, stored);
  }

  function updateCurrent(mutate: (current: StoredAnswer) => StoredAnswer, allowChecked = false) {
    if (!session) return;
    const question = activeQuestions?.[index];
    if (!question) return;
    const current = session.answers[question.id] ?? emptyAnswer();
    if (current.checked && !allowChecked) return;
    commit({
      ...session,
      answers: {
        ...session.answers,
        [question.id]: mutate(current),
      },
    });
  }

  function startPractice() {
    const picked = takeQuestions(matching, filters.count);
    if (picked.length === 0) return;
    finishingRef.current = false;
    setIndex(0);
    setTimerHidden(false);
    setPhase("practice");
    commit(createSession(picked, filters.timed));
  }

  function continuePractice() {
    if (!continueSession) return;
    finishingRef.current = false;
    setSession(continueSession);
    setIndex(0);
    setTimerHidden(false);
    setPhase("practice");
  }

  function openLatest() {
    if (!latestSession) return;
    setSession(latestSession);
    setPhase("results");
  }

  function finishPractice() {
    if (finishingRef.current || !session || !activeQuestions || session.finishedAt) return;
    finishingRef.current = true;
    const done: StoredSession = { ...session, finishedAt: new Date().toISOString() };
    setPhase("results");
    commit(done, [...progress.completed, done]);
  }

  function retry() {
    if (!session || !activeQuestions) return;
    finishingRef.current = false;
    setIndex(0);
    setTimerHidden(false);
    setPhase("practice");
    commit(createSession(activeQuestions, session.timed));
  }

  function newPractice() {
    finishingRef.current = false;
    setPhase("setup");
    commit(null);
  }

  if (phase === "practice" && session && activeQuestions) {
    const question = activeQuestions[index];
    return (
      <QuestionScreen
        session={session}
        questions={activeQuestions}
        index={index}
        now={now}
        timerHidden={timerHidden}
        onToggleTimer={() => setTimerHidden((hidden) => !hidden)}
        onSelect={(label) => {
          updateCurrent((current) => ({
            ...current,
            response: label,
            crossedOut: current.crossedOut.filter((choice) => choice !== label),
          }));
        }}
        onResponse={(value) => updateCurrent((current) => ({ ...current, response: value }))}
        onToggleCross={(label) => {
          updateCurrent((current) => {
            const crossed = current.crossedOut.includes(label)
              ? current.crossedOut.filter((choice) => choice !== label)
              : [...current.crossedOut, label];
            return {
              ...current,
              crossedOut: crossed,
              response: current.response === label ? "" : current.response,
            };
          });
        }}
        onToggleMark={() => {
          updateCurrent((current) => ({ ...current, marked: !current.marked }), true);
        }}
        onCheck={() => {
          if (!question) return;
          updateCurrent((current) => {
            if (current.response.trim() === "" || current.checked) return current;
            return {
              ...current,
              checked: true,
              correct: checkAnswer(question, current.response),
            };
          });
        }}
        onPrevious={() => setIndex((value) => Math.max(0, value - 1))}
        onNext={() => setIndex((value) => Math.min(activeQuestions.length - 1, value + 1))}
        onJump={(next) => setIndex(next)}
        onFinish={finishPractice}
      />
    );
  }

  if (phase === "results" && session && activeQuestions) {
    return (
      <ResultsScreen
        session={session}
        questions={activeQuestions}
        summary={summarizeSession(session, activeQuestions)}
        saved={summarizeSessions(progress.completed, bank)}
        onRetry={retry}
        onNewPractice={newPractice}
      />
    );
  }

  return (
    <SetupScreen
      filters={filters}
      available={matching.length}
      bankEmpty={bank.length === 0}
      canContinue={hydrated && continueSession !== null}
      canReview={hydrated && latestSession !== null}
      onChange={setFilters}
      onStart={startPractice}
      onContinue={continuePractice}
      onReview={openLatest}
    />
  );
}
