"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import Badge from "@/components/portal/Badge";
import StatCard from "@/components/portal/StatCard";
import { formatDate, formatTime24to12, resolveZoomUrl } from "@/lib/portal/utils";
import AvailabilityGrid from "@/components/portal/AvailabilityGrid";
import WeeklyCalendar from "@/components/portal/WeeklyCalendar";
import Modal from "@/components/portal/Modal";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  fetchTutorById, fetchStudents, fetchSessionsByTutor, fetchAllPackages,
  fetchTutorAvailability, insertSession, cancelSession,
  updateTutorLeadTime, upsertTutorAvailability,
  fetchSessionNotesByTutor, insertSessionNote,
  fetchHomeworkByTutor, insertHomework,
  addHomeworkFeedback, markHomeworkComplete,
  updateSessionZoomLink, updateSession,
  fetchBlockedDates, addBlockedDate, removeBlockedDate,
  fetchParentUpdatesByTutor, insertParentUpdate,
  autoCompletePastSessions,
  fetchBlockedSlots, toggleBlockedSlot,
  updateSessionNote, deleteSessionNote,
} from "@/lib/portal/db";
import type {
  Student, Tutor, Session, HoursBalance, TutorAvailability,
  SessionNote, Homework, BlockedDate, ParentUpdate, BlockedSlot,
} from "@/lib/portal/types";

function ProfileRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm mb-1">
      <span className="text-gray-400 w-16 shrink-0">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TIME_OPTIONS = (() => {
  const opts: string[] = [];
  for (let h = 6; h < 24; h++) {
    const ampm = h >= 12 ? "PM" : "AM";
    const h12  = h % 12 || 12;
    opts.push(`${h12}:00 ${ampm}`);
    opts.push(`${h12}:30 ${ampm}`);
  }
  return opts;
})();

const navItems = [
  { id: "overview",  label: "Overview"      },
  { id: "students",  label: "My Students"   },
  { id: "schedule",  label: "Schedule"      },
  { id: "notes",     label: "Session Notes" },
  { id: "homework",  label: "Homework"      },
];


export default function TutorPortal() {
  const { user, authLoaded } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("overview");

  const handleTabChange = useCallback((id: string) => {
    setTab(id);
  }, []);

  // Remote data
  const [tutor,         setTutor]         = useState<Tutor | null>(null);
  const [myStudents,    setMyStudents]     = useState<Student[]>([]);
  const [localSessions, setLocalSessions]  = useState<Session[]>([]);
  const [balances,      setBalances]       = useState<HoursBalance[]>([]);
  const [availability,  setAvailability]   = useState<TutorAvailability[]>([]);
  const [sessionNotes,  setSessionNotes]   = useState<SessionNote[]>([]);
  const [homework,      setHomework]       = useState<Homework[]>([]);
  const [blockedDates,  setBlockedDates]   = useState<BlockedDate[]>([]);
  const [blockedSlots,  setBlockedSlots]   = useState<BlockedSlot[]>([]);
  const [calendarMode,  setCalendarMode]   = useState<"schedule" | "block">("schedule");
  const [loading,       setLoading]        = useState(true);

  useEffect(() => {
    if (!authLoaded) return;
    if (!user || user.role !== "tutor" || !user.linkedId) {
      router.push("/login");
      return;
    }
    const tutorId = user.linkedId;

    async function load() {
      try {
        await autoCompletePastSessions();
        const [t, allStudents, sess, pkgs, avail, notes, hw, blocked, pu, bs] = await Promise.all([
          fetchTutorById(tutorId),
          fetchStudents(),
          fetchSessionsByTutor(tutorId),
          fetchAllPackages(),
          fetchTutorAvailability(tutorId),
          fetchSessionNotesByTutor(tutorId),
          fetchHomeworkByTutor(tutorId),
          fetchBlockedDates(tutorId),
          fetchParentUpdatesByTutor(tutorId),
          fetchBlockedSlots(tutorId),
        ]);
        setTutor(t);
        setMyStudents(allStudents.filter((s) => t?.assignedStudentIds.includes(s.id) ?? false));
        setLocalSessions(sess);
        setBalances(pkgs);
        setAvailability(avail);
        setSessionNotes(notes);
        setHomework(hw);
        setBlockedDates(blocked);
        setParentUpdates(pu);
        setBlockedSlots(bs);
      } catch (err) { console.error("Tutor load error:", err); }
      finally { setLoading(false); }
    }
    load();
  }, [authLoaded, user, router]);

  const tutorId = user?.linkedId ?? 0;

  // Realtime: see student homework submissions without page refresh
  useEffect(() => {
    if (!authLoaded || !user?.linkedId) return;
    const tid = user.linkedId;
    const channel = supabase
      .channel(`tutor-live-${tid}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "homework",
        filter: `tutor_id=eq.${tid}`,
      }, () => {
        fetchHomeworkByTutor(tid).then(setHomework).catch(console.error);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [authLoaded, user?.linkedId]);

  // ── SCHEDULE SESSION ────────────────────────────────────────────
  const [selectedSlot,     setSelectedSlot]     = useState<{ date: string; time: string } | null>(null);
  const [schedStudentId,   setSchedStudentId]   = useState("");
  const [schedSubject,     setSchedSubject]     = useState("");
  const [schedDuration,    setSchedDuration]    = useState("1");
  const [schedSessionType, setSchedSessionType] = useState<"online" | "in-person">("online");
  const [schedZoom,        setSchedZoom]        = useState("");
  const [schedSuccess,     setSchedSuccess]     = useState(false);
  const [schedError,       setSchedError]       = useState("");

  // ── BOOKING LEAD TIME ───────────────────────────────────────────
  const [leadHours,  setLeadHours]  = useState<24 | 48>(24);
  const [leadSaved,  setLeadSaved]  = useState(false);
  const [leadSaving, setLeadSaving] = useState(false);
  const [leadError,  setLeadError]  = useState("");

  // ── CANCEL SESSION ──────────────────────────────────────────────
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // ── AVAILABILITY EDITOR ─────────────────────────────────────────
  const [availSlots,  setAvailSlots]  = useState<{ dayOfWeek: number; startTime: string; endTime: string }[]>([]);
  const [availDay,    setAvailDay]    = useState("1");
  const [availStart,  setAvailStart]  = useState("");
  const [availEnd,    setAvailEnd]    = useState("");
  const [availSaved,  setAvailSaved]  = useState(false);
  const [availSaving, setAvailSaving] = useState(false);

  // ── SESSION NOTES FORM ──────────────────────────────────────────
  const [noteStudentId, setNoteStudentId] = useState("");
  const [noteTopic,     setNoteTopic]     = useState("");
  const [noteText,      setNoteText]      = useState("");
  const [noteSaving,    setNoteSaving]    = useState(false);
  const [noteSuccess,   setNoteSuccess]   = useState(false);
  const [noteError,     setNoteError]     = useState("");

  // ── HOMEWORK FORM ───────────────────────────────────────────────
  const [hwStudentId, setHwStudentId] = useState("");
  const [hwTask,      setHwTask]      = useState("");
  const [hwDue,       setHwDue]       = useState("");
  const [hwSaving,    setHwSaving]    = useState(false);
  const [hwSuccess,   setHwSuccess]   = useState(false);
  const [hwError,     setHwError]     = useState("");
  const [hwShowForm,  setHwShowForm]  = useState(false);

  // ── HOMEWORK FEEDBACK ────────────────────────────────────────────
  const [hwFeedbackId,     setHwFeedbackId]     = useState<number | null>(null);
  const [hwFeedbackText,   setHwFeedbackText]   = useState("");
  const [hwGradeText,      setHwGradeText]      = useState("");
  const [hwFeedbackSaving, setHwFeedbackSaving] = useState(false);
  const [hwOpeningId,      setHwOpeningId]      = useState<number | null>(null);

  // ── STUDENT PROFILE MODAL ───────────────────────────────────────
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);

  // ── BLOCKED DATES ───────────────────────────────────────────────
  const [blockDateInput, setBlockDateInput] = useState("");
  const [blockReason,    setBlockReason]    = useState("");
  const [blockSaving,    setBlockSaving]    = useState(false);
  const [blockError,     setBlockError]     = useState("");

  // ── SESSION DETAIL MODAL ────────────────────────────────────────
  const [sessionDetail,   setSessionDetail]   = useState<Session | null>(null);
  const [sdNoteTopic,     setSdNoteTopic]     = useState("");
  const [sdNoteText,      setSdNoteText]      = useState("");
  const [sdNoteLink,      setSdNoteLink]      = useState("");
  const [sdNoteSaving,    setSdNoteSaving]    = useState(false);
  const [sdNoteSuccess,   setSdNoteSuccess]   = useState(false);
  const [sdNoteError,     setSdNoteError]     = useState("");

  // ── ZOOM LINK ───────────────────────────────────────────────────
  const [zoomEditId,  setZoomEditId]  = useState<number | null>(null);
  const [zoomEditVal, setZoomEditVal] = useState("");
  const [zoomSaving,  setZoomSaving]  = useState(false);

  // ── NOTE EDIT ────────────────────────────────────────────────────
  const [noteEditId,    setNoteEditId]    = useState<number | null>(null);
  const [noteEditTopic, setNoteEditTopic] = useState("");
  const [noteEditText,  setNoteEditText]  = useState("");
  const [noteEditSaving, setNoteEditSaving] = useState(false);

  // ── STUDENT PANEL ────────────────────────────────────────────────
  const [selectedStudentId,   setSelectedStudentId]   = useState<number | null>(null);
  const [studentPanelTab,     setStudentPanelTab]     = useState<"homework" | "sessions" | "update">("homework");
  const [panelHwShowForm,     setPanelHwShowForm]     = useState(false);
  const [panelHwTask,         setPanelHwTask]         = useState("");
  const [panelHwDue,          setPanelHwDue]          = useState("");
  const [panelHwSaving,       setPanelHwSaving]       = useState(false);
  const [panelHwSuccess,      setPanelHwSuccess]      = useState(false);
  const [panelHwError,        setPanelHwError]        = useState("");

  // ── PARENT UPDATES ───────────────────────────────────────────────
  const [parentUpdates,        setParentUpdates]        = useState<ParentUpdate[]>([]);
  const [parentUpdateText,     setParentUpdateText]     = useState("");
  const [parentUpdateSaving,   setParentUpdateSaving]   = useState(false);
  const [parentUpdateSuccess,  setParentUpdateSuccess]  = useState(false);
  const [puSelectedSessionIds, setPuSelectedSessionIds] = useState<number[]>([]);

  // ── SESSION EDIT ─────────────────────────────────────────────────
  const [editingSession,  setEditingSession]  = useState(false);
  const [sdEditDate,      setSdEditDate]      = useState("");
  const [sdEditTime,      setSdEditTime]      = useState("");
  const [sdEditDuration,  setSdEditDuration]  = useState("1");
  const [sdEditSubject,   setSdEditSubject]   = useState("");
  const [sdEditType,      setSdEditType]      = useState<"online" | "in-person">("online");
  const [sdEditSaving,    setSdEditSaving]    = useState(false);
  const [sdEditError,     setSdEditError]     = useState("");

  // Sync defaults once students load
  useEffect(() => {
    if (myStudents.length > 0) {
      if (!schedStudentId) setSchedStudentId(String(myStudents[0].id));
      if (!noteStudentId)  setNoteStudentId(String(myStudents[0].id));
      if (!hwStudentId)    setHwStudentId(String(myStudents[0].id));
    }
  }, [myStudents, schedStudentId, noteStudentId, hwStudentId]);

  // Sync availability and lead time from DB
  useEffect(() => {
    setAvailSlots(availability.map((a) => ({ dayOfWeek: a.dayOfWeek, startTime: a.startTime, endTime: a.endTime })));
  }, [availability]);

  useEffect(() => {
    if (tutor) setLeadHours(tutor.bookingLeadHours === 48 ? 48 : 24);
  }, [tutor]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const upcoming = localSessions
    .filter((s) => s.status === "upcoming" && s.date >= todayIso)
    .sort((a, b) => a.date.localeCompare(b.date));

  function getStudent(id: number) { return myStudents.find((s) => s.id === id); }

  function timeTo24h(time: string): string {
    const m = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!m) return time;
    let h = parseInt(m[1]);
    if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
    if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${m[2]}`;
  }

  // ── HANDLERS ────────────────────────────────────────────────────

  async function submitSchedule() {
    if (!selectedSlot || !schedSubject || !schedStudentId) return;
    setSchedError("");
    try {
      const newSession = await insertSession({
        studentId: Number(schedStudentId), tutorId,
        subject: schedSubject, sessionDate: selectedSlot.date,
        sessionTime: selectedSlot.time, durationHours: Number(schedDuration),
        sessionType: schedSessionType,
      });
      if (schedZoom) await updateSessionZoomLink(newSession.id, schedZoom);
      setLocalSessions((prev) => [...prev, { ...newSession, zoomLink: schedZoom || undefined }]);
      setSchedSuccess(true);
      setSelectedSlot(null); setSchedSubject(""); setSchedDuration("1"); setSchedSessionType("online"); setSchedZoom("");
      setTimeout(() => setSchedSuccess(false), 4000);
    } catch { setSchedError("Failed to schedule session."); }
  }

  async function saveLeadTime() {
    setLeadSaving(true); setLeadError("");
    try {
      await updateTutorLeadTime(tutorId, leadHours);
      setLeadSaved(true); setTimeout(() => setLeadSaved(false), 3000);
    } catch (e: unknown) {
      setLeadError(e instanceof Error ? e.message : "Failed to save. Make sure migration 003 has been run in Supabase.");
    } finally { setLeadSaving(false); }
  }

  async function handleCancelSession(session: Session) {
    setCancellingId(session.id);
    try {
      await cancelSession(session.id, session.durationHours, session.studentId);
      setLocalSessions((prev) => prev.map((s) => s.id === session.id ? { ...s, status: "cancelled" } : s));
      setBalances((prev) => prev.map((b) =>
        b.studentId === session.studentId
          ? { ...b, totalUsed: Math.max(0, b.totalUsed - session.durationHours), remaining: b.remaining + session.durationHours }
          : b
      ));
    } catch { /* silent */ } finally { setCancellingId(null); }
  }

  function openSessionEdit(sd: Session) {
    setSdEditDate(sd.date);
    setSdEditTime(timeTo24h(sd.time));
    setSdEditDuration(String(sd.durationHours));
    setSdEditSubject(sd.subject);
    setSdEditType(sd.sessionType);
    setSdEditError("");
    setEditingSession(true);
  }

  async function saveSessionEdit() {
    if (!sessionDetail || !sdEditDate || !sdEditTime || !sdEditSubject) return;
    setSdEditSaving(true); setSdEditError("");
    try {
      const updated = await updateSession(sessionDetail.id, {
        sessionDate:   sdEditDate,
        sessionTime:   formatTime24to12(sdEditTime),
        durationHours: Number(sdEditDuration),
        subject:       sdEditSubject,
        sessionType:   sdEditType,
      });
      setLocalSessions((prev) => prev.map((s) => s.id === updated.id ? updated : s));
      setSessionDetail(updated);
      setEditingSession(false);
    } catch {
      setSdEditError("Failed to save. Please try again.");
    } finally {
      setSdEditSaving(false);
    }
  }

  async function saveZoomLink(sessionId: number) {
    setZoomSaving(true);
    try {
      await updateSessionZoomLink(sessionId, zoomEditVal);
      const updated = zoomEditVal || undefined;
      setLocalSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, zoomLink: updated } : s));
      if (sessionDetail?.id === sessionId) setSessionDetail((prev) => prev ? { ...prev, zoomLink: updated } : prev);
      setZoomEditId(null);
    } catch { /* silent */ } finally { setZoomSaving(false); }
  }

  async function saveNoteEdit(noteId: number) {
    if (!noteEditTopic.trim() || !noteEditText.trim()) return;
    setNoteEditSaving(true);
    try {
      const updated = await updateSessionNote(noteId, noteEditTopic.trim(), noteEditText.trim());
      setSessionNotes((prev) => prev.map((n) => n.id === noteId ? updated : n));
      setNoteEditId(null);
    } catch { /* silent */ } finally { setNoteEditSaving(false); }
  }

  async function removeSessionNote(noteId: number) {
    try {
      await deleteSessionNote(noteId);
      setSessionNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (noteEditId === noteId) setNoteEditId(null);
    } catch { /* silent */ }
  }

  async function submitSessionDetailNote() {
    if (!sdNoteTopic || !sdNoteText || !sessionDetail) { setSdNoteError("Fill in topic and notes."); return; }
    setSdNoteSaving(true); setSdNoteError("");
    try {
      const note = await insertSessionNote({
        tutorId, studentId: sessionDetail.studentId,
        topic: sdNoteTopic, notes: sdNoteText, sessionId: sessionDetail.id,
      });
      setSessionNotes((prev) => [note, ...prev]);
      if (sdNoteLink.trim()) {
        const linkNote = await insertSessionNote({
          tutorId, studentId: sessionDetail.studentId,
          topic: "_resource_", notes: sdNoteLink.trim(), sessionId: sessionDetail.id,
        });
        setSessionNotes((prev) => [linkNote, ...prev]);
      }
      setSdNoteTopic(""); setSdNoteText(""); setSdNoteLink("");
      setSdNoteSuccess(true); setTimeout(() => setSdNoteSuccess(false), 3000);
    } catch { setSdNoteError("Failed to save note."); }
    finally { setSdNoteSaving(false); }
  }

  async function submitNote() {
    if (!noteTopic || !noteText || !noteStudentId) { setNoteError("Fill in student, topic, and notes."); return; }
    setNoteSaving(true); setNoteError("");
    try {
      const note = await insertSessionNote({ tutorId, studentId: Number(noteStudentId), topic: noteTopic, notes: noteText });
      setSessionNotes((prev) => [note, ...prev]);
      setNoteTopic(""); setNoteText("");
      setNoteSuccess(true); setTimeout(() => setNoteSuccess(false), 4000);
    } catch { setNoteError("Failed to save notes."); }
    finally { setNoteSaving(false); }
  }

  async function submitHomework() {
    if (!hwTask || !hwStudentId) { setHwError("Fill in student and task."); return; }
    setHwSaving(true); setHwError("");
    try {
      const hw = await insertHomework({ tutorId, studentId: Number(hwStudentId), task: hwTask, dueDate: hwDue || undefined });
      setHomework((prev) => [hw, ...prev]);
      setHwTask(""); setHwDue("");
      setHwSuccess(true); setTimeout(() => setHwSuccess(false), 4000);
    } catch { setHwError("Failed to assign homework."); }
    finally { setHwSaving(false); }
  }

  async function openSubmission(hw: { id: number; submissionUrl?: string; submissionFilename?: string }) {
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

  async function saveFeedback(hwId: number) {
    if (!hwFeedbackText.trim()) return;
    setHwFeedbackSaving(true);
    try {
      const updated = await addHomeworkFeedback(hwId, hwFeedbackText.trim(), hwGradeText.trim() || undefined);
      setHomework((prev) => prev.map((h) => h.id === hwId ? updated : h));
      setHwFeedbackId(null);
      setHwFeedbackText("");
      setHwGradeText("");
    } catch { /* silent */ } finally { setHwFeedbackSaving(false); }
  }

  async function completeHomework(hwId: number) {
    try {
      const updated = await markHomeworkComplete(hwId);
      setHomework((prev) => prev.map((h) => h.id === hwId ? updated : h));
    } catch { /* silent */ }
  }

  async function submitPanelHomework(studentId: number) {
    if (!panelHwTask.trim()) return;
    setPanelHwSaving(true); setPanelHwError(""); setPanelHwSuccess(false);
    try {
      const hw = await insertHomework({ tutorId, studentId, task: panelHwTask.trim(), dueDate: panelHwDue || undefined });
      setHomework((prev) => [hw, ...prev]);
      setPanelHwTask(""); setPanelHwDue(""); setPanelHwShowForm(false);
      setPanelHwSuccess(true); setTimeout(() => setPanelHwSuccess(false), 3000);
    } catch { setPanelHwError("Failed to assign. Please try again."); }
    finally { setPanelHwSaving(false); }
  }

  async function sendParentUpdate(studentId: number) {
    if (!parentUpdateText.trim()) return;
    setParentUpdateSaving(true); setParentUpdateSuccess(false);
    try {
      const update = await insertParentUpdate(tutorId, studentId, parentUpdateText.trim(), puSelectedSessionIds);
      setParentUpdates((prev) => [update, ...prev]);
      // Fire email non-blocking — failures don't block the UI
      fetch("/api/portal/send-parent-update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tutorId, studentId, message: parentUpdateText.trim(), sessionIds: puSelectedSessionIds }),
      }).catch(console.error);
      setParentUpdateText("");
      setPuSelectedSessionIds([]);
      setParentUpdateSuccess(true); setTimeout(() => setParentUpdateSuccess(false), 3000);
    } catch { /* silent */ }
    finally { setParentUpdateSaving(false); }
  }

  async function addBlockDate() {
    if (!blockDateInput) return;
    setBlockSaving(true); setBlockError("");
    try {
      const bd = await addBlockedDate(tutorId, blockDateInput, blockReason || undefined);
      setBlockedDates((prev) => [...prev, bd].sort((a, b) => a.blockedDate.localeCompare(b.blockedDate)));
      setBlockDateInput(""); setBlockReason("");
    } catch { setBlockError("Failed to block date. Make sure migration 004 has been run."); }
    finally { setBlockSaving(false); }
  }

  async function deleteBlockDate(id: number) {
    try {
      await removeBlockedDate(id);
      setBlockedDates((prev) => prev.filter((b) => b.id !== id));
    } catch { /* silent */ }
  }

  function addAvailSlot() {
    if (!availStart || !availEnd) return;
    setAvailSlots((prev) => [...prev, { dayOfWeek: Number(availDay), startTime: availStart, endTime: availEnd }]);
    setAvailStart(""); setAvailEnd("");
  }

  function removeAvailSlot(i: number) {
    setAvailSlots((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function saveAvailability() {
    setAvailSaving(true);
    try {
      await upsertTutorAvailability(tutorId, availSlots);
      setAvailability(availSlots.map((s, i) => ({ id: i, tutorId, ...s })));
      setAvailSaved(true); setTimeout(() => setAvailSaved(false), 3000);
    } catch { /* silent */ } finally { setAvailSaving(false); }
  }

  if (!authLoaded || loading) {
    return (
      <DashboardShell role="tutor" userName="Loading…" navItems={navItems} activeTab={tab} onTabChange={handleTabChange}>
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading your dashboard…</div>
      </DashboardShell>
    );
  }

  if (!tutor) {
    return (
      <DashboardShell role="tutor" userName="Tutor" navItems={navItems} activeTab={tab} onTabChange={handleTabChange}>
        <div className="flex items-center justify-center h-64 text-red-500 text-sm">Could not load your data. Check your Supabase connection.</div>
      </DashboardShell>
    );
  }

  return (
    <>
    <DashboardShell role="tutor" userName={user?.fullName ?? tutor.name} navItems={navItems} activeTab={tab} onTabChange={handleTabChange}>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (() => {
        const todaySessions  = upcoming.filter((s) => s.date === todayIso).sort((a, b) => timeTo24h(a.time).localeCompare(timeTo24h(b.time)));
        const futureSessions = upcoming.filter((s) => s.date > todayIso);
        const hwNeedsGrading = homework.filter((h) => h.status === "submitted");
        const weekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const studentsNeedingUpdate = myStudents.filter((st) => {
          const pastSessions = localSessions.filter((s) =>
            s.studentId === st.id && (s.status === "completed" || s.date < todayIso)
          );
          if (pastSessions.length === 0) return false;
          const lastUpdate = parentUpdates
            .filter((u) => u.studentId === st.id)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
          const lastUpdateDate = lastUpdate?.createdAt.slice(0, 10) ?? "0000-00-00";
          return pastSessions.some((s) => s.date >= weekAgoIso && s.date > lastUpdateDate);
        });
        const hasActionItems = hwNeedsGrading.length > 0 || studentsNeedingUpdate.length > 0;

        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Welcome, {user?.fullName ?? tutor.name}</h1>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <StatCard label="My Students"       value={myStudents.length} />
              <StatCard label="Upcoming Sessions" value={upcoming.length}   />
              <StatCard label="Notes Written"     value={sessionNotes.length} />
            </div>

            {/* Today's Agenda */}
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Today&apos;s Agenda</h2>
            {todaySessions.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-sm text-gray-500 mb-8">
                No sessions today.
              </div>
            ) : (
              <div className="space-y-3 mb-8">
                {todaySessions.map((s) => {
                  const st = getStudent(s.studentId);
                  const studentHw = homework.filter((h) => h.studentId === s.studentId && h.status === "submitted");
                  const lastNote = sessionNotes.filter((n) => n.studentId === s.studentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
                  const lastUpdate = parentUpdates.filter((u) => u.studentId === s.studentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
                  const updateDays = lastUpdate ? Math.floor((Date.now() - new Date(lastUpdate.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : null;
                  const weekAgoIso2 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                  const pastSessionsForStudent = localSessions.filter((ps) =>
                    ps.studentId === s.studentId && (ps.status === "completed" || ps.date < todayIso)
                  );
                  const lastUpdateDate2 = lastUpdate?.createdAt.slice(0, 10) ?? "0000-00-00";
                  const updateOverdue = pastSessionsForStudent.length > 0 &&
                    pastSessionsForStudent.some((ps) => ps.date >= weekAgoIso2 && ps.date > lastUpdateDate2);

                  return (
                    <div key={s.id} className="bg-white rounded-xl border-2 border-blue-200 p-5 cursor-pointer hover:border-blue-400 transition-colors"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("button,a,input")) return;
                        setSdNoteTopic(""); setSdNoteText(""); setSdNoteLink(""); setSdNoteError(""); setSdNoteSuccess(false);
                        setSessionDetail(s);
                      }}>
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-gray-900 text-base">{st?.name ?? "Student"}</p>
                          <p className="text-sm text-gray-500">{s.subject} · {s.durationHours} hr · {s.time}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge status={s.sessionType} />
                          <button onClick={(e) => { e.stopPropagation(); handleCancelSession(s); }} disabled={cancellingId === s.id}
                            className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40">
                            {cancellingId === s.id ? "…" : "Cancel"}
                          </button>
                        </div>
                      </div>

                      {/* Checklist row */}
                      <div className="flex flex-wrap gap-3 text-xs">
                        {/* Zoom */}
                        {s.zoomLink ? (
                          <a href={resolveZoomUrl(s.zoomLink!)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                            Join Zoom →
                          </a>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); setZoomEditId(s.id); setZoomEditVal(""); }}
                            className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg font-medium hover:bg-red-100">
                            ⚠ Add Zoom link
                          </button>
                        )}

                        {/* Homework to grade */}
                        {studentHw.length > 0 ? (
                          <button onClick={(e) => { e.stopPropagation(); setTab("homework"); }}
                            className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg font-medium hover:bg-amber-100">
                            ⚠ {studentHw.length} hw to grade
                          </button>
                        ) : (
                          <span className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg font-medium">
                            ✓ Homework up to date
                          </span>
                        )}

                        {/* Last note */}
                        {lastNote ? (
                          <span className="flex items-center gap-1 bg-gray-50 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg">
                            ✓ Note: {lastNote.topic} ({formatDate(lastNote.createdAt.slice(0, 10))})
                          </span>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); setTab("notes"); }}
                            className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg font-medium hover:bg-amber-100">
                            ⚠ No notes yet
                          </button>
                        )}

                        {/* Parent update */}
                        {updateOverdue ? (
                          <button onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudentId(s.studentId);
                            setStudentPanelTab("update");
                            setTab("students");
                          }} className="flex items-center gap-1 bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-lg font-medium hover:bg-orange-100">
                            ⚠ Parent update needed
                          </button>
                        ) : (
                          <span className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg">
                            ✓ Parent updated {updateDays}d ago
                          </span>
                        )}
                      </div>

                      {/* Inline zoom editor */}
                      {zoomEditId === s.id && (
                        <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <input value={zoomEditVal} onChange={(e) => setZoomEditVal(e.target.value)} placeholder="https://zoom.us/j/..."
                            className="rounded border border-gray-300 px-2 py-1 text-xs flex-1" />
                          <button onClick={() => saveZoomLink(s.id)} disabled={zoomSaving} className="text-xs text-blue-600 font-medium">Save</button>
                          <button onClick={() => setZoomEditId(null)} className="text-xs text-gray-400">✕</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action Items */}
            {hasActionItems && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Action Items</h2>
                <div className="space-y-2">
                  {hwNeedsGrading.length > 0 && (
                    <button onClick={() => setTab("homework")}
                      className="w-full flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 text-left hover:bg-amber-100 transition-colors">
                      <span className="text-xl shrink-0">📋</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-amber-800 text-sm">{hwNeedsGrading.length} homework submission{hwNeedsGrading.length > 1 ? "s" : ""} need grading</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          {hwNeedsGrading.map((h) => getStudent(h.studentId)?.name ?? "?").filter((v, i, a) => a.indexOf(v) === i).join(", ")}
                        </p>
                      </div>
                      <span className="text-amber-600 text-sm font-medium shrink-0">Grade →</span>
                    </button>
                  )}
                  {studentsNeedingUpdate.length > 0 && (
                    <button onClick={() => { setTab("students"); setStudentPanelTab("update"); }}
                      className="w-full flex items-start gap-4 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3.5 text-left hover:bg-orange-100 transition-colors">
                      <span className="text-xl shrink-0">📣</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-orange-800 text-sm">{studentsNeedingUpdate.length} student{studentsNeedingUpdate.length > 1 ? "s" : ""} need a parent update this week</p>
                        <p className="text-xs text-orange-600 mt-0.5">{studentsNeedingUpdate.map((s) => s.name).join(", ")}</p>
                      </div>
                      <span className="text-orange-600 text-sm font-medium shrink-0">Send →</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Coming Up */}
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Coming Up</h2>
            <div className="space-y-2">
              {futureSessions.length === 0 ? (
                <p className="text-sm text-gray-400">No upcoming sessions scheduled.</p>
              ) : futureSessions.map((s) => {
                const st = getStudent(s.studentId);
                return (
                  <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between cursor-pointer hover:border-blue-300 transition-colors"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("button,a,input")) return;
                      setSdNoteTopic(""); setSdNoteText(""); setSdNoteLink(""); setSdNoteError(""); setSdNoteSuccess(false);
                      setSessionDetail(s);
                    }}>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{st?.name ?? "Student"}</p>
                      <p className="text-xs text-gray-500">{s.subject} · {formatDate(s.date)} at {s.time} · {s.durationHours} hr</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge status={s.sessionType} />
                      {s.zoomLink
                        ? <a href={resolveZoomUrl(s.zoomLink!)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs text-blue-600 underline">Zoom</a>
                        : <button onClick={(e) => { e.stopPropagation(); setZoomEditId(s.id); setZoomEditVal(""); }} className="text-xs text-gray-400 hover:text-blue-600">+ Zoom</button>}
                      <button onClick={(e) => { e.stopPropagation(); handleCancelSession(s); }} disabled={cancellingId === s.id} className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40">
                        {cancellingId === s.id ? "…" : "Cancel"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── MY STUDENTS ── */}
      {tab === "students" && (
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">My Students</h1>
          <div className="space-y-3">
            {myStudents.map((s) => {
              const bal = balances.find((b) => b.studentId === s.id);
              const isOpen = selectedStudentId === s.id;
              const sHw = homework
                .filter((h) => h.studentId === s.id)
                .sort((a, b) => {
                  const order = { submitted: 0, pending: 1, completed: 2 };
                  const diff = (order[a.status] ?? 1) - (order[b.status] ?? 1);
                  return diff !== 0 ? diff : (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
                });
              const sSess = localSessions
                .filter((sess) => sess.studentId === s.id && sess.status === "upcoming")
                .sort((a, b) => a.date.localeCompare(b.date));
              const sUpdates = parentUpdates.filter((u) => u.studentId === s.id);

              return (
                <div key={s.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Card header */}
                  <div
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      if (isOpen) {
                        setSelectedStudentId(null);
                      } else {
                        setSelectedStudentId(s.id);
                        setStudentPanelTab("homework");
                        setPanelHwShowForm(false);
                        setPanelHwTask(""); setPanelHwDue("");
                        setPanelHwSuccess(false); setPanelHwError("");
                        setParentUpdateText(""); setParentUpdateSuccess(false);
                      }
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-lg">{s.name}</p>
                      <p className="text-sm text-gray-500">{s.grade} Grade · {s.subjects.join(", ")}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-sm font-medium px-3 py-1 rounded-full ${(bal?.remaining ?? 0) <= 2 ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                        {bal?.remaining ?? 0} hrs
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setProfileStudent(s); }}
                        className="text-xs text-gray-500 hover:text-blue-600 border border-gray-200 rounded-lg px-2.5 py-1.5"
                      >
                        Profile
                      </button>
                      <span className="text-gray-400 text-sm select-none">{isOpen ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {isOpen && (
                    <div className="border-t border-gray-100">
                      {/* Sub-tabs */}
                      <div className="flex border-b border-gray-100">
                        {(["homework", "sessions", "update"] as const).map((t2) => (
                          <button
                            key={t2}
                            onClick={() => setStudentPanelTab(t2)}
                            className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                              studentPanelTab === t2
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            {t2 === "homework" ? `Homework (${sHw.length})` : t2 === "sessions" ? `Sessions (${sSess.length})` : "Parent Update"}
                          </button>
                        ))}
                      </div>

                      {/* ── Homework sub-tab ── */}
                      {studentPanelTab === "homework" && (
                        <div className="p-4 space-y-3">
                          {panelHwSuccess && <p className="text-xs text-green-600 font-medium">Assignment added!</p>}
                          {!panelHwShowForm ? (
                            <button onClick={() => setPanelHwShowForm(true)} className="text-sm text-blue-600 hover:underline font-medium">
                              + Assign Homework
                            </button>
                          ) : (
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
                              <textarea
                                value={panelHwTask}
                                onChange={(e) => setPanelHwTask(e.target.value)}
                                placeholder="Describe the assignment…"
                                rows={2}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <div className="flex flex-wrap items-end gap-3">
                                <div>
                                  <label className="text-xs text-gray-500 block mb-1">Due date (optional)</label>
                                  <input type="date" value={panelHwDue} onChange={(e) => setPanelHwDue(e.target.value)}
                                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
                                </div>
                                <button onClick={() => submitPanelHomework(s.id)} disabled={panelHwSaving || !panelHwTask.trim()}
                                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-40">
                                  {panelHwSaving ? "Assigning…" : "Assign"}
                                </button>
                                <button onClick={() => setPanelHwShowForm(false)} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
                              </div>
                              {panelHwError && <p className="text-xs text-red-500">{panelHwError}</p>}
                            </div>
                          )}

                          {sHw.length === 0 ? (
                            <p className="text-sm text-gray-400 py-2">No assignments yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {sHw.map((h) => {
                                const today2 = new Date().toISOString().slice(0, 10);
                                const isOverdue = h.dueDate && h.dueDate < today2 && h.status === "pending";
                                const isFeedbackOpen = hwFeedbackId === h.id;
                                return (
                                  <div key={h.id} className="bg-gray-50 rounded-lg border border-gray-200 p-3 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 leading-snug">{h.task}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                          {h.dueDate ? `Due ${formatDate(h.dueDate)}` : ""}
                                          {h.submittedAt ? ` · Submitted ${formatDate(h.submittedAt.slice(0, 10))}` : ""}
                                        </p>
                                      </div>
                                      <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                                        h.status === "completed" ? "bg-green-100 text-green-700" :
                                        h.status === "submitted" ? "bg-blue-100 text-blue-700" :
                                        isOverdue ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                                      }`}>
                                        {h.status === "completed" ? "Graded" : h.status === "submitted" ? "Review" : isOverdue ? "Overdue" : "Pending"}
                                      </span>
                                    </div>

                                    {h.submissionUrl && h.submissionFilename && (
                                      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
                                        <span className="text-sm">📄</span>
                                        <span className="text-xs text-gray-700 flex-1 truncate">{h.submissionFilename}</span>
                                        <button onClick={() => openSubmission(h)} disabled={hwOpeningId === h.id}
                                          className="text-xs text-blue-600 hover:underline disabled:opacity-50">
                                          {hwOpeningId === h.id ? "Opening…" : "View →"}
                                        </button>
                                      </div>
                                    )}

                                    {h.status === "completed" && (h.grade || h.feedback) && !isFeedbackOpen && (
                                      <div className="bg-green-50 rounded-lg p-2.5 space-y-0.5">
                                        {h.grade && <p className="text-xs font-bold text-green-700">{h.grade}</p>}
                                        {h.feedback && <p className="text-xs text-gray-600">{h.feedback}</p>}
                                        <button onClick={() => { setHwFeedbackId(h.id); setHwGradeText(h.grade ?? ""); setHwFeedbackText(h.feedback ?? ""); }}
                                          className="text-xs text-green-700 hover:underline pt-0.5 block">Edit grade</button>
                                      </div>
                                    )}

                                    {h.status === "submitted" && !isFeedbackOpen && (
                                      <button onClick={() => { setHwFeedbackId(h.id); setHwGradeText(""); setHwFeedbackText(""); }}
                                        className="text-xs text-blue-600 hover:underline font-medium">
                                        + Grade this assignment
                                      </button>
                                    )}

                                    {isFeedbackOpen && (
                                      <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                                        <input type="text" value={hwGradeText} onChange={(e) => setHwGradeText(e.target.value)}
                                          placeholder="Grade (A+, 95%, …)"
                                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                        <textarea value={hwFeedbackText} onChange={(e) => setHwFeedbackText(e.target.value)}
                                          placeholder="Comments…" rows={2}
                                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                        <div className="flex gap-2">
                                          <button onClick={() => saveFeedback(h.id)} disabled={hwFeedbackSaving || !hwFeedbackText.trim()}
                                            className="px-3 py-1 bg-green-600 text-white rounded text-xs font-semibold disabled:opacity-40">
                                            {hwFeedbackSaving ? "Saving…" : "Submit Grade"}
                                          </button>
                                          <button onClick={() => { setHwFeedbackId(null); setHwFeedbackText(""); setHwGradeText(""); }}
                                            className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Sessions sub-tab ── */}
                      {studentPanelTab === "sessions" && (
                        <div className="p-4 space-y-3">
                          {sSess.length === 0 ? (
                            <div>
                              <p className="text-sm text-gray-400 mb-3">No upcoming sessions with {s.name}.</p>
                              <button onClick={() => setTab("schedule")} className="text-sm text-blue-600 hover:underline">
                                Go to Schedule →
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="space-y-2">
                                {sSess.map((sess) => (
                                  <div key={sess.id} className="bg-gray-50 rounded-lg border border-gray-200 p-3 flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">{formatDate(sess.date)} at {sess.time}</p>
                                      <p className="text-xs text-gray-500">{sess.subject} · {sess.durationHours} hr · {sess.sessionType}</p>
                                    </div>
                                    <button onClick={() => {
                                      setSdNoteTopic(""); setSdNoteText(""); setSdNoteLink("");
                                      setSdNoteError(""); setSdNoteSuccess(false);
                                      setSessionDetail(sess);
                                    }} className="text-xs text-blue-600 hover:underline">
                                      Details
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <button onClick={() => setTab("schedule")} className="text-sm text-blue-600 hover:underline">
                                + Schedule another session
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* ── Parent Update sub-tab ── */}
                      {studentPanelTab === "update" && (() => {
                        const weekAgoIso3 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                        const recentPastSessions = localSessions
                          .filter((sess) =>
                            sess.studentId === s.id &&
                            (sess.status === "completed" || sess.date < todayIso) &&
                            sess.date >= weekAgoIso3
                          )
                          .sort((a, b) => b.date.localeCompare(a.date));
                        return (
                          <div className="p-4 space-y-4">
                            <div className="space-y-3">
                              <label className="text-sm font-semibold text-gray-700 block">
                                Send a weekly update to {s.name}&apos;s parent
                              </label>

                              {/* Session checkboxes */}
                              {recentPastSessions.length > 0 && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-2">Tag sessions this update covers (optional):</p>
                                  <div className="space-y-1.5">
                                    {recentPastSessions.map((sess) => {
                                      const checked = puSelectedSessionIds.includes(sess.id);
                                      return (
                                        <label key={sess.id} className="flex items-center gap-2 cursor-pointer group">
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() =>
                                              setPuSelectedSessionIds((prev) =>
                                                checked ? prev.filter((id) => id !== sess.id) : [...prev, sess.id]
                                              )
                                            }
                                            className="w-4 h-4 accent-blue-600 shrink-0"
                                          />
                                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                                            {formatDate(sess.date)} at {sess.time} · {sess.subject} · {sess.durationHours} hr
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              <textarea
                                value={parentUpdateText}
                                onChange={(e) => setParentUpdateText(e.target.value)}
                                placeholder={`Share ${s.name}'s progress, what was covered this week, upcoming topics, or anything the parent should know…`}
                                rows={4}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              {parentUpdateSuccess && <p className="text-xs text-green-600 font-medium">Update sent!</p>}
                              <button onClick={() => sendParentUpdate(s.id)} disabled={parentUpdateSaving || !parentUpdateText.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40">
                                {parentUpdateSaving ? "Sending…" : "Send Update"}
                              </button>
                            </div>

                            {sUpdates.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Past Updates</p>
                                <div className="space-y-2 max-h-56 overflow-y-auto">
                                  {sUpdates.map((u) => {
                                    const taggedSessions = u.sessionIds
                                      .map((id) => localSessions.find((sess) => sess.id === id))
                                      .filter(Boolean) as Session[];
                                    return (
                                      <div key={u.id} className="bg-gray-50 rounded-lg border border-gray-100 p-3">
                                        <p className="text-xs text-gray-400 mb-1">{formatDate(u.createdAt.slice(0, 10))}</p>
                                        {taggedSessions.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mb-1.5">
                                            {taggedSessions.map((sess) => (
                                              <span key={sess.id} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                                                {formatDate(sess.date)} · {sess.subject}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{u.message}</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
            {myStudents.length === 0 && <p className="text-sm text-gray-500">No students assigned yet.</p>}
          </div>
        </div>
      )}

      {/* ── SCHEDULE ── */}
      {tab === "schedule" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
            {/* Mode toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm shadow-sm">
              <button
                onClick={() => { setCalendarMode("schedule"); setSelectedSlot(null); }}
                className={`px-4 py-2 font-medium transition-colors ${calendarMode === "schedule" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                📅 Schedule
              </button>
              <button
                onClick={() => { setCalendarMode("block"); setSelectedSlot(null); }}
                className={`px-4 py-2 font-medium transition-colors border-l border-gray-200 ${calendarMode === "block" ? "bg-orange-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                🚫 Block Time
              </button>
            </div>
          </div>

          {schedSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm mb-4">Session scheduled!</div>
          )}

          <WeeklyCalendar
            availability={availability}
            sessions={localSessions}
            mode="tutor"
            selectedSlot={calendarMode === "schedule" ? selectedSlot : null}
            blockedDates={blockedDates.map((b) => b.blockedDate)}
            blockedSlots={blockedSlots.map((b) => ({ date: b.slotDate, time: b.slotTime }))}
            resolveStudentName={(id) => getStudent(id)?.name}
            onSlotSelect={calendarMode === "schedule" ? (date, time) => {
              setSessionDetail(null);
              setSelectedSlot({ date, time }); setSchedError("");
              if (myStudents.length > 0 && !schedStudentId) setSchedStudentId(String(myStudents[0].id));
            } : undefined}
            onSlotBlock={calendarMode === "block" ? async (date, time) => {
              const nowBlocked = await toggleBlockedSlot(tutorId, date, time);
              setBlockedSlots((prev) =>
                nowBlocked
                  ? [...prev, { id: Date.now(), tutorId, slotDate: date, slotTime: time }]
                  : prev.filter((b) => !(b.slotDate === date && b.slotTime === time)),
              );
            } : undefined}
            onSessionClick={(s) => {
              setSelectedSlot(null);
              setSdNoteTopic(""); setSdNoteText(""); setSdNoteLink(""); setSdNoteError(""); setSdNoteSuccess(false);
              setSessionDetail(s);
            }}
          />

          {selectedSlot && (
            <Modal onClose={() => { setSelectedSlot(null); setSchedError(""); }} title="Schedule Session" subtitle={`${formatDate(selectedSlot.date)} at ${selectedSlot.time}`}>
              <div className="space-y-4">
                <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                  {(["online", "in-person"] as const).map((type, i) => (
                    <button key={type} type="button" onClick={() => setSchedSessionType(type)}
                      className={`flex-1 px-4 py-2.5 font-medium transition-colors ${i > 0 ? "border-l border-gray-200" : ""} ${schedSessionType === type ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                      {type === "online" ? "Online" : "In-Person"}
                    </button>
                  ))}
                </div>
                <select value={schedStudentId} onChange={(e) => setSchedStudentId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
                  <option value="">Select student…</option>
                  {myStudents.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input value={schedSubject} onChange={(e) => setSchedSubject(e.target.value)} placeholder="Subject (e.g. Algebra)" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
                <select value={schedDuration} onChange={(e) => setSchedDuration(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
                  <option value="1">1 hour</option><option value="1.5">1.5 hours</option><option value="2">2 hours</option>
                </select>
                <input value={schedZoom} onChange={(e) => setSchedZoom(e.target.value)} placeholder="Zoom link (optional)" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
                {schedError && <p className="text-xs text-red-500">{schedError}</p>}
                <button onClick={submitSchedule} disabled={!schedSubject || !schedStudentId} className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">Confirm Session</button>
              </div>
            </Modal>
          )}

          {/* Booking lead time */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mt-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-gray-900">Student Booking Window</h3>
              {leadSaved && <span className="text-xs text-green-600 font-medium">Saved!</span>}
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Students cannot book sessions within this many hours of the start time.
              Currently saved: <span className="font-semibold text-gray-700">{tutor.bookingLeadHours} hours</span>.
            </p>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm w-fit mb-4">
              {([24, 48] as const).map((h, i) => (
                <button key={h} type="button" onClick={() => setLeadHours(h)}
                  className={`px-5 py-2 font-medium transition-colors ${i > 0 ? "border-l border-gray-200" : ""} ${leadHours === h ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                  {h} hours
                </button>
              ))}
            </div>
            {leadError && <p className="text-xs text-red-500 mb-2">{leadError}</p>}
            <button onClick={saveLeadTime} disabled={leadSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {leadSaving ? "Saving…" : "Save"}
            </button>
          </div>

          {/* Availability editor */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">My Weekly Availability</h3>
                <p className="text-xs text-gray-400 mt-0.5">Check the days you work, set your hours, then Save.</p>
              </div>
              {availSaved && <span className="text-xs text-green-600 font-medium">Saved!</span>}
            </div>

            <div className="divide-y divide-gray-100 mb-5">
              {DAY_NAMES.map((dayName, dow) => {
                const daySlots = availSlots.filter((s) => s.dayOfWeek === dow);
                const isOn = daySlots.length > 0;
                return (
                  <div key={dow} className="py-3 flex flex-wrap items-center gap-3">
                    {/* Checkbox + day label */}
                    <label className="flex items-center gap-2 cursor-pointer select-none w-20 shrink-0">
                      <input type="checkbox" checked={isOn}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAvailSlots((prev) => [...prev, { dayOfWeek: dow, startTime: "9:00 AM", endTime: "5:00 PM" }]
                              .sort((a, b) => a.dayOfWeek - b.dayOfWeek));
                          } else {
                            setAvailSlots((prev) => prev.filter((s) => s.dayOfWeek !== dow));
                          }
                        }}
                        className="w-4 h-4 accent-blue-600" />
                      <span className={`text-sm font-medium ${isOn ? "text-gray-900" : "text-gray-400"}`}>{DAY_SHORT[dow]}</span>
                    </label>

                    {isOn ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {daySlots.map((slot, slotIdx) => (
                          <div key={slotIdx} className="flex items-center gap-1.5">
                            <select value={slot.startTime}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAvailSlots((prev) => {
                                  let nth = 0;
                                  return prev.map((s) => {
                                    if (s.dayOfWeek !== dow) return s;
                                    return nth++ === slotIdx ? { ...s, startTime: val } : s;
                                  });
                                });
                              }}
                              className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm bg-white">
                              {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <span className="text-gray-400 text-xs">to</span>
                            <select value={slot.endTime}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAvailSlots((prev) => {
                                  let nth = 0;
                                  return prev.map((s) => {
                                    if (s.dayOfWeek !== dow) return s;
                                    return nth++ === slotIdx ? { ...s, endTime: val } : s;
                                  });
                                });
                              }}
                              className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm bg-white">
                              {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                            {daySlots.length > 1 && (
                              <button onClick={() => {
                                let nth = 0;
                                setAvailSlots((prev) => prev.filter((s) => {
                                  if (s.dayOfWeek !== dow) return true;
                                  return nth++ !== slotIdx;
                                }));
                              }} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
                            )}
                          </div>
                        ))}

                        {/* Add second slot for split days */}
                        <button onClick={() => setAvailSlots((prev) => [...prev, { dayOfWeek: dow, startTime: "9:00 AM", endTime: "5:00 PM" }])}
                          className="text-xs text-blue-500 hover:text-blue-700 font-medium">+ split</button>

                        {/* Apply to all weekdays shortcut */}
                        {dow >= 1 && dow <= 5 && (
                          <button onClick={() => {
                            const src = daySlots[0];
                            setAvailSlots((prev) => {
                              const withoutWeekdays = prev.filter((s) => s.dayOfWeek < 1 || s.dayOfWeek > 5);
                              const weekdays = [1,2,3,4,5].map((d) => ({ dayOfWeek: d, startTime: src.startTime, endTime: src.endTime }));
                              return [...withoutWeekdays, ...weekdays].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
                            });
                          }} className="text-xs text-gray-400 hover:text-blue-600 font-medium whitespace-nowrap">
                            Apply Mon–Fri
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">Not available</span>
                    )}
                  </div>
                );
              })}
            </div>

            <button onClick={saveAvailability} disabled={availSaving}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {availSaving ? "Saving…" : "Save Availability"}
            </button>
          </div>

          {/* Blocked dates */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mt-6">
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900">Block Off Dates</h3>
              <p className="text-xs text-gray-400 mt-0.5">Specific dates when you&apos;re unavailable — students cannot book on these days</p>
            </div>

            {/* Existing blocked dates */}
            {blockedDates.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {blockedDates.map((b) => (
                  <span key={b.id} className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5 text-sm text-orange-700">
                    <span>{b.blockedDate}</span>
                    {b.reason && <span className="text-orange-400 text-xs">· {b.reason}</span>}
                    <button onClick={() => deleteBlockDate(b.id)} className="text-orange-400 hover:text-orange-700 ml-1 font-bold leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
            {blockedDates.length === 0 && <p className="text-xs text-gray-400 mb-4">No dates blocked.</p>}

            {/* Add new blocked date */}
            <div className="flex flex-wrap gap-2 items-end">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date</label>
                <input type="date" value={blockDateInput} onChange={(e) => setBlockDateInput(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div className="flex-1 min-w-40">
                <label className="block text-xs text-gray-500 mb-1">Reason (optional)</label>
                <input value={blockReason} onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g. Holiday, sick day…"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <button onClick={addBlockDate} disabled={!blockDateInput || blockSaving}
                className="px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-40">
                {blockSaving ? "…" : "Block Date"}
              </button>
            </div>
            {blockError && <p className="text-xs text-red-500 mt-2">{blockError}</p>}
          </div>
        </div>
      )}

      {/* ── SESSION NOTES ── */}
      {tab === "notes" && (
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Session Notes</h1>

          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Add Notes</h3>
            <div className="space-y-3">
              <select value={noteStudentId} onChange={(e) => setNoteStudentId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Select student…</option>
                {myStudents.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input value={noteTopic} onChange={(e) => setNoteTopic(e.target.value)} placeholder="Topic covered (e.g. Linear equations)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="What was covered, student progress, areas to revisit…" rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none" />
              {noteSuccess && <p className="text-xs text-green-600">Notes saved!</p>}
              {noteError && <p className="text-xs text-red-500">{noteError}</p>}
              <button onClick={submitNote} disabled={noteSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {noteSaving ? "Saving…" : "Save Notes"}
              </button>
            </div>
          </div>

          <h3 className="font-semibold text-gray-900 mb-3">Past Notes</h3>
          {sessionNotes.length === 0 && <p className="text-sm text-gray-400">No notes yet.</p>}
          <div className="space-y-4">
            {sessionNotes.map((n) => (
              <div key={n.id} className="bg-white rounded-xl border border-gray-200 p-5">
                {noteEditId === n.id ? (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-400">{getStudent(n.studentId)?.name ?? "Student"} · {formatDate(n.createdAt.slice(0, 10))}</p>
                    <input value={noteEditTopic} onChange={(e) => setNoteEditTopic(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <textarea value={noteEditText} onChange={(e) => setNoteEditText(e.target.value)}
                      rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <div className="flex gap-2">
                      <button onClick={() => saveNoteEdit(n.id)} disabled={noteEditSaving || !noteEditTopic.trim() || !noteEditText.trim()}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-40">
                        {noteEditSaving ? "Saving…" : "Save Changes"}
                      </button>
                      <button onClick={() => setNoteEditId(null)} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900">{getStudent(n.studentId)?.name ?? "Student"}</p>
                      <div className="flex items-center gap-3">
                        <p className="text-xs text-gray-500">{formatDate(n.createdAt.slice(0, 10))}</p>
                        <button onClick={() => { setNoteEditId(n.id); setNoteEditTopic(n.topic); setNoteEditText(n.notes); }}
                          className="text-xs text-gray-400 hover:text-blue-600 font-medium">Edit</button>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-blue-600 mb-1">{n.topic}</p>
                    <p className="text-sm text-gray-600">{n.notes}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HOMEWORK ── */}
      {tab === "homework" && (() => {
        const today = new Date().toISOString().slice(0, 10);
        const hwSubmitted  = homework.filter((h) => h.status === "submitted");
        const hwPending    = homework.filter((h) => h.status === "pending");
        const hwCompleted  = homework.filter((h) => h.status === "completed");

        const statusBar = (h: Homework) => {
          const isOverdue = h.dueDate && h.dueDate < today && h.status === "pending";
          if (isOverdue) return { dot: "bg-red-500",    label: "OVERDUE",   cls: "text-red-600 bg-red-50 border-red-200" };
          if (h.status === "submitted")  return { dot: "bg-blue-500",   label: "SUBMITTED", cls: "text-blue-600 bg-blue-50 border-blue-200" };
          if (h.status === "completed")  return { dot: "bg-green-500",  label: "GRADED",    cls: "text-green-600 bg-green-50 border-green-200" };
          return { dot: "bg-yellow-400", label: "PENDING",   cls: "text-yellow-700 bg-yellow-50 border-yellow-200" };
        };

        const renderCard = (h: Homework) => {
          const st = getStudent(h.studentId);
          const sb = statusBar(h);
          const isFeedbackOpen = hwFeedbackId === h.id;
          return (
            <div key={h.id} className={`bg-white rounded-xl border-2 p-5 ${h.status === "submitted" ? "border-blue-200" : h.status === "completed" ? "border-green-100" : "border-gray-100"}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${sb.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sb.dot}`} />
                      {sb.label}
                    </span>
                    {st && <span className="text-sm font-medium text-gray-700">{st.name}</span>}
                  </div>
                  <p className="font-semibold text-gray-900 text-base leading-snug">{h.task}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Assigned {formatDate(h.assignedDate)}
                    {h.dueDate ? ` · Due ${formatDate(h.dueDate)}` : ""}
                    {h.submittedAt ? ` · Submitted ${formatDate(h.submittedAt.slice(0, 10))}` : ""}
                  </p>
                </div>
                {h.status === "pending" && (
                  <button onClick={() => completeHomework(h.id)}
                    className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 transition-colors font-medium">
                    Mark Done
                  </button>
                )}
              </div>

              {/* Submitted file */}
              {h.submissionUrl && h.submissionFilename && (
                <div className="mb-3 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                  <span className="text-lg">📄</span>
                  <span className="text-sm text-gray-700 font-medium flex-1 truncate">{h.submissionFilename}</span>
                  <button onClick={() => openSubmission(h)} disabled={hwOpeningId === h.id}
                    className="shrink-0 text-sm text-blue-600 hover:underline font-medium disabled:opacity-50">
                    {hwOpeningId === h.id ? "Opening…" : "View →"}
                  </button>
                </div>
              )}

              {/* Graded result — completed */}
              {h.status === "completed" && (h.grade || h.feedback) && !isFeedbackOpen && (
                <div className="mb-3 bg-green-50 border border-green-100 rounded-xl p-3 space-y-1.5">
                  {h.grade && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Grade</span>
                      <span className="text-sm font-bold text-green-800 bg-green-100 px-2.5 py-0.5 rounded-full">{h.grade}</span>
                    </div>
                  )}
                  {h.feedback && (
                    <div>
                      <p className="text-xs font-semibold text-green-700 mb-0.5">Comments</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{h.feedback}</p>
                    </div>
                  )}
                  <button
                    onClick={() => { setHwFeedbackId(h.id); setHwGradeText(h.grade ?? ""); setHwFeedbackText(h.feedback ?? ""); }}
                    className="text-xs text-green-700 hover:underline font-medium pt-0.5">
                    Edit Grade & Comments
                  </button>
                </div>
              )}

              {/* Grade & feedback form — submitted or editing completed */}
              {(h.status === "submitted" || (h.status === "completed" && isFeedbackOpen)) && (
                <div className="mt-2">
                  {!isFeedbackOpen ? (
                    <button
                      onClick={() => { setHwFeedbackId(h.id); setHwGradeText(h.grade ?? ""); setHwFeedbackText(h.feedback ?? ""); }}
                      className="text-xs text-blue-600 hover:underline font-semibold">
                      + Grade This Assignment
                    </button>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Grade <span className="text-gray-400 font-normal">(optional — e.g. A+, 95%, 9/10)</span></label>
                        <input
                          type="text"
                          value={hwGradeText}
                          onChange={(e) => setHwGradeText(e.target.value)}
                          placeholder="A+, 95%, 9/10, ✓…"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Comments <span className="text-red-400">*</span></label>
                        <textarea
                          value={hwFeedbackText}
                          onChange={(e) => setHwFeedbackText(e.target.value)}
                          placeholder="Great work! Pay attention to problem 3 next time…"
                          rows={3}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => saveFeedback(h.id)} disabled={hwFeedbackSaving || !hwFeedbackText.trim()}
                          className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-40">
                          {hwFeedbackSaving ? "Saving…" : "Submit Grade"}
                        </button>
                        <button onClick={() => { setHwFeedbackId(null); setHwFeedbackText(""); setHwGradeText(""); }}
                          className="px-3 py-1.5 text-gray-500 text-xs hover:text-gray-700">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        };

        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Homework</h1>

              <button onClick={() => setHwShowForm((v) => !v)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5">
                {hwShowForm ? "✕ Cancel" : "+ New Assignment"}
              </button>
            </div>

            {/* Add Assignment form */}
            {hwShowForm && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">New Assignment</h3>
                <div className="space-y-3">
                  <select value={hwStudentId} onChange={(e) => setHwStudentId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select student…</option>
                    {myStudents.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <textarea value={hwTask} onChange={(e) => setHwTask(e.target.value)}
                    placeholder="Describe the assignment (e.g. Complete problems 1–20 from Chapter 4)"
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Due date (optional)</label>
                    <input type="date" value={hwDue} onChange={(e) => setHwDue(e.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  {hwSuccess && <p className="text-xs text-green-600 font-medium">✓ Assignment assigned!</p>}
                  {hwError && <p className="text-xs text-red-500">{hwError}</p>}
                  <button onClick={submitHomework} disabled={hwSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                    {hwSaving ? "Saving…" : "Assign"}
                  </button>
                </div>
              </div>
            )}

            {homework.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-sm font-medium">No assignments yet.</p>
                <p className="text-xs mt-1">Click &quot;+ New Assignment&quot; to get started.</p>
              </div>
            )}

            {/* Needs Review */}
            {hwSubmitted.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Needs Review</span>
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{hwSubmitted.length}</span>
                </div>
                <div className="space-y-3">
                  {hwSubmitted.map((h) => renderCard(h))}
                </div>
              </div>
            )}

            {/* Pending */}
            {hwPending.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Pending</span>
                  <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">{hwPending.length}</span>
                </div>
                <div className="space-y-3">
                  {hwPending.map((h) => renderCard(h))}
                </div>
              </div>
            )}

            {/* Completed */}
            {hwCompleted.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Graded</span>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">{hwCompleted.length}</span>
                </div>
                <div className="space-y-3">
                  {hwCompleted.map((h) => renderCard(h))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

    </DashboardShell>

    {/* ── SESSION DETAIL MODAL (global — works from overview & calendar) ── */}
    {sessionDetail && (() => {
      const sd = sessionDetail;
      const sdStudent = getStudent(sd.studentId);
      const sdNotes = sessionNotes.filter((n) => n.sessionId === sd.id && n.topic !== "_resource_");
      const sdLinks = sessionNotes.filter((n) => n.sessionId === sd.id && n.topic === "_resource_");
      return (
        <Modal onClose={() => { setSessionDetail(null); setEditingSession(false); }} title="Session Details" size="xl"
          subtitle={editingSession ? "Editing session" : `${formatDate(sd.date)} at ${sd.time}`}>
          <div className="space-y-5">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-gray-900">{sdStudent?.name ?? "Student"}</p>
                {!editingSession && (
                  <p className="text-sm text-gray-500">{sd.subject} · {sd.durationHours} hr · {sd.sessionType}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!editingSession && (
                  <button onClick={() => openSessionEdit(sd)}
                    className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg px-3 py-1.5">
                    Edit Session
                  </button>
                )}
                {!editingSession && (
                  <button onClick={() => { handleCancelSession(sd); setSessionDetail(null); }} disabled={cancellingId === sd.id}
                    className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-3 py-1.5 disabled:opacity-40">
                    {cancellingId === sd.id ? "Cancelling…" : "Cancel Session"}
                  </button>
                )}
              </div>
            </div>

            {/* ── EDIT FORM ── */}
            {editingSession && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Date</label>
                    <input type="date" value={sdEditDate} onChange={(e) => setSdEditDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Time</label>
                    <input type="time" value={sdEditTime} onChange={(e) => setSdEditTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Subject</label>
                    <input type="text" value={sdEditSubject} onChange={(e) => setSdEditSubject(e.target.value)}
                      placeholder="e.g. Algebra"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Duration</label>
                    <select value={sdEditDuration} onChange={(e) => setSdEditDuration(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="0.5">30 min</option>
                      <option value="1">1 hour</option>
                      <option value="1.5">1.5 hours</option>
                      <option value="2">2 hours</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Session Type</label>
                  <div className="flex gap-3">
                    {(["online", "in-person"] as const).map((t) => (
                      <label key={t} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input type="radio" name="sdEditType" value={t} checked={sdEditType === t}
                          onChange={() => setSdEditType(t)} className="accent-blue-600" />
                        {t === "online" ? "Online" : "In-Person"}
                      </label>
                    ))}
                  </div>
                </div>
                {sdEditError && <p className="text-xs text-red-500">{sdEditError}</p>}
                <div className="flex items-center gap-2 pt-1">
                  <button onClick={saveSessionEdit} disabled={sdEditSaving || !sdEditDate || !sdEditTime || !sdEditSubject}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40">
                    {sdEditSaving ? "Saving…" : "Save Changes"}
                  </button>
                  <button onClick={() => setEditingSession(false)}
                    className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700">
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 mb-1.5">Zoom Link</p>
              {zoomEditId === sd.id ? (
                <div className="flex items-center gap-2">
                  <input value={zoomEditVal} onChange={(e) => setZoomEditVal(e.target.value)} placeholder="https://zoom.us/j/…" className="rounded border border-gray-300 px-2 py-1 text-sm flex-1" />
                  <button onClick={() => saveZoomLink(sd.id)} disabled={zoomSaving} className="text-xs text-blue-600 font-medium">Save</button>
                  <button onClick={() => setZoomEditId(null)} className="text-xs text-gray-400">✕</button>
                </div>
              ) : sd.zoomLink ? (
                <div className="flex items-center gap-3">
                  <a href={resolveZoomUrl(sd.zoomLink!)} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline truncate">{sd.zoomLink}</a>
                  <button onClick={() => { setZoomEditId(sd.id); setZoomEditVal(sd.zoomLink ?? ""); }} className="text-xs text-gray-400 hover:text-gray-600 shrink-0">Edit</button>
                </div>
              ) : (
                <button onClick={() => { setZoomEditId(sd.id); setZoomEditVal(""); }} className="text-sm text-gray-400 hover:text-blue-600">+ Add Zoom link</button>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Notes</p>
              {sdNotes.length === 0 && <p className="text-xs text-gray-400 mb-1">No notes for this session yet.</p>}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {sdNotes.map((n) => (
                  <div key={n.id} className="bg-white border border-gray-100 rounded-lg p-3">
                    {noteEditId === n.id ? (
                      <div className="space-y-2">
                        <input value={noteEditTopic} onChange={(e) => setNoteEditTopic(e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        <textarea value={noteEditText} onChange={(e) => setNoteEditText(e.target.value)}
                          rows={3} className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        <div className="flex gap-2">
                          <button onClick={() => saveNoteEdit(n.id)} disabled={noteEditSaving || !noteEditTopic.trim() || !noteEditText.trim()}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold disabled:opacity-40">
                            {noteEditSaving ? "Saving…" : "Save"}
                          </button>
                          <button onClick={() => setNoteEditId(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-blue-600 mb-0.5">{n.topic}</p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => { setNoteEditId(n.id); setNoteEditTopic(n.topic); setNoteEditText(n.notes); }}
                              className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded px-2 py-0.5 font-medium">Edit</button>
                            <button onClick={() => removeSessionNote(n.id)}
                              className="text-xs text-red-400 hover:text-red-600 border border-red-200 rounded px-2 py-0.5 font-medium">Remove</button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{n.notes}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(n.createdAt.slice(0, 10))}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {sdLinks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Attached Resources</p>
                {sdLinks.map((n) => (
                  <div key={n.id} className="flex items-center gap-2 mb-1">
                    <a href={n.notes} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline truncate flex-1">📎 {n.notes}</a>
                    <button onClick={() => removeSessionNote(n.id)}
                      className="shrink-0 text-xs text-red-400 hover:text-red-600 font-medium">Remove</button>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <p className="text-sm font-semibold text-gray-900">Add Note</p>
              <input value={sdNoteTopic} onChange={(e) => setSdNoteTopic(e.target.value)} placeholder="Topic (e.g. Quadratic equations)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <textarea value={sdNoteText} onChange={(e) => setSdNoteText(e.target.value)} placeholder="What was covered, student progress, areas to revisit…" rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none" />
              <input value={sdNoteLink} onChange={(e) => setSdNoteLink(e.target.value)} placeholder="Resource link (optional) — Google Drive, worksheet URL…" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              {sdNoteSuccess && <p className="text-xs text-green-600">Note saved!</p>}
              {sdNoteError && <p className="text-xs text-red-500">{sdNoteError}</p>}
              <button onClick={submitSessionDetailNote} disabled={sdNoteSaving || !sdNoteTopic || !sdNoteText}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40">
                {sdNoteSaving ? "Saving…" : "Save Note"}
              </button>
            </div>
          </div>
        </Modal>
      );
    })()}

    {/* ── STUDENT PROFILE MODAL ── */}
    {profileStudent && (() => {
      const ps = profileStudent;
      const balance = balances.find((b) => b.studentId === ps.id);
      const upcomingCount = localSessions.filter((s) => s.studentId === ps.id && s.status === "upcoming").length;
      return (
        <Modal onClose={() => setProfileStudent(null)} title={ps.name} subtitle={`${ps.grade} Grade`} size="xl">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contact</p>
                <ProfileRow label="Email" value={ps.email} />
                <ProfileRow label="Phone" value={ps.phone} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Subjects</p>
                <div className="flex flex-wrap gap-1">
                  {ps.subjects.map((sub) => <span key={sub} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{sub}</span>)}
                </div>
              </div>
            </div>
            {(ps.parentName || ps.parentEmail || ps.parentPhone) && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Parent / Guardian</p>
                <ProfileRow label="Name"  value={ps.parentName} />
                <ProfileRow label="Email" value={ps.parentEmail} />
                <ProfileRow label="Phone" value={ps.parentPhone} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Hours Remaining</p>
                <p className="text-2xl font-bold text-blue-600">{balance?.remaining ?? 0} <span className="text-sm font-normal text-gray-500">hrs</span></p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Upcoming Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingCount}</p>
              </div>
            </div>
            {ps.notes && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{ps.notes}</p>
              </div>
            )}
          </div>
        </Modal>
      );
    })()}
    </>
  );
}
