"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Loader2, Edit2, Check, X, FileText, ExternalLink, ChevronRight } from "lucide-react";
import type {
  Course, CourseCatalogFull, LessonPackage, LessonResource,
  CatalogSection, CatalogCategory,
} from "@/lib/portal/types";
import {
  fetchCourses, fetchFullCatalog, fetchLessonPackage,
  insertLesson, updateLesson, updateLessonResource, insertLessonResource,
} from "@/lib/portal/db";
import CourseTree from "./CourseTree";
import LessonWizard from "./LessonWizard";
import ResourceSlot, { RESOURCE_ORDER, RESOURCE_LABELS, RESOURCE_TAGS } from "./ResourceSlot";

// ── Constants ──────────────────────────────────────────────────────────────────

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Beginner", 2: "Intermediate", 3: "Standard", 4: "Advanced", 5: "Expert",
};

const STATUS_COLORS: Record<string, string> = {
  draft:     "bg-amber-100 text-amber-700",
  in_review: "bg-blue-100 text-blue-700",
  active:    "bg-emerald-100 text-emerald-700",
  archived:  "bg-gray-100 text-gray-400",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

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

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CurriculumBuilder() {
  const [courses,        setCourses]        = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<number | null>(null);
  const [catalog,        setCatalog]        = useState<CourseCatalogFull | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
  const [lessonPkg,      setLessonPkg]      = useState<LessonPackage | null>(null);
  const [loadingLesson,  setLoadingLesson]  = useState(false);

  const [showWizard, setShowWizard] = useState(false);

  // Edit state
  const [editing,        setEditing]        = useState(false);
  const [editTitle,      setEditTitle]      = useState("");
  const [editDesc,       setEditDesc]       = useState("");
  const [editDifficulty, setEditDifficulty] = useState(2);
  const [editMinutes,    setEditMinutes]    = useState(60);
  const [editObjectives, setEditObjectives] = useState<string[]>([""]);
  const [editMistakes,   setEditMistakes]   = useState("");
  const [editTutorNotes, setEditTutorNotes] = useState("");
  const [editDesmos,     setEditDesmos]     = useState("");
  const [editStatus,     setEditStatus]     = useState<"draft" | "in_review" | "active" | "archived">("draft");
  const [saving,         setSaving]         = useState(false);

  // Add lesson inline
  const [addingToCategoryId, setAddingToCategoryId] = useState<number | null>(null);
  const [newLessonTitle,     setNewLessonTitle]     = useState("");
  const [addingLesson,       setAddingLesson]       = useState(false);

  // ── Load courses ──
  useEffect(() => {
    fetchCourses({ all: true }).then((cs) => {
      setCourses(cs);
      if (cs.length > 0) setActiveCourseId(cs[0].id);
    }).catch(console.error);
  }, []);

  // ── Load catalog ──
  useEffect(() => {
    if (!activeCourseId) return;
    setLoadingCatalog(true);
    setCatalog(null); setActiveLessonId(null); setLessonPkg(null);
    fetchFullCatalog(activeCourseId)
      .then(setCatalog)
      .catch(console.error)
      .finally(() => setLoadingCatalog(false));
  }, [activeCourseId]);

  // ── Load lesson ──
  useEffect(() => {
    if (!activeLessonId) return;
    setLoadingLesson(true); setLessonPkg(null); setEditing(false);
    fetchLessonPackage(activeLessonId)
      .then(setLessonPkg)
      .catch(console.error)
      .finally(() => setLoadingLesson(false));
  }, [activeLessonId]);

  function enterEdit() {
    if (!lessonPkg) return;
    setEditTitle(lessonPkg.title);
    setEditDesc(lessonPkg.description ?? "");
    setEditDifficulty(lessonPkg.difficulty);
    setEditMinutes(lessonPkg.estimatedMinutes);
    setEditObjectives(lessonPkg.learningObjectives.length > 0 ? lessonPkg.learningObjectives : [""]);
    setEditMistakes(lessonPkg.commonMistakes ?? "");
    setEditTutorNotes(lessonPkg.tutorNotes ?? "");
    setEditDesmos(lessonPkg.desmosUsage ?? "");
    setEditStatus(lessonPkg.status as "draft" | "in_review" | "active" | "archived");
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
        desmosUsage:        editDesmos || undefined,
        status:             editStatus,
      });
      setLessonPkg({ ...lessonPkg, ...updated });
      if (activeCourseId) fetchFullCatalog(activeCourseId).then(setCatalog).catch(console.error);
      setEditing(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function confirmAddLesson(categoryId: number) {
    if (!newLessonTitle.trim()) return;
    setAddingLesson(true);
    try {
      const lesson = await insertLesson({ moduleId: categoryId, title: newLessonTitle.trim(), difficulty: 2, estimatedMinutes: 60, learningObjectives: [] });
      // Auto-create resource slots
      await Promise.all(RESOURCE_ORDER.map((type, i) =>
        insertLessonResource({ lessonId: lesson.id, type, label: RESOURCE_LABELS[type], position: i })
      ));
      if (activeCourseId) {
        const updated = await fetchFullCatalog(activeCourseId);
        setCatalog(updated);
      }
      setNewLessonTitle(""); setAddingToCategoryId(null);
      setActiveLessonId(lesson.id);
    } catch (e) { console.error(e); }
    finally { setAddingLesson(false); }
  }

  function handleWizardComplete(lessonId: number) {
    setShowWizard(false);
    if (activeCourseId) {
      fetchFullCatalog(activeCourseId).then(setCatalog).catch(console.error);
    }
    setActiveLessonId(lessonId);
  }

  function handleResourceUpdate(updated: LessonResource) {
    if (!lessonPkg) return;
    setLessonPkg({ ...lessonPkg, resources: lessonPkg.resources.map((r) => r.id === updated.id ? updated : r) });
  }

  const breadcrumb = catalog && activeLessonId ? findBreadcrumb(catalog, activeLessonId) : null;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Top header ── */}
      {!showWizard && (
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-gray-900">Curriculum Builder</h1>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">| ADMIN</span>
          </div>
          <button
            onClick={() => setShowWizard(true)}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            + Create New
          </button>
        </div>
      )}

      {/* ── Wizard or two-panel view ── */}
      {showWizard ? (
        <div className="flex-1 min-h-0">
          <LessonWizard
            courses={courses}
            defaultCourseId={activeCourseId}
            onComplete={handleWizardComplete}
            onCancel={() => setShowWizard(false)}
          />
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">
          {/* ── Left: Course Tree ── */}
          <CourseTree
            courses={courses}
            catalog={catalog}
            activeCourseId={activeCourseId}
            activeLessonId={activeLessonId}
            loading={loadingCatalog}
            isBuilder
            addingToCategoryId={addingToCategoryId}
            newLessonTitle={newLessonTitle}
            addingLesson={addingLesson}
            onCourseChange={(id) => setActiveCourseId(id)}
            onSelectLesson={(id) => { setActiveLessonId(id); setEditing(false); }}
            onStartAdd={(id) => { setAddingToCategoryId(id); setNewLessonTitle(""); }}
            onTitleChange={setNewLessonTitle}
            onConfirmAdd={confirmAddLesson}
            onCancelAdd={() => setAddingToCategoryId(null)}
          />

          {/* ── Right: Lesson Detail ── */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {!activeLessonId && !loadingLesson && (
              <div className="flex flex-col items-center justify-center h-full py-24 text-center">
                <BookOpen className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400 mb-2">Select a lesson to view its package</p>
                <button onClick={() => setShowWizard(true)} className="text-xs text-blue-600 hover:underline font-medium">
                  Or create a new lesson →
                </button>
              </div>
            )}
            {loadingLesson && <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>}

            {lessonPkg && !loadingLesson && (
              <div className="p-6 max-w-none">
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
                    {editing
                      ? <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as typeof editStatus)}
                          className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold focus:outline-none">
                          <option value="draft">DRAFT</option>
                          <option value="in_review">IN REVIEW</option>
                          <option value="active">ACTIVE</option>
                          <option value="archived">ARCHIVED</option>
                        </select>
                      : <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[lessonPkg.status] ?? "bg-gray-100 text-gray-500"}`}>
                          {lessonPkg.status.replace("_", " ").toUpperCase()}
                        </span>
                    }
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {editing ? (
                      <>
                        <button onClick={() => setEditing(false)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                          <X className="w-3.5 h-3.5" /> Cancel
                        </button>
                        <button onClick={saveLesson} disabled={saving}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save
                        </button>
                      </>
                    ) : (
                      <button onClick={enterEdit}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 bg-white rounded-lg text-sm text-gray-600 hover:bg-gray-50 shadow-sm">
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm px-5 py-3 flex flex-wrap gap-6 mb-5 items-center">
                  <StatPill label="Difficulty"  value={DIFFICULTY_LABELS[lessonPkg.difficulty] ?? String(lessonPkg.difficulty)} />
                  <StatPill label="Class Time"  value={`${lessonPkg.estimatedMinutes} min`} />
                  {lessonPkg.hwMinutes && <StatPill label="HW Time" value={`${lessonPkg.hwMinutes} min`} />}
                  <StatPill label="Skills"      value={String(lessonPkg.skills.length)} />
                  <StatPill label="Package"     value={`${lessonPkg.resources.filter((r) => r.url).length} / ${lessonPkg.resources.length} ready`} />
                  {lessonPkg.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {lessonPkg.tags.map((t) => (
                        <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[10px] font-medium">{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3-column body */}
                <div className="grid grid-cols-12 gap-5">
                  {/* Left (5/12): content */}
                  <div className="col-span-5 space-y-4">
                    <InfoSection title="About This Lesson">
                      {editing
                        ? <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={4} placeholder="Describe what this lesson covers…"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        : <p className="text-sm text-gray-600 leading-relaxed">{lessonPkg.description || <em className="text-gray-300">No description</em>}</p>
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

                    {(editing || lessonPkg.commonMistakes) && (
                      <InfoSection title="Common Mistakes">
                        {editing
                          ? <textarea value={editMistakes} onChange={(e) => setEditMistakes(e.target.value)} rows={3} placeholder="What do students commonly get wrong?"
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          : <p className="text-sm text-gray-600 leading-relaxed">{lessonPkg.commonMistakes}</p>
                        }
                      </InfoSection>
                    )}

                    {(editing || lessonPkg.tutorNotes) && (
                      <InfoSection title="Author's Playbook">
                        {editing
                          ? <textarea value={editTutorNotes} onChange={(e) => setEditTutorNotes(e.target.value)} rows={3} placeholder="Pacing tips, delivery notes…"
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          : <p className="text-sm text-gray-600 leading-relaxed">{lessonPkg.tutorNotes}</p>
                        }
                      </InfoSection>
                    )}

                    {(editing || lessonPkg.desmosUsage) && (
                      <InfoSection title="Recommended Desmos Usage">
                        {editing
                          ? <textarea value={editDesmos} onChange={(e) => setEditDesmos(e.target.value)} rows={2} placeholder="Specific activities, links, or techniques…"
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          : <p className="text-sm text-gray-600 leading-relaxed">{lessonPkg.desmosUsage}</p>
                        }
                      </InfoSection>
                    )}

                    {lessonPkg.skills.length > 0 && (
                      <InfoSection title="Aligned Skills">
                        <div className="space-y-3">
                          {lessonPkg.skills.map((sk) => (
                            <div key={sk.id}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-medium text-gray-700">{sk.name}</span>
                                <span className="text-[10px] font-bold text-gray-400">
                                  {["", "Beginner", "Intermediate", "Standard", "Advanced", "Expert"][sk.difficulty] ?? "—"}
                                </span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${sk.difficulty * 20}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </InfoSection>
                    )}
                  </div>

                  {/* Middle (4/12): package contents */}
                  <div className="col-span-4 space-y-4">
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lesson Package</p>
                        <span className="text-[10px] font-bold text-gray-400">
                          {lessonPkg.resources.filter((r) => r.url).length}/{lessonPkg.resources.length} Ready
                        </span>
                      </div>
                      {RESOURCE_ORDER.map((type) => {
                        const res = lessonPkg.resources.find((r) => r.type === type);
                        if (!res) return null;
                        return <ResourceSlot key={type} resource={res} isBuilder onUpdate={handleResourceUpdate} />;
                      })}
                    </div>
                  </div>

                  {/* Right (3/12): stats + workflow + actions */}
                  <div className="col-span-3 space-y-4">
                    {/* Lesson Stats */}
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Lesson Stats</p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Difficulty</span>
                          <span className="text-xs font-bold text-gray-800">{DIFFICULTY_LABELS[lessonPkg.difficulty]}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Class Time</span>
                          <span className="text-xs font-bold text-gray-800">{lessonPkg.estimatedMinutes} min</span>
                        </div>
                        {lessonPkg.hwMinutes && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">HW Time</span>
                            <span className="text-xs font-bold text-gray-800">{lessonPkg.hwMinutes} min</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Skills</span>
                          <span className="text-xs font-bold text-gray-800">{lessonPkg.skills.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Resources</span>
                          <span className="text-xs font-bold text-gray-800">
                            {lessonPkg.resources.filter((r) => r.url).length}/{lessonPkg.resources.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Approval Workflow */}
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Approval Workflow</p>
                      {([
                        { status: "draft",     label: "Draft",             hint: "Being created" },
                        { status: "in_review", label: "In Review",         hint: "Submitted to admin" },
                        { status: "active",    label: "Published",         hint: "Live in library" },
                      ] as const).map((stage, i) => {
                        const statusOrder = ["draft", "in_review", "active"];
                        const currentIdx  = statusOrder.indexOf(lessonPkg.status);
                        const stageIdx    = statusOrder.indexOf(stage.status);
                        const reached     = currentIdx >= stageIdx && currentIdx !== -1;
                        const current     = lessonPkg.status === stage.status;
                        return (
                          <div key={stage.status} className="flex items-start gap-2.5 mb-3 last:mb-0">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-2 ${
                              reached ? "bg-blue-600 border-blue-600" : "bg-white border-gray-200"
                            }`}>
                              {reached && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold ${current ? "text-blue-600" : reached ? "text-gray-700" : "text-gray-300"}`}>{stage.label}</p>
                              {current && <p className="text-[10px] text-gray-400 mt-0.5">{stage.hint}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</p>
                      <div className="space-y-2">
                        <button className="w-full px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 text-left">
                          Assign to Student
                        </button>
                        {lessonPkg.resources.find((r) => r.type === "lesson_deck" && r.url) && (
                          <a href={lessonPkg.resources.find((r) => r.type === "lesson_deck")!.url!}
                            target="_blank" rel="noopener noreferrer"
                            className="block w-full px-3 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 text-left">
                            Preview Lesson Deck ↗
                          </a>
                        )}
                        {lessonPkg.status === "draft" && (
                          <button
                            onClick={async () => {
                              await updateLesson(lessonPkg.id, { status: "in_review" });
                              setLessonPkg({ ...lessonPkg, status: "in_review" });
                              if (activeCourseId) fetchFullCatalog(activeCourseId).then(setCatalog).catch(console.error);
                            }}
                            className="w-full px-3 py-2 border border-blue-200 text-blue-600 rounded-xl text-xs font-semibold hover:bg-blue-50 text-left">
                            Submit for Review
                          </button>
                        )}
                        {lessonPkg.status === "in_review" && (
                          <button
                            onClick={async () => {
                              await updateLesson(lessonPkg.id, { status: "active" });
                              setLessonPkg({ ...lessonPkg, status: "active" });
                              if (activeCourseId) fetchFullCatalog(activeCourseId).then(setCatalog).catch(console.error);
                            }}
                            className="w-full px-3 py-2 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-semibold hover:bg-emerald-50 text-left">
                            Approve & Publish
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-5 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recent Activity</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {[
                      { label: "Lesson created",      note: "Added to curriculum library" },
                      { label: "Resources status",    note: `${lessonPkg.resources.filter((r) => r.url).length} of ${lessonPkg.resources.length} slots uploaded` },
                      { label: "Skills aligned",      note: lessonPkg.skills.length > 0 ? `${lessonPkg.skills.length} skill${lessonPkg.skills.length !== 1 ? "s" : ""} linked` : "No skills aligned yet" },
                    ].map((row) => (
                      <div key={row.label} className="px-5 py-3 flex items-center gap-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700">{row.label}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{row.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

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
