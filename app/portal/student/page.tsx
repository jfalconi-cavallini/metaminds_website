"use client";

import { useEffect, useState, useCallback } from "react";
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
import {
  LayoutDashboard, Calendar, FileText, Bell, BookOpen,
  Clock, FlaskConical, Plus, ChevronRight, CalendarDays,
} from "lucide-react";

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
      {tab === "sessions" && (
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
              <p className="text-sm text-gray-400 mt-1">View and manage your upcoming tutoring sessions.</p>
            </div>
            {(balance?.remaining ?? 0) > 0 ? (
              <button
                onClick={() => {
                  document.getElementById("weekly-calendar")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
              >
                <Plus className="w-4 h-4" />
                Book Session
              </button>
            ) : (
              <button
                onClick={() => setTab("hours")}
                className="shrink-0 text-sm font-semibold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-xl transition-colors"
              >
                Buy Hours →
              </button>
            )}
          </div>

          {/* Upcoming Sessions card grid */}
          {upcoming.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Upcoming Sessions</h2>
                <span className="text-xs text-gray-400">{upcoming.length} booked</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {upcoming.map((s) => {
                  const isToday = s.date === todayIso;
                  const hrs    = hoursUntilSession(s);
                  const locked = hrs < CANCEL_LOCK_HOURS;
                  const inPerson = s.sessionType === "in-person";

                  return (
                    <div key={s.id} className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm transition-shadow hover:shadow-md ${
                      isToday ? "border-blue-300" : "border-gray-100"
                    }`}>
                      <div className={`h-1 ${isToday ? "bg-blue-600" : inPerson ? "bg-violet-500" : "bg-gray-200"}`} />
                      <div className="p-4">
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                          isToday ? "text-blue-600" : "text-gray-400"
                        }`}>
                          {isToday ? "Today" : formatDate(s.date)} · {s.time}
                        </p>
                        <p className="font-bold text-gray-900 text-base leading-snug truncate">{s.subject}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            inPerson
                              ? "bg-violet-50 text-violet-600"
                              : "bg-blue-50 text-blue-600"
                          }`}>
                            {inPerson ? "In-Person" : "Online"}
                          </span>
                          <span className="text-[11px] text-gray-400">{s.durationHours} hr</span>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          {s.zoomLink ? (
                            <button
                              onClick={() => window.open(resolveZoomUrl(s.zoomLink!), "_blank", "noopener,noreferrer")}
                              className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              Join Zoom <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span />
                          )}
                          {locked ? (
                            <span className="text-xs text-gray-300 italic">Locked</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleReschedule(s)}
                                disabled={cancellingId === s.id}
                                className="text-xs text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-40"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => handleCancelSession(s)}
                                disabled={cancellingId === s.id}
                                className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                              >
                                {cancellingId === s.id ? "Cancelling…" : "Cancel"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Banners */}
          {availability.length === 0 && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl px-4 py-3 text-sm">
              Your tutor hasn&apos;t set their availability yet. Check back soon or contact MetaMinds support.
            </div>
          )}
          {bookSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm mb-4">
              Session booked! It&apos;s now blocked on your tutor&apos;s calendar.
            </div>
          )}
          {cancelError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
              {cancelError}
            </div>
          )}

          {/* Weekly calendar */}
          <div id="weekly-calendar">
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
            />
          </div>

          {/* Past sessions */}
          {(() => {
            const pastSessions = mySessions
              .filter((s) => s.status === "completed" || (s.status === "upcoming" && s.date < todayIso))
              .sort((a, b) => b.date.localeCompare(a.date));
            if (pastSessions.length === 0) return null;
            return (
              <div className="mt-8">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Past Sessions</h2>
                <div className="space-y-2">
                  {pastSessions.map((s) => {
                    const hasNotes = sessionNotes.some((n) => n.sessionId === s.id);
                    const hasHw    = homeworkList.some((h) => h.assignedDate === s.date);
                    return (
                      <div key={s.id}
                        className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-blue-200 hover:shadow-sm transition-all"
                        onClick={() => setPastSessionDetail(s)}
                      >
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{s.subject}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDate(s.date)} · {s.time} · {s.durationHours} hr · {s.sessionType}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasNotes && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Notes</span>}
                          {hasHw    && <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">Homework</span>}
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Booking modal */}
          {selectedSlot && (balance?.remaining ?? 0) > 0 && (
            <Modal
              onClose={() => { setSelectedSlot(null); setBookError(""); }}
              title="Book Session"
              subtitle={`${formatDate(selectedSlot.date)} at ${selectedSlot.time}`}
            >
              <div className="space-y-4">
                {/* Online / In-Person */}
                <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                  {(["online", "in-person"] as const).map((type, i) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setBookSessionType(type)}
                      className={`flex-1 px-4 py-2.5 font-medium transition-colors ${i > 0 ? "border-l border-gray-200" : ""} ${bookSessionType === type ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                    >
                      {type === "online" ? "Online" : "In-Person"}
                    </button>
                  ))}
                </div>

                {/* Subject */}
                <select
                  value={bookSubject}
                  onChange={(e) => setBookSubject(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                >
                  {student.subjects.map((s) => <option key={s}>{s}</option>)}
                </select>

                {/* Duration */}
                <select
                  value={bookDuration}
                  onChange={(e) => setBookDuration(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                >
                  <option value={1}>1 hour</option>
                  <option value={1.5}>1.5 hours</option>
                  <option value={2}>2 hours</option>
                </select>

                {/* Notes */}
                <textarea
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  placeholder="Any notes for your tutor? (optional)"
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm resize-none"
                />

                {(balance?.remaining ?? 0) < bookDuration && (
                  <p className="text-xs text-amber-600">You only have {balance?.remaining ?? 0} hr remaining. Select a shorter duration.</p>
                )}

                {bookError && <p className="text-xs text-red-500">{bookError}</p>}

                <button
                  onClick={submitBooking}
                  disabled={(balance?.remaining ?? 0) < bookDuration}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Confirm Booking
                </button>
              </div>
            </Modal>
          )}
        </div>
      )}

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
        const today = new Date().toISOString().slice(0, 10);
        const pending   = homeworkList.filter((h) => h.status === "pending");
        const submitted = homeworkList.filter((h) => h.status === "submitted");
        const completed = homeworkList.filter((h) => h.status === "completed");

        const AssignmentCard = ({ h }: { h: (typeof homeworkList)[0] }) => {
          const isOverdue = h.dueDate && h.dueDate < today && h.status === "pending";
          const file = hwSelectedFiles[h.id];
          const isUploading = hwUploadingId === h.id;
          const uploadError = hwUploadErrors[h.id];

          const borderColor =
            h.status === "completed" ? "border-green-200" :
            h.status === "submitted" ? "border-blue-200" :
            isOverdue               ? "border-red-200"  : "border-gray-200";

          const statusChip =
            h.status === "completed" ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />GRADED
              </span>
            ) : h.status === "submitted" ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />SUBMITTED
              </span>
            ) : isOverdue ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />OVERDUE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />PENDING
              </span>
            );

          return (
            <div className={`bg-white rounded-xl border-2 ${borderColor} overflow-hidden`}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  {statusChip}
                  {h.dueDate && h.status === "pending" && (
                    <span className={`text-xs font-medium ${isOverdue ? "text-red-500" : "text-gray-400"}`}>
                      Due {formatDate(h.dueDate)}{isOverdue ? " — Overdue" : ""}
                    </span>
                  )}
                </div>
                <p className="font-semibold text-gray-900 text-lg leading-snug mb-1">{h.task}</p>
                <p className="text-xs text-gray-400">
                  Assigned {formatDate(h.assignedDate)}
                  {h.dueDate && h.status !== "pending" ? ` · Due ${formatDate(h.dueDate)}` : ""}
                  {h.submittedAt ? ` · Submitted ${formatDate(h.submittedAt.slice(0, 10))}` : ""}
                </p>
              </div>

              {/* Submission area */}
              <div className={`border-t px-5 py-4 ${h.status === "completed" ? "bg-green-50 border-green-100" : h.status === "submitted" ? "bg-blue-50 border-blue-100" : "bg-gray-50 border-gray-100"}`}>

                {/* Already submitted — show file */}
                {h.submissionUrl && h.submissionFilename && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">📄</span>
                    <span className="text-sm font-medium text-gray-800 flex-1 truncate">{h.submissionFilename}</span>
                    <button onClick={() => openSubmission(h)} disabled={hwOpeningId === h.id}
                      className="text-sm text-blue-600 hover:underline font-semibold shrink-0 disabled:opacity-50">
                      {hwOpeningId === h.id ? "Opening…" : "View →"}
                    </button>
                  </div>
                )}

                {/* Grade + comments from tutor */}
                {h.status === "completed" && (h.grade || h.feedback) && (
                  <div className="mb-3 bg-white border border-green-200 rounded-xl p-3 space-y-2">
                    {h.grade && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Grade</span>
                        <span className="text-base font-bold text-green-700 bg-green-100 px-3 py-0.5 rounded-full">{h.grade}</span>
                      </div>
                    )}
                    {h.feedback && (
                      <div>
                        <p className="text-xs font-semibold text-green-700 mb-0.5">Tutor Comments</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{h.feedback}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Pending: file upload */}
                {h.status === "pending" && (
                  <div>
                    {/* Selected file preview */}
                    {file && (
                      <div className="flex items-center gap-2 mb-3 bg-white border border-gray-200 rounded-lg px-3 py-2">
                        <span>📄</span>
                        <span className="text-sm text-gray-700 flex-1 truncate">{file.name}</span>
                        <button
                          onClick={() => setHwSelectedFiles((prev) => { const n = { ...prev }; delete n[h.id]; return n; })}
                          className="text-xs text-gray-400 hover:text-red-500 font-medium shrink-0 transition-colors">
                          Remove
                        </button>
                      </div>
                    )}

                    {/* Two action buttons */}
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) setHwSelectedFiles((prev) => ({ ...prev, [h.id]: f }));
                            e.target.value = "";
                          }}
                        />
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium select-none">
                          📎 {file ? "Change File" : "Attach Document"}
                        </span>
                      </label>
                      <button
                        onClick={() => handleHomeworkUpload(h)}
                        disabled={!file || isUploading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        {isUploading ? "Submitting…" : "Submit Assignment"}
                      </button>
                    </div>

                    {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
                    <p className="text-xs text-gray-400 mt-2">PDF only · Max 10 MB</p>
                  </div>
                )}

                {h.status === "submitted" && (
                  <p className="text-xs text-blue-600 font-medium">Submitted — awaiting tutor review</p>
                )}
              </div>
            </div>
          );
        };

        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
              <div className="flex gap-2 text-xs font-medium">
                {pending.length > 0 && (
                  <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full">
                    {pending.length} pending
                  </span>
                )}
                {submitted.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                    {submitted.length} submitted
                  </span>
                )}
              </div>
            </div>

            {homeworkList.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">📚</p>
                <p className="text-sm font-medium">No assignments yet.</p>
                <p className="text-xs mt-1">Your tutor will assign work here.</p>
              </div>
            )}

            <div className="space-y-4">
              {[...pending, ...submitted, ...completed].map((h) => (
                <AssignmentCard key={h.id} h={h} />
              ))}
            </div>
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
