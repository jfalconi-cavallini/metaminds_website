"use client";

import React, { useState, useEffect } from "react";
import { Check, ChevronRight, Loader2, X } from "lucide-react";
import type { Course, CourseCatalogFull, CatalogSection, CatalogCategory, Lesson, LessonResource } from "@/lib/portal/types";
import { insertLesson, insertLessonResource, updateLesson, fetchFullCatalog, fetchLessonResources } from "@/lib/portal/db";
import ResourceSlot, { RESOURCE_ORDER, RESOURCE_LABELS } from "./ResourceSlot";

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { id: 0, label: "Lesson Information" },
  { id: 1, label: "Lesson Package" },
  { id: 2, label: "Lesson Metadata" },
  { id: 3, label: "Review & Submit" },
];

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Beginner", 2: "Intermediate", 3: "Standard", 4: "Advanced", 5: "Expert",
};

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  courses: Course[];
  defaultCourseId?: number | null;
  onComplete: (lessonId: number) => void;
  onCancel: () => void;
}

export default function LessonWizard({ courses, defaultCourseId, onComplete, onCancel }: Props) {
  const [step, setStep] = useState(0);

  // ── Step 1: Lesson Information ──
  const [courseId,    setCourseId]    = useState<number | "">(defaultCourseId ?? (courses[0]?.id ?? ""));
  const [sectionId,   setSectionId]   = useState<number | "">("");
  const [categoryId,  setCategoryId]  = useState<number | "">("");
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [difficulty,  setDifficulty]  = useState(2);
  const [minutes,     setMinutes]     = useState(60);
  const [tags,        setTags]        = useState<string[]>([]);
  const [tagInput,    setTagInput]    = useState("");
  const [objectives,  setObjectives]  = useState<string[]>([""]);

  // Cascade data
  const [sections,   setSections]   = useState<CatalogSection[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);

  // ── Step 2: resources (after lesson created) ──
  const [createdLesson,  setCreatedLesson]  = useState<Lesson | null>(null);
  const [resources,      setResources]      = useState<LessonResource[]>([]);
  const [savingStep1,    setSavingStep1]    = useState(false);

  // ── Step 3: Metadata ──
  const [commonMistakes, setCommonMistakes] = useState("");
  const [tutorNotes,     setTutorNotes]     = useState("");
  const [desmosUsage,    setDesmosUsage]    = useState("");
  const [prerequisites,  setPrerequisites]  = useState("");
  const [followUp,       setFollowUp]       = useState("");
  const [hwMinutes,      setHwMinutes]      = useState<number | "">(30);
  const [aiNotes,        setAiNotes]        = useState("");
  const [savingStep3,    setSavingStep3]    = useState(false);

  // ── Step 4 ──
  const [submitting, setSubmitting] = useState(false);

  // Load sections when course changes
  useEffect(() => {
    if (!courseId) return;
    setLoadingTree(true);
    setSectionId(""); setCategoryId(""); setSections([]); setCategories([]);
    fetchFullCatalog(Number(courseId))
      .then((cat) => { setSections(cat.sections); })
      .catch(console.error)
      .finally(() => setLoadingTree(false));
  }, [courseId]);

  // Load categories when section changes
  useEffect(() => {
    if (!sectionId) { setCategories([]); setCategoryId(""); return; }
    const sec = sections.find((s) => s.id === Number(sectionId));
    setCategories(sec?.categories ?? []);
    setCategoryId("");
  }, [sectionId, sections]);

  // ── Tag handling ──
  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  // ── Step 1 → create lesson + slots ──
  async function handleNextFromInfo() {
    if (!title.trim() || !categoryId) return;
    setSavingStep1(true);
    try {
      const lesson = await insertLesson({
        moduleId:          Number(categoryId),
        title:             title.trim(),
        description:       description || undefined,
        difficulty,
        estimatedMinutes:  minutes,
        tags,
        learningObjectives: objectives.filter(Boolean),
        status:            "draft",
      });
      // Create all 8 resource slots
      const slots = await Promise.all(
        RESOURCE_ORDER.map((type, i) =>
          insertLessonResource({
            lessonId: lesson.id,
            type,
            label:    RESOURCE_LABELS[type],
            position: i,
          })
        )
      );
      setCreatedLesson(lesson);
      setResources(slots);
      setStep(1);
    } catch (e) { console.error(e); }
    finally { setSavingStep1(false); }
  }

  // ── Resource update callback (Step 2) ──
  function handleResourceUpdate(updated: LessonResource) {
    setResources((prev) => prev.map((r) => r.id === updated.id ? updated : r));
  }

  // ── Step 3 → save metadata ──
  async function handleNextFromMetadata() {
    if (!createdLesson) return;
    setSavingStep3(true);
    try {
      await updateLesson(createdLesson.id, {
        commonMistakes: commonMistakes || undefined,
        tutorNotes:     tutorNotes     || undefined,
        desmosUsage:    desmosUsage    || undefined,
        prerequisites:  prerequisites  || undefined,
        followUp:       followUp       || undefined,
        hwMinutes:      hwMinutes !== "" ? Number(hwMinutes) : undefined,
        aiNotes:        aiNotes        || undefined,
      });
      setStep(3);
    } catch (e) { console.error(e); }
    finally { setSavingStep3(false); }
  }

  // ── Step 4 → submit for review ──
  async function handleSubmit(targetStatus: "in_review" | "active") {
    if (!createdLesson) return;
    setSubmitting(true);
    try {
      await updateLesson(createdLesson.id, { status: targetStatus });
      onComplete(createdLesson.id);
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  }

  // ── Checklist for Step 4 ──
  const readyResources  = resources.filter((r) => r.url).length;
  const totalResources  = resources.length;
  const checklist = [
    { label: "Lesson title",         done: !!title.trim() },
    { label: "Course & category",    done: !!(courseId && categoryId) },
    { label: "Description",          done: !!description.trim() },
    { label: "Learning objectives",  done: objectives.filter(Boolean).length > 0 },
    { label: "At least one resource uploaded", done: readyResources > 0 },
    { label: "Lesson Deck ready",    done: resources.some((r) => r.type === "lesson_deck" && r.url) },
    { label: "Answer Key ready",     done: resources.some((r) => r.type === "answer_key" && r.url) },
    { label: "Mastery Check ready",  done: resources.some((r) => r.type === "mastery_check" && r.url) },
  ];
  const completionPct = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Create New Lesson</h1>
            <p className="text-xs text-gray-400 mt-0.5">Build a complete lesson package for the curriculum library</p>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                step === s.id ? "bg-blue-600 text-white" : step > s.id ? "text-blue-600" : "text-gray-400"
              }`} onClick={() => { if (createdLesson && s.id <= step) setStep(s.id); }}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  step > s.id ? "bg-blue-100 text-blue-600" : step === s.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"
                }`}>
                  {step > s.id ? <Check className="w-3 h-3" /> : s.id + 1}
                </div>
                <span className="text-xs font-medium whitespace-nowrap">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Step 0: Lesson Information ── */}
        {step === 0 && (
          <div className="p-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-5 gap-6">
              {/* Left: placement */}
              <div className="col-span-3 space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Course</label>
                  {loadingTree
                    ? <div className="h-9 rounded-xl bg-gray-100 animate-pulse" />
                    : <select value={courseId} onChange={(e) => setCourseId(Number(e.target.value))}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {courses.map((c) => <option key={c.id} value={c.id}>{c.subject} — {c.title}</option>)}
                      </select>
                  }
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Section</label>
                    <select value={sectionId} onChange={(e) => setSectionId(Number(e.target.value) || "")}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select section…</option>
                      {sections.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Category</label>
                    <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value) || "")}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!sectionId}>
                      <option value="">Select category…</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Short Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="What will students learn? Describe the lesson scope and context…"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Learning Objectives</label>
                  <div className="space-y-2">
                    {objectives.map((obj, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-blue-500 font-bold text-sm mt-2 shrink-0">·</span>
                        <input
                          value={obj}
                          onChange={(e) => { const n = [...objectives]; n[i] = e.target.value; setObjectives(n); }}
                          placeholder={`Objective ${i + 1}`}
                          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {objectives.length > 1 && (
                          <button onClick={() => setObjectives(objectives.filter((_, j) => j !== i))}
                            className="text-gray-300 hover:text-red-400 mt-2 text-xs">✕</button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => setObjectives([...objectives, ""])}
                      className="text-xs text-blue-600 hover:underline font-medium ml-4">+ Add objective</button>
                  </div>
                </div>
              </div>

              {/* Right: details */}
              <div className="col-span-2 space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Lesson Title <span className="text-red-400">*</span></label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Text Structure and Purpose"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Difficulty</label>
                    <select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {[1,2,3,4,5].map((n) => <option key={n} value={n}>{DIFFICULTY_LABELS[n]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Est. Time (min)</label>
                    <input type="number" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} min={5} step={5}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tags</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tags.map((t) => (
                      <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs">
                        {t}
                        <button onClick={() => setTags(tags.filter((x) => x !== t))} className="text-blue-400 hover:text-blue-700 leading-none">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                      placeholder="Add tag, press Enter"
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={addTag} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-600">Add</button>
                  </div>
                </div>

                {/* Status note */}
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-0.5">Will be saved as Draft</p>
                  <p className="text-[10px] text-amber-600">You can submit for review after completing all 4 steps.</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between mt-8 pt-5 border-t border-gray-100">
              <button onClick={onCancel} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleNextFromInfo}
                disabled={!title.trim() || !categoryId || savingStep1}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
              >
                {savingStep1 ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Next: Lesson Package
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Lesson Package ── */}
        {step === 1 && createdLesson && (
          <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-5">
              <h2 className="text-base font-bold text-gray-900 mb-1">Build the Lesson Package</h2>
              <p className="text-sm text-gray-400">Upload files for each resource slot. You can use Google Drive links, Canva links, or upload PDFs directly. Resources can be replaced at any time.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Left: In-Class materials */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">In-Class Materials</p>
                </div>
                {(["lesson_deck", "guided_practice", "tutor_guide"] as const).map((type) => {
                  const res = resources.find((r) => r.type === type);
                  if (!res) return null;
                  return <ResourceSlot key={type} resource={res} isBuilder onUpdate={handleResourceUpdate} />;
                })}
              </div>

              {/* Right: Homework + Assessment */}
              <div className="space-y-4">
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Homework</p>
                  </div>
                  {(["homework_l1", "homework_l2", "homework_l3"] as const).map((type) => {
                    const res = resources.find((r) => r.type === type);
                    if (!res) return null;
                    return <ResourceSlot key={type} resource={res} isBuilder onUpdate={handleResourceUpdate} />;
                  })}
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reference & Assessment</p>
                  </div>
                  {(["answer_key", "mastery_check"] as const).map((type) => {
                    const res = resources.find((r) => r.type === type);
                    if (!res) return null;
                    return <ResourceSlot key={type} resource={res} isBuilder onUpdate={handleResourceUpdate} />;
                  })}
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-4 bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <p className="text-xs font-medium text-gray-700">Package Completion</p>
                  <p className="text-xs text-gray-400">{resources.filter((r) => r.url).length} / {resources.length} files</p>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${resources.length > 0 ? (resources.filter((r) => r.url).length / resources.length) * 100 : 0}%` }} />
                </div>
              </div>
              <p className="text-xs text-gray-400 shrink-0">You can add files later</p>
            </div>

            <div className="flex justify-between mt-6 pt-5 border-t border-gray-100">
              <button onClick={() => setStep(0)} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">
                ← Back
              </button>
              <button onClick={() => setStep(2)} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                Next: Lesson Metadata
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Lesson Metadata ── */}
        {step === 2 && (
          <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-5">
              <h2 className="text-base font-bold text-gray-900 mb-1">Lesson Metadata</h2>
              <p className="text-sm text-gray-400">These notes help tutors deliver the lesson effectively and power AI recommendations.</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <MetaTextarea label="Common Student Mistakes" hint="What do students typically struggle with or misunderstand?"
                  value={commonMistakes} onChange={setCommonMistakes} rows={4} />
                <MetaTextarea label="Teaching Notes" hint="Pacing tips, key explanations to emphasize, class flow."
                  value={tutorNotes} onChange={setTutorNotes} rows={4} />
                <MetaTextarea label="Recommended Desmos Usage" hint="Specific activities, links, or techniques."
                  value={desmosUsage} onChange={setDesmosUsage} rows={3} />
                <MetaTextarea label="Prerequisite Knowledge" hint="What should students already understand before this lesson?"
                  value={prerequisites} onChange={setPrerequisites} rows={3} />
              </div>

              <div className="space-y-4">
                <MetaTextarea label="Recommended Follow-up Lessons" hint="What should students study next? List lesson names or topics."
                  value={followUp} onChange={setFollowUp} rows={3} />

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Estimated Homework Time (min)</label>
                  <input type="number" value={hwMinutes} onChange={(e) => setHwMinutes(e.target.value === "" ? "" : Number(e.target.value))}
                    min={0} step={5} placeholder="30"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <p className="text-[10px] text-gray-400 mt-1">Separate from in-class time ({minutes} min)</p>
                </div>

                <MetaTextarea label="AI Notes" hint="Internal notes for AI-powered lesson recommendations. Students won't see this."
                  value={aiNotes} onChange={setAiNotes} rows={5} />
              </div>
            </div>

            <div className="flex justify-between mt-8 pt-5 border-t border-gray-100">
              <button onClick={() => setStep(1)} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">
                ← Back
              </button>
              <button onClick={handleNextFromMetadata} disabled={savingStep3}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40">
                {savingStep3 ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Next: Review & Submit
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Review & Submit ── */}
        {step === 3 && createdLesson && (
          <div className="p-6 max-w-3xl mx-auto">
            <div className="mb-5">
              <h2 className="text-base font-bold text-gray-900 mb-1">Review & Submit</h2>
              <p className="text-sm text-gray-400">Check that everything is in order before submitting for admin review and publishing.</p>
            </div>

            {/* Completion score */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-800">Completion Score</p>
                <span className={`text-lg font-bold ${completionPct >= 75 ? "text-emerald-600" : completionPct >= 50 ? "text-amber-500" : "text-red-500"}`}>
                  {completionPct}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div className={`h-full rounded-full transition-all ${completionPct >= 75 ? "bg-emerald-500" : completionPct >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                  style={{ width: `${completionPct}%` }} />
              </div>
              <div className="space-y-2">
                {checklist.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${item.done ? "bg-emerald-100" : "bg-gray-100"}`}>
                      {item.done
                        ? <Check className="w-2.5 h-2.5 text-emerald-600" />
                        : <span className="w-1.5 h-1.5 rounded-full bg-gray-300 block" />
                      }
                    </div>
                    <span className={`text-xs ${item.done ? "text-gray-700" : "text-gray-400"}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary card */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Lesson Summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Title</span>
                  <span className="font-medium text-gray-800">{title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Difficulty</span>
                  <span className="font-medium text-gray-800">{DIFFICULTY_LABELS[difficulty]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Class time</span>
                  <span className="font-medium text-gray-800">{minutes} min</span>
                </div>
                {hwMinutes !== "" && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Homework time</span>
                    <span className="font-medium text-gray-800">{hwMinutes} min</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Resources</span>
                  <span className="font-medium text-gray-800">{readyResources} / {totalResources} ready</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Objectives</span>
                  <span className="font-medium text-gray-800">{objectives.filter(Boolean).length}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-5 border-t border-gray-100">
              <button onClick={() => setStep(2)} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">
                ← Back
              </button>
              <div className="flex gap-3">
                <button onClick={() => handleSubmit("active")} disabled={submitting}
                  className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-40">
                  Save as Draft
                </button>
                <button onClick={() => handleSubmit("in_review")} disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Submit for Review
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function MetaTextarea({ label, hint, value, onChange, rows }: {
  label: string; hint: string; value: string;
  onChange: (v: string) => void; rows?: number;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</label>
      <p className="text-[10px] text-gray-400 mb-2">{hint}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows ?? 3}
        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
