"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import Badge from "@/components/portal/Badge";
import StatCard from "@/components/portal/StatCard";
import { purchaseOptions, formatDate, resolveZoomUrl } from "@/lib/portal/utils";
import WeeklyCalendar, { parseTimeToHour } from "@/components/portal/WeeklyCalendar";
import Modal from "@/components/portal/Modal";
import {
  fetchStudentById, fetchTutorById, fetchPackageByStudent,
  fetchSessionsByStudent, fetchSessionsByTutor, fetchTutorAvailability,
  insertSession, cancelSession,
  fetchSessionNotes, fetchHomework,
  fetchBlockedDates, fetchParentUpdatesByStudent,
  autoCompletePastSessions,
} from "@/lib/portal/db";
import { supabase } from "@/lib/supabase";
import type { Student, Tutor, Session, HoursBalance, TutorAvailability, SessionNote, Homework, BlockedDate, ParentUpdate } from "@/lib/portal/types";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Calendar, FileText, Bell, BookOpen,
  Clock, FlaskConical, Plus, ChevronRight, CalendarDays,
  Video, RotateCcw, X, Timer, CheckCircle, AlertCircle,
  Paperclip, Upload, Lightbulb,
} from "lucide-react";
import type { CalendarSessionAction } from "@/components/portal/WeeklyCalendar";

const CANCEL_LOCK_HOURS = 48;

const navItems = [
  { id: "overview",  label: "Dashboard",     icon: LayoutDashboard },
  { id: "sessions",  label: "Schedule",      icon: Calendar        },
  { id: "homework",  label: "Homework",      icon: BookOpen        },
  { id: "notes",     label: "Session Notes", icon: FileText        },
  { id: "updates",   label: "Updates",       icon: Bell            },
  { id: "hours",     label: "Hours",         icon: Clock           },
  { id: "lab",       label: "MetaMinds Lab", icon: FlaskConical, badge: "Soon" },
];

/** Returns hours from now until the session starts (negative if past) */
function hoursUntilSession(session: Session): number {
  const hour = parseTimeToHour(session.time);
  const dt = new Date(`${session.date}T${String(hour).padStart(2, "0")}:00:00`);
  return (dt.getTime() - Date.now()) / (1000 * 60 * 60);
}


export default function StudentPortal() {
  const { user, authLoaded } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("overview");

  const handleTabChange = useCallback((id: string) => {
    setTab(id);
  }, []);

  // Remote data
  const [student,       setStudent]       = useState<Student | null>(null);
  const [tutor,         setTutor]         = useState<Tutor | null>(null);
  const [balance,       setBalance]       = useState<HoursBalance | null>(null);
  const [mySessions,    setMySessions]    = useState<Session[]>([]);
  const [tutorSessions, setTutorSessions] = useState<Session[]>([]);
  const [availability,  setAvailability]  = useState<TutorAvailability[]>([]);
  const [blockedDates,  setBlockedDates]  = useState<BlockedDate[]>([]);
  const [sessionNotes,  setSessionNotes]  = useState<SessionNote[]>([]);
  const [homeworkList,   setHomeworkList]   = useState<Homework[]>([]);
  const [parentUpdates,  setParentUpdates]  = useState<ParentUpdate[]>([]);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    if (!authLoaded) return;
    if (!user || user.role !== "student" || !user.linkedId) {
      router.push("/login");
      return;
    }
    const studentId = user.linkedId;

    async function load() {
      try {
        await autoCompletePastSessions();
        const [s, pkg, sess] = await Promise.all([
          fetchStudentById(studentId),
          fetchPackageByStudent(studentId),
          fetchSessionsByStudent(studentId),
        ]);
        setStudent(s);
        setBalance(pkg);
        setMySessions(sess);
        if (s?.assignedTutorId) {
          const [t, avail, allTutorSess, notes, hw, blocked, pu] = await Promise.all([
            fetchTutorById(s.assignedTutorId),
            fetchTutorAvailability(s.assignedTutorId),
            fetchSessionsByTutor(s.assignedTutorId),
            fetchSessionNotes(studentId),
            fetchHomework(studentId),
            fetchBlockedDates(s.assignedTutorId),
            fetchParentUpdatesByStudent(studentId),
          ]);
          setTutor(t);
          setAvailability(avail);
          setTutorSessions(allTutorSess);
          setSessionNotes(notes);
          setHomeworkList(hw);
          setBlockedDates(blocked);
          setParentUpdates(pu);
        }
      } catch (err) {
        console.error("Failed to load student portal:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [authLoaded, user, router]);

  // Book Session
  const [selectedSlot,    setSelectedSlot]    = useState<{ date: string; time: string } | null>(null);
  const [bookSubject,     setBookSubject]     = useState("");
  const [bookNotes,       setBookNotes]       = useState("");
  const [bookDuration,    setBookDuration]    = useState(1);
  const [bookSessionType, setBookSessionType] = useState<"online" | "in-person">("online");
  const [bookSuccess,     setBookSuccess]     = useState(false);
  const [bookError,       setBookError]       = useState("");

  // Cancel/reschedule
  const [cancellingId,  setCancellingId]  = useState<number | null>(null);
  const [cancelError,   setCancelError]   = useState("");

  // Buy Hours
  const [showBuyPanel,    setShowBuyPanel]    = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  // Past session detail
  const [pastSessionDetail, setPastSessionDetail] = useState<Session | null>(null);

  // Homework upload
  const [hwSelectedFiles, setHwSelectedFiles] = useState<Record<number, File>>({});
  const [hwUploadingId,   setHwUploadingId]   = useState<number | null>(null);
  const [hwUploadErrors,  setHwUploadErrors]  = useState<Record<number, string>>({});
  const [hwOpeningId,     setHwOpeningId]     = useState<number | null>(null);
  const [hwFilter,        setHwFilter]        = useState<"todo" | "completed" | "all">("todo");
  const [hwExpandedIds,   setHwExpandedIds]   = useState<Set<number>>(new Set());

  const todayIso  = new Date().toISOString().slice(0, 10);
  const upcoming  = mySessions.filter((s) => s.status === "upcoming" && s.date >= todayIso).sort((a, b) => a.date.localeCompare(b.date));
  const completed = mySessions.filter((s) => s.status === "completed");
  const pct       = balance ? (balance.totalUsed / balance.totalPurchased) * 100 : 0;
  const nextSession = upcoming[0];

  // Realtime: update homework and parent updates without page refresh
  useEffect(() => {
    if (!student) return;
    const sid = student.id;
    const channel = supabase
      .channel(`student-live-${sid}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "homework",
        filter: `student_id=eq.${sid}`,
      }, () => {
        fetchHomework(sid).then(setHomeworkList).catch(console.error);
      })
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "parent_updates",
        filter: `student_id=eq.${sid}`,
      }, () => {
        fetchParentUpdatesByStudent(sid).then(setParentUpdates).catch(console.error);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [student?.id]);

  // Keep bookSubject in sync with student subjects once loaded
  useEffect(() => {
    if (student && !bookSubject) setBookSubject(student.subjects[0] ?? "");
  }, [student, bookSubject]);

  async function submitBooking() {
    if (!selectedSlot || !student || !student.assignedTutorId) return;
    setBookError("");
    try {
      const newSession = await insertSession({
        studentId:     student.id,
        tutorId:       student.assignedTutorId,
        subject:       bookSubject,
        sessionDate:   selectedSlot.date,
        sessionTime:   selectedSlot.time,
        durationHours: bookDuration,
        sessionType:   bookSessionType,
        notes:         bookNotes || undefined,
      });
      setMySessions((prev) => [...prev, newSession]);
      setTutorSessions((prev) => [...prev, newSession]);
      setBalance((prev) => prev ? {
        ...prev,
        totalUsed: prev.totalUsed + bookDuration,
        remaining: Math.max(0, prev.remaining - bookDuration),
      } : prev);
      setBookSuccess(true);
      setSelectedSlot(null);
      setBookNotes("");
      setBookDuration(1);
      setTimeout(() => setBookSuccess(false), 5000);
    } catch {
      setBookError("Failed to book session. Please try again.");
    }
  }

  async function handleCancelSession(session: Session) {
    if (!student) return;
    setCancellingId(session.id);
    setCancelError("");
    try {
      await cancelSession(session.id, session.durationHours, student.id);
      setMySessions((prev) => prev.map((s) => s.id === session.id ? { ...s, status: "cancelled" } : s));
      setTutorSessions((prev) => prev.filter((s) => s.id !== session.id));
      setBalance((prev) => prev ? {
        ...prev,
        totalUsed: Math.max(0, prev.totalUsed - session.durationHours),
        remaining: prev.remaining + session.durationHours,
      } : prev);
    } catch {
      setCancelError("Failed to cancel. Please try again.");
    } finally {
      setCancellingId(null);
    }
  }

  async function handleReschedule(session: Session) {
    if (!student) return;
    setCancellingId(session.id);
    try {
      await cancelSession(session.id, session.durationHours, student.id);
      setMySessions((prev) => prev.map((s) => s.id === session.id ? { ...s, status: "cancelled" } : s));
      setTutorSessions((prev) => prev.filter((s) => s.id !== session.id));
      setBalance((prev) => prev ? {
        ...prev,
        totalUsed: Math.max(0, prev.totalUsed - session.durationHours),
        remaining: prev.remaining + session.durationHours,
      } : prev);
      setTab("sessions");
    } catch {
      setCancelError("Failed to reschedule. Please try again.");
    } finally {
      setCancellingId(null);
    }
  }

  async function handleHomeworkUpload(hw: { id: number }) {
    const file = hwSelectedFiles[hw.id];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setHwUploadErrors((prev) => ({ ...prev, [hw.id]: "File too large (max 10 MB)." }));
      return;
    }
    setHwUploadingId(hw.id);
    setHwUploadErrors((prev) => ({ ...prev, [hw.id]: "" }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const form = new FormData();
      form.append("file", file);
      form.append("hwId", String(hw.id));
      const res = await fetch("/api/homework/upload", {
        method: "POST",
        headers: session ? { authorization: `Bearer ${session.access_token}` } : {},
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      const r = json.homework;
      const updated: Homework = {
        id: r.id, studentId: r.student_id, tutorId: r.tutor_id,
        task: r.task, assignedDate: r.assigned_date, dueDate: r.due_date ?? null,
        status: r.status, createdAt: r.created_at,
        submissionUrl:      r.submission_url      ?? undefined,
        submissionFilename: r.submission_filename ?? undefined,
        submittedAt:        r.submitted_at        ?? undefined,
        feedback:           r.feedback            ?? undefined,
        feedbackAt:         r.feedback_at         ?? undefined,
      };
      setHomeworkList((prev) => prev.map((h) => h.id === hw.id ? updated : h));
      setHwSelectedFiles((prev) => { const n = { ...prev }; delete n[hw.id]; return n; });
    } catch (e: unknown) {
      setHwUploadErrors((prev) => ({
        ...prev,
        [hw.id]: e instanceof Error ? e.message : "Upload failed. Please try again.",
      }));
    } finally {
      setHwUploadingId(null);
    }
  }

  async function openSubmission(hw: Homework) {
    if (!hw.submissionUrl) return;
    setHwOpeningId(hw.id);
    try {
      const res = await fetch("/api/homework/signed-url", {
        method:  "POST",
        headers: { "content-type": "application/json" },
        body:    JSON.stringify({ path: hw.submissionUrl }),
      });
      if (!res.ok) {
        const j = await res.json() as { error?: string };
        throw new Error(j.error ?? "Failed to fetch file");
      }
      const blob      = await res.blob();
      const objectUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    } catch (e: unknown) {
      alert(`Could not open file: ${e instanceof Error ? e.message : "Please try again."}`);
    } finally {
      setHwOpeningId(null);
    }
  }

  function requestPurchase(label: string) {
    setPurchaseSuccess(`"${label}" request submitted. Admin will confirm and send an invoice.`);
    setShowBuyPanel(false);
    setTimeout(() => setPurchaseSuccess(null), 5000);
  }

  if (!authLoaded || loading) {
    return (
      <DashboardShell role="student" userName="Loading…" navItems={navItems} activeTab={tab} onTabChange={handleTabChange}>
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading your dashboard…</div>
      </DashboardShell>
    );
  }

  if (!student) {
    return (
      <DashboardShell role="student" userName="Student" navItems={navItems} activeTab={tab} onTabChange={handleTabChange}>
        <div className="flex items-center justify-center h-64 text-red-500 text-sm">Could not load your data. Check your Supabase connection.</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="student" userName={student.name} navItems={navItems} activeTab={tab} onTabChange={handleTabChange}>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (() => {
        const sessionToday = upcoming.find((s) => s.date === todayIso);
        const overdueHw    = homeworkList.filter((h) => h.status === "pending" && h.dueDate && h.dueDate < todayIso).sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
        const dueTodayHw   = homeworkList.filter((h) => h.status === "pending" && h.dueDate === todayIso);
        const weekOut      = new Date(); weekOut.setDate(weekOut.getDate() + 7);
        const weekOutIso   = weekOut.toISOString().slice(0, 10);
        const dueWeekHw    = homeworkList.filter((h) => h.status === "pending" && h.dueDate && h.dueDate > todayIso && h.dueDate <= weekOutIso);
        const pendingHwCount = homeworkList.filter((h) => h.status === "pending").length;
        const firstName    = student.name.split(" ")[0];
        const dayLabel     = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

        const planItems = [
          ...overdueHw.map((h) => ({ key: `od-${h.id}`, dot: "bg-red-500", label: h.task, sub: `Overdue · ${formatDate(h.dueDate!)}`, labelColor: "text-red-700", subColor: "text-red-400", onClick: () => setTab("homework") })),
          ...dueTodayHw.map((h) => ({ key: `dt-${h.id}`, dot: "bg-amber-400", label: h.task, sub: "Due today", labelColor: "text-amber-700", subColor: "text-amber-500", onClick: () => setTab("homework") })),
          ...dueWeekHw.slice(0, 3).map((h) => ({ key: `dw-${h.id}`, dot: "bg-gray-300", label: h.task, sub: `Due ${formatDate(h.dueDate!)}`, labelColor: "text-gray-700", subColor: "text-gray-400", onClick: () => setTab("homework") })),
        ];

        return (
          <div className="space-y-6">

            {/* Welcome header + upcoming session */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}! 👋</h1>
                <p className="text-sm text-gray-400 mt-1">{dayLabel} · Keep the momentum going!</p>
              </div>
              {nextSession && (
                <div className="shrink-0 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-4 sm:min-w-[210px] shadow-lg shadow-blue-200">
                  <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-1.5">Upcoming Session</p>
                  <p className="font-bold text-sm leading-snug">{formatDate(nextSession.date)}</p>
                  <p className="text-blue-100 text-sm mt-0.5">{nextSession.time} · {nextSession.subject}</p>
                  <p className="text-blue-200 text-xs mt-0.5">{nextSession.durationHours} hr · {nextSession.sessionType}</p>
                  <div className="mt-3">
                    {nextSession.zoomLink ? (
                      <button
                        onClick={() => window.open(resolveZoomUrl(nextSession.zoomLink!), "_blank", "noopener,noreferrer")}
                        className="bg-white text-blue-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        Join Zoom →
                      </button>
                    ) : (
                      <button
                        onClick={() => setTab("sessions")}
                        className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors"
                      >
                        View Schedule →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Hours Left",     value: balance?.remaining ?? 0, sub: `of ${balance?.totalPurchased ?? 0} purchased`, Icon: Clock,        iconBg: "bg-blue-50",   iconColor: "text-blue-600",   valColor: "text-blue-700"  },
                { label: "Sessions Done",  value: completed.length,         sub: "total completed",                              Icon: CalendarDays, iconBg: "bg-green-50",  iconColor: "text-green-600",  valColor: "text-gray-900"  },
                { label: "HW Pending",     value: pendingHwCount,           sub: pendingHwCount === 0 ? "all done! 🎉" : "assignments pending", Icon: BookOpen, iconBg: pendingHwCount > 0 ? "bg-amber-50" : "bg-green-50", iconColor: pendingHwCount > 0 ? "text-amber-500" : "text-green-600", valColor: pendingHwCount > 0 ? "text-amber-700" : "text-green-700" },
                { label: "Upcoming",       value: upcoming.length,          sub: "sessions booked",                              Icon: Calendar,     iconBg: "bg-purple-50", iconColor: "text-purple-600", valColor: "text-gray-900"  },
              ].map(({ label, value, sub, Icon, iconBg, iconColor, valColor }) => (
                <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                    <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${iconColor}`} />
                    </div>
                  </div>
                  <p className={`text-3xl font-bold ${valColor}`}>{value}</p>
                  <p className="text-xs text-gray-400 mt-1">{sub}</p>
                </div>
              ))}
            </div>

            {/* 3-column section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Today's Plan */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                    Today&apos;s Plan
                  </h3>
                  <span className="text-xs text-gray-400">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>

                <div className="space-y-3">
                  {sessionToday && (
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-white text-[9px] font-bold">S</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{sessionToday.subject} Session</p>
                        <p className="text-xs text-gray-400">{sessionToday.time} · {sessionToday.durationHours} hr</p>
                      </div>
                      {sessionToday.zoomLink && (
                        <button
                          onClick={() => window.open(resolveZoomUrl(sessionToday.zoomLink!), "_blank", "noopener,noreferrer")}
                          className="text-xs text-blue-600 font-semibold hover:underline shrink-0"
                        >
                          Join →
                        </button>
                      )}
                    </div>
                  )}

                  {planItems.map((item) => (
                    <button key={item.key} onClick={item.onClick} className="w-full flex items-start gap-3 text-left">
                      <div className={`w-2 h-2 rounded-full ${item.dot} shrink-0 mt-1.5`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${item.labelColor}`}>{item.label}</p>
                        <p className={`text-xs ${item.subColor}`}>{item.sub}</p>
                      </div>
                    </button>
                  ))}

                  {!sessionToday && planItems.length === 0 && (
                    <div className="text-center py-5">
                      <p className="text-2xl mb-1">🎉</p>
                      <p className="text-sm font-semibold text-gray-600">All caught up!</p>
                      <p className="text-xs text-gray-400 mt-0.5">Nothing needs attention today.</p>
                    </div>
                  )}
                </div>

                {pendingHwCount > 0 && (
                  <button onClick={() => setTab("homework")}
                    className="mt-4 w-full text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center justify-center gap-1 pt-3 border-t border-gray-100">
                    View all homework <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Recent Tutor Update */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Recent Tutor Update</h3>
                  {parentUpdates.length > 1 && (
                    <button onClick={() => setTab("updates")} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                      See all →
                    </button>
                  )}
                </div>

                {parentUpdates[0] ? (
                  <div>
                    {tutor && (
                      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                        {tutor.photoUrl ? (
                          <img src={tutor.photoUrl} alt={tutor.name}
                            className="w-9 h-9 rounded-full object-cover border-2 border-gray-100 shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
                            {tutor.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{tutor.name}</p>
                          <p className="text-xs text-gray-400">{formatDate(parentUpdates[0].createdAt.slice(0, 10))}</p>
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-6">
                      {parentUpdates[0].message}
                    </p>
                    {parentUpdates[0].message.length > 200 && (
                      <button onClick={() => setTab("updates")} className="mt-2 text-xs text-blue-600 font-semibold hover:text-blue-700">
                        Read more →
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    {tutor && (
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                        {tutor.photoUrl ? (
                          <img src={tutor.photoUrl} alt={tutor.name}
                            className="w-9 h-9 rounded-full object-cover border-2 border-gray-100 shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
                            {tutor.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{tutor.name}</p>
                          <p className="text-xs text-gray-400">Your tutor</p>
                        </div>
                      </div>
                    )}
                    <div className="text-center py-4">
                      <p className="text-3xl mb-2">📬</p>
                      <p className="text-sm font-medium text-gray-500">No updates yet</p>
                      <p className="text-xs text-gray-400 mt-1">Your tutor will send updates after sessions.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setTab((balance?.remaining ?? 0) > 0 ? "sessions" : "hours")}
                    className="w-full flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      {(balance?.remaining ?? 0) > 0 ? "Book a Session" : "Buy More Hours"}
                    </span>
                    <ChevronRight className="w-4 h-4 opacity-70" />
                  </button>

                  {([
                    { label: "View Schedule",  Icon: CalendarDays, target: "sessions", color: "text-purple-600", bg: "bg-purple-50 hover:bg-purple-100" },
                    { label: "My Homework",    Icon: BookOpen,     target: "homework", color: "text-amber-600",  bg: "bg-amber-50 hover:bg-amber-100"   },
                    { label: "Session Notes",  Icon: FileText,     target: "notes",    color: "text-blue-600",   bg: "bg-blue-50 hover:bg-blue-100"     },
                    { label: "Tutor Updates",  Icon: Bell,         target: "updates",  color: "text-green-600",  bg: "bg-green-50 hover:bg-green-100"   },
                  ] as const).map(({ label, Icon, target, color, bg }) => (
                    <button key={label} onClick={() => setTab(target)}
                      className={`w-full flex items-center justify-between px-4 py-3 ${bg} rounded-xl text-sm font-medium transition-colors`}
                    >
                      <span className={`flex items-center gap-2 ${color}`}>
                        <Icon className="w-4 h-4" />
                        {label}
                      </span>
                      <ChevronRight className={`w-4 h-4 ${color} opacity-40`} />
                    </button>
                  ))}
                </div>

                {tutor && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">My Tutor</p>
                    <div className="flex items-center gap-3">
                      {tutor.photoUrl ? (
                        <img src={tutor.photoUrl} alt={tutor.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0 select-none">
                          {tutor.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{tutor.name}</p>
                        {tutor.email && (
                          <a href={`mailto:${tutor.email}`} className="text-xs text-blue-600 hover:underline truncate block">{tutor.email}</a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── SCHEDULE ── */}
      {tab === "sessions" && (() => {
        const sessionToday = upcoming.find((s) => s.date === todayIso);
        const nextSession  = upcoming[0];
        const daysToNext   = nextSession
          ? Math.round((new Date(nextSession.date + "T12:00:00").getTime() - new Date(todayIso + "T12:00:00").getTime()) / 86400000)
          : null;
        const nextLabel = daysToNext === null ? "None booked"
          : daysToNext === 0 ? "Today"
          : daysToNext === 1 ? "Tomorrow"
          : `${daysToNext} days`;

        const pastSessions = mySessions
          .filter((s) => s.status === "completed" || (s.status === "upcoming" && s.date < todayIso))
          .sort((a, b) => b.date.localeCompare(a.date));

        const calendarActions = (session: Session): CalendarSessionAction[] => {
          if (session.studentId !== student.id) return [];
          if (session.status === "cancelled" || session.date < todayIso) return [];
          const acts: CalendarSessionAction[] = [];
          if (session.zoomLink) {
            acts.push({
              label: "Join Zoom",
              variant: "primary",
              onClick: (e) => { e.stopPropagation(); window.open(resolveZoomUrl(session.zoomLink!), "_blank", "noopener,noreferrer"); },
            });
          }
          if (hoursUntilSession(session) >= CANCEL_LOCK_HOURS) {
            acts.push({ label: "Reschedule", onClick: (e) => { e.stopPropagation(); handleReschedule(session); } });
            acts.push({ label: "Cancel", variant: "danger", onClick: (e) => { e.stopPropagation(); handleCancelSession(session); } });
          }
          return acts;
        };

        return (
          <div className="space-y-6">

            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
                <p className="text-sm text-gray-400 mt-1">Manage your tutoring sessions and book new appointments.</p>
              </div>
              {(balance?.remaining ?? 0) > 0 ? (
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => document.getElementById("schedule-calendar")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                >
                  <Plus className="w-4 h-4" />
                  Book Session
                </motion.button>
              ) : (
                <button onClick={() => setTab("hours")}
                  className="shrink-0 text-sm font-semibold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-xl transition-colors">
                  Buy More Hours →
                </button>
              )}
            </div>

            {/* ── Quick Stats Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {([
                {
                  label: "Upcoming",
                  value: upcoming.length,
                  sub: upcoming.length === 1 ? "session booked" : "sessions booked",
                  Icon: CalendarDays,
                  iconBg: "bg-blue-50",
                  iconColor: "text-blue-600",
                  valColor: "text-gray-900",
                },
                {
                  label: "Today's Session",
                  value: sessionToday ? sessionToday.time : "—",
                  sub: sessionToday ? sessionToday.subject : "Free today",
                  Icon: Clock,
                  iconBg: sessionToday ? "bg-emerald-50" : "bg-gray-50",
                  iconColor: sessionToday ? "text-emerald-600" : "text-gray-400",
                  valColor: sessionToday ? "text-emerald-700" : "text-gray-400",
                },
                {
                  label: "Hours Remaining",
                  value: `${balance?.remaining ?? 0}`,
                  sub: `of ${balance?.totalPurchased ?? 0} hrs purchased`,
                  Icon: Timer,
                  iconBg: (balance?.remaining ?? 0) > 0 ? "bg-blue-50" : "bg-red-50",
                  iconColor: (balance?.remaining ?? 0) > 0 ? "text-blue-600" : "text-red-500",
                  valColor: (balance?.remaining ?? 0) > 0 ? "text-blue-700" : "text-red-600",
                },
                {
                  label: "Next Session",
                  value: nextLabel,
                  sub: nextSession ? `${nextSession.subject} · ${nextSession.time}` : "No sessions yet",
                  Icon: RotateCcw,
                  iconBg: nextSession ? "bg-purple-50" : "bg-gray-50",
                  iconColor: nextSession ? "text-purple-600" : "text-gray-400",
                  valColor: nextSession ? "text-gray-900" : "text-gray-400",
                },
              ] as const).map(({ label, value, sub, Icon, iconBg, iconColor, valColor }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.06 }}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                    <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${iconColor}`} />
                    </div>
                  </div>
                  <p className={`text-2xl font-bold ${valColor} leading-none`}>{value}</p>
                  <p className="text-xs text-gray-400 mt-1.5 truncate">{sub}</p>
                </motion.div>
              ))}
            </div>

            {/* ── Alert banners ── */}
            {bookSuccess && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                Session booked successfully! It&apos;s now on your tutor&apos;s calendar.
              </div>
            )}
            {cancelError && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                {cancelError}
              </div>
            )}
            {availability.length === 0 && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                Your tutor hasn&apos;t set their availability yet. Check back soon or contact MetaMinds support.
              </div>
            )}

            {/* ── Calendar ── */}
            <motion.div
              id="schedule-calendar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <WeeklyCalendar
                availability={availability}
                sessions={tutorSessions}
                blockedDates={blockedDates.map((b) => b.blockedDate)}
                mode={(balance?.remaining ?? 0) > 0 ? "book" : "view"}
                selectedSlot={selectedSlot}
                bookingLeadHours={tutor?.bookingLeadHours ?? 24}
                onSlotSelect={(date, time) => {
                  setSelectedSlot({ date, time });
                  setBookError("");
                  if (!bookSubject && student.subjects[0]) setBookSubject(student.subjects[0]);
                }}
                onSessionClick={(session) => {
                  if (session.status === "completed" || session.date < todayIso) {
                    setPastSessionDetail(session);
                  }
                }}
                getSessionActions={calendarActions}
              />
            </motion.div>

            {/* ── Upcoming Sessions ── */}
            {upcoming.length === 0 && mySessions.length === 0 ? (
              /* Empty state */
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No sessions scheduled yet</h3>
                <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">
                  Click a green slot on the calendar above to book your first session with your tutor.
                </p>
                {(balance?.remaining ?? 0) > 0 ? (
                  <button
                    onClick={() => document.getElementById("schedule-calendar")?.scrollIntoView({ behavior: "smooth" })}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Book Your First Session
                  </button>
                ) : (
                  <button onClick={() => setTab("hours")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                    Buy Hours to Get Started
                  </button>
                )}
              </div>
            ) : upcoming.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Upcoming Sessions</h2>
                  <span className="text-xs text-gray-400 font-medium">{upcoming.length} booked</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {upcoming.map((s, i) => {
                    const isToday  = s.date === todayIso;
                    const hrs      = hoursUntilSession(s);
                    const locked   = hrs < CANCEL_LOCK_HOURS;
                    const inPerson = s.sessionType === "in-person";

                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.05 }}
                        className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                          isToday ? "border-blue-300" : "border-gray-100"
                        }`}
                      >
                        {/* Color strip */}
                        <div className={`h-1.5 ${isToday ? "bg-blue-600" : inPerson ? "bg-violet-500" : "bg-slate-300"}`} />
                        <div className="p-4">
                          {/* Date/time */}
                          <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                            isToday ? "text-blue-600" : "text-gray-400"
                          }`}>
                            {isToday ? "Today" : formatDate(s.date)} · {s.time}
                          </p>
                          {/* Subject */}
                          <p className="font-bold text-gray-900 text-base leading-snug truncate">{s.subject}</p>
                          {/* Type + duration */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              inPerson
                                ? "bg-violet-50 text-violet-600"
                                : "bg-blue-50 text-blue-600"
                            }`}>
                              {inPerson ? <X className="w-2.5 h-2.5" /> : <Video className="w-2.5 h-2.5" />}
                              {inPerson ? "In-Person" : "Online"}
                            </span>
                            <span className="text-[11px] text-gray-400">{s.durationHours} hr</span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                            {s.zoomLink ? (
                              <button
                                onClick={() => window.open(resolveZoomUrl(s.zoomLink!), "_blank", "noopener,noreferrer")}
                                className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                              >
                                <Video className="w-3.5 h-3.5" />
                                Join Zoom
                              </button>
                            ) : (
                              <span />
                            )}
                            {locked ? (
                              <span className="text-xs text-gray-300 italic">Locked</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleReschedule(s)} disabled={cancellingId === s.id}
                                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-40">
                                  <RotateCcw className="w-3 h-3" /> Reschedule
                                </button>
                                <button onClick={() => handleCancelSession(s)} disabled={cancellingId === s.id}
                                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40">
                                  <X className="w-3 h-3" /> {cancellingId === s.id ? "…" : "Cancel"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Recent Sessions ── */}
            {pastSessions.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Recent Sessions</h2>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/60">
                        <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Subject</th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Duration</th>
                        <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pastSessions.slice(0, 8).map((s) => {
                        const hasNotes = sessionNotes.some((n) => n.sessionId === s.id);
                        const hasHw    = homeworkList.some((h) => h.assignedDate === s.date);
                        return (
                          <tr key={s.id}
                            className="hover:bg-gray-50/60 cursor-pointer transition-colors"
                            onClick={() => setPastSessionDetail(s)}
                          >
                            <td className="px-5 py-3 text-gray-600 font-medium whitespace-nowrap">{formatDate(s.date)}</td>
                            <td className="px-5 py-3 text-gray-900 font-semibold">{s.subject}</td>
                            <td className="px-5 py-3 text-gray-400 hidden sm:table-cell">{s.durationHours} hr</td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {hasNotes && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Notes</span>}
                                {hasHw    && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">HW</span>}
                                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Booking modal ── */}
            {selectedSlot && (balance?.remaining ?? 0) > 0 && (
              <Modal
                onClose={() => { setSelectedSlot(null); setBookError(""); }}
                title="Book Session"
                subtitle={`${formatDate(selectedSlot.date)} at ${selectedSlot.time}`}
              >
                <div className="space-y-4">
                  <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
                    {(["online", "in-person"] as const).map((type, i) => (
                      <button
                        key={type} type="button"
                        onClick={() => setBookSessionType(type)}
                        className={`flex-1 px-4 py-2.5 font-medium transition-colors ${i > 0 ? "border-l border-gray-200" : ""} ${bookSessionType === type ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                      >
                        {type === "online" ? "🎥 Online" : "📍 In-Person"}
                      </button>
                    ))}
                  </div>
                  <select value={bookSubject} onChange={(e) => setBookSubject(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    {student.subjects.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <select value={bookDuration} onChange={(e) => setBookDuration(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value={1}>1 hour</option>
                    <option value={1.5}>1.5 hours</option>
                    <option value={2}>2 hours</option>
                  </select>
                  <textarea value={bookNotes} onChange={(e) => setBookNotes(e.target.value)}
                    placeholder="Any notes for your tutor? (optional)" rows={2}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  {(balance?.remaining ?? 0) < bookDuration && (
                    <p className="text-xs text-amber-600">You only have {balance?.remaining ?? 0} hr remaining. Select a shorter duration.</p>
                  )}
                  {bookError && <p className="text-xs text-red-500">{bookError}</p>}
                  <button onClick={submitBooking} disabled={(balance?.remaining ?? 0) < bookDuration}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Confirm Booking
                  </button>
                </div>
              </Modal>
            )}
          </div>
        );
      })()}

      {/* ── SESSION NOTES ── */}
      {tab === "notes" && (() => {
        const regularNotes = sessionNotes.filter((n) => n.topic !== "_resource_");
        const resourceNotes = sessionNotes.filter((n) => n.topic === "_resource_");
        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Session Notes</h1>
            <p className="text-sm text-gray-500 mb-5">Notes from your tutor about what was covered each session.</p>
            {regularNotes.length === 0 && (
              <p className="text-sm text-gray-400">No session notes yet. Your tutor will add notes after each session.</p>
            )}
            <div className="space-y-4">
              {regularNotes.map((n) => {
                const links = resourceNotes.filter((r) => r.sessionId === n.sessionId && n.sessionId !== null);
                return (
                  <div key={n.id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900 text-base">{n.topic}</p>
                      <p className="text-xs text-gray-400 shrink-0 ml-4">{formatDate(n.createdAt.slice(0, 10))}</p>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{n.notes}</p>
                    {links.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Resources</p>
                        {links.map((r) => (
                          <a key={r.id} href={r.notes} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline">
                            <span>📎</span><span className="truncate">{r.notes}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── UPDATES ── */}
      {tab === "updates" && (() => {
        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Updates from Your Tutor</h1>
            <p className="text-sm text-gray-500 mb-6">Your tutor sends a weekly update summarising progress and what was covered.</p>
            {parentUpdates.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">📬</p>
                <p className="text-sm font-medium">No updates yet.</p>
                <p className="text-xs mt-1">Your tutor will send updates here after sessions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {parentUpdates.map((u) => (
                  <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs text-gray-400 mb-3">{formatDate(u.createdAt.slice(0, 10))}</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{u.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── HOMEWORK ── */}
      {tab === "homework" && (() => {
        const today         = new Date().toISOString().slice(0, 10);
        const pending       = homeworkList.filter((h) => h.status === "pending");
        const submitted     = homeworkList.filter((h) => h.status === "submitted");
        const completedHw   = homeworkList.filter((h) => h.status === "completed");
        const overdue       = pending.filter((h) => !!h.dueDate && h.dueDate < today);
        const urgentPending = pending.filter((h) => !h.dueDate || h.dueDate <= today);
        const futurePending = pending.filter((h) => !!h.dueDate && h.dueDate > today);

        // Table rows by filter
        const tableItems =
          hwFilter === "todo"        ? urgentPending
          : hwFilter === "completed" ? completedHw
          : homeworkList;

        // Upcoming cards: future-due + submitted, only in "To Do" view
        const upcomingCards = hwFilter === "todo" ? [...futurePending, ...submitted] : [];

        const toggleExpand = (id: number) =>
          setHwExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
          });

        const mkStatusBadge = (h: (typeof homeworkList)[0]) => {
          const isOv = h.status === "pending" && !!h.dueDate && h.dueDate < today;
          const isDT = h.status === "pending" && h.dueDate === today;
          if (h.status === "completed")
            return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />Graded</span>;
          if (h.status === "submitted")
            return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />Submitted</span>;
          if (isOv)
            return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />Overdue</span>;
          if (isDT)
            return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />Due Today</span>;
          return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />Upcoming</span>;
        };

        const mkExpandPanel = (h: (typeof homeworkList)[0]) => {
          const file        = hwSelectedFiles[h.id];
          const isUploading = hwUploadingId === h.id;
          const uploadError = hwUploadErrors[h.id];
          return (
            <div className="px-5 py-4 bg-gray-50/60 border-t border-gray-100 space-y-3">
              {h.submissionUrl && h.submissionFilename && (
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
                  <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm font-medium text-gray-700 flex-1 truncate">{h.submissionFilename}</span>
                  <button onClick={() => openSubmission(h)} disabled={hwOpeningId === h.id}
                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold shrink-0 disabled:opacity-50">
                    {hwOpeningId === h.id ? "Opening…" : "Open →"}
                  </button>
                </div>
              )}
              {h.status === "completed" && (h.grade || h.feedback) && (
                <div className="bg-white border border-emerald-200 rounded-xl p-4 space-y-2">
                  {h.grade && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Grade</span>
                      <span className="font-bold text-emerald-700 bg-emerald-100 px-3 py-0.5 rounded-full text-sm">{h.grade}</span>
                    </div>
                  )}
                  {h.feedback && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Tutor Feedback</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{h.feedback}</p>
                    </div>
                  )}
                </div>
              )}
              <div>
                {h.status !== "pending" && (
                  <p className="text-xs text-gray-400 mb-3">
                    {h.status === "submitted"
                      ? "Upload a new file to replace your current submission."
                      : "Upload an improved version below."}
                  </p>
                )}
                {file && (
                  <div className="flex items-center gap-3 mb-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
                    <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700 flex-1 truncate">{file.name}</span>
                    <button onClick={() => setHwSelectedFiles((prev) => { const n = { ...prev }; delete n[h.id]; return n; })}
                      className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors">Remove</button>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer">
                    <input type="file" accept=".pdf,application/pdf" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) setHwSelectedFiles((prev) => ({ ...prev, [h.id]: f })); e.target.value = ""; }} />
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium select-none">
                      <Paperclip className="w-3.5 h-3.5" />{file ? "Change File" : "Attach PDF"}
                    </span>
                  </label>
                  <button onClick={() => handleHomeworkUpload(h)} disabled={!file || isUploading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <Upload className="w-3.5 h-3.5" />{isUploading ? "Submitting…" : "Submit"}
                  </button>
                </div>
                {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
                <p className="text-xs text-gray-400 mt-2">PDF only · Max 10 MB</p>
              </div>
            </div>
          );
        };

        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Homework</h1>
                <p className="text-sm text-gray-400 mt-1">Stay on top of your assignments and never miss a due date.</p>
              </div>
              <button onClick={() => setTab("sessions")}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <Calendar className="w-4 h-4" />View Calendar
              </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              {([
                { label: "To Do",     value: urgentPending.length, sub: urgentPending.length === 1 ? "assignment" : "assignments", Icon: BookOpen,    iconBg: "bg-blue-50",    iconColor: "text-blue-600",    valColor: "text-gray-900"    },
                { label: "Completed", value: completedHw.length,   sub: completedHw.length   === 1 ? "assignment" : "assignments", Icon: CheckCircle, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", valColor: "text-emerald-700" },
                { label: "Late",      value: overdue.length,        sub: overdue.length        === 1 ? "assignment" : "assignments", Icon: AlertCircle, iconBg: overdue.length > 0 ? "bg-red-50" : "bg-gray-50", iconColor: overdue.length > 0 ? "text-red-500" : "text-gray-300", valColor: overdue.length > 0 ? "text-red-600" : "text-gray-300" },
              ] as const).map(({ label, value, sub, Icon, iconBg, iconColor, valColor }, i) => (
                <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.06 }}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                    <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${iconColor}`} />
                    </div>
                  </div>
                  <p className={`text-3xl font-bold ${valColor}`}>{value}</p>
                  <p className="text-xs text-gray-400 mt-1">{sub}</p>
                </motion.div>
              ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-2xl gap-1">
              {([
                { key: "todo"      as const, label: "To Do",          count: urgentPending.length },
                { key: "completed" as const, label: "Completed",      count: completedHw.length   },
                { key: "all"       as const, label: "All Assignments", count: homeworkList.length  },
              ]).map(({ key, label, count }) => (
                <button key={key} onClick={() => setHwFilter(key)}
                  className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${hwFilter === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  {label}{" "}<span className={`text-xs ${hwFilter === key ? "text-blue-600" : "text-gray-400"}`}>({count})</span>
                </button>
              ))}
            </div>

            {/* Main table */}
            {tableItems.length > 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80">
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-3 px-5">Assignment</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-3 px-5 hidden sm:table-cell">Tutor</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-3 px-5 hidden md:table-cell">Due Date</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-3 px-5">Status</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-3 px-5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {tableItems.map((h) => {
                      const isOverdue  = h.status === "pending" && !!h.dueDate && h.dueDate < today;
                      const isExpanded = hwExpandedIds.has(h.id);
                      return (
                        <Fragment key={h.id}>
                          <tr className={`transition-colors ${isExpanded ? "bg-blue-50/20" : "hover:bg-gray-50/60"}`}>
                            <td className="py-4 px-5">
                              <p className="font-semibold text-gray-900 text-sm">{h.task}</p>
                              {h.assignedDate && <p className="text-xs text-gray-400 mt-0.5">Assigned {formatDate(h.assignedDate)}</p>}
                            </td>
                            <td className="py-4 px-5 hidden sm:table-cell">
                              <p className="text-sm text-gray-500">{tutor?.name ?? "—"}</p>
                            </td>
                            <td className="py-4 px-5 hidden md:table-cell">
                              <p className={`text-sm font-medium ${isOverdue ? "text-red-500" : "text-gray-600"}`}>
                                {h.dueDate ? formatDate(h.dueDate) : "No due date"}
                              </p>
                            </td>
                            <td className="py-4 px-5">{mkStatusBadge(h)}</td>
                            <td className="py-4 px-5">
                              <button onClick={() => toggleExpand(h.id)}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border whitespace-nowrap transition-colors ${
                                  isExpanded ? "bg-gray-100 text-gray-600 border-gray-200"
                                  : isOverdue ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
                                  : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                                }`}>
                                {isExpanded ? "Close" : isOverdue ? "Submit Now" : "Start Assignment"}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={5} className="p-0">{mkExpandPanel(h)}</td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-500">
                  {hwFilter === "todo" ? "No urgent assignments — great work!" : hwFilter === "completed" ? "No completed assignments yet." : "No assignments yet."}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {hwFilter === "todo" ? "Your tutor will assign new work after sessions." : ""}
                </p>
              </div>
            )}

            {/* Upcoming Assignments */}
            {upcomingCards.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-3">Upcoming Assignments</h2>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                  {upcomingCards.slice(0, 5).map((h, i) => {
                    const isExpanded = hwExpandedIds.has(h.id);
                    const isOv       = h.status === "pending" && !!h.dueDate && h.dueDate < today;
                    return (
                      <div key={h.id}>
                        <div className="flex items-center gap-4 p-4">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-indigo-600">{i + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{h.task}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{tutor?.name ?? ""}</p>
                          </div>
                          {h.dueDate && (
                            <div className="text-right shrink-0 hidden sm:block">
                              <p className="text-[11px] text-gray-400 font-medium">Due Submission</p>
                              <p className={`text-xs font-semibold mt-0.5 ${isOv ? "text-red-500" : "text-gray-600"}`}>{formatDate(h.dueDate)}</p>
                            </div>
                          )}
                          <div className="hidden md:block shrink-0">{mkStatusBadge(h)}</div>
                          <button onClick={() => toggleExpand(h.id)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border shrink-0 transition-colors ${
                              isExpanded ? "bg-gray-100 text-gray-600 border-gray-200"
                              : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                            }`}>
                            {isExpanded ? "Close" : "Start Assignment"}
                          </button>
                        </div>
                        {isExpanded && mkExpandPanel(h)}
                      </div>
                    );
                  })}
                </div>
                {upcomingCards.length > 5 && (
                  <button onClick={() => setHwFilter("all")}
                    className="mt-3 w-full text-sm text-blue-600 font-semibold py-2 text-center hover:text-blue-700 transition-colors">
                    View All Assignments →
                  </button>
                )}
              </div>
            )}

            {/* Study Tip */}
            {homeworkList.length > 0 && (
              <div className="flex items-start gap-4 bg-blue-50/60 border border-blue-100 rounded-2xl p-5">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 mb-1">Study Tip</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Review your session notes before starting each assignment — it reinforces what you learned and makes the work feel easier.
                  </p>
                </div>
                <button onClick={() => setTab("notes")}
                  className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 bg-white px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap">
                  View Notes
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── HOURS ── */}
      {tab === "hours" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Hours & Package</h1>
            <button
              onClick={() => setShowBuyPanel((v) => !v)}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700"
            >
              + Buy More Hours
            </button>
          </div>

          {purchaseSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm mb-4">
              {purchaseSuccess}
            </div>
          )}

          {showBuyPanel && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Choose a Package</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                {purchaseOptions.map((opt) => (
                  <div key={opt.id} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col">
                    <p className="font-bold text-gray-900 text-lg">{opt.label}</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{opt.priceLabel}</p>
                    <p className="text-xs text-gray-500 mt-1 mb-4">
                      {opt.hours} session hour{opt.hours > 1 ? "s" : ""}
                    </p>
                    <button
                      onClick={() => requestPurchase(opt.label)}
                      className="mt-auto w-full py-2 rounded-lg border border-blue-600 text-blue-600 text-sm font-medium hover:bg-blue-50"
                    >
                      Request Purchase
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                No payment collected here. Admin will confirm and send an invoice.
              </p>
            </div>
          )}

          {balance ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-900">{balance.totalPurchased}-Hour Pack</p>
                <p className="text-sm text-gray-500">Expires {balance.expiresAt}</p>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  {balance.totalUsed}/{balance.totalPurchased} hrs used
                </span>
              </div>
              <p className="text-3xl font-bold text-blue-600">
                {balance.remaining}{" "}
                <span className="text-base font-normal text-gray-500">hours remaining</span>
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6 text-center text-gray-500 text-sm">
              No package yet. Contact MetaMinds to get started.
            </div>
          )}

          <h3 className="font-semibold text-gray-900 mb-3">Session History</h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Subject</th>
                  <th className="px-4 py-3 text-left">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {completed.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 text-gray-700">{formatDate(s.date)}</td>
                    <td className="px-4 py-3 text-gray-700">{s.subject}</td>
                    <td className="px-4 py-3 text-gray-700">{s.durationHours} hr</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── METAMINDS LAB ── */}
      {tab === "lab" && (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
            <FlaskConical className="w-12 h-12 text-blue-500" />
          </div>
          <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 text-xs font-bold px-4 py-2 rounded-full border border-blue-200 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block" />
            Coming Soon
          </span>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">MetaMinds Lab</h2>
          <p className="text-gray-500 max-w-md leading-relaxed mb-2">
            An AI-powered learning environment built just for you. Practice problems, interactive tools, and personalized feedback — all in one place.
          </p>
          <p className="text-sm text-gray-400">We&apos;re building something special. Stay tuned!</p>
        </div>
      )}

    {/* ── PAST SESSION DETAIL MODAL ── */}
    {pastSessionDetail && (() => {
      const ps   = pastSessionDetail;
      const notes = sessionNotes.filter((n) => n.sessionId === ps.id && n.topic !== "_resource_");
      const links = sessionNotes.filter((n) => n.sessionId === ps.id && n.topic === "_resource_");
      const hw    = homeworkList.filter((h) => h.assignedDate === ps.date);
      return (
        <Modal onClose={() => setPastSessionDetail(null)} title="Session Details" size="xl"
          subtitle={`${formatDate(ps.date)} at ${ps.time}`}>
          <div className="space-y-5">
            {/* Header */}
            <div>
              <p className="text-lg font-bold text-gray-900">{ps.subject}</p>
              <p className="text-sm text-gray-500">
                {ps.durationHours} hr · {ps.sessionType}
                {tutor ? ` · with ${tutor.name}` : ""}
              </p>
            </div>

            {/* Session Notes */}
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Session Notes</p>
              {notes.length === 0 ? (
                <p className="text-sm text-gray-400">No notes added for this session.</p>
              ) : (
                <div className="space-y-3">
                  {notes.map((n) => (
                    <div key={n.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <p className="text-xs font-semibold text-blue-600 mb-1">{n.topic}</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{n.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resources */}
            {links.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Resources</p>
                {links.map((n) => (
                  <a key={n.id} href={n.notes} target="_blank" rel="noopener noreferrer"
                    className="block text-sm text-blue-600 underline truncate mb-1">
                    📎 {n.notes}
                  </a>
                ))}
              </div>
            )}

            {/* Homework assigned this session */}
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Homework Assigned</p>
              {hw.length === 0 ? (
                <p className="text-sm text-gray-400">No homework assigned on this day.</p>
              ) : (
                <div className="space-y-2">
                  {hw.map((h) => (
                    <div key={h.id} className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                      <p className="text-sm text-gray-800 flex-1">{h.task}</p>
                      <span className={`shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        h.status === "completed" ? "bg-green-100 text-green-700" :
                        h.status === "submitted" ? "bg-blue-100 text-blue-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {h.status === "completed" ? (h.grade ? h.grade : "Graded") : h.status === "submitted" ? "Submitted" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      );
    })()}

    </DashboardShell>
  );
}
