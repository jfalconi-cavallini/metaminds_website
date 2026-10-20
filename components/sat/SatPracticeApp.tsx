"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { readGradeResponse } from "@/lib/sat/attempts";
import { mockPracticeQuestions } from "@/lib/sat/mockBank";
import { emptyProgress, loadProgress, saveProgress, type SatProgressV1 } from "@/lib/sat/progress";
import { fetchSatQuestions, type SatQuestionsClient } from "@/lib/sat/query";
import {
  createSession,
  emptyAnswer,
  filterQuestions,
  summarizeSession,
  takeQuestions,
  type PracticeFilters,
  type StoredAnswer,
  type StoredSession,
} from "@/lib/sat/session";
import type { SatQuestion } from "@/lib/sat/types";
import { QuestionScreen } from "./QuestionScreen";
import { ResultsScreen } from "./ResultsScreen";
import { SetupScreen } from "./SetupScreen";
import { cardClass, labelClass } from "./styles";

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

export function SatPracticeApp({ userId, mockFallback = false }: { userId: string; mockFallback?: boolean }) {
  const [bank, setBank] = useState<SatQuestion[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const byId = useMemo(() => new Map((bank ?? []).map((question) => [question.id, question])), [bank]);
  const [filters, setFilters] = useState<PracticeFilters>({
    section: "any",
    domain: "any",
    skill: "any",
    difficulty: "any",
    count: 5,
    timed: false,
  });
  const [phase, setPhase] = useState<Phase>("setup");
  const [session, setSession] = useState<StoredSession | null>(null);
  const [index, setIndex] = useState(0);
  const [timerHidden, setTimerHidden] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [progress, setProgress] = useState<SatProgressV1>(emptyProgress);
  const [usingMock, setUsingMock] = useState(false);
  const [checkPendingId, setCheckPendingId] = useState<string | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const finishingRef = useRef(false);
  const checkingRef = useRef(false);
  const progressRef = useRef(progress);
  const sessionRef = useRef<StoredSession | null>(null);
  const shownAtRef = useRef(Date.now());
  progressRef.current = progress;
  sessionRef.current = session;

  useEffect(() => {
    setProgress(loadProgress(window.localStorage, userId));
    setHydrated(true);
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    fetchSatQuestions(supabase as unknown as SatQuestionsClient)
      .then((questions) => {
        if (cancelled) return;
        setBank(questions);
        setFilters((current) => ({
          ...current,
          count: Math.min(current.count, Math.max(questions.length, 1)),
        }));
      })
      .catch(() => {
        if (cancelled) return;
        if (mockFallback) {
          const questions = mockPracticeQuestions();
          setUsingMock(true);
          setBank(questions);
          setFilters((current) => ({
            ...current,
            count: Math.min(current.count, Math.max(questions.length, 1)),
          }));
          return;
        }
        setLoadError(true);
        setBank([]);
      });
    return () => {
      cancelled = true;
    };
  }, [mockFallback]);

  useEffect(() => {
    if (phase !== "practice") return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [phase, session?.id]);

  useEffect(() => {
    shownAtRef.current = Date.now();
    setCheckError(null);
  }, [index, session?.id]);

  const loaded = bank ?? [];
  const matching = filterQuestions(loaded, filters);
  const activeQuestions = session ? questionsForSession(session, byId) : null;
  const continueSession = progress.active && questionsForSession(progress.active, byId) ? progress.active : null;
  const latestSession = [...progress.completed].reverse().find((item) => questionsForSession(item, byId)) ?? null;

  function commit(nextSession: StoredSession | null, completed = progressRef.current.completed) {
    const stored: SatProgressV1 = {
      version: 1,
      active: nextSession && nextSession.finishedAt === null ? nextSession : null,
      completed: completed.slice(-50),
    };
    setProgress(stored);
    setSession(nextSession);
    saveProgress(window.localStorage, stored, userId);
  }

  function updateCurrent(mutate: (current: StoredAnswer) => StoredAnswer, allowChecked = false) {
    if (!session || checkingRef.current) return;
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
    const latest = sessionRef.current;
    if (finishingRef.current || checkingRef.current || !latest || !activeQuestions || latest.finishedAt) return;
    finishingRef.current = true;
    const done: StoredSession = { ...latest, finishedAt: new Date().toISOString() };
    setPhase("results");
    commit(done, [...progressRef.current.completed, done]);
  }

  async function checkCurrent(question: SatQuestion | undefined) {
    const latest = sessionRef.current;
    if (!question || !latest || checkingRef.current || finishingRef.current) return;
    const current = latest.answers[question.id] ?? emptyAnswer();
    if (current.checked || current.response.trim() === "") return;
    checkingRef.current = true;
    setCheckPendingId(question.id);
    setCheckError(null);
    const practiceSetId = latest.practiceSetId ?? globalThis.crypto.randomUUID();
    const elapsed = Math.round((Date.now() - shownAtRef.current) / 1000);
    const timeSpentSeconds = Math.max(0, Math.min(86400, elapsed));
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token ?? null;
      const response = await fetch("/api/sat/attempts", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          questionId: question.id,
          selectedAnswer: current.response,
          timeSpentSeconds,
          practiceSetId,
        }),
      });
      const payload: unknown = await response.json().catch(() => null);
      const graded = readGradeResponse(payload);
      if (!response.ok || !graded) {
        const message = typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string"
          ? payload.error
          : "This answer could not be recorded. Try again.";
        setCheckError(message);
        return;
      }
      const base = sessionRef.current ?? latest;
      const answer = base.answers[question.id] ?? current;
      commit({
        ...base,
        practiceSetId,
        answers: {
          ...base.answers,
          [question.id]: {
            ...answer,
            response: current.response,
            checked: true,
            correct: graded.isCorrect,
          },
        },
      });
    } catch {
      setCheckError("This answer could not be recorded. Try again.");
    } finally {
      checkingRef.current = false;
      setCheckPendingId(null);
    }
  }

  function retryMissed() {
    if (!session || !activeQuestions) return;
    const missedIds = new Set(
      summarizeSession(session, activeQuestions).missed.map((item) => item.questionId),
    );
    const missed = activeQuestions.filter((question) => missedIds.has(question.id));
    if (missed.length === 0) return;
    finishingRef.current = false;
    setIndex(0);
    setTimerHidden(false);
    setPhase("practice");
    commit(createSession(missed, session.timed));
  }

  function newPractice() {
    finishingRef.current = false;
    setPhase("setup");
    commit(null);
  }

  if (phase === "practice" && session && activeQuestions) {
    const question = activeQuestions[index];
    return (
      <div className="flex flex-col gap-4">
      {checkError && <p className={cardClass} role="alert">{checkError}</p>}
      <QuestionScreen
        session={session}
        questions={activeQuestions}
        index={index}
        now={now}
        timerHidden={timerHidden}
        checkPending={checkPendingId === question?.id}
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
        onCheck={() => { void checkCurrent(question); }}
        onPrevious={() => setIndex((value) => Math.max(0, value - 1))}
        onNext={() => setIndex((value) => Math.min(activeQuestions.length - 1, value + 1))}
        onJump={(next) => setIndex(next)}
        onFinish={finishPractice}
      />
      </div>
    );
  }

  if (phase === "results" && session && activeQuestions) {
    return (
      <ResultsScreen
        session={session}
        questions={activeQuestions}
        summary={summarizeSession(session, activeQuestions)}
        onRetryMissed={retryMissed}
        onNewSet={newPractice}
      />
    );
  }

  if (bank === null) {
    return (
      <section className={cardClass} aria-busy="true">
        <p className="text-sm text-gray-500">Loading questions.</p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section aria-labelledby="sat-load-error-title">
        <p className={labelClass}>Practice</p>
        <h2 id="sat-load-error-title" className="mt-1 text-2xl font-bold text-gray-900">
          Questions could not be loaded.
        </h2>
      </section>
    );
  }

  return (
    <>
    {usingMock && (
      <p className={`${cardClass} mb-4 text-sm`}>
        Sample questions for local preview. Answers are graded in the app and are not saved.
      </p>
    )}
    <SetupScreen
      filters={filters}
      questions={loaded}
      available={matching.length}
      bankEmpty={bank.length === 0}
      canContinue={hydrated && continueSession !== null}
      canReview={hydrated && latestSession !== null}
      onChange={setFilters}
      onStart={startPractice}
      onContinue={continuePractice}
      onReview={openLatest}
    />
    </>
  );
}
