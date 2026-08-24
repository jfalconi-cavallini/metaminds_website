"use client";

import { useEffect, useState } from "react";
import { ChevronRight, BookOpen, FileText, Clock } from "lucide-react";
import type { SkillNode, SkillNoteLink, HomeworkSkillLink } from "@/lib/portal/types";
import { fetchSkillLinkedNotes, fetchSkillLinkedHomework } from "@/lib/portal/db";
import { formatDate } from "@/lib/portal/utils";

interface Props {
  studentId:     number;
  allSkillNodes: SkillNode[];
}

export default function StudentSkillPanel({ studentId, allSkillNodes }: Props) {
  const [noteLinks,    setNoteLinks]    = useState<SkillNoteLink[]>([]);
  const [hwLinks,      setHwLinks]      = useState<HomeworkSkillLink[]>([]);
  const [loadedForId,  setLoadedForId]  = useState<number | null>(null);
  const [expanded,     setExpanded]     = useState<Set<number>>(new Set());

  // loadedForId !== studentId means we're loading (or the data is stale)
  const isLoading = loadedForId !== studentId;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [notes, hw] = await Promise.all([
          fetchSkillLinkedNotes(studentId),
          fetchSkillLinkedHomework(studentId),
        ]);
        if (!cancelled) {
          setNoteLinks(notes);
          setHwLinks(hw);
          setExpanded(new Set());
          setLoadedForId(studentId);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("StudentSkillPanel load error:", e);
          setLoadedForId(studentId);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [studentId]);

  if (isLoading) return (
    <div className="p-4 flex justify-center py-8">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const allSkillIds = [...new Set([...noteLinks.map(l => l.skillId), ...hwLinks.map(l => l.skillId)])];

  if (allSkillIds.length === 0) return (
    <div className="p-6 text-center">
      <p className="text-sm text-gray-400 leading-relaxed">
        No skill tags yet. Tag session notes and assignments<br />with skills to build this student&apos;s learning history.
      </p>
    </div>
  );

  const notesBySkill = new Map<number, SkillNoteLink[]>();
  for (const l of noteLinks) {
    if (!notesBySkill.has(l.skillId)) notesBySkill.set(l.skillId, []);
    notesBySkill.get(l.skillId)!.push(l);
  }
  const hwBySkill = new Map<number, HomeworkSkillLink[]>();
  for (const h of hwLinks) {
    if (!hwBySkill.has(h.skillId)) hwBySkill.set(h.skillId, []);
    hwBySkill.get(h.skillId)!.push(h);
  }

  function toggleSkill(skillId: number) {
    const next = new Set(expanded);
    if (next.has(skillId)) next.delete(skillId); else next.add(skillId);
    setExpanded(next);
  }

  return (
    <div className="p-4 space-y-2">
      {allSkillIds.map((skillId) => {
        const node   = allSkillNodes.find(n => n.id === skillId);
        const title  = node?.title ?? `Skill #${skillId}`;
        const notes  = notesBySkill.get(skillId) ?? [];
        const hw     = hwBySkill.get(skillId) ?? [];
        const isOpen = expanded.has(skillId);

        return (
          <div key={skillId} className="border border-gray-100 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => toggleSkill(skillId)}
            >
              <span className="text-left truncate mr-2">{title}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                {notes.length > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full font-bold">
                    <FileText className="w-3 h-3" />{notes.length}
                  </span>
                )}
                {hw.length > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full font-bold">
                    <BookOpen className="w-3 h-3" />{hw.length}
                  </span>
                )}
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`} />
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {notes.map(n => (
                  <div key={`n-${n.noteId}`} className="px-3 py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="text-xs text-gray-700 truncate">{n.topic}</span>
                    </div>
                    {n.noteDate && (
                      <span className="text-[11px] text-gray-400 shrink-0">{formatDate(n.noteDate)}</span>
                    )}
                  </div>
                ))}
                {hw.map(h => (
                  <div key={`h-${h.homeworkId}`} className="px-3 py-2 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                        <span className="text-xs text-gray-700 truncate">{h.task}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        h.status === "completed" ? "bg-emerald-50 text-emerald-700"
                        : h.status === "submitted" ? "bg-blue-50 text-blue-700"
                        : "bg-amber-50 text-amber-700"
                      }`}>
                        {h.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 pl-5 text-[11px] text-gray-400 flex-wrap">
                      {h.dueDate && <span>Due {formatDate(h.dueDate)}</span>}
                      {h.estimatedMinutes && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {h.estimatedMinutes}m est.
                        </span>
                      )}
                      {h.studentTimeMinutes != null && (
                        <span>{h.studentTimeMinutes}m actual</span>
                      )}
                      {h.grade && (
                        <span className="font-semibold text-emerald-600">{h.grade}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
