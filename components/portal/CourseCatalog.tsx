"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  fetchCourses, fetchFullCatalog, fetchLessonPackage,
  insertLesson, updateLesson, updateLessonResource,
} from "@/lib/portal/db";
import type {
  Course, CourseCatalogFull, LessonPackage, ResourceType,
  CatalogSection, CatalogCategory,
} from "@/lib/portal/types";
import {
  ChevronRight, ChevronDown, Upload, ExternalLink, Plus,
  Edit2, Check, X, Loader2, BookOpen, Clock, Star, FileText,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const RESOURCE_ORDER: ResourceType[] = [
  "lesson_deck", "guided_practice", "tutor_guide",
  "homework_l1", "homework_l2", "homework_l3",
  "answer_key", "mastery_check",
];

const RESOURCE_LABELS: Record<string, string> = {
  lesson_deck:     "Lesson Deck",
  guided_practice: "Guided Practice",
  tutor_guide:     "Tutor Guide",
  homework_l1:     "Homework Level 1",
  homework_l2:     "Homework Level 2",
  homework_l3:     "Homework Level 3",
  answer_key:      "Answer Key",
  mastery_check:   "Mastery Check",
};

const RESOURCE_TAGS: Record<string, string> = {
  lesson_deck:     "In-Class",
  guided_practice: "In-Class",
  tutor_guide:     "In-Class",
  homework_l1:     "Homework",
  homework_l2:     "Homework",
  homework_l3:     "Homework",
  answer_key:      "Reference",
  mastery_check:   "Assessment",
};

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Beginner", 2: "Intermediate", 3: "Standard", 4: "Advanced", 5: "Expert",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function findBreadcrumb(catalog: CourseCatalogFull, lessonId: number) {
  for (const s of catalog.sections) {
    for (const c of s.categories) {
      for (const l of c.lessons) {
        if (l.id === lessonId) return { section: s, category: c };
      }
    }
  }
  return null;
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  mode?: "builder" | "library"; // builder = edit mode, library = read-only browse
}

export default function CourseCatalog({ mode = "builder" }: Props) {
  const isBuilder = mode === "builder";
  // Catalog state
  const [courses,        setCourses]        = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<number | null>(null);
  const [catalog,        setCatalog]        = useState<CourseCatalogFull | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Selection
  const [expandedSections,   setExpandedSections]   = useState<Set<number>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [activeLessonId,     setActiveLessonId]     = useState<number | null>(null);
  const [lessonPkg,          setLessonPkg]          = useState<LessonPackage | null>(null);
  const [loadingLesson,      setLoadingLesson]      = useState(false);

  // Edit
  const [editing,        setEditing]        = useState(false);
  const [editTitle,      setEditTitle]      = useState("");
  const [editDesc,       setEditDesc]       = useState("");
  const [editDifficulty, setEditDifficulty] = useState(2);
  const [editMinutes,    setEditMinutes]    = useState(60);
  const [editObjectives, setEditObjectives] = useState<string[]>([""]);
  const [editMistakes,   setEditMistakes]   = useState("");
  const [editTutorNotes, setEditTutorNotes] = useState("");
  const [editStatus,     setEditStatus]     = useState<"draft" | "active" | "archived">("draft");
  const [saving,         setSaving]         = useState(false);

  // Upload
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [uploadMsg,   setUploadMsg]   = useState<{ id: number; ok: boolean; text: string } | null>(null);
  const fileInputRef     = useRef<HTMLInputElement>(null);
  const uploadTargetRef  = useRef<number | null>(null);

  // Add lesson inline
  const [addingToCategoryId, setAddingToCategoryId] = useState<number | null>(null);
  const [newLessonTitle,     setNewLessonTitle]     = useState("");
  const [addingLesson,       setAddingLesson]       = useState(false);

  // URL paste panel
  const [pasteOpen,      setPasteOpen]      = useState(false);
  const [pasteResourceId, setPasteResourceId] = useState<number | "">("");
  const [pasteUrl,       setPasteUrl]       = useState("");

  // ── Load courses on mount ──────────────────────────────────────────
  useEffect(() => {
    fetchCourses({ all: true }).then((cs) => {
      setCourses(cs);
      if (cs.length > 0) setActiveCourseId(cs[0].id);
    }).catch(console.error);
  }, []);

  // ── Load catalog when course changes ──────────────────────────────
  useEffect(() => {
    if (!activeCourseId) return;
    setLoadingCatalog(true);
    setCatalog(null);
    setActiveLessonId(null);
    setLessonPkg(null);
    setExpandedSections(new Set());
    setExpandedCategories(new Set());
    fetchFullCatalog(activeCourseId).then((cat) => {
      setCatalog(cat);
      if (cat.sections.length > 0) {
        const first = cat.sections[0];
        setExpandedSections(new Set([first.id]));
        if (first.categories.length > 0) {
          setExpandedCategories(new Set([first.categories[0].id]));
        }
      }
    }).catch(console.error).finally(() => setLoadingCatalog(false));
  }, [activeCourseId]);

  // ── Load lesson when selected ──────────────────────────────────────
  useEffect(() => {
    if (!activeLessonId) return;
    setLoadingLesson(true);
    setLessonPkg(null);
    setEditing(false);
    fetchLessonPackage(activeLessonId)
      .then(setLessonPkg)
      .catch(console.error)
      .finally(() => setLoadingLesson(false));
  }, [activeLessonId]);

  // ── Tree handlers ──────────────────────────────────────────────────
  function toggleSection(id: number) {
    setExpandedSections((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleCategory(id: number) {
    setExpandedCategories((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  // ── Edit handlers ──────────────────────────────────────────────────
  function enterEdit() {
    if (!lessonPkg) return;
    setEditTitle(lessonPkg.title);
    setEditDesc(lessonPkg.description ?? "");
    setEditDifficulty(lessonPkg.difficulty);
    setEditMinutes(lessonPkg.estimatedMinutes);
    setEditObjectives(lessonPkg.learningObjectives.length > 0 ? lessonPkg.learningObjectives : [""]);
    setEditMistakes(lessonPkg.commonMistakes ?? "");
    setEditTutorNotes(lessonPkg.tutorNotes ?? "");
    setEditStatus(lessonPkg.status);
    setEditing(true);
  }

  async function saveLesson() {
    if (!lessonPkg) return;
    setSaving(true);
    try {
      const updated = await updateLesson(lessonPkg.id, {
        title:              editTitle,
        description:        editDesc || undefined,
        difficulty:         editDifficulty,
        estimatedMinutes:   editMinutes,
        learningObjectives: editObjectives.filter(Boolean),
        commonMistakes:     editMistakes || undefined,
        tutorNotes:         editTutorNotes || undefined,
        status:             editStatus,
      });
      setLessonPkg({ ...lessonPkg, ...updated });
      if (activeCourseId) fetchFullCatalog(activeCourseId).then(setCatalog).catch(console.error);
      setEditing(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  // ── Upload handlers ────────────────────────────────────────────────
  function triggerUpload(resourceId: number) {
    uploadTargetRef.current = resourceId;
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const resourceId = uploadTargetRef.current;
    if (!file || !resourceId) return;
    e.target.value = "";
    setUploadingId(resourceId);
    setUploadMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const form = new FormData();
      form.append("file", file);
      form.append("resourceId", String(resourceId));
      const res = await fetch("/api/cms/upload-resource", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
      });
      const json = await res.json() as { resource?: { url: string }; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      if (lessonPkg && json.resource) {
        setLessonPkg({ ...lessonPkg, resources: lessonPkg.resources.map((r) =>
          r.id === resourceId ? { ...r, url: json.resource!.url } : r) });
      }
      setUploadMsg({ id: resourceId, ok: true, text: "Uploaded!" });
      setTimeout(() => setUploadMsg(null), 3000);
    } catch (err) {
      setUploadMsg({ id: resourceId, ok: false, text: err instanceof Error ? err.message : "Upload failed" });
    } finally { setUploadingId(null); uploadTargetRef.current = null; }
  }

  async function handlePasteUrl() {
    if (!lessonPkg || !pasteResourceId) return;
    try {
      const updated = await updateLessonResource(pasteResourceId as number, { url: pasteUrl || null });
      setLessonPkg({ ...lessonPkg, resources: lessonPkg.resources.map((r) =>
        r.id === pasteResourceId ? { ...r, url: updated.url } : r) });
      setPasteUrl(""); setPasteOpen(false); setPasteResourceId("");
    } catch (e) { console.error(e); }
  }

  // ── Add lesson ─────────────────────────────────────────────────────
  async function confirmAddLesson(categoryId: number) {
    if (!newLessonTitle.trim()) return;
    setAddingLesson(true);
    try {
      await insertLesson({ moduleId: categoryId, title: newLessonTitle.trim(), difficulty: 2, estimatedMinutes: 60, learningObjectives: [] });
      if (activeCourseId) {
        const updated = await fetchFullCatalog(activeCourseId);
        setCatalog(updated);
      }
      setNewLessonTitle(""); setAddingToCategoryId(null);
    } catch (e) { console.error(e); }
    finally { setAddingLesson(false); }
  }

  const breadcrumb = catalog && activeLessonId ? findBreadcrumb(catalog, activeLessonId) : null;

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="flex h-full min-h-0">
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.png,.jpg" className="hidden" onChange={handleFileSelected} />

      {/* ── LEFT: Course Library ── */}
      <div className="w-64 shrink-0 flex flex-col border-r border-gray-200 bg-white">
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Course Library</p>
          <select value={activeCourseId ?? ""} onChange={(e) => setActiveCourseId(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {courses.map((c) => <option key={c.id} value={c.id}>{c.subject} — {c.title}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {loadingCatalog && <div className="flex justify-center py-10"><Loader2 className="w-4 h-4 animate-spin text-gray-300" /></div>}
          {catalog && catalog.sections.map((section) => (
            <SectionNode key={section.id} section={section}
              expandedSections={expandedSections} expandedCategories={expandedCategories}
              activeLessonId={activeLessonId} addingToCategoryId={addingToCategoryId}
              newLessonTitle={newLessonTitle} addingLesson={addingLesson}
              showAddLesson={isBuilder}
              onToggleSection={toggleSection} onToggleCategory={toggleCategory}
              onSelectLesson={(id) => { setActiveLessonId(id); setEditing(false); }}
              onStartAdd={(id) => { setAddingToCategoryId(id); setNewLessonTitle(""); }}
              onTitleChange={setNewLessonTitle}
              onConfirm={confirmAddLesson}
              onCancelAdd={() => setAddingToCategoryId(null)}
            />
          ))}
        </div>
      </div>

      {/* ── RIGHT: Main Content ── */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {!activeLessonId && !loadingLesson && (
          <div className="flex flex-col items-center justify-center h-full py-24 text-center">
            <BookOpen className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">Select a lesson from the Course Library</p>
          </div>
        )}
        {loadingLesson && <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>}

        {lessonPkg && !loadingLesson && (
          <div className="p-6 max-w-5xl mx-auto">
            {/* Breadcrumb */}
            {breadcrumb && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4 flex-wrap">
                <span className="font-medium text-gray-600">{catalog!.subject}</span>
                <ChevronRight className="w-3 h-3" />
                <span>{breadcrumb.section.title}</span>
                <ChevronRight className="w-3 h-3" />
                <span>{breadcrumb.category.title}</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-700 font-semibold">{lessonPkg.title}</span>
              </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3 flex-wrap min-w-0">
                {editing
                  ? <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                      className="text-xl font-bold text-gray-900 border-b-2 border-blue-500 bg-transparent focus:outline-none min-w-0 flex-1" />
                  : <h1 className="text-xl font-bold text-gray-900">{lessonPkg.title}</h1>
                }
                <StatusBadge status={editing ? editStatus : lessonPkg.status} editing={editing} onChange={setEditStatus} />
              </div>
              {isBuilder && (
                <div className="flex gap-2 shrink-0">
                  {editing ? (
                    <>
                      <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                      <button onClick={saveLesson} disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save
                      </button>
                    </>
                  ) : (
                    <button onClick={enterEdit} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 bg-white rounded-lg text-sm text-gray-600 hover:bg-gray-50 shadow-sm">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm px-5 py-3 flex flex-wrap gap-6 mb-5 items-center">
              {editing ? (
                <>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Difficulty</p>
                    <select value={editDifficulty} onChange={(e) => setEditDifficulty(Number(e.target.value))}
                      className="rounded border border-gray-200 px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                      {[1,2,3,4,5].map((n) => <option key={n} value={n}>{DIFFICULTY_LABELS[n]}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Est. Time (min)</p>
                    <input type="number" value={editMinutes} onChange={(e) => setEditMinutes(Number(e.target.value))}
                      className="w-16 rounded border border-gray-200 px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                </>
              ) : (
                <>
                  <StatPill label="Difficulty"  value={DIFFICULTY_LABELS[lessonPkg.difficulty] ?? String(lessonPkg.difficulty)} />
                  <StatPill label="Est. Time"   value={`${lessonPkg.estimatedMinutes} min`} />
                  <StatPill label="Skills"      value={String(lessonPkg.skills.length)} />
                  <StatPill label="Resources"   value={`${lessonPkg.resources.filter((r) => r.url).length} / ${lessonPkg.resources.length} ready`} />
                </>
              )}
            </div>

            {/* Body: 3-5 left + 2-5 right */}
            <div className="grid grid-cols-5 gap-5">
              {/* Left column */}
              <div className="col-span-3 space-y-4">
                <InfoSection title="About This Lesson">
                  {editing
                    ? <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={4} placeholder="Describe what this lesson covers…"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    : <p className="text-sm text-gray-600 leading-relaxed">{lessonPkg.description || <em className="text-gray-300">No description yet</em>}</p>
                  }
                </InfoSection>

                <InfoSection title="Students Will Learn To">
                  {editing ? (
                    <div className="space-y-2">
                      {editObjectives.map((obj, i) => (
                        <div key={i} className="flex gap-2">
                          <input value={obj} onChange={(e) => { const n = [...editObjectives]; n[i] = e.target.value; setEditObjectives(n); }}
                            placeholder={`Objective ${i + 1}`}
                            className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          <button onClick={() => setEditObjectives(editObjectives.filter((_, j) => j !== i))}
                            className="text-red-400 hover:text-red-600 text-xs w-5">✕</button>
                        </div>
                      ))}
                      <button onClick={() => setEditObjectives([...editObjectives, ""])}
                        className="text-xs text-blue-600 hover:underline font-medium">+ Add objective</button>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {lessonPkg.learningObjectives.length === 0
                        ? <li className="text-sm text-gray-300 italic">No objectives yet</li>
                        : lessonPkg.learningObjectives.map((obj, i) => (
                            <li key={i} className="flex gap-2 text-sm text-gray-600">
                              <span className="text-blue-500 font-bold shrink-0 mt-0.5">·</span> {obj}
                            </li>
                          ))
                      }
                    </ul>
                  )}
                </InfoSection>

                <InfoSection title="Common Mistakes">
                  {editing
                    ? <textarea value={editMistakes} onChange={(e) => setEditMistakes(e.target.value)} rows={3} placeholder="What do students commonly get wrong?"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    : <p className="text-sm text-gray-600 leading-relaxed">{lessonPkg.commonMistakes || <em className="text-gray-300">None noted</em>}</p>
                  }
                </InfoSection>

                <InfoSection title="Author's Playbook">
                  {editing
                    ? <textarea value={editTutorNotes} onChange={(e) => setEditTutorNotes(e.target.value)} rows={3} placeholder="Tutor delivery notes, pacing tips…"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    : <p className="text-sm text-gray-600 leading-relaxed">{lessonPkg.tutorNotes || <em className="text-gray-300">No tutor notes</em>}</p>
                  }
                </InfoSection>

                {lessonPkg.skills.length > 0 && (
                  <InfoSection title="Skills Covered">
                    <div className="flex flex-wrap gap-2">
                      {lessonPkg.skills.map((sk) => (
                        <span key={sk.id} className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-medium">{sk.name}</span>
                      ))}
                    </div>
                  </InfoSection>
                )}
              </div>

              {/* Right column */}
              <div className="col-span-2 space-y-4">
                {/* Package Contents */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lesson Package Contents</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {RESOURCE_ORDER.map((type) => {
                      const res = lessonPkg.resources.find((r) => r.type === type);
                      if (!res) return null;
                      const isUp = uploadingId === res.id;
                      const msg  = uploadMsg?.id === res.id ? uploadMsg : null;
                      return (
                        <div key={type} className="px-4 py-2.5 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{RESOURCE_LABELS[type]}</p>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{RESOURCE_TAGS[type]}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {res.url
                              ? <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Ready</span>
                              : <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-400">Missing</span>
                            }
                            {msg && <span className={`text-[10px] font-medium ${msg.ok ? "text-emerald-600" : "text-red-500"}`}>{msg.text}</span>}
                            {res.url && (
                              <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-blue-500 transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {isBuilder && (
                              <button onClick={() => triggerUpload(res.id)} disabled={isUp} title="Upload file"
                                className="text-gray-300 hover:text-blue-500 transition-colors disabled:opacity-40">
                                {isUp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* URL paste — builder only */}
                  {isBuilder && (!pasteOpen ? (
                    <div className="px-4 py-2 border-t border-gray-50">
                      <button onClick={() => setPasteOpen(true)} className="text-xs text-gray-400 hover:text-blue-600 font-medium">+ Paste a URL instead</button>
                    </div>
                  ) : (
                    <div className="px-4 py-3 border-t border-gray-100 space-y-2">
                      <select value={pasteResourceId} onChange={(e) => setPasteResourceId(Number(e.target.value) || "")}
                        className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="">Select slot…</option>
                        {lessonPkg.resources.map((r) => <option key={r.id} value={r.id}>{RESOURCE_LABELS[r.type as string] ?? r.type}</option>)}
                      </select>
                      <div className="flex gap-2">
                        <input value={pasteUrl} onChange={(e) => setPasteUrl(e.target.value)} placeholder="https://…"
                          className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        <button onClick={handlePasteUrl} disabled={!pasteResourceId}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-40">Save</button>
                        <button onClick={() => { setPasteOpen(false); setPasteUrl(""); setPasteResourceId(""); }}
                          className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50">✕</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Lesson Stats */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Lesson Stats</p>
                  <div className="grid grid-cols-3 gap-3">
                    <MiniStat icon={<Clock className="w-3.5 h-3.5" />} label="Minutes" value={String(lessonPkg.estimatedMinutes)} />
                    <MiniStat icon={<Star className="w-3.5 h-3.5" />}  label="Difficulty" value={String(lessonPkg.difficulty)} />
                    <MiniStat icon={<FileText className="w-3.5 h-3.5" />} label="Skills" value={String(lessonPkg.skills.length)} />
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</p>
                  <div className="space-y-2">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 text-left">
                      Assign to Student
                    </button>
                    {lessonPkg.resources.find((r) => r.type === "lesson_deck" && r.url) && (
                      <a href={lessonPkg.resources.find((r) => r.type === "lesson_deck")!.url!}
                        target="_blank" rel="noopener noreferrer"
                        className="block w-full px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 text-left">
                        Preview Lesson Deck ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{title}</p>
      {children}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-2.5 text-center">
      <div className="flex justify-center text-gray-400 mb-1">{icon}</div>
      <p className="text-base font-bold text-gray-800">{value}</p>
      <p className="text-[10px] text-gray-400">{label}</p>
    </div>
  );
}

function StatusBadge({ status, editing, onChange }: {
  status: string;
  editing: boolean;
  onChange: (v: "draft" | "active" | "archived") => void;
}) {
  const colors: Record<string, string> = {
    draft:    "bg-amber-100 text-amber-700",
    active:   "bg-emerald-100 text-emerald-700",
    archived: "bg-gray-100 text-gray-400",
  };
  if (!editing) {
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${colors[status] ?? "bg-gray-100 text-gray-500"}`}>{status.toUpperCase()}</span>;
  }
  return (
    <select value={status} onChange={(e) => onChange(e.target.value as "draft" | "active" | "archived")}
      className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500">
      <option value="draft">DRAFT</option>
      <option value="active">ACTIVE</option>
      <option value="archived">ARCHIVED</option>
    </select>
  );
}

// ── Tree nodes ────────────────────────────────────────────────────────────────

interface TreeProps {
  section: CatalogSection;
  expandedSections: Set<number>;
  expandedCategories: Set<number>;
  activeLessonId: number | null;
  addingToCategoryId: number | null;
  newLessonTitle: string;
  addingLesson: boolean;
  showAddLesson: boolean;
  onToggleSection: (id: number) => void;
  onToggleCategory: (id: number) => void;
  onSelectLesson: (id: number) => void;
  onStartAdd: (catId: number) => void;
  onTitleChange: (v: string) => void;
  onConfirm: (catId: number) => void;
  onCancelAdd: () => void;
}

function SectionNode(p: TreeProps) {
  const open = p.expandedSections.has(p.section.id);
  return (
    <div>
      <button onClick={() => p.onToggleSection(p.section.id)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 text-left">
        {open ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
        <span className="truncate">{p.section.title}</span>
      </button>
      {open && p.section.categories.map((cat) => (
        <CategoryNode key={cat.id} category={cat}
          expandedCategories={p.expandedCategories} activeLessonId={p.activeLessonId}
          addingToCategoryId={p.addingToCategoryId} newLessonTitle={p.newLessonTitle}
          addingLesson={p.addingLesson} showAddLesson={p.showAddLesson}
          onToggle={p.onToggleCategory} onSelectLesson={p.onSelectLesson}
          onStartAdd={p.onStartAdd} onTitleChange={p.onTitleChange}
          onConfirm={p.onConfirm} onCancelAdd={p.onCancelAdd}
        />
      ))}
    </div>
  );
}

interface CatProps {
  category: CatalogCategory;
  expandedCategories: Set<number>;
  activeLessonId: number | null;
  addingToCategoryId: number | null;
  newLessonTitle: string;
  addingLesson: boolean;
  showAddLesson: boolean;
  onToggle: (id: number) => void;
  onSelectLesson: (id: number) => void;
  onStartAdd: (id: number) => void;
  onTitleChange: (v: string) => void;
  onConfirm: (id: number) => void;
  onCancelAdd: () => void;
}

function CategoryNode(p: CatProps) {
  const open      = p.expandedCategories.has(p.category.id);
  const addingHere = p.addingToCategoryId === p.category.id;
  return (
    <div>
      <button onClick={() => p.onToggle(p.category.id)}
        className="w-full flex items-center gap-2 pl-6 pr-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 text-left">
        {open ? <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" /> : <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />}
        <span className="truncate">{p.category.title}</span>
        <span className="ml-auto text-[10px] text-gray-300 shrink-0">{p.category.lessons.length}</span>
      </button>
      {open && (
        <div>
          {p.category.lessons.map((lesson) => (
            <button key={lesson.id} onClick={() => p.onSelectLesson(lesson.id)}
              className={`w-full flex items-center gap-2 pl-10 pr-3 py-1.5 text-xs text-left transition-colors ${
                p.activeLessonId === lesson.id
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}>
              <span className="truncate">{lesson.title}</span>
              {lesson.status === "draft" && p.activeLessonId !== lesson.id && (
                <span className="ml-auto text-[9px] font-bold text-gray-300 uppercase shrink-0">draft</span>
              )}
            </button>
          ))}
          {p.showAddLesson && addingHere ? (
            <div className="pl-10 pr-3 py-1.5 flex gap-1">
              <input autoFocus value={p.newLessonTitle} onChange={(e) => p.onTitleChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") p.onConfirm(p.category.id); if (e.key === "Escape") p.onCancelAdd(); }}
                placeholder="Lesson title…"
                className="flex-1 text-xs border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              <button onClick={() => p.onConfirm(p.category.id)} disabled={p.addingLesson || !p.newLessonTitle.trim()}
                className="text-blue-600 hover:text-blue-700 disabled:opacity-40 text-xs font-bold px-1">
                {p.addingLesson ? "…" : "✓"}
              </button>
              <button onClick={p.onCancelAdd} className="text-gray-400 hover:text-gray-600 text-xs px-1">✕</button>
            </div>
          ) : p.showAddLesson ? (
            <button onClick={() => p.onStartAdd(p.category.id)}
              className="w-full flex items-center gap-1 pl-10 pr-3 py-1 text-[10px] text-gray-300 hover:text-blue-500 text-left">
              <Plus className="w-3 h-3" /> Add lesson
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
