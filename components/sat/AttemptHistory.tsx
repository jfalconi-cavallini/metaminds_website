"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  answeredScoreLabel,
  historyPageFromPayload,
  questionsFromPayload,
  type AttemptHistoryPage,
  type PracticeAttempt,
  type PracticeAttemptQuestion,
} from "@/lib/sat/attempts";
import { difficultyLabel, domainTitle, sectionLabel, skillTitle } from "@/lib/sat/catalog";
import { supabase } from "@/lib/supabase";
import { cardClass, labelClass, secondaryClass } from "./styles";

function sourceText(source: string): string {
  if (source === "metaminds") return "MetaMinds";
  if (source === "college_board_test") return "Test set";
  return source;
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function validTime(iso: string): boolean {
  return !Number.isNaN(new Date(iso).getTime());
}

function spokenScore(attempt: Pick<PracticeAttempt, "answered" | "correct" | "percentCorrect">): string {
  return `${attempt.answered} answered, ${attempt.correct} correct, ${attempt.percentCorrect} percent`;
}

function When({ iso }: { iso: string }) {
  if (!validTime(iso)) return <>{iso}</>;
  return <time dateTime={iso}>{formatWhen(iso)}</time>;
}

function errorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string") {
    return payload.error;
  }
  return fallback;
}

async function authorizedFetch(path: string): Promise<unknown> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sign in to view SAT practice history.");
  const response = await fetch(path, { headers: { authorization: `Bearer ${token}` } });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(errorMessage(payload, "Could not load SAT practice history."));
  return payload;
}

function historyPath(studentId: number, offset: number): string {
  return `/api/sat/attempts?studentId=${studentId}&offset=${offset}&scope=history`;
}

function QuestionDetail({
  question,
  number,
  showSource,
}: {
  question: PracticeAttemptQuestion;
  number: number;
  showSource: boolean;
}) {
  const answer = question.selectedAnswer?.trim() || "none";
  return (
    <li className="border-t border-gray-100 px-4 py-3 first:border-t-0">
      <p className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
            question.isCorrect ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
          }`}
        >
          {question.isCorrect ? "Correct" : "Incorrect"}
        </span>
        <span className={labelClass}>
          {number} · {sectionLabel(question.section)} · {domainTitle(question.domain)} · {skillTitle(question.skill)} · {difficultyLabel(question.difficulty)}
          {showSource && question.source ? ` · ${sourceText(question.source)}` : ""}
        </span>
      </p>
      <p className="mt-1 break-words text-sm text-gray-900">{question.stem || "Question"}</p>
      <p className="mt-1 break-words text-xs text-gray-500">
        Your answer: {answer}. Correct answer: {question.correctAnswer}
      </p>
    </li>
  );
}

function AttemptRow({
  attempt,
  studentId,
  showSource,
}: {
  attempt: PracticeAttempt;
  studentId: number;
  showSource: boolean;
}) {
  const panelId = `sat-attempt-panel-${attempt.id.replace(/[^A-Za-z0-9_-]/g, "") || "attempt"}`;
  const score = answeredScoreLabel(attempt);
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<PracticeAttemptQuestion[] | null>(null);
  const [detailError, setDetailError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const spanned = attempt.startedAt !== attempt.latestAnswerAt;

  function loadQuestions() {
    if (questions !== null || detailLoading) return;
    setDetailLoading(true);
    setDetailError("");
    authorizedFetch(`/api/sat/attempts?studentId=${studentId}&attemptId=${encodeURIComponent(attempt.id)}`)
      .then((payload) => {
        const loaded = questionsFromPayload(payload);
        if (!loaded) throw new Error("Could not load this attempt.");
        setQuestions(loaded);
      })
      .catch((error: unknown) => {
        setDetailError(error instanceof Error ? error.message : "Could not load this attempt.");
      })
      .finally(() => {
        setDetailLoading(false);
      });
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) loadQuestions();
  }

  return (
    <li className="min-w-0 rounded-2xl border border-gray-100 bg-white shadow-sm">
      <button
        type="button"
        className="flex w-full min-h-11 flex-col gap-2 rounded-2xl p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:flex-row sm:items-center sm:justify-between"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-gray-900">
            Newest saved answer <When iso={attempt.latestAnswerAt} />
          </span>
        </span>
        <span className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="text-sm font-semibold text-gray-900">
            <span aria-hidden="true">{score}</span>
            <span className="sr-only">{spokenScore(attempt)}</span>
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </span>
      </button>
      <div id={panelId} hidden={!open}>
        {detailLoading && (
          <p className="px-4 py-3 text-sm text-gray-500" role="status" aria-live="polite" aria-busy="true">
            Loading questions.
          </p>
        )}
        {detailError && (
          <p className="px-4 py-3 text-sm text-red-600" role="alert">{detailError}</p>
        )}
        {questions && (
          <>
            {spanned && (
              <p className="px-4 pt-3 text-xs text-gray-500">
                First answer <When iso={attempt.startedAt} />
                {" to newest saved answer "}
                <When iso={attempt.latestAnswerAt} />
              </p>
            )}
            <ol className="pb-1">
              {questions.map((question, index) => (
                <QuestionDetail
                  key={question.id}
                  question={question}
                  number={index + 1}
                  showSource={showSource}
                />
              ))}
            </ol>
          </>
        )}
      </div>
    </li>
  );
}

export function AttemptHistoryList({
  attempts,
  studentId,
  showSource = false,
  titleAs = "h2",
  hasMore = false,
  nextOffset = null,
}: {
  attempts: readonly PracticeAttempt[];
  studentId: number;
  showSource?: boolean;
  titleAs?: "h2" | "h3";
  hasMore?: boolean;
  nextOffset?: number | null;
}) {
  const [extra, setExtra] = useState<PracticeAttempt[]>([]);
  const [more, setMore] = useState(hasMore);
  const [cursor, setCursor] = useState<number | null>(nextOffset);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState("");
  const titleId = `sat-attempt-history-${useId().replace(/:/g, "")}`;
  const shown = mergeAttempts(attempts, extra);
  const latest = shown[0];

  if (!latest) {
    return <p className="text-sm text-gray-500">No SAT practice attempts yet.</p>;
  }
  const score = answeredScoreLabel(latest);

  async function showMore() {
    if (cursor === null || loadingMore) return;
    setLoadingMore(true);
    setMoreError("");
    try {
      const payload = await authorizedFetch(historyPath(studentId, cursor));
      const page = historyPageFromPayload(payload);
      if (!page) throw new Error("Could not load SAT practice history.");
      setExtra((current) => mergeAttempts(current, page.history));
      setMore(page.hasMore);
      setCursor(page.nextOffset);
    } catch (error: unknown) {
      setMoreError(error instanceof Error ? error.message : "Could not load SAT practice history.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <article aria-label="Latest attempt" className={cardClass}>
        <p className={labelClass}>Latest attempt</p>
        <p className="mt-1 text-sm text-gray-700">This is the set that contains the newest saved answer.</p>
        <p className="mt-2 text-sm font-semibold text-gray-900">
          Newest saved answer <When iso={latest.latestAnswerAt} />
        </p>
        <p className="mt-2 text-2xl font-bold text-gray-900">
          <span aria-hidden="true">{score}</span>
          <span className="sr-only">{spokenScore(latest)}</span>
        </p>
      </article>

      <section aria-labelledby={titleId}>
        {titleAs === "h3" ? (
          <h3 id={titleId} className="text-base font-semibold text-gray-900">Questions answered</h3>
        ) : (
          <h2 id={titleId} className="text-base font-semibold text-gray-900">Questions answered</h2>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Each group is the questions answered in one practice set. A group can be unfinished.
        </p>
        <ul className="mt-3 flex flex-col gap-3">
          {shown.map((attempt) => (
            <AttemptRow
              key={`${studentId}:${attempt.id}`}
              attempt={attempt}
              studentId={studentId}
              showSource={showSource}
            />
          ))}
        </ul>
        {more && (
          <button
            type="button"
            className={`${secondaryClass} mt-3`}
            onClick={() => { void showMore(); }}
            disabled={loadingMore || cursor === null}
          >
            {loadingMore ? "Loading more attempts." : "Show more"}
          </button>
        )}
        {moreError && <p className="mt-2 text-sm text-red-600" role="alert">{moreError}</p>}
      </section>
    </div>
  );
}

function mergeAttempts(base: readonly PracticeAttempt[], extra: readonly PracticeAttempt[]): PracticeAttempt[] {
  const seen = new Set(base.map((attempt) => attempt.id));
  const merged = [...base];
  for (const attempt of extra) {
    if (seen.has(attempt.id)) continue;
    seen.add(attempt.id);
    merged.push(attempt);
  }
  return merged;
}

function StudentPracticeHistory({ studentId }: { studentId: number }) {
  const [page, setPage] = useState<AttemptHistoryPage | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    authorizedFetch(historyPath(studentId, 0))
      .then((payload) => {
        if (cancelled) return;
        const history = historyPageFromPayload(payload);
        if (!history) throw new Error("Could not load SAT practice history.");
        setPage(history);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : "Could not load SAT practice history.");
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (error) return <p className="text-sm text-red-600" role="alert">{error}</p>;
  if (page === null) {
    return (
      <p className="text-sm text-gray-500" role="status" aria-live="polite" aria-busy="true">
        Loading SAT practice history.
      </p>
    );
  }
  return (
    <AttemptHistoryList
      attempts={page.history}
      studentId={studentId}
      hasMore={page.hasMore}
      nextOffset={page.nextOffset}
    />
  );
}

/** Saved attempts for the signed-in student. Hidden for other roles. */
export function SatPracticeHistory() {
  const { user, authLoaded } = useAuth();
  const studentId = user?.role === "student" ? user.linkedId : null;

  if (!authLoaded) {
    return (
      <p className="text-sm text-gray-500" role="status" aria-live="polite">
        Loading SAT practice history.
      </p>
    );
  }
  if (user?.role !== "student") return null;
  if (studentId === null) {
    return (
      <p className="text-sm text-red-600" role="alert">
        This account is not linked to a student.
      </p>
    );
  }
  return <StudentPracticeHistory key={studentId} studentId={studentId} />;
}
