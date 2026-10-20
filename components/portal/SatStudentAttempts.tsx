"use client";

import { useEffect, useState } from "react";
import { sectionLabel } from "@/lib/sat/catalog";
import type { AccuracyBucket, MissedAttempt, SatAttemptSummary } from "@/lib/sat/attempts";
import { supabase } from "@/lib/supabase";

function sourceText(source: string): string {
  if (source === "metaminds") return "MetaMinds";
  if (source === "college_board_test") return "Test set";
  return source;
}

function percentLabel(correct: number, attempted: number): string {
  if (attempted === 0) return "—";
  return `${Math.round((correct / attempted) * 100)}%`;
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function BucketList({ title, rows, labelFor }: { title: string; rows: AccuracyBucket[]; labelFor?: (key: string) => string }) {
  return (
    <section>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">None yet</p>
      ) : (
        <ul className="divide-y divide-gray-100 border border-gray-100 rounded-xl">
          {rows.map((row) => (
            <li key={row.key} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="text-gray-800">{labelFor ? labelFor(row.key) : row.key}</span>
              <span className="shrink-0 font-semibold text-gray-900">
                {row.correct}/{row.attempted} · {percentLabel(row.correct, row.attempted)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MissedList({ items, showSource }: { items: MissedAttempt[]; showSource: boolean }) {
  return (
    <section>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Recent missed questions</p>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">None</p>
      ) : (
        <ul className="border border-gray-100 rounded-xl">
          {items.map((item) => (
            <li key={item.attemptId} className="border-t border-gray-100 px-3 py-3 first:border-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {sectionLabel(item.section)} · {item.domain} · {item.skill}
                {showSource && item.source ? ` · ${sourceText(item.source)}` : ""}
              </p>
              <p className="mt-1 text-sm text-gray-900">{item.stem || item.questionId}</p>
              <p className="mt-1 text-xs text-gray-500">
                {formatWhen(item.createdAt)}. Answer given: {item.selectedAnswer?.trim() || "none"}. Correct answer: {item.correctAnswer}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function SatStudentAttempts({
  studentId,
  viewerRole,
  initialSummary,
}: {
  studentId: number;
  viewerRole: "tutor" | "admin";
  initialSummary?: SatAttemptSummary;
}) {
  const [summary, setSummary] = useState<SatAttemptSummary | null>(initialSummary ?? null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(initialSummary === undefined);

  useEffect(() => {
    if (initialSummary) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    async function load() {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        if (!cancelled) {
          setError("Sign in to view SAT practice results.");
          setLoading(false);
        }
        return;
      }
      try {
        const response = await fetch(`/api/sat/attempts?studentId=${studentId}`, {
          headers: { authorization: `Bearer ${token}` },
        });
        const payload: unknown = await response.json();
        if (!response.ok) {
          const message = typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "Could not load SAT practice results.";
          if (!cancelled) setError(message);
          return;
        }
        if (!cancelled) setSummary(payload as SatAttemptSummary);
      } catch {
        if (!cancelled) setError("Could not load SAT practice results.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [studentId, initialSummary]);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading SAT practice results.</p>;
  }
  if (error) {
    return <p className="text-sm text-red-600" role="alert">{error}</p>;
  }
  if (!summary) return null;

  const showSource = viewerRole === "admin";
  const stats = [
    { label: "Attempted", value: String(summary.attempted) },
    { label: "Correct", value: String(summary.correct) },
    { label: "Percent correct", value: summary.percentCorrect === null ? "—" : `${summary.percentCorrect}%` },
  ] as const;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SAT Practice</p>
        <h3 className="text-base font-semibold text-gray-900">Results</h3>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>
      {summary.attempted === 0 ? (
        <p className="text-sm text-gray-500">No SAT practice attempts yet.</p>
      ) : (
        <>
          <BucketList title="By section" rows={summary.bySection} labelFor={(key) => sectionLabel(key as "math" | "reading_writing")} />
          <BucketList title="By domain" rows={summary.byDomain} />
          <BucketList title="By skill" rows={summary.bySkill} />
          <MissedList items={summary.missed} showSource={showSource} />
        </>
      )}
    </div>
  );
}
