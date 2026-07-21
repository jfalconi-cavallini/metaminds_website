"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Loader2, ChevronRight, Check, ExternalLink } from "lucide-react";
import type { Course, CourseCatalogFull, LessonPackage } from "@/lib/portal/types";
import { fetchCourses, fetchFullCatalog, fetchLessonPackage } from "@/lib/portal/db";
import CourseTree from "./CourseTree";
import ResourceSlot, { RESOURCE_ORDER } from "./ResourceSlot";

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Beginner", 2: "Intermediate", 3: "Standard", 4: "Advanced", 5: "Expert",
};

const STATUS_COLORS: Record<string, string> = {
  draft:     "bg-amber-100 text-amber-700",
  in_review: "bg-blue-100 text-blue-700",
  active:    "bg-emerald-100 text-emerald-700",
  archived:  "bg-gray-100 text-gray-400",
};

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

export default function CourseLibrary() {
  const [courses,        setCourses]        = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<number | null>(null);
  const [catalog,        setCatalog]        = useState<CourseCatalogFull | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
  const [lessonPkg,      setLessonPkg]      = useState<LessonPackage | null>(null);
  const [loadingLesson,  setLoadingLesson]  = useState(false);

  useEffect(() => {
    // Only show published lessons in the library
    fetchCourses({ all: false }).then((cs) => {
      setCourses(cs);
      if (cs.length > 0) setActiveCourseId(cs[0].id);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!activeCourseId) return;
    setLoadingCatalog(true);
    setCatalog(null); setActiveLessonId(null); setLessonPkg(null);
    fetchFullCatalog(activeCourseId)
      .then(setCatalog)
      .catch(console.error)
      .finally(() => setLoadingCatalog(false));
  }, [activeCourseId]);

  useEffect(() => {
    if (!activeLessonId) return;
    setLoadingLesson(true); setLessonPkg(null);
    fetchLessonPackage(activeLessonId)
      .then(setLessonPkg)
      .catch(console.error)
      .finally(() => setLoadingLesson(false));
  }, [activeLessonId]);

  const breadcrumb = catalog && activeLessonId ? findBreadcrumb(catalog, activeLessonId) : null;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-gray-900">Course Library</h1>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">| BROWSE</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left: tree — read-only (no add lesson, no delete) */}
        <CourseTree
          courses={courses}
          catalog={catalog}
          activeCourseId={activeCourseId}
          activeLessonId={activeLessonId}
          loading={loadingCatalog}
          isBuilder={false}
          addingToCategoryId={null}
          newLessonTitle=""
          addingLesson={false}
          onCourseChange={setActiveCourseId}
          onSelectLesson={(id) => setActiveLessonId(id)}
          onStartAdd={() => {}}
          onTitleChange={() => {}}
          onConfirmAdd={() => {}}
          onCancelAdd={() => {}}
        />

        {/* Right: lesson detail — read-only */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {!activeLessonId && !loadingLesson && (
            <div className="flex flex-col items-center justify-center h-full py-24 text-center">
              <BookOpen className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">Select a lesson from the library</p>
            </div>
          )}
          {loadingLesson && (
            <div className="flex justify-center py-24">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          )}

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

              {/* Title + status */}
              <div className="flex items-center gap-3 flex-wrap mb-4">
                <h1 className="text-xl font-bold text-gray-900">{lessonPkg.title}</h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[lessonPkg.status] ?? "bg-gray-100 text-gray-500"}`}>
                  {lessonPkg.status.replace("_", " ").toUpperCase()}
                </span>
              </div>

              {/* Stats row */}
              <div className="bg-white border border-gray-100 rounded-xl shadow-sm px-5 py-3 flex flex-wrap gap-6 mb-5 items-center">
                <StatPill label="Difficulty"  value={DIFFICULTY_LABELS[lessonPkg.difficulty] ?? String(lessonPkg.difficulty)} />
                <StatPill label="Class Time"  value={`${lessonPkg.estimatedMinutes} min`} />
                {lessonPkg.hwMinutes && <StatPill label="HW Time" value={`${lessonPkg.hwMinutes} min`} />}
                <StatPill label="Package"     value={`${lessonPkg.resources.filter((r) => r.url).length} / ${lessonPkg.resources.length} files`} />
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
                {/* Left (5/12) */}
                <div className="col-span-5 space-y-4">
                  {lessonPkg.description && (
                    <InfoSection title="About This Lesson">
                      <p className="text-sm text-gray-600 leading-relaxed">{lessonPkg.description}</p>
                    </InfoSection>
                  )}

                  {lessonPkg.learningObjectives.length > 0 && (
                    <InfoSection title="Students Will Learn To">
                      <ul className="space-y-2">
                        {lessonPkg.learningObjectives.map((obj, i) => (
                          <li key={i} className="flex gap-2 text-sm text-gray-600">
                            <span className="text-blue-500 font-bold shrink-0 mt-0.5">·</span> {obj}
                          </li>
                        ))}
                      </ul>
                    </InfoSection>
                  )}

                  {lessonPkg.commonMistakes && (
                    <InfoSection title="Common Mistakes">
                      <p className="text-sm text-gray-600 leading-relaxed">{lessonPkg.commonMistakes}</p>
                    </InfoSection>
                  )}

                  {lessonPkg.tutorNotes && (
                    <InfoSection title="Teaching Notes">
                      <p className="text-sm text-gray-600 leading-relaxed">{lessonPkg.tutorNotes}</p>
                    </InfoSection>
                  )}

                  {lessonPkg.desmosUsage && (
                    <InfoSection title="Recommended Desmos Usage">
                      <p className="text-sm text-gray-600 leading-relaxed">{lessonPkg.desmosUsage}</p>
                    </InfoSection>
                  )}

                  {lessonPkg.prerequisites && (
                    <InfoSection title="Prerequisite Knowledge">
                      <p className="text-sm text-gray-600 leading-relaxed">{lessonPkg.prerequisites}</p>
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

                {/* Middle (4/12): package — view only */}
                <div className="col-span-4">
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
                      return (
                        <ResourceSlot
                          key={type}
                          resource={res}
                          isBuilder={false}
                          onUpdate={() => {}}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Right (3/12): stats + actions */}
                <div className="col-span-3 space-y-4">
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

                  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</p>
                    <div className="space-y-2">
                      <button className="w-full px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 text-left">
                        Assign to Student
                      </button>
                      {lessonPkg.resources.find((r) => r.type === "lesson_deck" && r.url) && (
                        <a
                          href={lessonPkg.resources.find((r) => r.type === "lesson_deck")!.url!}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 w-full px-3 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50"
                        >
                          Preview Lesson Deck <ExternalLink className="w-3 h-3 ml-auto" />
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
    </div>
  );
}

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
