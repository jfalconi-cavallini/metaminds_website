"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { historyFromPayload, type PracticeAttempt, type PracticeAttemptQuestion } from "@/lib/sat/attempts";
import { difficultyLabel, sectionLabel } from "@/lib/sat/catalog";
import { supabase } from "@/lib/supabase";
import { cardClass, labelClass } from "./styles";

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

function scoreText(attempt: Pick<PracticeAttempt, "correct" | "total" | "percentCorrect">): {
  visual: string;
  spoken: string;
} {
  return {
    visual: `${attempt.correct}/${attempt.total} · ${attempt.percentCorrect}%`,
    spoken: `${attempt.correct} of ${attempt.total} correct, ${attempt.percentCorrect} percent`,
  };
}

function questionDomId(question: PracticeAttemptQuestion): string {
  const safe = question.id.replace(/[^A-Za-z0-9_-]/g, "");
  return `sat-attempt-question-${safe || "row"}`;
}

function When({ iso }: { iso: string }) {
  if (!validTime(iso)) return <>{iso}</>;
  return <time dateTime={iso}>{formatWhen(iso)}</time>;
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
  const refId = questionDomId(question);
  const answer = question.selectedAnswer?.trim() || "none";
  return (
    <li id={refId} className="border-t border-gray-100 px-4 py-3 first:border-t-0">
      <p className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
            question.isCorrect ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
          }`}
        >
          {question.isCorrect ? "Correct" : "Incorrect"}
        </span>
        <span className={labelClass}>
          {number} · {sectionLabel(question.section)} · {question.domain} · {question.skill} · {difficultyLabel(question.difficulty)}
          {showSource && question.source ? ` · ${sourceText(question.source)}` : ""}
        </span>
      </p>
      <p className="mt-1 break-words text-sm text-gray-900">{question.stem || "Question"}</p>
      <p className="mt-1 break-words text-xs text-gray-500">
        Your answer: {answer}. Correct answer: {question.correctAnswer}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Question{" "}
        <a
          href={`#${refId}`}
          className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-2 hover:text-blue-800"
        >
          {question.questionId}
        </a>
      </p>
    </li>
  );
}

function AttemptRow({
  attempt,
  showSource,
  open,
  onToggle,
}: {
  attempt: PracticeAttempt;
  showSource: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = `sat-attempt-panel-${attempt.id.replace(/[^A-Za-z0-9_-]/g, "") || "attempt"}`;
  const score = scoreText(attempt);
  const spanned = attempt.startedAt !== attempt.completedAt;
  return (
    <li className="min-w-0 rounded-2xl border border-gray-100 bg-white shadow-sm">
      <button
        type="button"
        className="flex w-full min-h-11 flex-col gap-2 rounded-2xl p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:flex-row sm:items-center sm:justify-between"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-gray-900">
            <When iso={attempt.completedAt} />
          </span>
          <span className="mt-1 block text-xs text-gray-500">
            {attempt.total === 1 ? "1 question" : `${attempt.total} questions`}
          </span>
        </span>
        <span className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="text-sm font-semibold text-gray-900">
            <span aria-hidden="true">{score.visual}</span>
            <span className="sr-only">{score.spoken}</span>
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </span>
      </button>
      <div id={panelId} hidden={!open}>
        {spanned && (
          <p className="px-4 pt-3 text-xs text-gray-500">
            <When iso={attempt.startedAt} />
            {" to "}
            <When iso={attempt.completedAt} />
          </p>
        )}
        <ol className="pb-1">
          {attempt.questions.map((question, index) => (
            <QuestionDetail
              key={question.id}
              question={question}
              number={index + 1}
              showSource={showSource}
            />
          ))}
        </ol>
      </div>
    </li>
  );
}

export function AttemptHistoryList({
  attempts,
  showSource = false,
  titleAs = "h2",
}: {
  attempts: readonly PracticeAttempt[];
  showSource?: boolean;
  titleAs?: "h2" | "h3";
}) {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const titleId = `sat-attempt-history-${useId().replace(/:/g, "")}`;
  if (attempts.length === 0) {
    return <p className="text-sm text-gray-500">No SAT practice attempts yet.</p>;
  }
  const latest = attempts[0];
  if (!latest) return null;
  const score = scoreText(latest);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <article aria-label="Latest attempt" className={cardClass}>
        <p className={labelClass}>Latest attempt</p>
        <p className="mt-1 text-sm font-semibold text-gray-900">
          <When iso={latest.completedAt} />
        </p>
        <p className="mt-2 text-2xl font-bold text-gray-900">
          <span aria-hidden="true">{score.visual}</span>
          <span className="sr-only">{score.spoken}</span>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {latest.total === 1 ? "1 question tried" : `${latest.total} questions tried`}
        </p>
      </article>

      <section aria-labelledby={titleId}>
        {titleAs === "h3" ? (
          <h3 id={titleId} className="text-base font-semibold text-gray-900">Attempt history</h3>
        ) : (
          <h2 id={titleId} className="text-base font-semibold text-gray-900">Attempt history</h2>
        )}
        <ul className="mt-3 flex flex-col gap-3">
          {attempts.map((attempt) => (
            <AttemptRow
              key={attempt.id}
              attempt={attempt}
              showSource={showSource}
              open={openIds[attempt.id] === true}
              onToggle={() => {
                setOpenIds((current) => ({ ...current, [attempt.id]: current[attempt.id] !== true }));
              }}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function errorMessage(payload: unknown): string {
  if (typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string") {
    return payload.error;
  }
  return "Could not load SAT practice history.";
}

/** Saved attempts for the signed-in student. Hidden for other roles. */
export function SatPracticeHistory() {
  const { user, authLoaded } = useAuth();
  const studentId = user?.role === "student" ? user.linkedId : null;
  const [attempts, setAttempts] = useState<PracticeAttempt[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoaded || studentId === null) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setAttempts(null);
    async function load() {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        if (!cancelled) {
          setError("Sign in to view SAT practice history.");
          setLoading(false);
        }
        return;
      }
      try {
        const response = await fetch(`/api/sat/attempts?studentId=${studentId}`, {
          headers: { authorization: `Bearer ${token}` },
        });
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          if (!cancelled) setError(errorMessage(payload));
          return;
        }
        const history = historyFromPayload(payload);
        if (!history) {
          if (!cancelled) setError("Could not load SAT practice history.");
          return;
        }
        if (!cancelled) setAttempts(history);
      } catch {
        if (!cancelled) setError("Could not load SAT practice history.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [authLoaded, studentId]);

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
  if (error) return <p className="text-sm text-red-600" role="alert">{error}</p>;
  if (loading || attempts === null) {
    return (
      <p className="text-sm text-gray-500" role="status" aria-live="polite" aria-busy="true">
        Loading SAT practice history.
      </p>
    );
  }
  return <AttemptHistoryList attempts={attempts} />;
}
