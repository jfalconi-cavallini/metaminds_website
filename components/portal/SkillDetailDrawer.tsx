"use client";

import { useEffect, useState } from "react";
import { X, FileText, BookOpen, Clock, Star, AlertCircle } from "lucide-react";
import type { SkillNode, SkillNoteLink, HomeworkSkillLink, StudentSkill } from "@/lib/portal/types";
import { fetchStudentSkill, fetchSkillLinkedNotes, fetchSkillLinkedHomework, upsertStudentSkill } from "@/lib/portal/db";
import { formatDate } from "@/lib/portal/utils";
import { scoreToStatus, STATUS_LABEL, STATUS_BADGE, masteryScoreToStudentStatus } from "@/lib/portal/planConfig";

interface Props {
  skillId:    number | null;
  studentId:  number;
  skillNodes: SkillNode[];
  noteLinks?: SkillNoteLink[];    // if omitted, fetched internally
  hwLinks?:   HomeworkSkillLink[]; // if omitted, fetched internally
  editable?:  boolean;            // tutor-only: shows the manual mastery editor
  onSaved?:   (updated: StudentSkill) => void; // fires after a manual save, so the parent can refresh its roadmap
  onClose:    () => void;
}

export default function SkillDetailDrawer({
  skillId, studentId, skillNodes, noteLinks, hwLinks, editable = false, onSaved, onClose,
}: Props) {
  const [mastery,    setMastery]    = useState<StudentSkill | null>(null);
  const [mastLoaded, setMastLoaded] = useState<number | null>(null);

  // Manual editor (tutor-only)
  const [editScore,   setEditScore]   = useState(0);
  const [editNote,    setEditNote]    = useState("");
  const [savingSkill, setSavingSkill] = useState(false);

  useEffect(() => {
    if (mastLoaded === skillId) {
      setEditScore(mastery?.masteryScore ?? 0);
      setEditNote(mastery?.tutorNotes ?? "");
    }
  }, [mastLoaded, skillId, mastery]);

  async function saveMastery() {
    if (skillId === null) return;
    setSavingSkill(true);
    try {
      const updated = await upsertStudentSkill(studentId, skillId, {
        masteryScore: editScore,
        status:       masteryScoreToStudentStatus(editScore),
        tutorNotes:   editNote.trim() || undefined,
      });
      setMastery(updated);
      onSaved?.(updated);
    } catch { /* silent — tutor can retry */ }
    finally { setSavingSkill(false); }
  }

  // Self-fetch mode: when noteLinks/hwLinks are not pre-loaded by the parent
  const selfLoad = noteLinks === undefined || hwLinks === undefined;
  const [internalNoteLinks, setInternalNoteLinks] = useState<SkillNoteLink[]>([]);
  const [internalHwLinks,   setInternalHwLinks]   = useState<HomeworkSkillLink[]>([]);
  const [dataLoadedFor,     setDataLoadedFor]     = useState<number | null>(null);

  useEffect(() => {
    if (!selfLoad || dataLoadedFor === studentId) return;
    let cancelled = false;
    async function load() {
      try {
        const [notes, hw] = await Promise.all([
          fetchSkillLinkedNotes(studentId),
          fetchSkillLinkedHomework(studentId),
        ]);
        if (!cancelled) {
          setInternalNoteLinks(notes);
          setInternalHwLinks(hw);
          setDataLoadedFor(studentId);
        }
      } catch {
        if (!cancelled) setDataLoadedFor(studentId);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selfLoad, studentId, dataLoadedFor]);

  const resolvedNoteLinks = noteLinks ?? internalNoteLinks;
  const resolvedHwLinks   = hwLinks   ?? internalHwLinks;

  // Lazy-load mastery record for the current skill
  useEffect(() => {
    if (skillId === null || mastLoaded === skillId) return;
    let cancelled = false;
    async function load() {
      try {
        const s = await fetchStudentSkill(studentId, skillId!);
        if (!cancelled) { setMastery(s); setMastLoaded(skillId); }
      } catch {
        if (!cancelled) setMastLoaded(skillId);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [skillId, studentId, mastLoaded]);

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (skillId === null) return null;

  const node     = skillNodes.find(n => n.id === skillId);
  const sessions = resolvedNoteLinks.filter(l => l.skillId === skillId);
  const hw       = resolvedHwLinks.filter(h => h.skillId === skillId);
  const hasAny   = sessions.length > 0 || hw.length > 0;

  const masteryStatus = mastery ? scoreToStatus(mastery.masteryScore) : "not-assessed";
  const pendingHw     = hw.filter(h => h.status === "pending");

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={node ? `Skill detail: ${node.title}` : "Skill detail"}
        className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              {node?.category ?? "SAT"}
            </p>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">
              {node?.title ?? "Skill Detail"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close skill detail"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mastery badge */}
        <div className="px-5 py-3 border-b border-gray-50 shrink-0">
          {mastLoaded === skillId ? (
            mastery ? (
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[masteryStatus]}`}>
                  {STATUS_LABEL[masteryStatus]}
                </span>
                <span className="text-xs text-gray-500">
                  Score: <span className="font-semibold text-gray-700">{mastery.masteryScore}/6</span>
                </span>
                {mastery.lastAssessed && (
                  <span className="text-xs text-gray-400">
                    Assessed {formatDate(mastery.lastAssessed)}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-gray-400 italic">Not yet assessed by tutor</span>
            )
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-400">Loading mastery…</span>
            </div>
          )}
          {mastery?.tutorNotes && !editable && (
            <p className="text-xs text-gray-600 mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
              <span className="font-semibold text-amber-700">Tutor note: </span>
              {mastery.tutorNotes}
            </p>
          )}

          {editable && mastLoaded === skillId && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    onClick={() => setEditScore(n)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                      editScore === n
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                    aria-label={`Set mastery score to ${n} of 6`}
                    aria-pressed={editScore === n}
                  >
                    {n}
                  </button>
                ))}
                <span className={`ml-2 text-xs font-bold px-2 py-1 rounded-full ${STATUS_BADGE[scoreToStatus(editScore)]}`}>
                  {STATUS_LABEL[scoreToStatus(editScore)]}
                </span>
              </div>
              <input
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Optional tutor note…"
                className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => void saveMastery()}
                disabled={savingSkill}
                className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-lg px-3 py-1.5 transition-colors"
              >
                {savingSkill ? "Saving…" : "Save Assessment"}
              </button>
            </div>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Next step */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Recommended Next Step</p>
            {pendingHw.length > 0 ? (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-blue-800 truncate">{pendingHw[0].task}</p>
                  {pendingHw[0].dueDate && (
                    <p className="text-xs text-blue-500 mt-0.5">Due {formatDate(pendingHw[0].dueDate)}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No next activity assigned yet.</p>
            )}
          </div>

          {/* Sessions */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Related Sessions {sessions.length > 0 && `(${sessions.length})`}
            </p>
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No sessions tagged with this skill yet.</p>
            ) : (
              <div className="space-y-2">
                {sessions.map(s => (
                  <div key={s.noteId} className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-start gap-2.5">
                    <FileText className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{s.topic}</p>
                      {s.noteDate && (
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(s.noteDate)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assignments */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Related Assignments {hw.length > 0 && `(${hw.length})`}
            </p>
            {hw.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No assignments tagged with this skill yet.</p>
            ) : (
              <div className="space-y-2">
                {hw.map(h => (
                  <div key={h.homeworkId} className="bg-gray-50 rounded-xl px-3 py-2.5 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <BookOpen className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                        <p className="text-sm font-semibold text-gray-800 leading-snug">{h.task}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 ${
                        h.status === "completed" ? "bg-emerald-50 text-emerald-700"
                        : h.status === "submitted" ? "bg-blue-50 text-blue-700"
                        : "bg-amber-50 text-amber-700"
                      }`}>
                        {h.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 pl-6 text-[11px] text-gray-400 flex-wrap">
                      {h.dueDate && <span>Due {formatDate(h.dueDate)}</span>}
                      {h.estimatedMinutes && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />{h.estimatedMinutes}m est.
                        </span>
                      )}
                      {h.studentTimeMinutes != null && (
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3" />{h.studentTimeMinutes}m actual
                        </span>
                      )}
                      {h.grade && (
                        <span className="font-semibold text-emerald-600">Grade: {h.grade}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Global empty state */}
          {!hasAny && mastLoaded === skillId && (
            <div className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-4">
              <AlertCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-500 leading-relaxed">
                No sessions or assignments have been linked to this skill yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
