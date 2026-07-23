"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Check } from "lucide-react";
import type {
  Course, CourseCatalogFull, StudentPlanFull,
  PlanSectionScores, SkillBaseline, ConsultationNotes, CategoryBaseline,
} from "@/lib/portal/types";
import { fetchFullCatalog, fetchStudentPlanFull, insertStudentPlan } from "@/lib/portal/db";
import { getSubskills, scoreToStatus, STATUS_DOT, STATUS_LABEL, ACT_SECTIONS } from "@/lib/portal/planConfig";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  courses: Course[];
  defaultCourseId: number | null;
  tutorId: number;
  studentId: number;
  onComplete: (plan: StudentPlanFull, catalog: CourseCatalogFull) => void;
  onCancel: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isSAT(course: Course | undefined) {
  return course?.title?.toLowerCase().includes("sat") ?? true;
}

function ScoreButton({ value, current, onClick }: { value: number; current: number | undefined; onClick: () => void }) {
  const selected = current === value;
  const status = scoreToStatus(selected ? value : undefined);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-7 h-7 rounded-full text-xs font-bold border-2 transition-all ${
        selected
          ? `${STATUS_DOT[status]} border-transparent text-white`
          : "bg-white border-gray-200 text-gray-400 hover:border-blue-300"
      }`}
    >
      {value}
    </button>
  );
}

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      {Array.from({ length: total }, (_, i) => (
        <React.Fragment key={i}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
            i + 1 < step
              ? "bg-blue-600 border-blue-600 text-white"
              : i + 1 === step
                ? "bg-white border-blue-600 text-blue-600"
                : "bg-white border-gray-200 text-gray-300"
          }`}>
            {i + 1 < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`flex-1 h-0.5 rounded-full ${i + 1 < step ? "bg-blue-600" : "bg-gray-200"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export default function PlanWizard({ courses, defaultCourseId, tutorId, studentId, onComplete, onCancel }: Props) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Catalog for the selected course
  const [catalog, setCatalog] = useState<CourseCatalogFull | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Step 1 state
  const [courseId,        setCourseId]        = useState<number>(defaultCourseId ?? courses[0]?.id ?? 0);
  const [title,           setTitle]           = useState("");
  const [startingScore,   setStartingScore]   = useState("");
  const [targetScore,     setTargetScore]     = useState("");
  const [targetDate,      setTargetDate]      = useState("");
  const [sessionsPerWeek, setSessionsPerWeek] = useState("2");
  const [studyMinutes,    setStudyMinutes]    = useState("120");

  // Step 2 state
  const [sectionScores, setSectionScores] = useState<Record<string, string>>({});

  // Step 3 state — skillBaseline[categoryId][subskillOrSelf]
  const [skillBaseline, setSkillBaseline] = useState<SkillBaseline>({});
  const [expandedCats,  setExpandedCats]  = useState<Set<string>>(new Set());
  const [skillNotes,    setSkillNotes]    = useState<Record<string, string>>({});

  // Step 4 state
  const [strengths,           setStrengths]           = useState("");
  const [weaknesses,          setWeaknesses]          = useState("");
  const [scheduleConstraints, setScheduleConstraints] = useState("");
  const [commitment,          setCommitment]          = useState("");
  const [recommendation,      setRecommendation]      = useState("");
  const [firstMilestone,      setFirstMilestone]      = useState("");

  // Auto-set title when course changes
  useEffect(() => {
    const c = courses.find(c2 => c2.id === courseId);
    if (c && !title) setTitle(`${c.title} — Learning Plan`);
  }, [courseId, courses, title]);

  // Load catalog when courseId changes
  useEffect(() => {
    if (!courseId) return;
    setLoadingCatalog(true);
    setCatalog(null);
    fetchFullCatalog(courseId)
      .then(setCatalog)
      .catch(console.error)
      .finally(() => setLoadingCatalog(false));
  }, [courseId]);

  const selectedCourse = courses.find(c => c.id === courseId);
  const sat = isSAT(selectedCourse);

  function setSubskillScore(catId: string, subskill: string, score: number | undefined) {
    setSkillBaseline(prev => {
      const cat: CategoryBaseline = prev[catId] ?? { subskills: {} };
      const updated: CategoryBaseline = {
        ...cat,
        subskills: {
          ...cat.subskills,
          [subskill]: { ...cat.subskills[subskill], score },
        },
      };
      return { ...prev, [catId]: updated };
    });
  }

  function setCatScore(catId: string, score: number | undefined) {
    setSkillBaseline(prev => {
      const cat: CategoryBaseline = prev[catId] ?? { subskills: {} };
      return { ...prev, [catId]: { ...cat, score } };
    });
  }

  async function handleSubmit() {
    if (!courseId || !title.trim()) { setError("Course and title are required."); return; }
    setSubmitting(true); setError("");
    try {
      const scores: PlanSectionScores = {};
      if (sat) {
        if (sectionScores.rw)   scores.rw   = Number(sectionScores.rw);
        if (sectionScores.math) scores.math  = Number(sectionScores.math);
      } else {
        for (const { key } of ACT_SECTIONS) {
          if (sectionScores[key]) (scores as any)[key] = Number(sectionScores[key]);
        }
      }

      const notes: ConsultationNotes = {
        strengths:           strengths           || undefined,
        weaknesses:          weaknesses          || undefined,
        scheduleConstraints: scheduleConstraints || undefined,
        studentCommitment:   commitment          || undefined,
        tutorRecommendation: recommendation      || undefined,
        firstMilestone:      firstMilestone      || undefined,
      };

      // Strip empty entries from skillBaseline
      const cleanBaseline: SkillBaseline = {};
      for (const [catId, entry] of Object.entries(skillBaseline)) {
        const hasData = entry.score !== undefined
          || Object.values(entry.subskills).some(s => s.score !== undefined);
        if (hasData) cleanBaseline[catId] = entry;
      }

      const startNum = startingScore ? Number(startingScore) : undefined;
      const targNum  = targetScore   ? Number(targetScore)   : undefined;

      const plan = await insertStudentPlan({
        studentId:           studentId,
        tutorId:             tutorId,
        courseId:            courseId,
        title:               title.trim(),
        startingScore:       startNum,
        currentScore:        startNum,
        targetScore:         targNum,
        targetDate:          targetDate || undefined,
        sessionsPerWeek:     sessionsPerWeek ? Number(sessionsPerWeek) : undefined,
        studyMinutesPerWeek: studyMinutes    ? Number(studyMinutes)    : undefined,
        sectionScores:       Object.keys(scores).length > 0 ? scores : undefined,
        skillBaseline:       Object.keys(cleanBaseline).length > 0 ? cleanBaseline : undefined,
        consultationNotes:   Object.values(notes).some(Boolean) ? notes : undefined,
      });

      const [full, cat] = await Promise.all([
        fetchStudentPlanFull(studentId, plan.courseId),
        fetchFullCatalog(plan.courseId),
      ]);
      if (!full) throw new Error("Failed to load created plan");
      onComplete(full, cat);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create plan");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Step renderers ────────────────────────────────────────────────────────

  function renderStep1() {
    return (
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Course</label>
          <select
            value={courseId}
            onChange={e => { setCourseId(Number(e.target.value)); setTitle(""); }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            {courses.length === 0 && <option value="">No courses available</option>}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">Plan Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. SAT Prep — Fall 2026"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Starting Composite Score</label>
            <input
              type="number"
              value={startingScore}
              onChange={e => setStartingScore(e.target.value)}
              placeholder={sat ? "e.g. 1200" : "e.g. 22"}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Goal Score</label>
            <input
              type="number"
              value={targetScore}
              onChange={e => setTargetScore(e.target.value)}
              placeholder={sat ? "e.g. 1500" : "e.g. 30"}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">Target Test Date</label>
          <input
            type="date"
            value={targetDate}
            onChange={e => setTargetDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Sessions / week</label>
            <input
              type="number"
              value={sessionsPerWeek}
              onChange={e => setSessionsPerWeek(e.target.value)}
              min={1} max={7}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Study goal (min / week)</label>
            <input
              type="number"
              value={studyMinutes}
              onChange={e => setStudyMinutes(e.target.value)}
              step={30} min={0}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    );
  }

  function renderStep2() {
    const fields = sat
      ? [{ key: "rw", label: "Reading & Writing", max: 800 }, { key: "math", label: "Math", max: 800 }]
      : ACT_SECTIONS.map(s => ({ ...s }));

    const total = sat
      ? (Number(sectionScores.rw ?? 0) + Number(sectionScores.math ?? 0)) || null
      : null;

    return (
      <div className="space-y-3">
        <p className="text-xs text-gray-500">Enter the student&apos;s starting scores for each section.</p>
        {fields.map(f => (
          <div key={f.key} className="flex items-center gap-3">
            <label className="text-sm text-gray-700 w-40 shrink-0">{f.label}</label>
            <input
              type="number"
              value={sectionScores[f.key] ?? ""}
              onChange={e => setSectionScores(prev => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={sat ? `/ ${f.max}` : `/ ${f.max}`}
              min={sat ? 200 : 1} max={f.max}
              className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
        {sat && total !== null && total > 0 && (
          <p className="text-xs text-gray-400 pt-1">
            Total: <span className="font-semibold text-gray-700">{total}</span> / 1600
          </p>
        )}
        <p className="text-[10px] text-gray-400 pt-1">Optional — skip if not yet available.</p>
      </div>
    );
  }

  function renderStep3() {
    if (loadingCatalog) {
      return <div className="py-8 text-center text-sm text-gray-400">Loading skills…</div>;
    }
    if (!catalog || catalog.sections.length === 0) {
      return <p className="text-sm text-gray-400">No catalog loaded for this course. You can assess skills later.</p>;
    }

    const allCategories = catalog.sections.flatMap(s => s.categories);

    return (
      <div className="space-y-2">
        <p className="text-xs text-gray-500 mb-3">
          Rate each skill 0–6 or leave as Not Assessed. You can fill this in later.
        </p>
        <div className="text-[10px] flex gap-4 text-gray-400 mb-3 flex-wrap">
          {(["needs-attention", "developing", "proficient", "strong"] as const).map(s => (
            <span key={s} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} />
              {STATUS_LABEL[s]}
            </span>
          ))}
        </div>

        {allCategories.map(cat => {
          const catId = String(cat.id);
          const subskills = getSubskills(cat.title);
          const isExpanded = expandedCats.has(catId);
          const catEntry = skillBaseline[catId];
          const hasData = catEntry?.score !== undefined
            || Object.values(catEntry?.subskills ?? {}).some(s => s.score !== undefined);
          const status = scoreToStatus(catEntry?.score);

          return (
            <div key={cat.id} className="border border-gray-100 rounded-xl overflow-hidden">
              {/* Category row */}
              <div
                className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => setExpandedCats(prev => {
                  const next = new Set(prev);
                  if (next.has(catId)) next.delete(catId); else next.add(catId);
                  return next;
                })}
              >
                {isExpanded
                  ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  : <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                }
                <span className={`text-sm font-semibold flex-1 truncate ${hasData ? "text-gray-800" : "text-gray-500"}`}>
                  {cat.title}
                </span>
                {catEntry?.score !== undefined && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_DOT[status]} text-white`}>
                    {catEntry.score}
                  </span>
                )}
              </div>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-3 bg-gray-50/50">
                  {/* Category-level score */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-gray-500 w-28 shrink-0">Overall</span>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4, 5, 6].map(v => (
                        <ScoreButton
                          key={v} value={v} current={catEntry?.score}
                          onClick={() => setCatScore(catId, catEntry?.score === v ? undefined : v)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Subskills */}
                  {subskills.length > 0 && (
                    <div className="space-y-2 pl-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subskills</p>
                      {subskills.map(skill => {
                        const entry = catEntry?.subskills?.[skill];
                        const st = scoreToStatus(entry?.score);
                        return (
                          <div key={skill} className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-44 shrink-0 truncate" title={skill}>{skill}</span>
                            <div className="flex gap-1">
                              {[0, 1, 2, 3, 4, 5, 6].map(v => (
                                <ScoreButton
                                  key={v} value={v} current={entry?.score}
                                  onClick={() => setSubskillScore(catId, skill, entry?.score === v ? undefined : v)}
                                />
                              ))}
                            </div>
                            {entry?.score !== undefined && (
                              <span className={`text-[10px] font-semibold ml-1 shrink-0 ${
                                st === "needs-attention" ? "text-red-500"
                                : st === "developing"    ? "text-amber-500"
                                : st === "proficient"    ? "text-blue-500"
                                : "text-emerald-500"
                              }`}>
                                {STATUS_LABEL[st]}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function renderStep4() {
    const fields: Array<{ label: string; value: string; set: (v: string) => void; multi?: boolean; placeholder?: string }> = [
      { label: "Main Strengths",        value: strengths,           set: setStrengths,           multi: true,  placeholder: "What is this student already good at?" },
      { label: "Main Weaknesses",       value: weaknesses,          set: setWeaknesses,          multi: true,  placeholder: "Which areas need the most work?" },
      { label: "Schedule Constraints",  value: scheduleConstraints, set: setScheduleConstraints, multi: false, placeholder: "e.g. busy weekends, sports season ends in Nov" },
      { label: "Student Commitment",    value: commitment,          set: setCommitment,          multi: false, placeholder: "e.g. high — self-motivated, practices daily" },
      { label: "Tutor Recommendation",  value: recommendation,      set: setRecommendation,      multi: true,  placeholder: "What is your overall recommendation?" },
      { label: "First Milestone",       value: firstMilestone,      set: setFirstMilestone,      multi: false, placeholder: "e.g. Score 1300 by October diagnostic" },
    ];

    return (
      <div className="space-y-3">
        <p className="text-xs text-gray-500 mb-1">Capture your intake notes. All fields are optional.</p>
        {fields.map(f => (
          <div key={f.label}>
            <label className="text-xs text-gray-500 block mb-1">{f.label}</label>
            {f.multi
              ? <textarea
                  value={f.value}
                  onChange={e => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              : <input
                  type="text"
                  value={f.value}
                  onChange={e => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            }
          </div>
        ))}
      </div>
    );
  }

  const STEP_TITLES = ["Plan Basics", "Section Scores", "Skill Baseline", "Consultation Notes"];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-900">{STEP_TITLES[step - 1]}</p>
        <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
      </div>

      <StepDots step={step} total={4} />

      <div className="max-h-[60vh] overflow-y-auto pr-1">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex items-center gap-2 pt-1">
        {step > 1 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium"
          >
            ← Back
          </button>
        )}
        <div className="flex-1" />
        {step === 3 && (
          <button
            onClick={() => setStep(4)}
            className="text-sm text-gray-400 hover:text-gray-600 font-medium px-2"
          >
            Skip
          </button>
        )}
        {step < 4 ? (
          <button
            onClick={() => {
              if (step === 1 && !courseId) { setError("Please select a course."); return; }
              if (step === 1 && !title.trim()) { setError("Plan title is required."); return; }
              setError("");
              setStep(s => s + 1);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Creating…" : <><Check className="w-4 h-4" /> Create Plan</>}
          </button>
        )}
      </div>
    </div>
  );
}
