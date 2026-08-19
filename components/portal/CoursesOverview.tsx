"use client";

import React, { useEffect, useState } from "react";
import {
  BookOpen, GraduationCap, Target, Code2, ChevronDown, ChevronUp, Users, Loader2,
} from "lucide-react";
import StatCard from "./StatCard";
import { DISPLAY_GROUP_ORDER, displayGroupFor } from "@/lib/portal/utils";
import { fetchCourses, fetchCourseEnrollments } from "@/lib/portal/db";
import type { Student, Course, StudentCourseEnrollment } from "@/lib/portal/types";

const GROUP_ICONS: Record<string, React.ElementType> = {
  "Test Prep":     Target,
  "AP Courses":    GraduationCap,
  "Academics":     BookOpen,
  "Coding & STEM": Code2,
  "Other":         BookOpen,
};

interface Props {
  students: Student[];
  role: "admin" | "tutor";
  onSelectStudent?: (student: Student) => void;
}

export default function CoursesOverview({ students, role, onSelectStudent }: Props) {
  const [courses,     setCourses]     = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<StudentCourseEnrollment[]>([]);
  const [loading,      setLoading]    = useState(true);
  const [openCourseId, setOpenCourseId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([fetchCourses({ all: true }), fetchCourseEnrollments()])
      .then(([c, e]) => { setCourses(c); setEnrollments(e); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeStudents = students.filter((s) => !s.archived);
  const studentById     = new Map(activeStudents.map((s) => [s.id, s]));
  const visibleCourses  = courses.filter((c) => c.status !== "archived");

  const enrollmentsByCourse = new Map<number, StudentCourseEnrollment[]>();
  for (const e of enrollments) {
    if (!studentById.has(e.studentId)) continue; // scope to the students this view can see
    const arr = enrollmentsByCourse.get(e.courseId) ?? [];
    arr.push(e);
    enrollmentsByCourse.set(e.courseId, arr);
  }

  const totalEnrollments = [...enrollmentsByCourse.values()].reduce((n, arr) => n + arr.length, 0);
  const unassignedCount  = activeStudents.filter((s) =>
    !enrollments.some((e) => e.studentId === s.id)
  ).length;

  const groups = new Map<string, Course[]>();
  for (const c of visibleCourses) {
    const g = displayGroupFor(c.subject);
    const arr = groups.get(g) ?? [];
    arr.push(c);
    groups.set(g, arr);
  }
  const orderedGroupKeys = [
    ...DISPLAY_GROUP_ORDER.filter((g) => groups.has(g)),
    ...[...groups.keys()].filter((g) => !DISPLAY_GROUP_ORDER.includes(g)),
  ];

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
        <p className="text-sm text-gray-500 mt-1">
          {role === "admin"
            ? "Every course MetaMinds offers, and which students are enrolled in each."
            : "Courses your students are enrolled in."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Courses Offered" value={visibleCourses.length} />
        <StatCard label="Total Enrollments" value={totalEnrollments} />
        <StatCard label={role === "admin" ? "Students With No Course" : "My Students With No Course"} value={unassignedCount} />
      </div>

      <div className="space-y-8">
        {orderedGroupKeys.map((group) => {
          const Icon = GROUP_ICONS[group] ?? BookOpen;
          const groupCourses = groups.get(group)!;
          return (
            <div key={group}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{group}</h2>
                <span className="text-xs text-gray-300 font-medium">{groupCourses.length}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupCourses.map((course) => {
                  const roster = enrollmentsByCourse.get(course.id) ?? [];
                  const isOpen = openCourseId === course.id;
                  return (
                    <div key={course.id}
                      className={`bg-white border rounded-xl shadow-sm transition-colors ${isOpen ? "border-blue-300" : "border-gray-200"}`}>
                      <button
                        onClick={() => setOpenCourseId(isOpen ? null : course.id)}
                        className="w-full flex items-start justify-between gap-3 px-4 py-3 text-left"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900 truncate">{course.title}</p>
                            {course.status === "draft" && (
                              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0">
                                Curriculum Pending
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                            <Users className="w-3 h-3" />
                            <span>{roster.length} student{roster.length !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />}
                      </button>

                      {isOpen && (
                        <div className="border-t border-gray-100 px-4 py-2.5">
                          {roster.length === 0 ? (
                            <p className="text-xs text-gray-300 italic py-1">No students enrolled yet</p>
                          ) : (
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                              {roster.map((e) => {
                                const s = studentById.get(e.studentId);
                                if (!s) return null;
                                return (
                                  <div key={e.id}
                                    onClick={() => role === "admin" && onSelectStudent?.(s)}
                                    className={`flex items-center justify-between gap-2 py-1 ${role === "admin" && onSelectStudent ? "cursor-pointer hover:opacity-70" : ""}`}
                                  >
                                    <span className="text-xs font-medium text-gray-700 truncate">{s.name}</span>
                                    <span className="text-[10px] text-gray-400 shrink-0">{s.grade}</span>
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
