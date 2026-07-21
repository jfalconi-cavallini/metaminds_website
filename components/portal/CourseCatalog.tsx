"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronRight, Plus, Pencil, Trash2, ArrowUp, ArrowDown, Link, Video, FileText, BookOpen } from "lucide-react";
import {
  fetchCourses, insertCourse, updateCourse,
  fetchModules, insertModule, updateModule, deleteModule,
  fetchLessons, insertLesson, updateLesson, deleteLesson,
  fetchLessonResources, insertLessonResource, deleteLessonResource,
} from "@/lib/portal/db";
import type { Course, Module, Lesson, LessonResource, ResourceType } from "@/lib/portal/types";

type CmsView = "courses" | "modules" | "lessons" | "lesson";

const SUBJECTS = ["SAT", "ACT", "Python", "Scratch", "Algebra 1", "Algebra 2", "Geometry", "Pre-Calculus", "AP CSP", "Java", "Robotics", "Entrepreneurship"];
const GRADE_OPTIONS = ["5","6","7","8","9","10","11","12"];
const RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
  { value: "slides",       label: "Lesson Slides"  },
  { value: "worksheet",    label: "Worksheet"       },
  { value: "homework_pdf", label: "Homework PDF"    },
  { value: "answer_key",   label: "Answer Key"      },
  { value: "video",        label: "Video"           },
  { value: "kami_link",    label: "Kami Link"       },
  { value: "external",     label: "External Link"   },
];

const DIFF_LABELS = ["","Beginner","Easy","Intermediate","Advanced","Expert"];
const DIFF_COLORS = ["","text-emerald-600 bg-emerald-50","text-blue-600 bg-blue-50","text-amber-600 bg-amber-50","text-orange-600 bg-orange-50","text-red-600 bg-red-50"];

function StatusBadge({ status }: { status: string }) {
  const cls = status === "active" ? "bg-emerald-50 text-emerald-700" : status === "archived" ? "bg-gray-100 text-gray-500" : "bg-amber-50 text-amber-700";
  return <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cls}`}>{status}</span>;
}

function ResourceIcon({ type }: { type: string }) {
  if (type === "video")    return <Video   className="w-3.5 h-3.5 text-violet-500" />;
  if (type === "kami_link" || type === "external") return <Link className="w-3.5 h-3.5 text-blue-500" />;
  return <FileText className="w-3.5 h-3.5 text-gray-400" />;
}

export default function CourseCatalog() {
  // ── NAVIGATION ──────────────────────────────────────────────────
  const [view,           setView]           = useState<CmsView>("courses");
  const [activeCourse,   setActiveCourse]   = useState<Course | null>(null);
  const [activeModule,   setActiveModule]   = useState<Module | null>(null);
  const [activeLesson,   setActiveLesson]   = useState<Lesson | null>(null);

  // ── DATA ────────────────────────────────────────────────────────
  const [courses,   setCourses]   = useState<Course[]>([]);
  const [modules,   setModules]   = useState<Module[]>([]);
  const [lessons,   setLessons]   = useState<Lesson[]>([]);
  const [resources, setResources] = useState<LessonResource[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // ── COURSE FORM ─────────────────────────────────────────────────
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse,  setEditingCourse]  = useState<Course | null>(null);
  const [cfSubject,      setCfSubject]      = useState("");
  const [cfTitle,        setCfTitle]        = useState("");
  const [cfDesc,         setCfDesc]         = useState("");
  const [cfGrades,       setCfGrades]       = useState<string[]>([]);
  const [cfHours,        setCfHours]        = useState("");
  const [cfStatus,       setCfStatus]       = useState<"draft"|"active"|"archived">("draft");
  const [cfSaving,       setCfSaving]       = useState(false);

  // ── MODULE FORM ─────────────────────────────────────────────────
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule,  setEditingModule]  = useState<Module | null>(null);
  const [mfTitle,        setMfTitle]        = useState("");
  const [mfDesc,         setMfDesc]         = useState("");
  const [mfWeeks,        setMfWeeks]        = useState("");
  const [mfSaving,       setMfSaving]       = useState(false);

  // ── LESSON EDITOR (inline view) ─────────────────────────────────
  const [lfTitle,      setLfTitle]      = useState("");
  const [lfDesc,       setLfDesc]       = useState("");
  const [lfDiff,       setLfDiff]       = useState(2);
  const [lfMinutes,    setLfMinutes]    = useState(60);
  const [lfObjs,       setLfObjs]       = useState<string[]>([""]);
  const [lfMistakes,   setLfMistakes]   = useState("");
  const [lfTutorNotes, setLfTutorNotes] = useState("");
  const [lfAiNotes,    setLfAiNotes]    = useState("");
  const [lfStatus,     setLfStatus]     = useState<"draft"|"active"|"archived">("draft");
  const [lfSaving,     setLfSaving]     = useState(false);
  const [lfSaved,      setLfSaved]      = useState(false);

  // New lesson form (in lessons list view)
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson,  setEditingLesson]  = useState<Lesson | null>(null);
  const [nlTitle,        setNlTitle]        = useState("");
  const [nlDiff,         setNlDiff]         = useState(2);
  const [nlMinutes,      setNlMinutes]      = useState(60);
  const [nlSaving,       setNlSaving]       = useState(false);

  // ── RESOURCE FORM ────────────────────────────────────────────────
  const [showResForm, setShowResForm] = useState(false);
  const [rfType,      setRfType]      = useState<ResourceType>("slides");
  const [rfLabel,     setRfLabel]     = useState("");
  const [rfUrl,       setRfUrl]       = useState("");
  const [rfSaving,    setRfSaving]    = useState(false);

  // ── LOAD ────────────────────────────────────────────────────────
  const loadCourses = useCallback(async () => {
    setLoading(true); setError(null);
    try { setCourses(await fetchCourses({ all: true })); }
    catch { setError("Failed to load courses."); }
    finally { setLoading(false); }
  }, []);

  const loadModules = useCallback(async (courseId: number) => {
    setLoading(true);
    try { setModules(await fetchModules(courseId)); }
    catch { setError("Failed to load modules."); }
    finally { setLoading(false); }
  }, []);

  const loadLessons = useCallback(async (moduleId: number) => {
    setLoading(true);
    try { setLessons(await fetchLessons(moduleId)); }
    catch { setError("Failed to load lessons."); }
    finally { setLoading(false); }
  }, []);

  const loadResources = useCallback(async (lessonId: number) => {
    try { setResources(await fetchLessonResources(lessonId)); }
    catch { /* silent */ }
  }, []);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  // ── NAVIGATION HANDLERS ──────────────────────────────────────────
  function openCourse(c: Course) {
    setActiveCourse(c); setView("modules");
    setModules([]); loadModules(c.id);
    setShowModuleForm(false); setEditingModule(null);
  }

  function openModule(m: Module) {
    setActiveModule(m); setView("lessons");
    setLessons([]); loadLessons(m.id);
    setShowLessonForm(false); setEditingLesson(null);
  }

  function openLesson(l: Lesson) {
    setActiveLesson(l); setView("lesson");
    setLfTitle(l.title); setLfDesc(l.description ?? "");
    setLfDiff(l.difficulty); setLfMinutes(l.estimatedMinutes);
    setLfObjs(l.learningObjectives.length ? l.learningObjectives : [""]);
    setLfMistakes(l.commonMistakes ?? ""); setLfTutorNotes(l.tutorNotes ?? "");
    setLfAiNotes(l.aiNotes ?? ""); setLfStatus(l.status);
    setLfSaved(false); setShowResForm(false);
    loadResources(l.id);
  }

  // ── COURSE FORM HANDLERS ─────────────────────────────────────────
  function openNewCourseForm() {
    setEditingCourse(null); setCfSubject(""); setCfTitle(""); setCfDesc("");
    setCfGrades([]); setCfHours(""); setCfStatus("draft");
    setShowCourseForm(true);
  }
  function openEditCourseForm(c: Course) {
    setEditingCourse(c); setCfSubject(c.subject); setCfTitle(c.title);
    setCfDesc(c.description ?? ""); setCfGrades(c.gradeLevels);
    setCfHours(c.estimatedHours ? String(c.estimatedHours) : ""); setCfStatus(c.status);
    setShowCourseForm(true);
  }

  async function submitCourseForm() {
    if (!cfSubject || !cfTitle) return;
    setCfSaving(true);
    try {
      const payload = { subject: cfSubject, title: cfTitle, description: cfDesc, gradeLevels: cfGrades, estimatedHours: cfHours ? Number(cfHours) : undefined, status: cfStatus };
      if (editingCourse) {
        const updated = await updateCourse(editingCourse.id, payload);
        setCourses((prev) => prev.map((c) => c.id === updated.id ? updated : c));
        if (activeCourse?.id === updated.id) setActiveCourse(updated);
      } else {
        const created = await insertCourse(payload);
        setCourses((prev) => [...prev, created]);
      }
      setShowCourseForm(false);
    } catch { setError("Failed to save course."); }
    finally { setCfSaving(false); }
  }

  // ── MODULE FORM HANDLERS ─────────────────────────────────────────
  function openNewModuleForm() {
    setEditingModule(null); setMfTitle(""); setMfDesc(""); setMfWeeks("");
    setShowModuleForm(true);
  }
  function openEditModuleForm(m: Module) {
    setEditingModule(m); setMfTitle(m.title); setMfDesc(m.description ?? "");
    setMfWeeks(m.estimatedWeeks ? String(m.estimatedWeeks) : "");
    setShowModuleForm(true);
  }

  async function submitModuleForm() {
    if (!mfTitle || !activeCourse) return;
    setMfSaving(true);
    try {
      if (editingModule) {
        const updated = await updateModule(editingModule.id, { title: mfTitle, description: mfDesc, estimatedWeeks: mfWeeks ? Number(mfWeeks) : undefined });
        setModules((prev) => prev.map((m) => m.id === updated.id ? updated : m));
      } else {
        const maxPos = modules.reduce((max, m) => Math.max(max, m.position), -1);
        const created = await insertModule({ courseId: activeCourse.id, title: mfTitle, description: mfDesc, estimatedWeeks: mfWeeks ? Number(mfWeeks) : undefined, position: maxPos + 1 });
        setModules((prev) => [...prev, created]);
      }
      setShowModuleForm(false);
    } catch { setError("Failed to save module."); }
    finally { setMfSaving(false); }
  }

  async function handleDeleteModule(m: Module) {
    if (!confirm(`Delete module "${m.title}" and all its lessons? This cannot be undone.`)) return;
    try {
      await deleteModule(m.id);
      setModules((prev) => prev.filter((x) => x.id !== m.id));
    } catch { setError("Failed to delete module."); }
  }

  async function moveModule(m: Module, dir: "up" | "down") {
    const idx = modules.findIndex((x) => x.id === m.id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= modules.length) return;
    const swap = modules[swapIdx];
    try {
      await Promise.all([
        updateModule(m.id, { position: swap.position }),
        updateModule(swap.id, { position: m.position }),
      ]);
      setModules((prev) => {
        const next = [...prev];
        next[idx] = { ...m, position: swap.position };
        next[swapIdx] = { ...swap, position: m.position };
        return next.sort((a, b) => a.position - b.position);
      });
    } catch { setError("Failed to reorder."); }
  }

  // ── LESSON FORM HANDLERS (from lessons list) ─────────────────────
  function openNewLessonForm() {
    setEditingLesson(null); setNlTitle(""); setNlDiff(2); setNlMinutes(60);
    setShowLessonForm(true);
  }

  async function submitNewLesson() {
    if (!nlTitle || !activeModule) return;
    setNlSaving(true);
    try {
      const maxPos = lessons.reduce((max, l) => Math.max(max, l.position), -1);
      const created = await insertLesson({ moduleId: activeModule.id, title: nlTitle, difficulty: nlDiff, estimatedMinutes: nlMinutes, position: maxPos + 1 });
      setLessons((prev) => [...prev, created]);
      setShowLessonForm(false);
    } catch { setError("Failed to create lesson."); }
    finally { setNlSaving(false); }
  }

  async function handleDeleteLesson(l: Lesson) {
    if (!confirm(`Delete lesson "${l.title}"?`)) return;
    try {
      await deleteLesson(l.id);
      setLessons((prev) => prev.filter((x) => x.id !== l.id));
      if (activeLesson?.id === l.id) { setView("lessons"); setActiveLesson(null); }
    } catch { setError("Failed to delete lesson."); }
  }

  async function moveLesson(l: Lesson, dir: "up" | "down") {
    const idx = lessons.findIndex((x) => x.id === l.id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= lessons.length) return;
    const swap = lessons[swapIdx];
    try {
      await Promise.all([
        updateLesson(l.id, { position: swap.position }),
        updateLesson(swap.id, { position: l.position }),
      ]);
      setLessons((prev) => {
        const next = [...prev];
        next[idx] = { ...l, position: swap.position };
        next[swapIdx] = { ...swap, position: l.position };
        return next.sort((a, b) => a.position - b.position);
      });
    } catch { setError("Failed to reorder."); }
  }

  // ── LESSON EDITOR SAVE ───────────────────────────────────────────
  async function saveLessonEdits() {
    if (!activeLesson) return;
    setLfSaving(true);
    try {
      const updated = await updateLesson(activeLesson.id, {
        title: lfTitle, description: lfDesc, difficulty: lfDiff,
        estimatedMinutes: lfMinutes,
        learningObjectives: lfObjs.map((o) => o.trim()).filter(Boolean),
        commonMistakes: lfMistakes, tutorNotes: lfTutorNotes,
        aiNotes: lfAiNotes, status: lfStatus,
      });
      setActiveLesson(updated);
      setLessons((prev) => prev.map((l) => l.id === updated.id ? updated : l));
      setLfSaved(true);
      setTimeout(() => setLfSaved(false), 3000);
    } catch { setError("Failed to save lesson."); }
    finally { setLfSaving(false); }
  }

  // ── RESOURCE HANDLERS ────────────────────────────────────────────
  async function submitResource() {
    if (!rfLabel || !rfUrl || !activeLesson) return;
    setRfSaving(true);
    try {
      const maxPos = resources.reduce((max, r) => Math.max(max, r.position), -1);
      const created = await insertLessonResource({ lessonId: activeLesson.id, type: rfType, label: rfLabel, url: rfUrl, position: maxPos + 1 });
      setResources((prev) => [...prev, created]);
      setRfLabel(""); setRfUrl(""); setShowResForm(false);
    } catch { setError("Failed to add resource."); }
    finally { setRfSaving(false); }
  }

  async function handleDeleteResource(id: number) {
    try {
      await deleteLessonResource(id);
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch { setError("Failed to delete resource."); }
  }

  // ── GROUPED COURSES ──────────────────────────────────────────────
  const coursesBySubject = courses.reduce<Record<string, Course[]>>((acc, c) => {
    if (!acc[c.subject]) acc[c.subject] = [];
    acc[c.subject].push(c);
    return acc;
  }, {});

  // ── INPUT CLASS ──────────────────────────────────────────────────
  const inp = "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
  const ta  = `${inp} resize-none`;

  // ── BREADCRUMB ───────────────────────────────────────────────────
  function Breadcrumb() {
    return (
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6 flex-wrap">
        <button onClick={() => { setView("courses"); setActiveCourse(null); setActiveModule(null); setActiveLesson(null); }} className="hover:text-blue-600 font-medium transition-colors">
          All Courses
        </button>
        {activeCourse && <>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <button onClick={() => { setView("modules"); setActiveModule(null); setActiveLesson(null); loadModules(activeCourse.id); }} className={`hover:text-blue-600 transition-colors ${view === "modules" ? "text-gray-900 font-semibold" : ""}`}>
            {activeCourse.title}
          </button>
        </>}
        {activeModule && <>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <button onClick={() => { setView("lessons"); setActiveLesson(null); loadLessons(activeModule.id); }} className={`hover:text-blue-600 transition-colors ${view === "lessons" ? "text-gray-900 font-semibold" : ""}`}>
            {activeModule.title}
          </button>
        </>}
        {activeLesson && <>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <span className="text-gray-900 font-semibold">{activeLesson.title}</span>
        </>}
      </nav>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="p-6 max-w-5xl mx-auto">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-xl flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <Breadcrumb />

      {/* ── COURSES VIEW ─────────────────────────────────────────── */}
      {view === "courses" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Course Catalog</h2>
              <p className="text-sm text-gray-400 mt-0.5">All MetaMinds programs — the source of all curriculum</p>
            </div>
            <button onClick={openNewCourseForm} className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" /> New Course
            </button>
          </div>

          {/* Course form */}
          {showCourseForm && (
            <div className="mb-6 bg-white border border-blue-100 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">{editingCourse ? "Edit Course" : "New Course"}</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Subject *</label>
                  <input list="subjects-list" value={cfSubject} onChange={(e) => setCfSubject(e.target.value)} placeholder="e.g. SAT" className={inp} />
                  <datalist id="subjects-list">{SUBJECTS.map((s) => <option key={s} value={s} />)}</datalist>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Title *</label>
                  <input value={cfTitle} onChange={(e) => setCfTitle(e.target.value)} placeholder="e.g. SAT Math Prep" className={inp} />
                </div>
              </div>
              <div className="mb-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Description</label>
                <textarea value={cfDesc} onChange={(e) => setCfDesc(e.target.value)} rows={2} placeholder="What does this course cover?" className={ta} />
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Grade Levels</label>
                  <div className="flex flex-wrap gap-1">
                    {GRADE_OPTIONS.map((g) => (
                      <button key={g} onClick={() => setCfGrades((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g])}
                        className={`text-xs px-2 py-0.5 rounded-lg border transition-colors ${cfGrades.includes(g) ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:border-blue-300"}`}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Est. Hours</label>
                  <input type="number" value={cfHours} onChange={(e) => setCfHours(e.target.value)} placeholder="40" className={inp} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Status</label>
                  <select value={cfStatus} onChange={(e) => setCfStatus(e.target.value as "draft"|"active"|"archived")} className={inp}>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={submitCourseForm} disabled={cfSaving || !cfSubject || !cfTitle} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl disabled:opacity-50 hover:bg-blue-700">
                  {cfSaving ? "Saving…" : editingCourse ? "Save Changes" : "Create Course"}
                </button>
                <button onClick={() => setShowCourseForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              </div>
            </div>
          )}

          {loading && <p className="text-sm text-gray-400">Loading…</p>}

          {Object.keys(coursesBySubject).length === 0 && !loading && (
            <div className="text-center py-16 text-gray-400">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No courses yet</p>
              <p className="text-sm mt-1">Create your first course to get started</p>
            </div>
          )}

          {Object.entries(coursesBySubject).sort(([a],[b]) => a.localeCompare(b)).map(([subject, list]) => (
            <div key={subject} className="mb-8">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{subject}</p>
              <div className="grid grid-cols-1 gap-3">
                {list.map((c) => (
                  <div key={c.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openCourse(c)}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-gray-900 text-sm">{c.title}</span>
                        <StatusBadge status={c.status} />
                      </div>
                      {c.description && <p className="text-xs text-gray-400 truncate">{c.description}</p>}
                      <div className="flex items-center gap-3 mt-1">
                        {c.gradeLevels.length > 0 && <span className="text-[10px] text-gray-400">Grades {c.gradeLevels.join(", ")}</span>}
                        {c.estimatedHours && <span className="text-[10px] text-gray-400">{c.estimatedHours}h</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => openCourse(c)} className="text-xs text-blue-600 font-medium hover:underline">Open →</button>
                      <button onClick={() => openEditCourseForm(c)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"><Pencil className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODULES VIEW ─────────────────────────────────────────── */}
      {view === "modules" && activeCourse && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{activeCourse.title}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{activeCourse.subject} · {modules.length} module{modules.length !== 1 ? "s" : ""}</p>
            </div>
            <button onClick={openNewModuleForm} className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" /> New Module
            </button>
          </div>

          {/* Module form */}
          {showModuleForm && (
            <div className="mb-5 bg-white border border-blue-100 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">{editingModule ? "Edit Module" : "New Module"}</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Title *</label>
                  <input value={mfTitle} onChange={(e) => setMfTitle(e.target.value)} placeholder="e.g. Algebra & Linear Equations" className={inp} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Est. Weeks</label>
                  <input type="number" value={mfWeeks} onChange={(e) => setMfWeeks(e.target.value)} placeholder="2" className={inp} />
                </div>
              </div>
              <div className="mb-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Description</label>
                <textarea value={mfDesc} onChange={(e) => setMfDesc(e.target.value)} rows={2} placeholder="What skills does this module cover?" className={ta} />
              </div>
              <div className="flex gap-2">
                <button onClick={submitModuleForm} disabled={mfSaving || !mfTitle} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl disabled:opacity-50 hover:bg-blue-700">
                  {mfSaving ? "Saving…" : editingModule ? "Save Changes" : "Create Module"}
                </button>
                <button onClick={() => setShowModuleForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              </div>
            </div>
          )}

          {loading && <p className="text-sm text-gray-400">Loading…</p>}

          {modules.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400">
              <p className="font-medium">No modules yet</p>
              <p className="text-sm mt-1">Add the first module to this course</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {modules.map((m, idx) => (
              <div key={m.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button onClick={() => moveModule(m, "up")} disabled={idx === 0} className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20"><ArrowUp className="w-3 h-3" /></button>
                  <button onClick={() => moveModule(m, "down")} disabled={idx === modules.length - 1} className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20"><ArrowDown className="w-3 h-3" /></button>
                </div>
                <span className="text-[11px] font-bold text-gray-300 w-5 text-center shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openModule(m)}>
                  <p className="font-semibold text-gray-900 text-sm">{m.title}</p>
                  {m.description && <p className="text-xs text-gray-400 truncate">{m.description}</p>}
                  {m.estimatedWeeks && <p className="text-[10px] text-gray-400 mt-0.5">{m.estimatedWeeks} week{m.estimatedWeeks !== 1 ? "s" : ""}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openModule(m)} className="text-xs text-blue-600 font-medium hover:underline">Open →</button>
                  <button onClick={() => openEditModuleForm(m)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeleteModule(m)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LESSONS VIEW ─────────────────────────────────────────── */}
      {view === "lessons" && activeModule && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{activeModule.title}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{lessons.length} lesson{lessons.length !== 1 ? "s" : ""}</p>
            </div>
            <button onClick={openNewLessonForm} className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" /> New Lesson
            </button>
          </div>

          {/* Quick lesson form */}
          {showLessonForm && (
            <div className="mb-5 bg-white border border-blue-100 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">New Lesson</h3>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="col-span-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Title *</label>
                  <input value={nlTitle} onChange={(e) => setNlTitle(e.target.value)} placeholder="e.g. Solving Linear Equations" className={inp} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Difficulty</label>
                  <select value={nlDiff} onChange={(e) => setNlDiff(Number(e.target.value))} className={inp}>
                    {[1,2,3,4,5].map((d) => <option key={d} value={d}>{d} — {DIFF_LABELS[d]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Minutes</label>
                  <input type="number" value={nlMinutes} onChange={(e) => setNlMinutes(Number(e.target.value))} className={inp} />
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-3">Create the lesson, then open it to fill in objectives, notes, and resources.</p>
              <div className="flex gap-2">
                <button onClick={submitNewLesson} disabled={nlSaving || !nlTitle} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl disabled:opacity-50 hover:bg-blue-700">
                  {nlSaving ? "Creating…" : "Create Lesson"}
                </button>
                <button onClick={() => setShowLessonForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              </div>
            </div>
          )}

          {loading && <p className="text-sm text-gray-400">Loading…</p>}

          {lessons.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400">
              <p className="font-medium">No lessons yet</p>
              <p className="text-sm mt-1">Add the first lesson to this module</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {lessons.map((l, idx) => (
              <div key={l.id} className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-sm flex items-center gap-3">
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button onClick={() => moveLesson(l, "up")} disabled={idx === 0} className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20"><ArrowUp className="w-3 h-3" /></button>
                  <button onClick={() => moveLesson(l, "down")} disabled={idx === lessons.length - 1} className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20"><ArrowDown className="w-3 h-3" /></button>
                </div>
                <span className="text-[11px] font-bold text-gray-300 w-5 text-center shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openLesson(l)}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{l.title}</span>
                    <StatusBadge status={l.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${DIFF_COLORS[l.difficulty]}`}>{DIFF_LABELS[l.difficulty]}</span>
                    <span className="text-[10px] text-gray-400">{l.estimatedMinutes} min</span>
                    {l.learningObjectives.length > 0 && <span className="text-[10px] text-gray-400">{l.learningObjectives.length} objective{l.learningObjectives.length !== 1 ? "s" : ""}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openLesson(l)} className="text-xs text-blue-600 font-medium hover:underline">Edit →</button>
                  <button onClick={() => handleDeleteLesson(l)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LESSON EDITOR VIEW ───────────────────────────────────── */}
      {view === "lesson" && activeLesson && (
        <div>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{activeLesson.title}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{activeCourse?.subject} · {activeModule?.title}</p>
            </div>
            <div className="flex items-center gap-2">
              {lfSaved && <span className="text-sm text-emerald-600 font-medium">Saved ✓</span>}
              <button onClick={saveLessonEdits} disabled={lfSaving} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl disabled:opacity-50 hover:bg-blue-700">
                {lfSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Left: lesson fields */}
            <div className="col-span-2 flex flex-col gap-4">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Lesson Details</p>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Title</label>
                    <input value={lfTitle} onChange={(e) => setLfTitle(e.target.value)} className={inp} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Description</label>
                    <textarea value={lfDesc} onChange={(e) => setLfDesc(e.target.value)} rows={2} placeholder="What is this lesson about?" className={ta} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Difficulty</label>
                      <select value={lfDiff} onChange={(e) => setLfDiff(Number(e.target.value))} className={inp}>
                        {[1,2,3,4,5].map((d) => <option key={d} value={d}>{d} — {DIFF_LABELS[d]}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Minutes</label>
                      <input type="number" value={lfMinutes} onChange={(e) => setLfMinutes(Number(e.target.value))} className={inp} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Status</label>
                      <select value={lfStatus} onChange={(e) => setLfStatus(e.target.value as "draft"|"active"|"archived")} className={inp}>
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Learning Objectives */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Learning Objectives</p>
                  <button onClick={() => setLfObjs((prev) => [...prev, ""])} className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"><Plus className="w-3 h-3" />Add</button>
                </div>
                <p className="text-xs text-gray-400 mb-3">By the end of this lesson, the student can…</p>
                <div className="flex flex-col gap-2">
                  {lfObjs.map((obj, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-gray-300 font-bold w-4 shrink-0">{i + 1}.</span>
                      <input value={obj} onChange={(e) => { const next = [...lfObjs]; next[i] = e.target.value; setLfObjs(next); }} placeholder={`Objective ${i + 1}`} className={`${inp} flex-1`} />
                      {lfObjs.length > 1 && (
                        <button onClick={() => setLfObjs((prev) => prev.filter((_, j) => j !== i))} className="p-1 text-gray-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Tutor Notes</p>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Common Mistakes</label>
                    <textarea value={lfMistakes} onChange={(e) => setLfMistakes(e.target.value)} rows={3} placeholder="What do students typically get wrong?" className={ta} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Tutor Notes</label>
                    <textarea value={lfTutorNotes} onChange={(e) => setLfTutorNotes(e.target.value)} rows={3} placeholder="Teaching tips, pacing advice, whiteboard suggestions…" className={ta} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">AI Notes</label>
                    <textarea value={lfAiNotes} onChange={(e) => setLfAiNotes(e.target.value)} rows={2} placeholder="Instructions for AI when generating curriculum from this lesson…" className={ta} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: resources */}
            <div className="flex flex-col gap-4">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Resources</p>
                  <button onClick={() => { setShowResForm((v) => !v); setRfLabel(""); setRfUrl(""); setRfType("slides"); }} className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"><Plus className="w-3 h-3" />Add</button>
                </div>

                {showResForm && (
                  <div className="mb-4 border border-blue-100 rounded-xl p-3 bg-blue-50/30">
                    <div className="flex flex-col gap-2">
                      <select value={rfType} onChange={(e) => setRfType(e.target.value as ResourceType)} className={inp}>
                        {RESOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <input value={rfLabel} onChange={(e) => setRfLabel(e.target.value)} placeholder="Label (e.g. Lesson Slides)" className={inp} />
                      <input value={rfUrl} onChange={(e) => setRfUrl(e.target.value)} placeholder="URL or link" className={inp} />
                      <div className="flex gap-2">
                        <button onClick={submitResource} disabled={rfSaving || !rfLabel || !rfUrl} className="flex-1 py-1.5 bg-blue-600 text-white text-xs rounded-lg disabled:opacity-50">
                          {rfSaving ? "Adding…" : "Add"}
                        </button>
                        <button onClick={() => setShowResForm(false)} className="px-3 text-xs text-gray-500">Cancel</button>
                      </div>
                    </div>
                  </div>
                )}

                {resources.length === 0 && !showResForm && (
                  <p className="text-xs text-gray-400 text-center py-4">No resources yet</p>
                )}

                <div className="flex flex-col gap-2">
                  {resources.map((r) => (
                    <div key={r.id} className="flex items-center gap-2 group">
                      <ResourceIcon type={r.type} />
                      <div className="flex-1 min-w-0">
                        <a href={r.url ?? "#"} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-gray-700 hover:text-blue-600 truncate block">{r.label}</a>
                        <span className="text-[10px] text-gray-400">{RESOURCE_TYPES.find((t) => t.value === r.type)?.label}</span>
                      </div>
                      <button onClick={() => handleDeleteResource(r.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-opacity">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick stats card */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Lesson Info</p>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Difficulty</span>
                    <span className={`font-semibold px-1.5 py-0.5 rounded-md text-[10px] ${DIFF_COLORS[lfDiff]}`}>{DIFF_LABELS[lfDiff]}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Duration</span>
                    <span className="font-medium text-gray-700">{lfMinutes} min</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Objectives</span>
                    <span className="font-medium text-gray-700">{lfObjs.filter(Boolean).length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Resources</span>
                    <span className="font-medium text-gray-700">{resources.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Status</span>
                    <StatusBadge status={lfStatus} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
