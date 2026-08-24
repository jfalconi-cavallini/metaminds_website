"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown, Plus, Loader2, Trash2 } from "lucide-react";
import type { Course, CourseCatalogFull, CatalogSection, CatalogCategory } from "@/lib/portal/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CourseTreeProps {
  courses: Course[];
  catalog: CourseCatalogFull | null;
  activeCourseId: number | null;
  activeLessonId: number | null;
  loading: boolean;
  isBuilder: boolean;
  // add-lesson inline state
  addingToCategoryId: number | null;
  newLessonTitle: string;
  addingLesson: boolean;
  onCourseChange: (id: number) => void;
  onSelectLesson: (id: number) => void;
  onStartAdd: (categoryId: number) => void;
  onTitleChange: (v: string) => void;
  onConfirmAdd: (categoryId: number) => void;
  onCancelAdd: () => void;
  onDeleteCourse?: (id: number) => Promise<void>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CourseTree(p: CourseTreeProps) {
  const [expandedSections,   setExpandedSections]   = useState<Set<number>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [deleteError,   setDeleteError]   = useState<string | null>(null);

  // Reset confirm state when course changes
  React.useEffect(() => { setConfirmDelete(false); setDeleteError(null); }, [p.activeCourseId]);

  // Auto-expand first section+category when catalog loads
  React.useEffect(() => {
    if (!p.catalog) return;
    const firstSection = p.catalog.sections[0];
    if (!firstSection) return;
    setExpandedSections(new Set([firstSection.id]));
    const firstCat = firstSection.categories[0];
    if (firstCat) setExpandedCategories(new Set([firstCat.id]));
  }, [p.catalog]);

  function toggleSection(id: number) {
    setExpandedSections((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleCategory(id: number) {
    setExpandedCategories((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  return (
    <div className="w-64 shrink-0 flex flex-col border-r border-gray-200 bg-white">
      {/* Course selector */}
      <div className="px-4 pt-3 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Course</p>
          {p.onDeleteCourse && p.activeCourseId && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              title="Delete course"
              className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors rounded"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <select
          value={p.activeCourseId ?? ""}
          onChange={(e) => { p.onCourseChange(Number(e.target.value)); setConfirmDelete(false); }}
          className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {p.courses.map((c) => (
            <option key={c.id} value={c.id}>{c.subject} — {c.title}</option>
          ))}
        </select>

        {/* Inline delete confirmation */}
        {confirmDelete && p.activeCourseId && p.onDeleteCourse && (
          <div className="mt-2 p-2.5 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-[10px] font-bold text-red-600 mb-1">Delete this course?</p>
            <p className="text-[10px] text-red-500 mb-2">All sections, lessons, and resources will be permanently removed.</p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  setDeleting(true);
                  setDeleteError(null);
                  try {
                    await p.onDeleteCourse!(p.activeCourseId!);
                    setConfirmDelete(false);
                  } catch (err) {
                    setDeleteError(err instanceof Error ? err.message : "Delete failed");
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="flex-1 py-1 bg-red-500 text-white rounded-md text-[10px] font-bold hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button
                onClick={() => { setConfirmDelete(false); setDeleteError(null); }}
                className="flex-1 py-1 border border-gray-200 text-gray-500 rounded-md text-[10px] font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
            {deleteError && (
              <p className="text-[10px] text-red-600 mt-2">{deleteError}</p>
            )}
          </div>
        )}
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {p.loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
          </div>
        )}
        {p.catalog && p.catalog.sections.map((section) => (
          <SectionNode
            key={section.id}
            section={section}
            expandedSections={expandedSections}
            expandedCategories={expandedCategories}
            activeLessonId={p.activeLessonId}
            addingToCategoryId={p.addingToCategoryId}
            newLessonTitle={p.newLessonTitle}
            addingLesson={p.addingLesson}
            showAddLesson={p.isBuilder}
            onToggleSection={toggleSection}
            onToggleCategory={toggleCategory}
            onSelectLesson={p.onSelectLesson}
            onStartAdd={p.onStartAdd}
            onTitleChange={p.onTitleChange}
            onConfirm={p.onConfirmAdd}
            onCancelAdd={p.onCancelAdd}
          />
        ))}
        {p.catalog && p.catalog.sections.length === 0 && (
          <p className="text-xs text-gray-300 text-center py-6 px-4">No sections yet</p>
        )}
      </div>
    </div>
  );
}

// ── Tree sub-nodes ─────────────────────────────────────────────────────────────

interface SectionNodeProps {
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
  onStartAdd: (id: number) => void;
  onTitleChange: (v: string) => void;
  onConfirm: (id: number) => void;
  onCancelAdd: () => void;
}

function SectionNode(p: SectionNodeProps) {
  const open = p.expandedSections.has(p.section.id);
  return (
    <div>
      <button
        onClick={() => p.onToggleSection(p.section.id)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 text-left"
      >
        {open
          ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        }
        <span className="truncate">{p.section.title}</span>
      </button>
      {open && p.section.categories.map((cat) => (
        <CategoryNode
          key={cat.id}
          category={cat}
          expandedCategories={p.expandedCategories}
          activeLessonId={p.activeLessonId}
          addingToCategoryId={p.addingToCategoryId}
          newLessonTitle={p.newLessonTitle}
          addingLesson={p.addingLesson}
          showAddLesson={p.showAddLesson}
          onToggle={p.onToggleCategory}
          onSelectLesson={p.onSelectLesson}
          onStartAdd={p.onStartAdd}
          onTitleChange={p.onTitleChange}
          onConfirm={p.onConfirm}
          onCancelAdd={p.onCancelAdd}
        />
      ))}
    </div>
  );
}

interface CategoryNodeProps {
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

function CategoryNode(p: CategoryNodeProps) {
  const open       = p.expandedCategories.has(p.category.id);
  const addingHere = p.addingToCategoryId === p.category.id;
  return (
    <div>
      <button
        onClick={() => p.onToggle(p.category.id)}
        className="w-full flex items-center gap-2 pl-6 pr-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 text-left"
      >
        {open
          ? <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
          : <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
        }
        <span className="truncate">{p.category.title}</span>
        <span className="ml-auto text-[10px] text-gray-300 shrink-0">{p.category.lessons.length}</span>
      </button>
      {open && (
        <div>
          {p.category.lessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => p.onSelectLesson(lesson.id)}
              className={`w-full flex items-center gap-2 pl-10 pr-3 py-1.5 text-xs text-left transition-colors ${
                p.activeLessonId === lesson.id
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              <span className="truncate flex-1">{lesson.title}</span>
              {lesson.status === "draft" && p.activeLessonId !== lesson.id && (
                <span className="text-[9px] font-bold text-gray-300 uppercase shrink-0">draft</span>
              )}
              {lesson.status === "in_review" && p.activeLessonId !== lesson.id && (
                <span className="text-[9px] font-bold text-amber-400 uppercase shrink-0">review</span>
              )}
            </button>
          ))}
          {p.showAddLesson && addingHere ? (
            <div className="pl-10 pr-3 py-1.5 flex gap-1">
              <input
                autoFocus
                value={p.newLessonTitle}
                onChange={(e) => p.onTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") p.onConfirm(p.category.id);
                  if (e.key === "Escape") p.onCancelAdd();
                }}
                placeholder="Lesson title…"
                className="flex-1 text-xs border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => p.onConfirm(p.category.id)}
                disabled={p.addingLesson || !p.newLessonTitle.trim()}
                className="text-blue-600 hover:text-blue-700 disabled:opacity-40 text-xs font-bold px-1"
              >
                {p.addingLesson ? "…" : "✓"}
              </button>
              <button onClick={p.onCancelAdd} className="text-gray-400 hover:text-gray-600 text-xs px-1">✕</button>
            </div>
          ) : p.showAddLesson ? (
            <button
              onClick={() => p.onStartAdd(p.category.id)}
              className="w-full flex items-center gap-1 pl-10 pr-3 py-1 text-[10px] text-gray-300 hover:text-blue-500 text-left"
            >
              <Plus className="w-3 h-3" /> Add lesson
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
