"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import DashboardShell from "@/components/DashboardShell";
import { usePortalViewerContext } from "@/lib/portal/usePortalViewerContext";
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
  insertPurchaseRequest,
  autoCompletePastSessions,
  fetchStudyLog,
  fetchStudentPlans, fetchStudentPlanFull, fetchFullCatalog,
  fetchSkillNodes, fetchSkillLinkedNotes, fetchSkillLinkedHomework,
  fetchVocabularyConfig, fetchVocabularySubmissions,
  upsertVocabularySubmissions, markHomeworkSubmitted,
  fetchPracticeTestResults,
} from "@/lib/portal/db";
import { supabase } from "@/lib/supabase";
import type { Student, Tutor, Session, HoursBalance, TutorAvailability, SessionNote, Homework, BlockedDate, ParentUpdate, PurchaseOption, StudyLog, StudentPlanFull, StudentPlanLessonFull, CourseCatalogFull, SkillNode, SkillNoteLink, HomeworkSkillLink, VocabularyAssignmentConfig, VocabularySubmissionEntry, PracticeTestResult } from "@/lib/portal/types";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Calendar, FileText, Bell, BookOpen,
  Clock, FlaskConical, Plus, ChevronRight, CalendarDays,
  Video, RotateCcw, X, Timer, CheckCircle, AlertCircle,
  Paperclip, Upload, Lightbulb, TrendingUp, Star, Zap, MapPin,
  Search, ThumbsUp, ThumbsDown, ExternalLink, MessageCircle,
  User, Settings as SettingsIcon, Camera, Download, Trash2,
  Map as MapIcon,
} from "lucide-react";
import type { CalendarSessionAction } from "@/components/portal/WeeklyCalendar";
import SATRoadmapGraph from "@/components/portal/SATRoadmapGraph";
import SkillDetailDrawer from "@/components/portal/SkillDetailDrawer";
import { scoreToStatus, STATUS_BADGE, STATUS_LABEL } from "@/lib/portal/planConfig";

const CANCEL_LOCK_HOURS = 48;

const ALL_NAV_ITEMS = [
  { id: "overview",  label: "Dashboard",     icon: LayoutDashboard },
  { id: "sessions",  label: "Schedule",      icon: Calendar        },
  { id: "homework",  label: "Homework",      icon: BookOpen        },
  { id: "notes",     label: "Session Notes", icon: FileText        },
  { id: "updates",   label: "Updates",       icon: Bell            },
  { id: "progress",  label: "Progress",      icon: TrendingUp      },
  { id: "hours",     label: "Hours",         icon: Clock           },
  { id: "path",      label: "Learning Path", icon: MapIcon         },
  { id: "lab",       label: "MetaMinds Lab", icon: FlaskConical, badge: "Soon" },
  { id: "profile",   label: "Profile",       icon: User            },
  { id: "settings",  label: "Settings",      icon: SettingsIcon    },
];

// Tabs parents are allowed to see (read-only view of their child's portal)
const PARENT_TABS = new Set(["overview", "sessions", "homework", "notes", "updates", "progress", "hours", "path"]);

/** Returns hours from now until the session starts (negative if past) */
function hoursUntilSession(session: Session): number {
  const hour = parseTimeToHour(session.time);
  const dt = new Date(`${session.date}T${String(hour).padStart(2, "0")}:00:00`);
  return (dt.getTime() - Date.now()) / (1000 * 60 * 60);
}


export default function StudentPortal() {
  const { user, authLoaded } = useAuth();
  const ctx = usePortalViewerContext(user, authLoaded);
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
  const [studyLog,       setStudyLog]       = useState<StudyLog[]>([]);
  const [loading,        setLoading]        = useState(true);

  // Learning Path
  const [studentPlanFull, setStudentPlanFull] = useState<StudentPlanFull | null>(null);
  const [planCatalog,     setPlanCatalog]     = useState<CourseCatalogFull | null>(null);
  const [planLoading,     setPlanLoading]     = useState(false);
  const [planLoaded,      setPlanLoaded]      = useState(false);
  const [planExpIds,      setPlanExpIds]      = useState<Set<number>>(new Set());
  const [planSectionIdx,  setPlanSectionIdx]  = useState(0);
  const [pathSkillNodes,     setPathSkillNodes]     = useState<SkillNode[]>([]);
  const [skillNoteLinks,     setSkillNoteLinks]     = useState<SkillNoteLink[]>([]);
  const [skillHomeworkLinks, setSkillHomeworkLinks] = useState<HomeworkSkillLink[]>([]);
  const [expandedSkills,     setExpandedSkills]     = useState<Set<number>>(new Set());
  const [selectedSkillId,    setSelectedSkillId]    = useState<number | null>(null);
  const [practiceTests,      setPracticeTests]      = useState<PracticeTestResult[]>([]);

  // Data load — waits for the viewer context to resolve auth and (if admin) preview token
  const { previewReady, effectiveStudentId, isAdminPreview, previewViewAs } = ctx;
  useEffect(() => {
    if (!previewReady || !effectiveStudentId) return;
    const studentId = effectiveStudentId;

    async function load() {
      try {
        // Skip auto-complete in admin preview — admin session has broad RLS permissions
        // and would mark sessions as completed across all students
        if (!isAdminPreview) await autoCompletePastSessions();
        const [s, pkg, sess] = await Promise.all([
          fetchStudentById(studentId),
          fetchPackageByStudent(studentId),
          fetchSessionsByStudent(studentId),
        ]);
        setStudent(s);
        setBalance(pkg);
        setMySessions(sess);
        if (s?.assignedTutorId) {
          const [t, avail, allTutorSess, notes, hw, blocked, pu, sl] = await Promise.all([
            fetchTutorById(s.assignedTutorId),
            fetchTutorAvailability(s.assignedTutorId),
            fetchSessionsByTutor(s.assignedTutorId),
            fetchSessionNotes(studentId),
            fetchHomework(studentId),
            fetchBlockedDates(s.assignedTutorId),
            fetchParentUpdatesByStudent(studentId),
            fetchStudyLog(studentId),
          ]);
          setTutor(t);
          setAvailability(avail);
          setTutorSessions(allTutorSess);
          setSessionNotes(notes);
          setHomeworkList(hw);
          setBlockedDates(blocked);
          setParentUpdates(pu);
          setStudyLog(sl);
        }
      } catch (err) {
        console.error("Failed to load student portal:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [previewReady, effectiveStudentId, isAdminPreview]);

  // Learning Path lazy load
  useEffect(() => {
    if (tab !== "path" || !student || planLoaded) return;
    setPlanLoading(true);
    (async () => {
      try {
        const [plans, skillNodes, noteLinks, hwLinks, testResults] = await Promise.all([
          fetchStudentPlans(student.id),
          fetchSkillNodes("SAT"),
          fetchSkillLinkedNotes(student.id),
          fetchSkillLinkedHomework(student.id),
          fetchPracticeTestResults(student.id),
        ]);
        setPathSkillNodes(skillNodes);
        setSkillNoteLinks(noteLinks);
        setSkillHomeworkLinks(hwLinks);
        setPracticeTests(testResults);
        const active = plans.find(p => p.status === "active") ?? plans[0] ?? null;
        if (active) {
          const [full, catalog] = await Promise.all([
            fetchStudentPlanFull(student.id, active.courseId),
            fetchFullCatalog(active.courseId),
          ]);
          setStudentPlanFull(full);
          setPlanCatalog(catalog);
        }
        setPlanLoaded(true);
      } catch (err) {
        console.error("Learning path load error:", err);
        setPlanLoaded(true);
      } finally {
        setPlanLoading(false);
      }
    })();
  }, [tab, student, planLoaded]);

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
  const [purchaseError,   setPurchaseError]   = useState("");
  const [purchaseSaving,  setPurchaseSaving]  = useState(false);

  // Past session detail
  const [pastSessionDetail, setPastSessionDetail] = useState<Session | null>(null);

  // Homework upload
  const [hwSelectedFiles, setHwSelectedFiles] = useState<Record<number, File>>({});
  const [hwUploadingId,   setHwUploadingId]   = useState<number | null>(null);
  const [hwUploadErrors,  setHwUploadErrors]  = useState<Record<number, string>>({});
  const [hwOpeningId,     setHwOpeningId]     = useState<number | null>(null);
  const [noteOpeningId,   setNoteOpeningId]   = useState<number | null>(null);
  const [hwFilter,        setHwFilter]        = useState<"todo" | "submitted" | "graded" | "all">("todo");
  const [hwExpandedIds,   setHwExpandedIds]   = useState<Set<number>>(new Set());
  const [hwTimeInputs,    setHwTimeInputs]    = useState<Record<number, string>>({});
  const [hwNoteInputs,    setHwNoteInputs]    = useState<Record<number, string>>({});
  const [hwDiffInputs,    setHwDiffInputs]    = useState<Record<number, string>>({});

  // Vocabulary homework
  const [vocabConfigs,  setVocabConfigs]  = useState<Record<number, VocabularyAssignmentConfig | null>>({});
  const [vocabEntries,  setVocabEntries]  = useState<Record<number, VocabularySubmissionEntry[]>>({});
  const [vocabInputs,   setVocabInputs]   = useState<Record<number, { definition: string; sentence: string; confidence: string }[]>>({});
  const [vocabSavingId, setVocabSavingId] = useState<number | null>(null);
  const [vocabErrors,   setVocabErrors]   = useState<Record<number, string>>({});
  const [notesSearch,       setNotesSearch]       = useState("");
  const [selectedNoteId,    setSelectedNoteId]    = useState<number | null>(null);
  const [selectedUpdateId,  setSelectedUpdateId]  = useState<number | null>(null);

  // Settings state
  const [settingsSection,       setSettingsSection]       = useState<"profile" | "notifications" | "preferences" | "privacy" | "data">("profile");
  const [settingsBio,           setSettingsBio]           = useState("");
  const [settingsPhone,         setSettingsPhone]         = useState("");
  const [settingsNotifSession,  setSettingsNotifSession]  = useState(true);
  const [settingsNotifHomework, setSettingsNotifHomework] = useState(true);
  const [settingsNotifUpdates,  setSettingsNotifUpdates]  = useState(true);
  const [settingsNotifActivity, setSettingsNotifActivity] = useState(false);
  const [settingsNotifMessages, setSettingsNotifMessages] = useState(true);
  const [settingsNotifAchieve,  setSettingsNotifAchieve]  = useState(true);
  const [settingsPrivProfile,   setSettingsPrivProfile]   = useState(true);
  const [settingsPrivProgress,  setSettingsPrivProgress]  = useState(false);
  const [settingsSaved,         setSettingsSaved]         = useState(false);

  // Force password reset state
  const [forceResetDone,    setForceResetDone]    = useState(false);
  const [resetNewPw,        setResetNewPw]        = useState("");
  const [resetConfirmPw,    setResetConfirmPw]    = useState("");
  const [resetPwError,      setResetPwError]      = useState("");
  const [resetPwLoading,    setResetPwLoading]    = useState(false);
  const [resetShowPw,       setResetShowPw]       = useState(false);

  async function handleForceReset() {
    if (resetNewPw.length < 8) { setResetPwError("Password must be at least 8 characters."); return; }
    if (resetNewPw !== resetConfirmPw) { setResetPwError("Passwords don't match."); return; }
    setResetPwLoading(true); setResetPwError("");
    try {
      const { error } = await supabase.auth.updateUser({ password: resetNewPw });
      if (error) throw error;
      // Clear flag via server route — bypasses RLS on profiles table
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      if (activeSession) {
        await fetch("/api/student/complete-reset", {
          method: "POST",
          headers: { "Authorization": `Bearer ${activeSession.access_token}` },
        });
      }
      setForceResetDone(true);
      setResetNewPw(""); setResetConfirmPw("");
    } catch (e: unknown) {
      setResetPwError(e instanceof Error ? e.message : "Failed to update password. Please try again.");
    } finally {
      setResetPwLoading(false);
    }
  }

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
    if (!ctx.canManageSchedule) return;
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
    } catch (e: unknown) {
      setBookError(e instanceof Error ? e.message : "Failed to book session. Please try again.");
    }
  }

  async function handleCancelSession(session: Session) {
    if (!ctx.canManageSchedule) return;
    if (!student) return;
    setCancellingId(session.id);
    setCancelError("");
    try {
      await cancelSession(session.id);
      setMySessions((prev) => prev.map((s) => s.id === session.id ? { ...s, status: "cancelled" } : s));
      setTutorSessions((prev) => prev.filter((s) => s.id !== session.id));
      setBalance((prev) => prev ? {
        ...prev,
        totalUsed: Math.max(0, prev.totalUsed - session.durationHours),
        remaining: prev.remaining + session.durationHours,
      } : prev);
    } catch (e: unknown) {
      setCancelError(e instanceof Error ? e.message : "Failed to cancel. Please try again.");
    } finally {
      setCancellingId(null);
    }
  }

  async function handleReschedule(session: Session) {
    if (!ctx.canManageSchedule) return;
    if (!student) return;
    setCancellingId(session.id);
    try {
      await cancelSession(session.id);
      setMySessions((prev) => prev.map((s) => s.id === session.id ? { ...s, status: "cancelled" } : s));
      setTutorSessions((prev) => prev.filter((s) => s.id !== session.id));
      setBalance((prev) => prev ? {
        ...prev,
        totalUsed: Math.max(0, prev.totalUsed - session.durationHours),
        remaining: prev.remaining + session.durationHours,
      } : prev);
      setTab("sessions");
    } catch (e: unknown) {
      setCancelError(e instanceof Error ? e.message : "Failed to reschedule. Please try again.");
    } finally {
      setCancellingId(null);
    }
  }

  async function handleHomeworkUpload(hw: { id: number }) {
    if (!ctx.canSubmitHomework) return;
    const file = hwSelectedFiles[hw.id];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setHwUploadErrors((prev) => ({ ...prev, [hw.id]: "File too large (max 10 MB)." }));
      return;
    }

    // Time is required — fall back to previously reported value if not changed
    const prevTimeMinutes = homeworkList.find((h) => h.id === hw.id)?.studentTimeMinutes;
    const timeStr = hwTimeInputs[hw.id] ?? prevTimeMinutes?.toString() ?? "";
    if (!timeStr.trim()) {
      setHwUploadErrors((prev) => ({ ...prev, [hw.id]: "Please enter the time you spent on this assignment." }));
      return;
    }
    const timeMins = Number.parseInt(timeStr, 10);
    if (!Number.isInteger(timeMins) || timeMins < 1 || timeMins > 600) {
      setHwUploadErrors((prev) => ({ ...prev, [hw.id]: "Time must be between 1 and 600 minutes." }));
      return;
    }

    const prevDiff = homeworkList.find((h) => h.id === hw.id)?.difficultyRating ?? "";
    const prevNote = homeworkList.find((h) => h.id === hw.id)?.studentNote ?? "";
    const diffVal  = hwDiffInputs[hw.id] ?? prevDiff;
    const noteVal  = hwNoteInputs[hw.id] ?? prevNote;

    setHwUploadingId(hw.id);
    setHwUploadErrors((prev) => ({ ...prev, [hw.id]: "" }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const form = new FormData();
      form.append("file", file);
      form.append("hwId", String(hw.id));
      form.append("studentTimeMinutes", String(timeMins));
      form.append("studentNote", noteVal.trim());
      form.append("difficultyRating", diffVal);
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
        submissionUrl:      r.submission_url       ?? undefined,
        submissionFilename: r.submission_filename  ?? undefined,
        submittedAt:        r.submitted_at         ?? undefined,
        feedback:           r.feedback             ?? undefined,
        feedbackAt:         r.feedback_at          ?? undefined,
        attachmentUrl:      r.attachment_url       ?? undefined,
        attachmentFilename: r.attachment_filename  ?? undefined,
        kamiLink:           r.kami_link            ?? undefined,
        estimatedMinutes:   r.estimated_minutes    ?? undefined,
        assignmentType:     r.assignment_type      ?? undefined,
        instructions:       r.instructions         ?? undefined,
        studentTimeMinutes: r.student_time_minutes ?? undefined,
        studentNote:        r.student_note         ?? undefined,
        difficultyRating:   r.difficulty_rating    ?? undefined,
      };
      setHomeworkList((prev) => prev.map((h) => h.id === hw.id ? updated : h));
      setHwSelectedFiles((prev) => { const n = { ...prev }; delete n[hw.id]; return n; });
      setHwTimeInputs((prev)   => { const n = { ...prev }; delete n[hw.id]; return n; });
      setHwNoteInputs((prev)   => { const n = { ...prev }; delete n[hw.id]; return n; });
      setHwDiffInputs((prev)   => { const n = { ...prev }; delete n[hw.id]; return n; });
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
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/homework/signed-url", {
        method:  "POST",
        headers: {
          "content-type": "application/json",
          ...(session ? { authorization: `Bearer ${session.access_token}` } : {}),
        },
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

  async function loadVocabForHomework(hw: Homework) {
    if (vocabConfigs[hw.id] !== undefined) return;
    try {
      const [config, entries] = await Promise.all([
        fetchVocabularyConfig(hw.id),
        fetchVocabularySubmissions(hw.id),
      ]);
      setVocabConfigs((prev) => ({ ...prev, [hw.id]: config }));
      setVocabEntries((prev) => ({ ...prev, [hw.id]: entries }));
      if (config) {
        setVocabInputs((prev) => ({
          ...prev,
          [hw.id]: config.words.map((w, i) => {
            const existing = entries.find((e) => e.wordIndex === i);
            return {
              definition: existing?.definition ?? "",
              sentence:   existing?.sentence   ?? "",
              confidence: existing?.confidence ?? "",
            };
          }),
        }));
      }
    } catch {
      setVocabConfigs((prev) => ({ ...prev, [hw.id]: null }));
    }
  }

  async function submitVocabularyHomework(hwId: number) {
    const studentId = ctx.effectiveStudentId;
    if (!studentId) return;
    const config = vocabConfigs[hwId];
    const inputs = vocabInputs[hwId];
    if (!config || !inputs) return;

    const hasEmpty = inputs.some((inp) => !inp.definition.trim() || !inp.sentence.trim());
    if (hasEmpty) {
      setVocabErrors((prev) => ({ ...prev, [hwId]: "Please write a definition and sentence for every word." }));
      return;
    }

    setVocabSavingId(hwId);
    setVocabErrors((prev) => ({ ...prev, [hwId]: "" }));
    try {
      const entries = config.words.map((w, i) => ({
        homeworkId: hwId,
        studentId,
        wordIndex:  i,
        word:       w.word,
        definition: (inputs[i]?.definition ?? "").trim(),
        sentence:   (inputs[i]?.sentence   ?? "").trim(),
        confidence: (inputs[i]?.confidence as "low" | "medium" | "high" | undefined) || undefined,
      }));
      const saved = await upsertVocabularySubmissions(entries);
      setVocabEntries((prev) => ({ ...prev, [hwId]: saved }));
      const timeMins = hwTimeInputs[hwId] ? parseInt(hwTimeInputs[hwId]) : undefined;
      const updated = await markHomeworkSubmitted(hwId, timeMins && !isNaN(timeMins) ? timeMins : undefined);
      setHomeworkList((prev) => prev.map((h) => h.id === hwId ? updated : h));
    } catch {
      setVocabErrors((prev) => ({ ...prev, [hwId]: "Failed to save submission. Please try again." }));
    } finally {
      setVocabSavingId(null);
    }
  }

  async function openNoteAttachment(note: { id: number; attachmentUrl?: string }) {
    if (!note.attachmentUrl) return;
    setNoteOpeningId(note.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/session-notes/signed-url", {
        method:  "POST",
        headers: {
          "content-type": "application/json",
          ...(session ? { authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ path: note.attachmentUrl }),
      });
      if (!res.ok) {
        const j = await res.json() as { error?: string };
        throw new Error(j.error ?? "Failed to fetch file");
      }
      const blob      = await res.blob();
      const objectUrl = URL.createObjectURL(new Blob([blob], { type: blob.type || "application/pdf" }));
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    } catch (e: unknown) {
      alert(`Could not open file: ${e instanceof Error ? e.message : "Please try again."}`);
    } finally {
      setNoteOpeningId(null);
    }
  }

  async function requestPurchase(opt: PurchaseOption) {
    if (!ctx.canPurchaseHours) return;
    if (!student) return;
    setPurchaseSaving(true);
    setPurchaseError("");
    try {
      await insertPurchaseRequest({
        studentId:    student.id,
        packageLabel: opt.label,
        hours:        opt.hours,
        price:        opt.price,
      });
      setPurchaseSuccess(`"${opt.label}" request submitted. Admin will confirm and send an invoice.`);
      setShowBuyPanel(false);
      setTimeout(() => setPurchaseSuccess(null), 5000);
    } catch {
      setPurchaseError("Failed to submit request. Please try again.");
    } finally {
      setPurchaseSaving(false);
    }
  }

  const isParent = user?.role === "parent" || (ctx.isAdminPreview && previewViewAs === "parent");
  const navItems = isParent
    ? ALL_NAV_ITEMS.filter((n) => PARENT_TABS.has(n.id))
    : ALL_NAV_ITEMS;

  // Guard: if a parent somehow lands on a restricted tab, bounce them to overview
  useEffect(() => {
    if (isParent && !PARENT_TABS.has(tab)) setTab("overview");
  }, [isParent, tab]);

  if (!authLoaded || loading) {
    return (
      <DashboardShell role={isParent ? "parent" : "student"} userName="Loading…" navItems={navItems} activeTab={tab} onTabChange={handleTabChange}>
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading your dashboard…</div>
      </DashboardShell>
    );
  }

  if (!student) {
    return (
      <DashboardShell role={isParent ? "parent" : "student"} userName="Student" navItems={navItems} activeTab={tab} onTabChange={handleTabChange}>
        <div className="flex items-center justify-center h-64 text-red-500 text-sm">Could not load your data. Check your Supabase connection.</div>
      </DashboardShell>
    );
  }

  // Force password reset — block dashboard access until new password is set
  // Skip entirely in admin preview: the admin's account never needs a force-reset
  if (!ctx.isAdminPreview && user?.mustResetPassword && !forceResetDone) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">🔒</div>
            <h1 className="text-xl font-bold text-gray-900">Create Your Password</h1>
            <p className="text-sm text-gray-500 mt-1">
              Your account was set up with a temporary password. Please create a permanent password before accessing your dashboard.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">New Password</label>
              <div className="relative">
                <input
                  type={resetShowPw ? "text" : "password"}
                  value={resetNewPw}
                  onChange={(e) => setResetNewPw(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={() => setResetShowPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-medium">
                  {resetShowPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Confirm Password</label>
              <input
                type={resetShowPw ? "text" : "password"}
                value={resetConfirmPw}
                onChange={(e) => setResetConfirmPw(e.target.value)}
                placeholder="Repeat your new password"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => { if (e.key === "Enter") handleForceReset(); }}
              />
            </div>

            {resetPwError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{resetPwError}</p>
            )}

            <button
              onClick={handleForceReset}
              disabled={resetPwLoading || !resetNewPw || !resetConfirmPw}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {resetPwLoading ? "Setting password…" : "Set Password & Enter Dashboard"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell role={isParent ? "parent" : "student"} userName={student.name} navItems={navItems} activeTab={tab} onTabChange={handleTabChange}>

      {/* ── ADMIN PREVIEW BANNER ── */}
      {ctx.isAdminPreview && (
        <div className="flex items-center justify-between gap-4 px-5 py-3 bg-amber-50 border-b-2 border-amber-200">
          <div className="flex items-center gap-3 min-w-0">
            <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 bg-amber-200 text-amber-900 rounded-full uppercase tracking-widest">
              Read-only
            </span>
            <span className="text-sm font-semibold text-amber-900 truncate">
              Admin Preview — {ctx.previewViewAs === "parent" ? "Parent" : "Student"} view for {ctx.previewStudentName}
            </span>
          </div>
          <button
            onClick={ctx.exitPreview}
            className="shrink-0 text-xs font-semibold text-amber-700 border border-amber-300 px-3 py-1.5 rounded-xl hover:bg-amber-100 transition-colors"
          >
            Exit Preview
          </button>
        </div>
      )}

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
                  <div className="mt-3 space-y-1.5">
                    {(nextSession.zoomLink ?? tutor?.zoomLink) ? (
                      <button
                        onClick={() => window.open(resolveZoomUrl((nextSession.zoomLink ?? tutor?.zoomLink)!), "_blank", "noopener,noreferrer")}
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
                    {tutor?.meetingId && (
                      <p className="text-blue-200 text-[11px]">Meeting ID: {tutor.meetingId}</p>
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
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        {(sessionToday.zoomLink ?? tutor?.zoomLink) && (
                          <button
                            onClick={() => window.open(resolveZoomUrl((sessionToday.zoomLink ?? tutor?.zoomLink)!), "_blank", "noopener,noreferrer")}
                            className="text-xs text-blue-600 font-semibold hover:underline"
                          >
                            Join →
                          </button>
                        )}
                        {tutor?.meetingId && (
                          <span className="text-[10px] text-gray-400">ID: {tutor.meetingId}</span>
                        )}
                      </div>
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

            {/* ── Study Accountability ── */}
            {(() => {
            const weeklyGoal = student.weeklyStudyGoalMinutes ?? 180;
            // Sunday of current week
            const weekStart = new Date(todayIso);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekStartIso = weekStart.toISOString().slice(0, 10);
            const thisWeekMins = studyLog
              .filter((e) => e.logDate >= weekStartIso)
              .reduce((s, e) => s + e.minutes, 0);
            const goalPct = Math.min(100, Math.round((thisWeekMins / weeklyGoal) * 100));

            // Last 7 days bar chart data
            const last7 = Array.from({ length: 7 }, (_, i) => {
              const d = new Date(todayIso);
              d.setDate(d.getDate() - (6 - i));
              const iso = d.toISOString().slice(0, 10);
              const mins = studyLog.filter((e) => e.logDate === iso).reduce((s, e) => s + e.minutes, 0);
              return { iso, mins, label: d.toLocaleDateString("en-US", { weekday: "short" }) };
            });
            const maxMins = Math.max(...last7.map((d) => d.mins), 1);

            // Streak: consecutive days ending today or yesterday
            const datesWithActivity = new Set(studyLog.map((e) => e.logDate));
            let streak = 0;
            const checkDate = new Date(todayIso);
            if (!datesWithActivity.has(todayIso)) checkDate.setDate(checkDate.getDate() - 1);
            while (datesWithActivity.has(checkDate.toISOString().slice(0, 10))) {
              streak++;
              checkDate.setDate(checkDate.getDate() - 1);
            }

            return (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">Study This Week</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Logged from homework submissions</p>
                  </div>
                  {streak > 0 && (
                    <span className="flex items-center gap-1.5 text-sm font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {streak}-day streak
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Goal progress */}
                  <div>
                    <div className="flex items-end gap-1 mb-2">
                      <span className="text-3xl font-bold text-gray-900">{thisWeekMins}</span>
                      <span className="text-sm text-gray-400 mb-1">/ {weeklyGoal} min goal</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                      <div
                        className={`h-2.5 rounded-full transition-all ${goalPct >= 100 ? "bg-emerald-500" : goalPct >= 60 ? "bg-blue-500" : "bg-amber-400"}`}
                        style={{ width: `${goalPct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      {goalPct >= 100
                        ? "Goal reached! Great work this week."
                        : `${weeklyGoal - thisWeekMins} min to reach your weekly goal`}
                    </p>
                  </div>

                  {/* 7-day chart */}
                  <div>
                    <div className="flex items-end justify-between gap-1 h-16">
                      {last7.map(({ iso, mins, label }) => (
                        <div key={iso} className="flex flex-col items-center gap-1 flex-1">
                          <div className="w-full flex items-end justify-center" style={{ height: "44px" }}>
                            <div
                              className={`w-full rounded-t-md transition-all ${iso === todayIso ? "bg-blue-500" : mins > 0 ? "bg-blue-200" : "bg-gray-100"}`}
                              style={{ height: mins > 0 ? `${Math.max(4, Math.round((mins / maxMins) * 44))}px` : "4px" }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
            })()}

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
          const effectiveZoom = session.zoomLink ?? tutor?.zoomLink;
          if (effectiveZoom) {
            acts.push({
              label: "Join Zoom",
              variant: "primary",
              onClick: (e) => { e.stopPropagation(); window.open(resolveZoomUrl(effectiveZoom), "_blank", "noopener,noreferrer"); },
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
                visibleSessions={mySessions}
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
                <div className="space-y-2">
                  {upcoming.map((s, i) => {
                    const isToday  = s.date === todayIso;
                    const hrs      = hoursUntilSession(s);
                    const locked   = hrs < CANCEL_LOCK_HOURS;
                    const inPerson = s.sessionType === "in-person";
                    const sessionDate = new Date(s.date + "T12:00:00");
                    const dayName = sessionDate.toLocaleDateString("en-US", { weekday: "short" });
                    const monthName = sessionDate.toLocaleDateString("en-US", { month: "short" });
                    const dayNum = sessionDate.getDate();

                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.05 }}
                        className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex items-center hover:shadow-md transition-shadow ${
                          isToday ? "ring-1 ring-blue-200" : ""
                        }`}
                      >
                        {/* Left accent bar */}
                        <div className={`w-1 self-stretch shrink-0 ${isToday ? "bg-blue-500" : inPerson ? "bg-violet-500" : "bg-slate-200"}`} />

                        {/* Date block */}
                        <div className={`px-4 py-4 text-center shrink-0 w-[72px] border-r border-gray-100`}>
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? "text-blue-500" : "text-gray-400"}`}>
                            {isToday ? "Today" : dayName}
                          </p>
                          <p className={`text-2xl font-bold leading-none mt-0.5 ${isToday ? "text-blue-600" : "text-gray-800"}`}>{dayNum}</p>
                          <p className="text-[10px] font-medium text-gray-400 mt-0.5">{monthName}</p>
                        </div>

                        {/* Main content */}
                        <div className="flex-1 px-4 py-4 min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">{s.subject}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                            <p className="text-xs text-gray-500">{s.time} · {s.durationHours} hr</p>
                          </div>
                        </div>

                        {/* Session type badge */}
                        <div className="px-3 shrink-0 hidden sm:block">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                            inPerson ? "bg-violet-50 text-violet-700" : "bg-blue-50 text-blue-700"
                          }`}>
                            {inPerson ? <MapPin className="w-2.5 h-2.5" /> : <Video className="w-2.5 h-2.5" />}
                            {inPerson ? "In-Person" : "Online"}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="pr-4 pl-2 shrink-0 flex items-center gap-1.5">
                          {(s.zoomLink ?? tutor?.zoomLink) && (
                            <div className="flex flex-col items-end gap-0.5">
                              <button
                                onClick={() => window.open(resolveZoomUrl((s.zoomLink ?? tutor?.zoomLink)!), "_blank", "noopener,noreferrer")}
                                className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Join</span>
                              </button>
                              {tutor?.meetingId && (
                                <span className="text-[10px] text-gray-400">ID: {tutor.meetingId}</span>
                              )}
                            </div>
                          )}
                          {locked ? (
                            <span className="text-[11px] text-gray-300 italic px-2">Locked</span>
                          ) : (
                            <div className="flex items-center gap-0.5">
                              <button onClick={() => handleReschedule(s)} disabled={cancellingId === s.id}
                                title="Reschedule"
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-40">
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleCancelSession(s)} disabled={cancellingId === s.id}
                                title={cancellingId === s.id ? "Cancelling…" : "Cancel"}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
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
                    <button type="button" onClick={() => setBookSessionType("online")}
                      className={`flex-1 px-4 py-2.5 font-medium transition-colors ${bookSessionType === "online" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                      🎥 Online
                    </button>
                    {student.allowInPerson ? (
                      <button type="button" onClick={() => setBookSessionType("in-person")}
                        className={`flex-1 px-4 py-2.5 font-medium border-l border-gray-200 transition-colors ${bookSessionType === "in-person" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                        📍 In-Person
                      </button>
                    ) : (
                      <div className="flex-1 px-4 py-2.5 font-medium border-l border-gray-200 bg-gray-50 text-gray-300 text-center cursor-not-allowed select-none" title="In-person sessions are not available for your account">
                        📍 In-Person
                      </div>
                    )}
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
                  <button onClick={submitBooking} disabled={!ctx.canManageSchedule || (balance?.remaining ?? 0) < bookDuration}
                    title={!ctx.canManageSchedule ? "Not available in admin preview" : undefined}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Confirm Booking
                  </button>
                </div>
              </Modal>
            )}
          </div>
        );
      })()}

      {/* ── PROGRESS ── */}
      {tab === "progress" && (() => {
        const completedHw   = homeworkList.filter((h) => h.status === "completed");
        const submittedHw   = homeworkList.filter((h) => h.status === "submitted");
        const totalHw       = homeworkList.length;
        const doneHw        = completedHw.length + submittedHw.length;
        const hwRate        = totalHw > 0 ? Math.round((doneHw / totalHw) * 100) : 0;
        const cancelledCount = mySessions.filter((s) => s.status === "cancelled").length;
        const nonCancelled  = mySessions.filter((s) => s.status !== "cancelled").length;
        const attendanceRate = nonCancelled > 0
          ? Math.round((completed.length / nonCancelled) * 100)
          : 100;

        // Monthly bar chart — last 6 months
        const now = new Date();
        const chartMonths: { key: string; count: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          chartMonths.push({
            key: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
            count: 0,
          });
        }
        completed.forEach((s) => {
          const d = new Date(s.date + "T12:00:00");
          const k = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
          const entry = chartMonths.find((m) => m.key === k);
          if (entry) entry.count++;
        });
        const maxBar = Math.max(...chartMonths.map((m) => m.count), 1);

        // Subject mastery
        const subjectMap: Record<string, number> = {};
        student.subjects.forEach((sub) => { subjectMap[sub] = 0; });
        completed.forEach((s) => {
          if (s.subject in subjectMap) subjectMap[s.subject]++;
        });
        const maxSubCount = Math.max(...Object.values(subjectMap), 1);

        // Achievements
        const achievements: { title: string; desc: string }[] = [];
        if (completed.length >= 1)  achievements.push({ title: "First Session", desc: "Completed your first tutoring session" });
        if (completed.length >= 5)  achievements.push({ title: "5 Sessions Strong", desc: "Completed 5 tutoring sessions" });
        if (completed.length >= 10) achievements.push({ title: "10 Session Milestone", desc: "Reached 10 completed sessions" });
        if (completedHw.length >= 1) achievements.push({ title: "First Assignment Done", desc: "Completed and graded first assignment" });
        if (hwRate >= 80) achievements.push({ title: "High Achiever", desc: "80%+ assignment completion rate" });

        // Study tips (cycle by day of week)
        const tips = [
          "Review session notes within 24 hours to retain 80% more of what you learned.",
          "Practice problems between sessions to solidify new concepts.",
          "Ask your tutor for extra resources on topics you find challenging.",
          "Set a consistent study schedule to build strong habits.",
          "Break complex problems into smaller steps — your tutor can help with each one.",
          "Teaching a concept back to yourself is one of the most effective ways to learn it.",
          "Celebrate small wins — every completed session moves you forward.",
        ];
        const todayTip = tips[new Date().getDay() % tips.length];

        // Circular SVG helper
        const r = 26;
        const circ = 2 * Math.PI * r;
        const mkCircle = (pct: number, color: string, label: string, sub: string) => {
          const dash = Math.min(pct, 100) / 100 * circ;
          return (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col items-center text-center">
              <div className="relative w-16 h-16 mb-3">
                <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
                  <circle cx="32" cy="32" r={r} stroke="#f1f5f9" strokeWidth="6" fill="none" />
                  <circle cx="32" cy="32" r={r} stroke={color} strokeWidth="6" fill="none"
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm font-bold text-gray-900">{label}</p>
                </div>
              </div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide leading-tight">{sub}</p>
            </div>
          );
        };

        const subjectBarColors = [
          "from-blue-500 to-blue-400",
          "from-violet-500 to-violet-400",
          "from-emerald-500 to-emerald-400",
          "from-amber-500 to-amber-400",
          "from-rose-500 to-rose-400",
          "from-cyan-500 to-cyan-400",
        ];

        return (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
              <p className="text-sm text-gray-400 mt-1">Track your academic journey and celebrate milestones.</p>
            </div>

            {/* 4 Stat circles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {mkCircle(
                hwRate,
                hwRate >= 80 ? "#22c55e" : hwRate >= 50 ? "#3b82f6" : "#f59e0b",
                `${hwRate}%`,
                "Completion Rate",
              )}
              {mkCircle(
                Math.min(completed.length * 10, 100),
                "#6366f1",
                String(completed.length),
                "Sessions Done",
              )}
              {mkCircle(
                attendanceRate,
                "#0ea5e9",
                `${attendanceRate}%`,
                "Attendance Rate",
              )}
              {mkCircle(
                balance ? Math.min((balance.totalUsed / Math.max(balance.totalPurchased, 1)) * 100, 100) : 0,
                "#f43f5e",
                `${balance?.totalUsed ?? 0}h`,
                "Hours Invested",
              )}
            </div>

            {/* Subject Mastery */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-5">Subject Mastery</h2>
              {student.subjects.length === 0 ? (
                <p className="text-sm text-gray-400">No subjects assigned yet.</p>
              ) : (
                <div className="space-y-4">
                  {student.subjects.map((sub, i) => {
                    const count  = subjectMap[sub] ?? 0;
                    const pctBar = count > 0 ? Math.round((count / maxSubCount) * 100) : 0;
                    return (
                      <div key={sub}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-gray-700">{sub}</p>
                          <span className="text-xs font-semibold text-gray-400">{count} session{count !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(pctBar, count > 0 ? 4 : 0)}%` }}
                            transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                            className={`h-full rounded-full bg-gradient-to-r ${subjectBarColors[i % subjectBarColors.length]}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Progress chart + Achievements */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Bar chart */}
              <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-bold text-gray-900">Progress Over Time</h2>
                  <span className="text-xs text-gray-400">{completed.length} sessions total</span>
                </div>
                <div className="flex items-end gap-2" style={{ height: "96px" }}>
                  {chartMonths.map(({ key, count }, i) => (
                    <div key={key} className="flex-1 flex flex-col items-center gap-1">
                      {count > 0 && <p className="text-[10px] font-bold text-gray-500">{count}</p>}
                      <div className="w-full flex items-end" style={{ height: "64px" }}>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: count > 0 ? `${Math.max((count / maxBar) * 64, 8)}px` : "3px" }}
                          transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
                          className={`w-full rounded-t-lg ${count > 0 ? "bg-blue-500" : "bg-gray-100"}`}
                        />
                      </div>
                      <p className="text-[9px] text-gray-400 text-center leading-tight whitespace-nowrap">{key}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-bold text-gray-900 mb-5">Achievements</h2>
                {achievements.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-3xl mb-2">🌱</p>
                    <p className="text-xs text-gray-400 leading-relaxed">Complete your first session to start earning achievements!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {achievements.slice(0, 4).map((a) => (
                      <div key={a.title} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                          <Star className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800">{a.title}</p>
                          <p className="text-[11px] text-gray-400">{a.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Session Impact + Study Tip */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Session Impact */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-bold text-gray-900 mb-5">Recent Session Impact</h2>
                {completed.length === 0 ? (
                  <p className="text-sm text-gray-400">No completed sessions yet.</p>
                ) : (
                  <div className="space-y-4">
                    {[...completed].reverse().slice(0, 4).map((s) => {
                      const note = sessionNotes.filter((n) => n.topic !== "_resource_").find((n) => n.sessionId === s.id);
                      return (
                        <div key={s.id} className="flex items-start gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                            <Star className="w-3.5 h-3.5 text-blue-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-800 truncate">{s.subject} · {formatDate(s.date)}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {note ? `${note.topic}${note.notes ? ` — ${note.notes.slice(0, 80)}${note.notes.length > 80 ? "…" : ""}` : ""}` : "Session completed"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Study Tip */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-sm flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h2 className="text-sm font-bold text-white/90">Daily Study Tip</h2>
                </div>
                <p className="text-[15px] font-medium leading-relaxed text-white/95 flex-1">{todayTip}</p>
                {sessionNotes.filter((n) => n.topic !== "_resource_").length > 0 && (
                  <div className="mt-5 pt-4 border-t border-white/20">
                    <p className="text-[11px] font-bold text-blue-200 mb-1">
                      Latest from {tutor?.name ?? "your tutor"}
                    </p>
                    <p className="text-sm text-blue-100 leading-relaxed" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {sessionNotes.filter((n) => n.topic !== "_resource_")[0]?.notes ?? ""}
                    </p>
                  </div>
                )}
                <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-white/20">
                  <div className="text-center">
                    <p className="text-lg font-bold">{completed.length}</p>
                    <p className="text-[10px] text-blue-200">Sessions</p>
                  </div>
                  <div className="text-center border-x border-white/20">
                    <p className="text-lg font-bold">{hwRate}%</p>
                    <p className="text-[10px] text-blue-200">HW Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{balance?.totalUsed ?? 0}h</p>
                    <p className="text-[10px] text-blue-200">Hours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── SESSION NOTES ── */}
      {tab === "notes" && (() => {
        const regularNotes  = sessionNotes.filter((n) => n.topic !== "_resource_");
        const resourceNotes = sessionNotes.filter((n) => n.topic === "_resource_");

        const filteredNotes = regularNotes.filter(
          (n) =>
            !notesSearch ||
            n.topic.toLowerCase().includes(notesSearch.toLowerCase()) ||
            n.notes.toLowerCase().includes(notesSearch.toLowerCase()),
        );

        const selectedNote = selectedNoteId !== null
          ? regularNotes.find((n) => n.id === selectedNoteId) ?? null
          : null;

        // Stats
        const sessionIdsWithNotes = new Set(
          regularNotes.map((n) => n.sessionId).filter((id): id is number => id !== null),
        );
        const coverageRate = completed.length > 0
          ? Math.round((sessionIdsWithNotes.size / completed.length) * 100)
          : 0;
        const notedSubjects = new Set<string>();
        regularNotes.forEach((n) => {
          const sess = mySessions.find((s) => s.id === n.sessionId);
          if (sess) notedSubjects.add(sess.subject);
        });

        // Selected note detail
        const selectedResources = selectedNote?.sessionId != null
          ? resourceNotes.filter((r) => r.sessionId === selectedNote.sessionId)
          : [];
        const selectedSession = selectedNote?.sessionId != null
          ? mySessions.find((s) => s.id === selectedNote.sessionId) ?? null
          : null;
        const relatedHw = selectedSession
          ? homeworkList.filter((h) => h.assignedDate === selectedSession.date)
          : [];

        return (
          <div className="space-y-5">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Session Notes</h1>
              <p className="text-sm text-gray-400 mt-1">
                Review notes, key takeaways, and study materials from every session.
              </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {([
                { label: "Total Notes",  value: regularNotes.length,  sub: "session summaries",   Icon: FileText,    iconBg: "bg-blue-50",    iconColor: "text-blue-600"    },
                { label: "Coverage",     value: `${coverageRate}%`,   sub: "sessions documented", Icon: CheckCircle, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
                { label: "Resources",    value: resourceNotes.length + regularNotes.filter((n) => n.kamiLink || n.attachmentUrl).length, sub: "study links shared",  Icon: Paperclip,   iconBg: "bg-amber-50",   iconColor: "text-amber-600"   },
                { label: "Subjects",     value: notedSubjects.size,   sub: "topics covered",      Icon: BookOpen,    iconBg: "bg-violet-50",  iconColor: "text-violet-600"  },
              ] as const).map(({ label, value, sub, Icon, iconBg, iconColor }) => (
                <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                  <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
                    <p className="text-[10px] font-medium text-gray-400 mt-0.5 uppercase tracking-wide">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">

              {/* ── Left: note list ── */}
              <div className="lg:col-span-2 space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search notes…"
                    value={notesSearch}
                    onChange={(e) => setNotesSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  />
                </div>

                {filteredNotes.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-3xl mb-2">📝</p>
                    <p className="text-sm text-gray-500">
                      {notesSearch ? "No notes match your search." : "No session notes yet."}
                    </p>
                    {!notesSearch && (
                      <p className="text-xs text-gray-400 mt-1">
                        Your tutor will add notes after each session.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredNotes.map((n, i) => {
                      const isSelected = selectedNoteId === n.id;
                      const sess    = mySessions.find((s) => s.id === n.sessionId);
                      const legacyResCount = resourceNotes.filter((r) => r.sessionId === n.sessionId).length;
                      const resCount = legacyResCount + (n.kamiLink ? 1 : 0) + (n.attachmentUrl ? 1 : 0);
                      return (
                        <motion.button
                          key={n.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.18, delay: i * 0.04 }}
                          onClick={() => setSelectedNoteId(isSelected ? null : n.id)}
                          className={`w-full text-left bg-white rounded-2xl border shadow-sm transition-all overflow-hidden ${
                            isSelected
                              ? "border-blue-300 ring-1 ring-blue-200"
                              : "border-gray-100 hover:border-gray-200 hover:shadow-md"
                          }`}
                        >
                          <div className="flex overflow-hidden">
                            {/* Accent bar */}
                            <div className={`w-1 shrink-0 self-stretch ${isSelected ? "bg-blue-500" : "bg-gray-100"}`} />
                            {/* Card body */}
                            <div className="flex-1 p-4 min-w-0">
                              {/* Row 1: number + topic + date */}
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`flex-shrink-0 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center ${
                                    isSelected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
                                  }`}>
                                    {i + 1}
                                  </span>
                                  <p className="text-sm font-bold text-gray-900 leading-snug truncate">{n.topic}</p>
                                </div>
                                <p className="text-[10px] text-gray-400 shrink-0 mt-px whitespace-nowrap">
                                  {formatDate((n.noteDate ?? n.createdAt).slice(0, 10))}
                                </p>
                              </div>
                              {/* Row 2: subject chip + notes preview */}
                              <div className="pl-7">
                                {sess && (
                                  <span className="inline-block text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full mb-1.5">
                                    {sess.subject}
                                  </span>
                                )}
                                <p className="text-xs text-gray-500 leading-relaxed"
                                  style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                  {n.notes}
                                </p>
                                {resCount > 0 && (
                                  <div className="flex items-center gap-1 mt-2">
                                    <Paperclip className="w-2.5 h-2.5 text-gray-400" />
                                    <span className="text-[10px] text-gray-400">
                                      {resCount} resource{resCount !== 1 ? "s" : ""}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Right: detail panel ── */}
              <div className="lg:col-span-3">
                {selectedNote ? (
                  <motion.div
                    key={selectedNote.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.22 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    {/* Panel header */}
                    <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h2 className="text-base font-bold text-gray-900 leading-snug">{selectedNote.topic}</h2>
                        <button
                          onClick={() => setSelectedNoteId(null)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                          {formatDate((selectedNote.noteDate ?? selectedNote.createdAt).slice(0, 10))}
                        </span>
                        {selectedSession && (
                          <span className="text-[11px] font-semibold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full">
                            {selectedSession.subject}
                          </span>
                        )}
                        {tutor && (
                          <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                            {tutor.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Key takeaways */}
                    <div className="px-6 py-5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Key Takeaways</p>
                      {(() => {
                        const lines = selectedNote.notes.split("\n").map((l) => l.trim()).filter(Boolean);
                        return lines.length > 1 ? (
                          <div className="space-y-3">
                            {lines.map((line, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                                  <CheckCircle className="w-3 h-3 text-blue-600" />
                                </span>
                                <p className="text-sm text-gray-700 leading-relaxed">{line}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedNote.notes}</p>
                        );
                      })()}
                    </div>

                    {/* Kami link + PDF attachment + legacy resource notes */}
                    {(selectedNote.kamiLink || selectedNote.attachmentUrl || selectedResources.length > 0) && (
                      <div className="px-6 py-4 border-t border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Resources</p>
                        <div className="space-y-2">
                          {selectedNote.kamiLink && (
                            <a
                              href={selectedNote.kamiLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2.5 text-xs font-medium text-violet-700 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-4 py-2.5 rounded-xl transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                              <span>Open Kami Lesson</span>
                            </a>
                          )}
                          {selectedNote.attachmentUrl && (
                            <button
                              onClick={() => openNoteAttachment(selectedNote)}
                              disabled={noteOpeningId === selectedNote.id}
                              className="w-full flex items-center gap-2.5 text-xs font-medium text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                            >
                              <Paperclip className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">
                                {noteOpeningId === selectedNote.id ? "Opening…" : (selectedNote.attachmentFilename ?? "View Attachment")}
                              </span>
                            </button>
                          )}
                          {selectedResources.map((r) => (
                            <a
                              key={r.id}
                              href={r.notes}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-4 py-2.5 rounded-xl transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{r.notes}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Homework Assigned */}
                    {relatedHw.length > 0 && (
                      <div className="px-6 py-4 border-t border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Homework Assigned</p>
                        <div className="space-y-2">
                          {relatedHw.map((h) => (
                            <div key={h.id} className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
                              <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-gray-800 truncate">{h.task}</p>
                                {h.dueDate && (
                                  <p className="text-[10px] text-amber-600 mt-0.5">Due {formatDate(h.dueDate)}</p>
                                )}
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                h.status === "completed" ? "bg-emerald-100 text-emerald-700"
                                : h.status === "submitted" ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                              }`}>
                                {h.status === "completed" ? "Graded" : h.status === "submitted" ? "Submitted" : "Pending"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Was this helpful? */}
                    <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/60 flex items-center gap-3">
                      <p className="text-xs text-gray-400">Was this helpful?</p>
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center text-center p-12 min-h-[320px]">
                    <div>
                      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-6 h-6 text-gray-300" />
                      </div>
                      <p className="text-sm font-semibold text-gray-500">Select a note to view details</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Click any note on the left to read the full content.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── UPDATES ── */}
      {tab === "updates" && (() => {
        // Sort newest first
        const sortedUpdates = [...parentUpdates].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

        const selectedUpdate = selectedUpdateId !== null
          ? sortedUpdates.find((u) => u.id === selectedUpdateId) ?? null
          : null;

        // Derive session data for the selected update
        const selectedSessions = selectedUpdate
          ? mySessions.filter((s) => selectedUpdate.sessionIds.includes(s.id))
          : [];
        const selectedSubjects = [...new Set(selectedSessions.map((s) => s.subject))];
        const selDates = selectedSessions.map((s) => s.date).sort();
        const selDateFrom = selDates[0];
        const selDateTo   = selDates[selDates.length - 1];

        // Stats
        const totalSessionsReferenced = new Set(parentUpdates.flatMap((u) => u.sessionIds)).size;

        // Message section parser — returns structured sections or raw text
        type ParsedMsg =
          | { type: "raw" }
          | { type: "structured"; summary: string; wentWell: string[]; improve: string[]; nextSteps: string[] };

        const parseMessage = (msg: string): ParsedMsg => {
          const lower = msg.toLowerCase();
          if (!lower.includes("went well") && !lower.includes("improve") && !lower.includes("next step")) {
            return { type: "raw" };
          }
          let sect = "summary";
          const summary: string[] = [];
          const wentWell: string[] = [];
          const improve: string[] = [];
          const nextSteps: string[] = [];
          for (const rawLine of msg.split("\n")) {
            const line = rawLine.trim();
            if (!line) continue;
            if (/went well|positive|strengths?/i.test(line) && line.length < 70)  { sect = "well";    continue; }
            if (/improve|challenge|growth/i.test(line) && line.length < 70)        { sect = "improve"; continue; }
            if (/next step|action|moving forward|goal/i.test(line) && line.length < 70) { sect = "next"; continue; }
            if (/summary|overall|progress update/i.test(line) && line.length < 70) { sect = "summary"; continue; }
            const content = line.replace(/^[-•*\d.]\s*/, "").trim();
            if (!content) continue;
            if (sect === "well")    wentWell.push(content);
            else if (sect === "improve")  improve.push(content);
            else if (sect === "next")     nextSteps.push(content);
            else                          summary.push(content);
          }
          if (!wentWell.length && !improve.length && !nextSteps.length) return { type: "raw" };
          return { type: "structured", summary: summary.join(" "), wentWell, improve, nextSteps };
        };

        const parsed: ParsedMsg | null = selectedUpdate ? parseMessage(selectedUpdate.message) : null;

        const subjectChipColors = [
          "bg-blue-100 text-blue-800",
          "bg-violet-100 text-violet-800",
          "bg-emerald-100 text-emerald-800",
          "bg-amber-100 text-amber-800",
          "bg-rose-100 text-rose-800",
        ];

        return (
          <div className="space-y-5">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Updates</h1>
              <p className="text-sm text-gray-400 mt-1">Progress and feedback from your tutor, delivered after each session block.</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {([
                {
                  label: "Updates",
                  value: String(parentUpdates.length),
                  sub: "received from tutor",
                  Icon: Bell,
                  iconBg: "bg-blue-50",
                  iconColor: "text-blue-600",
                },
                {
                  label: "Sessions Covered",
                  value: String(totalSessionsReferenced),
                  sub: "across all updates",
                  Icon: CalendarDays,
                  iconBg: "bg-violet-50",
                  iconColor: "text-violet-600",
                },
                {
                  label: "Latest Update",
                  value: sortedUpdates[0] ? formatDate(sortedUpdates[0].createdAt.slice(0, 10)) : "—",
                  sub: "most recent",
                  Icon: Clock,
                  iconBg: "bg-emerald-50",
                  iconColor: "text-emerald-600",
                },
                {
                  label: "Your Tutor",
                  value: tutor?.name.split(" ")[0] ?? "—",
                  sub: tutor?.name ?? "Assigned tutor",
                  Icon: Star,
                  iconBg: "bg-amber-50",
                  iconColor: "text-amber-500",
                },
              ] as const).map(({ label, value, sub, Icon, iconBg, iconColor }) => (
                <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                  <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-gray-900 leading-none truncate">{value}</p>
                    <p className="text-[10px] font-medium text-gray-400 mt-0.5 uppercase tracking-wide">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Body */}
            {parentUpdates.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-500">No updates yet</p>
                <p className="text-xs text-gray-400 mt-1">Your tutor will send updates here after sessions.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">

                {/* ── Left: update list ── */}
                <div className="lg:col-span-2 space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-3">All Updates</p>
                  {sortedUpdates.map((u, i) => {
                    const isSelected   = selectedUpdateId === u.id;
                    const uSessions    = mySessions.filter((s) => u.sessionIds.includes(s.id));
                    const uDates       = uSessions.map((s) => s.date).sort();
                    const fromDate     = uDates[0] ? formatDate(uDates[0]) : null;
                    const toDate       = uDates[uDates.length - 1] ? formatDate(uDates[uDates.length - 1]) : null;
                    const dateRange    = fromDate && toDate && fromDate !== toDate
                      ? `${fromDate} – ${toDate}`
                      : fromDate ?? formatDate(u.createdAt.slice(0, 10));

                    return (
                      <motion.button
                        key={u.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: i * 0.04 }}
                        onClick={() => setSelectedUpdateId(isSelected ? null : u.id)}
                        className={`w-full text-left bg-white rounded-2xl border shadow-sm transition-all overflow-hidden ${
                          isSelected
                            ? "border-blue-300 ring-1 ring-blue-200"
                            : "border-gray-100 hover:border-gray-200 hover:shadow-md"
                        }`}
                      >
                        <div className="flex overflow-hidden">
                          <div className={`w-1 shrink-0 self-stretch ${isSelected ? "bg-blue-500" : "bg-gray-100"}`} />
                          <div className="flex-1 p-4 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`flex-shrink-0 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center ${
                                  isSelected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
                                }`}>
                                  {i + 1}
                                </span>
                                <p className="text-sm font-bold text-gray-900 truncate">Weekly Progress Update</p>
                              </div>
                              <p className="text-[10px] text-gray-400 shrink-0 mt-px whitespace-nowrap">
                                {formatDate(u.createdAt.slice(0, 10))}
                              </p>
                            </div>
                            <div className="pl-7">
                              <p className="text-[10px] font-semibold text-blue-600 mb-1.5">By {tutor?.name ?? "your tutor"}</p>
                              <p className="text-xs text-gray-500 leading-relaxed"
                                style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {u.message.replace(/\n/g, " ")}
                              </p>
                              <div className="flex items-center gap-1 mt-2">
                                <CalendarDays className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                                <span className="text-[10px] text-gray-400">{dateRange}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* ── Right: detail panel ── */}
                <div className="lg:col-span-3">
                  {selectedUpdate ? (
                    <motion.div
                      key={selectedUpdate.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.22 }}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                    >
                      {/* Panel header */}
                      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-gray-400 mb-1">
                              {selDateFrom && selDateTo && selDateFrom !== selDateTo
                                ? `${formatDate(selDateFrom)} – ${formatDate(selDateTo)}`
                                : selDateFrom
                                  ? formatDate(selDateFrom)
                                  : formatDate(selectedUpdate.createdAt.slice(0, 10))}
                            </p>
                            <h2 className="text-base font-bold text-gray-900">Weekly Progress Update</h2>
                          </div>
                          <button
                            onClick={() => setSelectedUpdateId(null)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {tutor && (
                            <span className="text-[11px] font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
                              {tutor.name}
                            </span>
                          )}
                          {selectedSubjects.map((sub, idx) => (
                            <span key={sub} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${subjectChipColors[idx % subjectChipColors.length]}`}>
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Message body */}
                      {parsed?.type === "structured" ? (
                        <div className="px-6 py-5 space-y-5">
                          {/* Summary */}
                          {parsed.summary && (
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Overall Summary</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{parsed.summary}</p>
                            </div>
                          )}

                          {/* What went well */}
                          {parsed.wentWell.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">What Went Well</p>
                              <div className="space-y-2">
                                {parsed.wentWell.map((item, idx) => (
                                  <div key={idx} className="flex items-start gap-2.5">
                                    <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                      <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                                    </span>
                                    <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Areas to improve */}
                          {parsed.improve.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Areas to Improve</p>
                              <div className="space-y-2">
                                {parsed.improve.map((item, idx) => (
                                  <div key={idx} className="flex items-start gap-2.5">
                                    <span className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                                      <Lightbulb className="w-2.5 h-2.5 text-amber-600" />
                                    </span>
                                    <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Next steps */}
                          {parsed.nextSteps.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Next Steps</p>
                              <div className="space-y-2">
                                {parsed.nextSteps.map((item, idx) => (
                                  <div key={idx} className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-bold text-blue-700">
                                      {idx + 1}
                                    </span>
                                    <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="px-6 py-5">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Update</p>
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedUpdate.message}</p>
                        </div>
                      )}

                      {/* Footer */}
                      {tutor?.email && ctx.canReply && (
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between gap-4">
                          <p className="text-xs text-gray-400">Have a question about this update?</p>
                          <a
                            href={`mailto:${tutor.email}?subject=${encodeURIComponent(`Re: Weekly Progress Update – ${formatDate(selectedUpdate.createdAt.slice(0, 10))}`)}&body=${encodeURIComponent(`Hi ${tutor?.name ?? "there"},\n\n`)}`}
                            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition-colors shrink-0"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Reply to Tutor
                          </a>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center text-center p-12 min-h-[320px]">
                      <div>
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                          <Bell className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-sm font-semibold text-gray-500">Select an update to read it</p>
                        <p className="text-xs text-gray-400 mt-1">Click any update on the left to view the full message.</p>
                      </div>
                    </div>
                  )}
                </div>
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
        const futurePending = pending.filter((h) => !!h.dueDate && h.dueDate > today);

        // To Do = all pending, sorted overdue first then by due date
        const urgentPending = [...pending].sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        });
        const tableItems =
          hwFilter === "todo"        ? urgentPending
          : hwFilter === "submitted" ? submitted
          : hwFilter === "graded"    ? completedHw
          : homeworkList;

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
          const currentTime = hwTimeInputs[h.id] ?? (h.studentTimeMinutes?.toString() ?? "");
          const currentDiff = hwDiffInputs[h.id] ?? (h.difficultyRating ?? "");
          const currentNote = hwNoteInputs[h.id] ?? (h.studentNote ?? "");
          const diffLabels: Record<string, string> = { easy: "Easy", appropriate: "Appropriate", difficult: "Difficult" };

          // ── Vocabulary assignment: custom form ──────────────────────
          if (h.assignmentType === "sat_vocabulary") {
            const config  = vocabConfigs[h.id];
            const entries = vocabEntries[h.id] ?? [];
            const inputs  = vocabInputs[h.id]  ?? [];
            const saving  = vocabSavingId === h.id;
            const error   = vocabErrors[h.id];
            return (
              <div className="px-5 py-4 bg-gray-50/60 border-t border-gray-100 space-y-4">
                {/* Tutor instructions */}
                {h.instructions && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Instructions</p>
                    <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">{h.instructions}</p>
                  </div>
                )}
                {/* Grade + feedback (for graded submissions) */}
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
                {/* Word cards */}
                {config === undefined ? (
                  <p className="text-sm text-gray-400 py-2">Loading word list…</p>
                ) : config === null ? (
                  <p className="text-sm text-red-400 py-2">Word list not found. Ask your tutor to re-check the assignment.</p>
                ) : (
                  <div className="space-y-3">
                    {config.words.map((word, i) => {
                      const entry  = entries.find((e) => e.wordIndex === i);
                      const inp    = inputs[i] ?? { definition: "", sentence: "", confidence: "" };
                      const status = entry?.tutorStatus;
                      return (
                        <div key={i} className={`bg-white border rounded-xl p-4 space-y-3 ${
                          status === "correct"        ? "border-emerald-300"
                          : status === "needs_revision" ? "border-amber-300"
                          : "border-gray-200"
                        }`}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-gray-900">{word.word}</p>
                            {status === "correct" && <span className="shrink-0 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">✓ Correct</span>}
                            {status === "needs_revision" && <span className="shrink-0 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-full">Needs Revision</span>}
                          </div>
                          {word.hintDefinition && (
                            <p className="text-xs text-blue-600 italic">Hint: {word.hintDefinition}</p>
                          )}
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Definition</label>
                            <textarea
                              value={inp.definition}
                              onChange={(e) => setVocabInputs((prev) => {
                                const arr = [...(prev[h.id] ?? [])];
                                arr[i] = { ...(arr[i] ?? { definition: "", sentence: "", confidence: "" }), definition: e.target.value };
                                return { ...prev, [h.id]: arr };
                              })}
                              rows={2}
                              placeholder="Write a definition in your own words…"
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Example Sentence</label>
                            <textarea
                              value={inp.sentence}
                              onChange={(e) => setVocabInputs((prev) => {
                                const arr = [...(prev[h.id] ?? [])];
                                arr[i] = { ...(arr[i] ?? { definition: "", sentence: "", confidence: "" }), sentence: e.target.value };
                                return { ...prev, [h.id]: arr };
                              })}
                              rows={2}
                              placeholder="Use the word in a sentence…"
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Confidence</span>
                            {(["low", "medium", "high"] as const).map((c) => (
                              <button key={c}
                                onClick={() => setVocabInputs((prev) => {
                                  const arr = [...(prev[h.id] ?? [])];
                                  const cur = arr[i] ?? { definition: "", sentence: "", confidence: "" };
                                  arr[i] = { ...cur, confidence: cur.confidence === c ? "" : c };
                                  return { ...prev, [h.id]: arr };
                                })}
                                className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition-colors ${
                                  inp.confidence === c
                                    ? c === "high" ? "bg-emerald-600 text-white border-emerald-600"
                                      : c === "low" ? "bg-red-500 text-white border-red-500"
                                      : "bg-amber-400 text-white border-amber-400"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                }`}>{c.charAt(0).toUpperCase() + c.slice(1)}</button>
                            ))}
                          </div>
                          {entry?.tutorFeedback && (
                            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">Tutor Feedback</p>
                              <p className="text-sm text-blue-900">{entry.tutorFeedback}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {!isParent && (
                      <div className="pt-1 space-y-3">
                        {/* Time spent */}
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min="1" max="600" placeholder="20"
                            value={currentTime}
                            onChange={(e) => setHwTimeInputs((prev) => ({ ...prev, [h.id]: e.target.value }))}
                            className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-500">minutes spent studying</span>
                          {h.estimatedMinutes != null && (
                            <span className="text-xs text-blue-500 font-medium">(Est. {h.estimatedMinutes} min)</span>
                          )}
                        </div>
                        {error && <p className="text-xs text-red-500">{error}</p>}
                        <button
                          onClick={() => submitVocabularyHomework(h.id)}
                          disabled={!ctx.canSubmitHomework || saving}
                          className="self-start px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {saving ? "Saving…" : h.status === "pending" ? "Submit Vocabulary" : "Update Submission"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div className="px-5 py-4 bg-gray-50/60 border-t border-gray-100 space-y-3">
              {/* Tutor-provided resources */}
              {(h.attachmentUrl || h.kamiLink) && (
                <div className="flex flex-wrap gap-2">
                  {h.attachmentUrl && (
                    <button
                      onClick={() => openSubmission({ ...h, submissionUrl: h.attachmentUrl!, submissionFilename: h.attachmentFilename })}
                      disabled={hwOpeningId === h.id}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {h.attachmentFilename ?? "Download PDF"}
                    </button>
                  )}
                  {h.kamiLink && (
                    <a href={h.kamiLink} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-lg hover:bg-violet-100"
                    >
                      ✏️ Open in Kami
                    </a>
                  )}
                </div>
              )}
              {/* Tutor instructions */}
              {h.instructions && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Instructions</p>
                  <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">{h.instructions}</p>
                </div>
              )}
              {/* Student's own submission */}
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
              {/* Grade + feedback */}
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
              {/* Submit section — students only */}
              {!isParent && (
                <div>
                  {h.status !== "pending" && (
                    <p className="text-xs text-gray-400 mb-3">
                      {h.status === "submitted"
                        ? "Upload a new file to replace your current submission."
                        : "Upload an improved version below."}
                    </p>
                  )}
                  {/* Study time reporting */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 mb-3 space-y-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Your Study Time</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min="1" max="600" placeholder="30"
                        value={currentTime}
                        onChange={(e) => setHwTimeInputs((prev) => ({ ...prev, [h.id]: e.target.value }))}
                        className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-500">minutes spent working</span>
                      {h.estimatedMinutes != null && (
                        <span className="text-xs text-blue-500 font-medium ml-1">(Est. {h.estimatedMinutes} min)</span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">How was the difficulty? <span className="text-gray-400">(optional)</span></p>
                      <div className="flex gap-2">
                        {(["easy", "appropriate", "difficult"] as const).map((d) => (
                          <button key={d}
                            onClick={() => setHwDiffInputs((prev) => ({ ...prev, [h.id]: prev[h.id] === d ? "" : d }))}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                              currentDiff === d
                                ? d === "easy" ? "bg-emerald-600 text-white border-emerald-600"
                                  : d === "difficult" ? "bg-red-500 text-white border-red-500"
                                  : "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                            }`}>
                            {diffLabels[d]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Note <span className="text-gray-400">(optional)</span></p>
                      <textarea
                        value={currentNote}
                        onChange={(e) => setHwNoteInputs((prev) => ({ ...prev, [h.id]: e.target.value }))}
                        placeholder="Anything you want your tutor to know about this submission…"
                        rows={2}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
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
                    <button onClick={() => handleHomeworkUpload(h)} disabled={!ctx.canSubmitHomework || !file || isUploading}
                      title={!ctx.canSubmitHomework ? "Not available in admin preview" : undefined}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <Upload className="w-3.5 h-3.5" />{isUploading ? "Submitting…" : "Submit"}
                    </button>
                  </div>
                  {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
                  <p className="text-xs text-gray-400 mt-2">PDF only · Max 10 MB</p>
                </div>
              )}
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
                { label: "To Do",     value: pending.length,     sub: pending.length     === 1 ? "assignment" : "assignments", Icon: BookOpen,    iconBg: "bg-blue-50",    iconColor: "text-blue-600",    valColor: "text-gray-900"    },
                { label: "Submitted", value: submitted.length,   sub: submitted.length   === 1 ? "assignment" : "assignments", Icon: CheckCircle, iconBg: "bg-violet-50",  iconColor: "text-violet-500",  valColor: "text-violet-700"  },
                { label: "Late",      value: overdue.length,     sub: overdue.length     === 1 ? "assignment" : "assignments", Icon: AlertCircle, iconBg: overdue.length > 0 ? "bg-red-50" : "bg-gray-50", iconColor: overdue.length > 0 ? "text-red-500" : "text-gray-300", valColor: overdue.length > 0 ? "text-red-600" : "text-gray-300" },
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

            {/* Filter Tabs + View All */}
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 p-1 rounded-2xl gap-1 flex-1">
                {([
                  { key: "todo"      as const, label: "To Do",    count: urgentPending.length },
                  { key: "submitted" as const, label: "Submitted", count: submitted.length },
                  { key: "graded"    as const, label: "Graded",   count: completedHw.length },
                ]).map(({ key, label, count }) => (
                  <button key={key} onClick={() => setHwFilter(key)}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                      hwFilter === key
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}>
                    {label}{" "}<span className={`text-xs ${hwFilter === key ? "text-blue-600" : "text-gray-400"}`}>({count})</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setHwFilter(hwFilter === "all" ? "todo" : "all")}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all ${
                  hwFilter === "all"
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}>
                <BookOpen className="w-3.5 h-3.5" />
                {hwFilter === "all" ? "Filtered View" : "View All"}
              </button>
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
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {h.assignmentType === "sat_vocabulary" && (
                                  <span className="inline-flex items-center text-[10px] font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                                    Vocabulary
                                  </span>
                                )}
                                {h.estimatedMinutes != null && (
                                  <span className="inline-flex items-center text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                                    Est. {h.estimatedMinutes} min
                                  </span>
                                )}
                              </div>
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
                              <button onClick={() => {
                                if (h.assignmentType === "sat_vocabulary" && !hwExpandedIds.has(h.id)) {
                                  void loadVocabForHomework(h);
                                }
                                toggleExpand(h.id);
                              }}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border whitespace-nowrap transition-colors ${
                                  isExpanded          ? "bg-gray-100 text-gray-600 border-gray-200"
                                  : isOverdue         ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
                                  : h.status === "submitted" ? "border-gray-200 text-gray-700 hover:bg-gray-50"
                                  : h.status === "completed" ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                                  : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                                }`}>
                                {isExpanded ? "Close"
                                  : isOverdue ? "Submit Now"
                                  : h.status === "submitted" ? "Edit Submission"
                                  : h.status === "completed" ? "View Details"
                                  : "Start Assignment"}
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
                  {hwFilter === "todo" ? "No pending assignments — great work!" : hwFilter === "submitted" ? "Nothing submitted yet." : hwFilter === "graded" ? "No graded assignments yet." : "No assignments yet."}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {hwFilter === "todo" ? "Your tutor will assign new work after sessions." : ""}
                </p>
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
      {tab === "hours" && (() => {
        const now = new Date();
        const isThisMonth = (dateStr: string) => {
          const d = new Date(dateStr + "T12:00:00");
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        };
        const completedThisMonth = completed.filter((s) => isThisMonth(s.date));
        const hoursUsedThisMonth = completedThisMonth.reduce((sum, s) => sum + s.durationHours, 0);
        const sessionsThisMonth = completedThisMonth.length;

        const subjectHours: Record<string, number> = {};
        completed.forEach((s) => {
          subjectHours[s.subject] = (subjectHours[s.subject] ?? 0) + s.durationHours;
        });
        const totalCompletedHours = Object.values(subjectHours).reduce((a, b) => a + b, 0);
        const subjectColors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4"];
        const subjectEntries = Object.entries(subjectHours).sort((a, b) => b[1] - a[1]);

        const donutR = 54;
        const donutCirc = 2 * Math.PI * donutR;
        let donutOffset = 0;
        const donutSegments = subjectEntries.map(([subject, hrs], i) => {
          const fraction = totalCompletedHours > 0 ? hrs / totalCompletedHours : 0;
          const seg = { subject, hrs, color: subjectColors[i % subjectColors.length], dash: fraction * donutCirc, offset: donutOffset };
          donutOffset += fraction * donutCirc;
          return seg;
        });

        const ringR = 46;
        const ringCirc = 2 * Math.PI * ringR;
        const ringPct = balance ? Math.min((balance.remaining / Math.max(balance.totalPurchased, 1)) * 100, 100) : 0;

        return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Hours & Packages</h1>
              <p className="text-sm text-gray-400 mt-1">Track your tutoring hours, packages, and usage.</p>
            </div>
            <button
              onClick={() => setShowBuyPanel((v) => !v)}
              disabled={!ctx.canPurchaseHours}
              title={!ctx.canPurchaseHours ? "Not available in admin preview" : undefined}
              className="shrink-0 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              + Buy More Hours
            </button>
          </div>

          {purchaseSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
              {purchaseSuccess}
            </div>
          )}

          {showBuyPanel && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Choose a Package</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                {purchaseOptions.map((opt) => (
                  <div key={opt.id} className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col">
                    <p className="font-bold text-gray-900 text-lg">{opt.label}</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{opt.priceLabel}</p>
                    <p className="text-xs text-gray-500 mt-1 mb-4">
                      {opt.hours} session hour{opt.hours > 1 ? "s" : ""}
                    </p>
                    <button
                      onClick={() => requestPurchase(opt)}
                      disabled={purchaseSaving}
                      className="mt-auto w-full py-2 rounded-lg border border-blue-600 text-blue-600 text-sm font-medium hover:bg-blue-50 disabled:opacity-50"
                    >
                      {purchaseSaving ? "Submitting…" : "Request Purchase"}
                    </button>
                  </div>
                ))}
              </div>
              {purchaseError && <p className="text-xs text-red-500 mb-2">{purchaseError}</p>}
              <p className="text-xs text-gray-400">
                No payment collected here. Admin will confirm and send an invoice.
              </p>
            </div>
          )}

          {balance ? (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,1fr)] gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-6">
                <div className="relative w-28 h-28 shrink-0">
                  <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
                    <circle cx="56" cy="56" r={ringR} stroke="#f1f5f9" strokeWidth="10" fill="none" />
                    <circle cx="56" cy="56" r={ringR} stroke="#2563eb" strokeWidth="10" fill="none"
                      strokeDasharray={`${(ringPct / 100) * ringCirc} ${ringCirc}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-xl font-bold text-gray-900">{balance.remaining}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">hrs left</p>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{balance.totalPurchased}-Hour Package</p>
                  <p className="text-xs text-gray-400 mt-0.5">Expires {balance.expiresAt ? formatDate(balance.expiresAt) : "—"}</p>
                  <button
                    onClick={() => setTab("sessions")}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                  >
                    Book a Session
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-start">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{hoursUsedThisMonth}</p>
                <p className="text-xs text-gray-400 mt-1">Hours used this month</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-start">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
                  <CalendarDays className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{sessionsThisMonth}</p>
                <p className="text-xs text-gray-400 mt-1">Sessions completed this month</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-start">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
                  <Timer className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{balance.remaining}</p>
                <p className="text-xs text-gray-400 mt-1">Hours remaining</p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center text-gray-500 text-sm">
              No package yet. Contact MetaMinds to get started.
            </div>
          )}

          {balance && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-900">{balance.totalPurchased}-Hour Package</p>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Active</span>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  {balance.totalUsed}/{balance.totalPurchased} hrs used
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span><span className="font-semibold text-gray-900">{balance.remaining}</span> remaining</span>
                <span><span className="font-semibold text-gray-900">{completed.length}</span> sessions</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 pt-5 pb-3">
                <h3 className="font-semibold text-gray-900">Hours Usage History</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-2 text-left">Date</th>
                    <th className="px-6 py-2 text-left">Subject</th>
                    <th className="px-6 py-2 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {completed.length === 0 && (
                    <tr><td colSpan={3} className="px-6 py-6 text-center text-gray-400">No completed sessions yet.</td></tr>
                  )}
                  {[...completed].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map((s) => (
                    <tr key={s.id}>
                      <td className="px-6 py-3 text-gray-700">{formatDate(s.date)}</td>
                      <td className="px-6 py-3 text-gray-700">{s.subject}</td>
                      <td className="px-6 py-3 text-gray-700">{s.durationHours} hr</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Upcoming Sessions</h3>
                <button onClick={() => setTab("sessions")} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                  View Schedule
                </button>
              </div>
              <div className="space-y-3">
                {upcoming.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No upcoming sessions booked.</p>
                )}
                {upcoming.slice(0, 4).map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{s.subject}</p>
                      <p className="text-xs text-gray-400">{tutor?.name ?? "Your tutor"} · {formatDate(s.date)} · {s.time}</p>
                    </div>
                    <span className="text-xs font-medium text-gray-500 whitespace-nowrap">{s.durationHours} hr</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setTab("sessions")}
                className="mt-4 w-full py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <CalendarDays className="w-4 h-4" /> Book Another Session
              </button>
            </div>
          </div>

          {completed.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-5">Hours Breakdown</h3>
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="relative w-40 h-40 shrink-0">
                  <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
                    <circle cx="80" cy="80" r={donutR} stroke="#f1f5f9" strokeWidth="18" fill="none" />
                    {donutSegments.map((seg) => (
                      <circle key={seg.subject} cx="80" cy="80" r={donutR} stroke={seg.color} strokeWidth="18" fill="none"
                        strokeDasharray={`${seg.dash} ${donutCirc - seg.dash}`}
                        strokeDashoffset={-seg.offset} />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-2xl font-bold text-gray-900">{totalCompletedHours}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">hours used</p>
                  </div>
                </div>
                <div className="flex-1 w-full space-y-2">
                  {donutSegments.map((seg) => (
                    <div key={seg.subject} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                        <span className="text-gray-700 truncate">{seg.subject}</span>
                      </div>
                      <span className="text-gray-500 whitespace-nowrap">
                        {seg.hrs}h · {totalCompletedHours > 0 ? Math.round((seg.hrs / totalCompletedHours) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        );
      })()}

      {/* ── LEARNING PATH ── */}
      {tab === "path" && (() => {
        if (planLoading) return (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        );

        if (!studentPlanFull) return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl flex items-center justify-center mb-5">
              <MapIcon className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Learning Path Yet</h2>
            <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
              Your tutor will set up your personalized SAT learning path. Check back soon!
            </p>
          </div>
        );

        const total         = studentPlanFull.lessons.length;
        const completedCount= studentPlanFull.lessons.filter(l => l.status === "completed").length;
        const inProgressCount=studentPlanFull.lessons.filter(l => l.status === "in_progress").length;
        const pct           = total > 0 ? Math.round((completedCount / total) * 100) : 0;

        const planLessonMap: Record<number, StudentPlanLessonFull> = {};
        for (const pl of studentPlanFull.lessons) planLessonMap[pl.lessonId] = pl;

        const ss = studentPlanFull.sectionScores;
        const hasBaseline = !!studentPlanFull.skillBaseline && Object.keys(studentPlanFull.skillBaseline).length > 0;

        // Weeks until target date
        const weeksLeft = studentPlanFull.targetDate
          ? Math.max(0, Math.round((new Date(studentPlanFull.targetDate).getTime() - Date.now()) / (7 * 86400000)))
          : null;

        // Activity stats (computed from already-loaded state)
        const completedSessions = mySessions.filter(s => s.status === "completed");
        const sessionHours = completedSessions.reduce((sum, s) => sum + s.durationHours, 0);
        const studyMinutesTotal = studyLog.reduce((sum, e) => sum + e.minutes, 0);
        const studyHours = +(studyMinutesTotal / 60).toFixed(1);

        // Practice test score progression
        const testsWithScore = practiceTests.filter(t => t.overallScore != null);
        const latestTest     = testsWithScore.length > 0 ? testsWithScore[testsWithScore.length - 1] : null;
        const latestScore    = latestTest?.overallScore ?? null;

        // Estimated composite: most recent R&W + most recent Math across all tests
        const reversed       = [...practiceTests].reverse();
        const latestRW       = reversed.find(t => t.rwScore   != null)?.rwScore   ?? null;
        const latestMath     = reversed.find(t => t.mathScore != null)?.mathScore ?? null;
        const estimatedComposite = (latestRW != null && latestMath != null) ? latestRW + latestMath : null;

        // Use real composite if available, otherwise estimated from sections — never stale plan.currentScore
        const curScore    = latestScore ?? estimatedComposite ?? null;
        const isEstimated = latestScore == null && estimatedComposite != null;

        // Score-based milestones (4 checkpoints between start and goal)
        const startScore = studentPlanFull.startingScore ?? null;
        const goalScore  = studentPlanFull.targetScore ?? null;
        const milestones = (startScore && goalScore && goalScore > startScore)
          ? [1, 2, 3, 4].map(n => ({
              n,
              score: Math.round((startScore + ((goalScore - startScore) * n) / 4) / 10) * 10,
            }))
          : null;
        // Current milestone = first milestone score not yet exceeded by current score
        const curMilestoneIdx = milestones
          ? (curScore
            ? Math.min(milestones.length - 1, milestones.findIndex(m => (curScore ?? 0) < m.score) === -1 ? milestones.length - 1 : milestones.findIndex(m => (curScore ?? 0) < m.score))
            : Math.min(milestones.length - 1, Math.floor(pct / 25)))
          : 0;
        const curMilestone = milestones?.[curMilestoneIdx] ?? null;
        const milestoneAchieved = curScore !== null && goalScore !== null ? curScore >= goalScore : pct === 100;

        return (
          <div className="space-y-4">

            {/* ── Milestone banner ── */}
            <div className="bg-slate-900 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">
                  {milestoneAchieved ? "Plan Complete" : "Current Milestone"}
                </p>
                <p className="text-lg font-bold text-white">
                  {milestoneAchieved
                    ? "All Milestones Achieved"
                    : curMilestone
                    ? `Milestone ${curMilestone.n} — Score ${curMilestone.score}+`
                    : `Milestone 1 — First Practice Test`}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {milestoneAchieved
                    ? "Goal reached — great work!"
                    : curMilestone
                    ? `Reach ${curMilestone.score} consistently on practice tests`
                    : "Complete your first scored practice test with your tutor"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <p className="text-2xl font-bold text-white">{pct}%</p>
                <div className="w-28 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[10px] text-slate-500">{completedCount} of {total} lessons</p>
              </div>
            </div>

            {/* ── Top stat row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                {
                  label: curScore && curScore !== startScore ? "Current Score" : "Starting Score",
                  value: curScore ? `${isEstimated ? "~" : ""}${curScore}` : (startScore ? String(startScore) : "—"),
                  sub: isEstimated
                    ? `R&W ${latestRW} + Math ${latestMath} (est.)`
                    : curScore && startScore && curScore !== startScore
                    ? `started at ${startScore}`
                    : "baseline",
                  accent: curScore && startScore && curScore > startScore ? "text-emerald-700" : "text-gray-900",
                  Icon: BookOpen,
                  iconBg: "bg-blue-50",
                  iconColor: "text-blue-500",
                },
                {
                  label: "Goal Score",
                  value: studentPlanFull.targetScore ? String(studentPlanFull.targetScore) : "—",
                  sub: "target",
                  accent: "text-blue-600",
                  Icon: Zap,
                  iconBg: "bg-blue-50",
                  iconColor: "text-blue-500",
                },
                {
                  label: "Time Remaining",
                  value: weeksLeft !== null ? `${weeksLeft}` : "—",
                  sub: weeksLeft !== null ? "weeks" : "no date set",
                  accent: weeksLeft !== null && weeksLeft <= 4 ? "text-red-500" : "text-violet-600",
                  Icon: CalendarDays,
                  iconBg: "bg-violet-50",
                  iconColor: "text-violet-500",
                },
                {
                  label: "Study Goal",
                  value: studentPlanFull.studyMinutesPerWeek ? String(studentPlanFull.studyMinutesPerWeek) : "—",
                  sub: "min / week",
                  accent: "text-amber-600",
                  Icon: Clock,
                  iconBg: "bg-amber-50",
                  iconColor: "text-amber-500",
                },
                {
                  label: "Lessons Done",
                  value: `${completedCount}/${total}`,
                  sub: `${pct}% complete`,
                  accent: pct === 100 ? "text-emerald-600" : "text-blue-600",
                  Icon: CheckCircle,
                  iconBg: "bg-emerald-50",
                  iconColor: "text-emerald-500",
                },
              ].map(card => (
                <div key={card.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{card.label}</p>
                    <p className={`text-2xl font-bold ${card.accent}`}>{card.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                    <card.Icon className={`w-4 h-4 ${card.iconColor}`} />
                  </div>
                </div>
              ))}
            </div>

            {/* ── Score Journey bar ── */}
            {startScore && studentPlanFull.targetScore && (() => {
              const MIN = 400, MAX = 1600, SPAN = MAX - MIN;
              const goal       = studentPlanFull.targetScore;
              const startPct   = Math.max(0, Math.min(100, ((startScore - MIN) / SPAN) * 100));
              const curPct     = curScore ? Math.max(0, Math.min(100, ((curScore  - MIN) / SPAN) * 100)) : startPct;
              const goalPct    = Math.max(0, Math.min(100, ((goal       - MIN) / SPAN) * 100));
              const pointsLeft = curScore ? Math.max(0, goal - curScore) : goal - startScore;
              const gained     = curScore && curScore > startScore ? curScore - startScore : 0;
              return (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm px-6 py-5">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Score Journey</p>
                    <div className="flex items-center gap-2">
                      {gained > 0 && (
                        <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 border ${isEstimated ? "text-amber-700 bg-amber-50 border-amber-100" : "text-emerald-700 bg-emerald-50 border-emerald-100"}`}>
                          ~+{gained}{isEstimated ? " (est.)" : " gained"}
                        </span>
                      )}
                      {pointsLeft > 0 && (
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5">
                          +{pointsLeft} to goal
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative mb-12">
                    <div className="h-3 w-full bg-gray-100 rounded-full relative overflow-hidden">
                      {/* Progress from start to current */}
                      <div className={`absolute inset-y-0 transition-all duration-700 ${isEstimated ? "bg-amber-400" : "bg-emerald-400"}`}
                        style={{ left: `${startPct}%`, width: `${Math.max(0, curPct - startPct)}%` }} />
                      {/* Gap from current to goal */}
                      {pointsLeft > 0 && <div className="absolute inset-y-0 bg-blue-200" style={{ left: `${curPct}%`, width: `${Math.max(0, goalPct - curPct)}%` }} />}
                    </div>
                    {/* Start marker */}
                    <div className="absolute" style={{ left: `${startPct}%`, top: "-4px", transform: "translateX(-50%)" }}>
                      <div className="w-4 h-4 rounded-full bg-gray-300 border-2 border-white shadow-sm" />
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
                        <span className="text-xs font-bold text-gray-500 block">{startScore}</span>
                        <span className="text-[10px] text-gray-400">start</span>
                      </div>
                    </div>
                    {/* Current score marker (only if different from start) */}
                    {curScore && curScore !== startScore && (
                      <div className="absolute" style={{ left: `${curPct}%`, top: "-4px", transform: "translateX(-50%)" }}>
                        <div className={`w-5 h-5 rounded-full border-2 border-white shadow-md ${isEstimated ? "bg-amber-400" : "bg-emerald-500"}`} />
                        <div className="absolute top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
                          <span className={`text-sm font-bold block ${isEstimated ? "text-amber-600" : "text-emerald-700"}`}>
                            {isEstimated ? "~" : ""}{curScore}
                          </span>
                          <span className="text-[10px] text-gray-400">{isEstimated ? "est." : "current"}</span>
                        </div>
                      </div>
                    )}
                    {/* Goal marker */}
                    <div className="absolute" style={{ left: `${goalPct}%`, top: "-4px", transform: "translateX(-50%)" }}>
                      <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-md flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                      <div className="absolute top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
                        <span className="text-sm font-bold text-blue-600 block">{goal}</span>
                        <span className="text-[10px] text-gray-400">goal</span>
                      </div>
                    </div>
                    {/* Practice test dots on the bar — only for composite scores */}
                    {testsWithScore.length > 1 && testsWithScore.slice(0, -1).map((tr) => {
                      const tPct = Math.max(0, Math.min(100, (((tr.overallScore ?? 0) - MIN) / SPAN) * 100));
                      return (
                        <div key={tr.id} className="absolute" style={{ left: `${tPct}%`, top: "3px", transform: "translateX(-50%)" }}>
                          <div className="w-2 h-2 rounded-full bg-emerald-300 border border-white" title={`${tr.overallScore} — ${tr.testDate}`} />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-300 mt-2 px-0.5">
                    {[400, 600, 800, 1000, 1200, 1400, 1600].map(v => <span key={v}>{v}</span>)}
                  </div>
                </div>
              );
            })()}

            {/* ── Section Scores (R&W / Math) ── */}
            {ss && (ss.rw || ss.math || ss.english || ss.reading || ss.science) && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Section Scores — Starting</p>
                <div className="flex flex-wrap gap-4">
                  {[
                    { key: "rw",      label: "Reading & Writing", max: 800,  color: "text-violet-600 bg-violet-50" },
                    { key: "math",    label: "Math",              max: 800,  color: "text-blue-600 bg-blue-50"    },
                    { key: "english", label: "English",           max: 36,   color: "text-emerald-600 bg-emerald-50" },
                    { key: "reading", label: "Reading",           max: 36,   color: "text-amber-600 bg-amber-50"  },
                    { key: "science", label: "Science",           max: 36,   color: "text-red-600 bg-red-50"      },
                  ].map(f => {
                    const val = (ss as Record<string,number|undefined>)[f.key];
                    if (!val) return null;
                    return (
                      <div key={f.key} className={`flex flex-col items-center px-4 py-3 rounded-xl ${f.color.split(" ")[1]} border border-opacity-20`}>
                        <span className={`text-2xl font-bold ${f.color.split(" ")[0]}`}>{val}</span>
                        <span className="text-xs text-gray-500 mt-0.5">{f.label}</span>
                        <span className="text-[10px] text-gray-400">/ {f.max}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Practice Test History ── */}
            {practiceTests.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Practice Test History</p>
                <div className="space-y-2">
                  {practiceTests.map((tr, i) => {
                    // Delta only makes sense when both this and the prev test have an overall score
                    const prevOverall = i > 0
                      ? ([...practiceTests].slice(0, i).reverse().find(t => t.overallScore != null)?.overallScore ?? startScore)
                      : startScore;
                    const diff     = (tr.overallScore != null && prevOverall != null) ? tr.overallScore - prevOverall : null;
                    const isLatest = i === practiceTests.length - 1;
                    return (
                      <div key={tr.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${isLatest ? "border-emerald-200 bg-emerald-50" : "border-gray-100 bg-gray-50"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isLatest ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-600"}`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {tr.overallScore != null
                              ? <span className={`text-base font-bold ${isLatest ? "text-emerald-700" : "text-gray-800"}`}>{tr.overallScore}</span>
                              : <span className="text-xs text-gray-400 italic">Section only</span>
                            }
                            {tr.rwScore   && <span className="text-xs text-violet-600 bg-violet-100 px-2 py-0.5 rounded font-semibold">R&amp;W {tr.rwScore}</span>}
                            {tr.mathScore && <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded font-semibold">Math {tr.mathScore}</span>}
                            {diff !== null && diff !== 0 && (
                              <span className={`text-xs font-bold ${diff > 0 ? "text-emerald-600" : "text-red-500"}`}>
                                {diff > 0 ? "▲" : "▼"} {Math.abs(diff)} pts
                              </span>
                            )}
                            {isLatest && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Latest</span>}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">{tr.testDate}{tr.tutorNotes ? ` · ${tr.tutorNotes}` : ""}</p>
                        </div>
                        {goalScore && tr.overallScore != null && (
                          <div className="text-right shrink-0">
                            <p className={`text-xs font-semibold ${tr.overallScore >= goalScore ? "text-emerald-600" : "text-gray-400"}`}>
                              {tr.overallScore >= goalScore ? "✓ Goal" : `${goalScore - tr.overallScore} to go`}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Overall progress bar ── */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">{studentPlanFull.title}</p>
                <span className="text-sm font-bold text-blue-600">{pct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />{completedCount} done</span>
                {inProgressCount > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />{inProgressCount} in progress</span>}
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-200 inline-block" />{total - completedCount - inProgressCount} pending</span>
              </div>
            </div>

            {/* ── Activity stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Sessions Done",
                  value: String(completedSessions.length),
                  sub: `${sessionHours} hrs in session`,
                  accent: "text-blue-600",
                  Icon: Video,
                  iconBg: "bg-blue-50",
                  iconColor: "text-blue-500",
                },
                {
                  label: "Self Study",
                  value: `${studyHours}h`,
                  sub: studyMinutesTotal > 0 ? `${studyMinutesTotal} min logged` : "none logged yet",
                  accent: "text-violet-600",
                  Icon: FileText,
                  iconBg: "bg-violet-50",
                  iconColor: "text-violet-500",
                },
                {
                  label: "Total Hours Used",
                  value: balance ? String(balance.totalUsed) : "—",
                  sub: "session hours",
                  accent: "text-gray-700",
                  Icon: TrendingUp,
                  iconBg: "bg-gray-50",
                  iconColor: "text-gray-400",
                },
              ].map(card => (
                <div key={card.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{card.label}</p>
                    <p className={`text-2xl font-bold ${card.accent}`}>{card.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                    <card.Icon className={`w-4 h-4 ${card.iconColor}`} />
                  </div>
                </div>
              ))}
            </div>

            {/* ── Node graph roadmap ── */}
            {planCatalog && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                {/* Header + tabs */}
                <div className="px-5 pt-4 pb-0 border-b border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                    {planCatalog.title} — Skills Roadmap
                  </p>
                  <div className="flex">
                    {planCatalog.sections.map((s, i) => {
                      const sIds = s.categories.flatMap(c => c.lessons.map(l => l.id));
                      const sDone = sIds.filter(id => planLessonMap[id]?.status === "completed").length;
                      const sPlan = sIds.filter(id => id in planLessonMap).length;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setPlanSectionIdx(i)}
                          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                            planSectionIdx === i
                              ? "border-blue-500 text-blue-600"
                              : "border-transparent text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          {s.title}
                          {sPlan > 0 && (
                            <span className="text-[10px] font-bold text-gray-400">
                              {sDone}/{sPlan}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Node graph */}
                {planCatalog.sections[planSectionIdx] && (
                  <div className="p-5">
                    <SATRoadmapGraph
                      section={planCatalog.sections[planSectionIdx]}
                      skillBaseline={studentPlanFull.skillBaseline}
                      planLessonMap={planLessonMap}
                      skillNodes={pathSkillNodes}
                      onSkillClick={(id) => setSelectedSkillId(id)}
                    />
                  </div>
                )}

                {/* Legend */}
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-4">
                  {([
                    { color: "bg-emerald-400", label: "Completed" },
                    { color: "bg-blue-400",    label: "In Progress" },
                    { color: "bg-amber-400",   label: "Developing" },
                    { color: "bg-red-400",     label: "Needs Work" },
                    { color: "bg-gray-300",    label: "Not Assessed" },
                  ] as const).map(({ color, label }) => (
                    <span key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Baseline skill detail (expandable list, below graph) ── */}
            {planCatalog && hasBaseline && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Starting Proficiency Detail</p>
                </div>
                <div className="px-5 pb-5 space-y-4">
                  {planCatalog.sections.map(section => (
                    <div key={section.id} className="pt-3">
                      <p className="text-xs font-bold text-gray-700 mb-2">{section.title}</p>
                      <div className="space-y-1.5">
                        {section.categories.map(cat => {
                          const catEntry = studentPlanFull.skillBaseline?.[String(cat.id)];
                          if (!catEntry?.score && !Object.values(catEntry?.subskills ?? {}).some(s => s.score !== undefined)) return null;
                          const st = scoreToStatus(catEntry?.score);
                          return (
                            <div key={cat.id}>
                              <div className="flex items-center gap-2 py-0.5">
                                <span className="text-xs font-semibold text-gray-700 flex-1">{cat.title}</span>
                                {catEntry?.score !== undefined && (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[st]}`}>
                                    {catEntry.score}/6 — {STATUS_LABEL[st]}
                                  </span>
                                )}
                              </div>
                              {Object.entries(catEntry?.subskills ?? {}).map(([skill, entry]) => {
                                if (entry.score === undefined) return null;
                                const sst = scoreToStatus(entry.score);
                                return (
                                  <div key={skill} className="flex items-center gap-2 pl-3 py-0.5">
                                    <span className="text-xs text-gray-500 flex-1">{skill}</span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_BADGE[sst]}`}>
                                      {entry.score}/6
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!planCatalog && total > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                <p className="text-sm text-gray-400 text-center">{total} lessons in your plan.</p>
              </div>
            )}

            {/* Activity by Skill */}
            {(skillNoteLinks.length > 0 || skillHomeworkLinks.length > 0) && (() => {
              const allSkillIds = [...new Set([
                ...skillNoteLinks.map(l => l.skillId),
                ...skillHomeworkLinks.map(l => l.skillId),
              ])];
              const notesBySkill = new Map<number, SkillNoteLink[]>();
              for (const l of skillNoteLinks) {
                if (!notesBySkill.has(l.skillId)) notesBySkill.set(l.skillId, []);
                notesBySkill.get(l.skillId)!.push(l);
              }
              const hwBySkill = new Map<number, HomeworkSkillLink[]>();
              for (const h of skillHomeworkLinks) {
                if (!hwBySkill.has(h.skillId)) hwBySkill.set(h.skillId, []);
                hwBySkill.get(h.skillId)!.push(h);
              }
              return (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Activity by Skill</h3>
                  <div className="space-y-2">
                    {allSkillIds.map((skillId) => {
                      const notes   = notesBySkill.get(skillId) ?? [];
                      const hw      = hwBySkill.get(skillId) ?? [];
                      const node    = pathSkillNodes.find((n) => n.id === skillId);
                      const title   = node?.title ?? `Skill #${skillId}`;
                      const isOpen  = expandedSkills.has(skillId);
                      return (
                        <div key={skillId} className="border border-gray-100 rounded-xl overflow-hidden">
                          <button
                            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => {
                              const next = new Set(expandedSkills);
                              if (next.has(skillId)) next.delete(skillId); else next.add(skillId);
                              setExpandedSkills(next);
                            }}
                          >
                            <span className="text-left truncate mr-2">{title}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              {notes.length > 0 && (
                                <span className="text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full font-medium">{notes.length} session{notes.length !== 1 ? "s" : ""}</span>
                              )}
                              {hw.length > 0 && (
                                <span className="text-[11px] text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full font-medium">{hw.length} hw</span>
                              )}
                              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                            </div>
                          </button>
                          {isOpen && (
                            <div className="divide-y divide-gray-50 border-t border-gray-100">
                              {notes.length > 0 && (
                                <>
                                  <div className="px-4 py-1.5 bg-gray-50">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Related Sessions</p>
                                  </div>
                                  {notes.map((lnk) => (
                                    <div key={`n-${lnk.noteId}`} className="px-4 py-2.5 flex items-center justify-between">
                                      <span className="text-sm text-gray-700">{lnk.topic}</span>
                                      {lnk.noteDate && (
                                        <span className="text-xs text-gray-400">{formatDate(lnk.noteDate)}</span>
                                      )}
                                    </div>
                                  ))}
                                </>
                              )}
                              {hw.length > 0 && (
                                <>
                                  <div className="px-4 py-1.5 bg-gray-50">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Related Assignments</p>
                                  </div>
                                  {hw.map((h) => (
                                    <div key={`h-${h.homeworkId}`} className="px-4 py-2.5 space-y-0.5">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm text-gray-700 truncate">{h.task}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                          h.status === "completed" ? "bg-emerald-50 text-emerald-700"
                                          : h.status === "submitted" ? "bg-blue-50 text-blue-700"
                                          : "bg-amber-50 text-amber-700"
                                        }`}>{h.status}</span>
                                      </div>
                                      <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-wrap">
                                        {h.dueDate && <span>Due {formatDate(h.dueDate)}</span>}
                                        {h.estimatedMinutes && <span>{h.estimatedMinutes}m est.</span>}
                                        {h.studentTimeMinutes != null && <span>{h.studentTimeMinutes}m actual</span>}
                                        {h.grade && <span className="font-semibold text-emerald-600">{h.grade}</span>}
                                      </div>
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}

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

      {/* ── PROFILE ── */}
      {tab === "profile" && (() => {
        const displayInitials = student.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
        const completedCount  = completed.length;
        const hoursUsedAmt    = balance?.totalUsed ?? 0;
        const gradedHwCount   = homeworkList.filter((h) => h.status === "completed").length;
        const daysUntilNext   = nextSession
          ? Math.max(0, Math.ceil((new Date(nextSession.date + "T12:00:00").getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : null;

        const subjectCounts: Record<string, number> = {};
        completed.forEach((s) => { subjectCounts[s.subject] = (subjectCounts[s.subject] ?? 0) + 1; });
        const maxSubjCount = Math.max(...Object.values(subjectCounts), 1);
        const recentActivity = [...completed].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

        return (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="h-20 bg-gradient-to-r from-blue-600 to-violet-600" />
              <div className="px-6 pb-6">
                <div className="-mt-10 mb-4 flex items-end justify-between">
                  <div className="w-20 h-20 rounded-2xl bg-blue-600 border-4 border-white flex items-center justify-center text-white text-2xl font-bold shadow-md select-none">
                    {displayInitials}
                  </div>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-sm">
                    Premium Student
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {student.grade ? `Grade ${student.grade}` : "Student"} · {student.email}
                    </p>
                    {tutor && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <p className="text-xs text-gray-500">Tutor: <span className="font-semibold text-gray-700">{tutor.name}</span></p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {student.subjects.slice(0, 3).map((subj) => (
                      <span key={subj} className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        {subj}
                      </span>
                    ))}
                    {student.subjects.length > 3 && (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                        +{student.subjects.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([
                { label: "Sessions", value: completedCount, sub: "completed", color: "text-blue-600" },
                { label: "Hours Used", value: hoursUsedAmt, sub: `of ${balance?.totalPurchased ?? 0} purchased`, color: "text-violet-600" },
                { label: "Homework", value: gradedHwCount, sub: "graded complete", color: "text-emerald-600" },
                { label: "Subjects", value: student.subjects.length, sub: "currently studying", color: "text-amber-600" },
              ] as const).map((stat) => (
                <div key={stat.label} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Success Plan PDF */}
            {student.successPlanUrl && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Success Plan</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">
                      {student.successPlanUrl.split("/").pop()?.replace(/^\d+_/, "") ?? "Success Plan.pdf"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const { data: { session } } = await supabase.auth.getSession();
                      const res = await fetch("/api/student/success-plan/view", {
                        method: "POST",
                        headers: {
                          "content-type": "application/json",
                          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
                        },
                        body: JSON.stringify({ path: student.successPlanUrl }),
                      });
                      if (!res.ok) throw new Error("Failed to load");
                      const blob = await res.blob();
                      window.open(URL.createObjectURL(blob), "_blank");
                    } catch {
                      alert("Could not open your Success Plan. Please try again.");
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View PDF
                </button>
              </div>
            )}

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left: Progress + Upcoming */}
              <div className="lg:col-span-3 space-y-6">
                {/* Learning Progress */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Learning Progress</h3>
                    <button onClick={() => setTab("progress")} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      Full Progress →
                    </button>
                  </div>
                  {Object.keys(subjectCounts).length === 0 ? (
                    <p className="text-sm text-gray-400">No sessions completed yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(subjectCounts).map(([subj, count]) => {
                        const pctVal = Math.round((count / maxSubjCount) * 100);
                        return (
                          <div key={subj}>
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-sm font-medium text-gray-700">{subj}</p>
                              <span className="text-sm font-bold text-gray-900">{pctVal}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
                                style={{ width: `${pctVal}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Upcoming Schedule */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Upcoming Schedule</h3>
                    <button onClick={() => setTab("sessions")} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      View All →
                    </button>
                  </div>
                  {upcoming.length === 0 ? (
                    <p className="text-sm text-gray-400">No upcoming sessions scheduled.</p>
                  ) : (
                    <div className="space-y-3">
                      {upcoming.slice(0, 3).map((s) => {
                        const d = new Date(s.date + "T12:00:00");
                        const isToday = s.date === todayIso;
                        return (
                          <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 ${isToday ? "bg-blue-600" : "bg-white border border-gray-200"}`}>
                              <p className={`text-[10px] font-bold uppercase ${isToday ? "text-blue-200" : "text-gray-400"}`}>
                                {d.toLocaleDateString("en-US", { weekday: "short" })}
                              </p>
                              <p className={`text-sm font-bold leading-none ${isToday ? "text-white" : "text-gray-800"}`}>
                                {d.getDate()}
                              </p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{s.subject}</p>
                              <p className="text-xs text-gray-400">{s.time} · {s.durationHours}h</p>
                            </div>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${s.sessionType === "in-person" ? "bg-violet-50 text-violet-700" : "bg-blue-50 text-blue-700"}`}>
                              {s.sessionType === "in-person" ? "In-Person" : "Online"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Countdown + Activity + Hours */}
              <div className="lg:col-span-2 space-y-6">
                {nextSession && daysUntilNext !== null && (
                  <div className="bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl p-5 text-white">
                    <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-1">Next Session</p>
                    <p className="text-3xl font-bold">
                      {daysUntilNext === 0 ? "Today!" : daysUntilNext === 1 ? "Tomorrow" : `${daysUntilNext} days`}
                    </p>
                    <p className="text-sm text-blue-100 mt-1 font-medium">{nextSession.subject}</p>
                    <p className="text-xs text-blue-200 mt-0.5">{formatDate(nextSession.date)} · {nextSession.time}</p>
                  </div>
                )}

                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Recent Activity</h3>
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-gray-400">No sessions completed yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.map((s) => (
                        <div key={s.id} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{s.subject} session</p>
                            <p className="text-xs text-gray-400">{formatDate(s.date)} · {s.durationHours}h</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {balance && (
                  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Hours Package</h3>
                    <div className="flex items-end justify-between mb-2">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{balance.remaining}</p>
                        <p className="text-xs text-gray-400">hours remaining</p>
                      </div>
                      <button onClick={() => setTab("hours")} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                        Manage →
                      </button>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                        style={{ width: `${Math.round((balance.remaining / balance.totalPurchased) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">{balance.totalUsed} of {balance.totalPurchased} hours used</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── SETTINGS ── */}
      {tab === "settings" && (() => {
        const displayInitials = student.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

        const settingsSections = [
          { id: "profile"       as const, label: "Profile"        },
          { id: "notifications" as const, label: "Notifications"  },
          { id: "preferences"   as const, label: "Preferences"    },
          { id: "privacy"       as const, label: "Privacy"        },
          { id: "data"          as const, label: "Data & Account" },
        ];

        const mkToggle = (on: boolean, onToggle: () => void) => (
          <button
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${on ? "bg-blue-600" : "bg-gray-200"}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${on ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        );

        function handleSaveProfile() {
          setSettingsSaved(true);
          setTimeout(() => setSettingsSaved(false), 3000);
        }

        return (
          <div className="space-y-6">
            {/* Page header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-400 mt-1">Manage your profile, preferences, and notifications</p>
            </div>

            {/* Sub-nav */}
            <div className="overflow-x-auto">
              <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                {settingsSections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => setSettingsSection(sec.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      settingsSection === sec.id
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {sec.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Profile section ── */}
            {settingsSection === "profile" && (
              <div className="space-y-4">
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Profile Photo</h3>
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shrink-0 select-none">
                      {displayInitials}
                    </div>
                    <div>
                      <button className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors">
                        <Camera className="w-4 h-4" />
                        Upload New Photo
                      </button>
                      <p className="text-xs text-gray-400 mt-2">JPG, PNG · Max 2MB · Coming soon</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Profile Information</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1.5">Full Name</label>
                        <input
                          type="text"
                          value={student.name}
                          disabled
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-400 mt-1">Managed by admin</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1.5">Grade</label>
                        <input
                          type="text"
                          value={student.grade ? `Grade ${student.grade}` : "—"}
                          disabled
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1.5">Email Address</label>
                      <input
                        type="email"
                        value={student.email}
                        disabled
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-400 mt-1">Contact your admin to change your email</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        value={settingsPhone}
                        onChange={(e) => setSettingsPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1.5">About / Bio</label>
                      <textarea
                        value={settingsBio}
                        onChange={(e) => setSettingsBio(e.target.value)}
                        placeholder="Interests, goals, favorite subjects..."
                        rows={3}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      {settingsSaved ? (
                        <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4" />
                          Profile saved!
                        </p>
                      ) : <div />}
                      <button
                        onClick={handleSaveProfile}
                        className="bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        Save Profile
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Notifications section ── */}
            {settingsSection === "notifications" && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-100">
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Notification Preferences</h3>
                  <p className="text-xs text-gray-400">Choose what you want to be notified about</p>
                </div>
                {([
                  { label: "Session Reminders",       desc: "Get notified before each session starts",                on: settingsNotifSession,  toggle: () => setSettingsNotifSession((v)  => !v) },
                  { label: "Homework Due Alerts",      desc: "Reminders when homework is due soon",                   on: settingsNotifHomework, toggle: () => setSettingsNotifHomework((v) => !v) },
                  { label: "Session Updates",          desc: "When your tutor adds notes or reschedules",             on: settingsNotifUpdates,  toggle: () => setSettingsNotifUpdates((v)  => !v) },
                  { label: "New Activity",             desc: "When tutor assigns new homework or resources",          on: settingsNotifActivity, toggle: () => setSettingsNotifActivity((v) => !v) },
                  { label: "Messages",                 desc: "When you receive a message from your tutor",            on: settingsNotifMessages, toggle: () => setSettingsNotifMessages((v) => !v) },
                  { label: "Achievements & Announcements", desc: "Platform updates and milestones",                   on: settingsNotifAchieve,  toggle: () => setSettingsNotifAchieve((v)  => !v) },
                ]).map((item) => (
                  <div key={item.label} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                    {mkToggle(item.on, item.toggle)}
                  </div>
                ))}
              </div>
            )}

            {/* ── Preferences section ── */}
            {settingsSection === "preferences" && (
              <div className="space-y-4">
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Learning Preferences</h3>
                  <div className="space-y-5">
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-2">Current Subjects</label>
                      <div className="flex flex-wrap gap-2">
                        {student.subjects.map((subj) => (
                          <span key={subj} className="text-xs font-medium px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                            {subj}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Contact admin to add or remove subjects</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-2">Preferred Session Format</label>
                      <div className="flex gap-3">
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50">
                          <Video className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-sm text-gray-700">Online</span>
                        </div>
                        {student.allowInPerson && (
                          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50">
                            <MapPin className="w-3.5 h-3.5 text-violet-500" />
                            <span className="text-sm text-gray-700">In-Person</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Session type is set per booking in your Schedule</p>
                    </div>
                    {tutor && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-2">Assigned Tutor</label>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl w-fit">
                          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold select-none">
                            {tutor.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{tutor.name}</p>
                            <p className="text-xs text-gray-400">{tutor.email}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Privacy section ── */}
            {settingsSection === "privacy" && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-100">
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Privacy Settings</h3>
                  <p className="text-xs text-gray-400">Control what information is visible to others</p>
                </div>
                {([
                  { label: "Show Profile to Tutors",   desc: "Allow your tutor to view your full profile and learning history", on: settingsPrivProfile,  toggle: () => setSettingsPrivProfile((v)  => !v) },
                  { label: "Share Progress with Parents", desc: "Allow parents and guardians to view your progress reports",   on: settingsPrivProgress, toggle: () => setSettingsPrivProgress((v) => !v) },
                ]).map((item) => (
                  <div key={item.label} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                    {mkToggle(item.on, item.toggle)}
                  </div>
                ))}
              </div>
            )}

            {/* ── Data & Account section ── */}
            {settingsSection === "data" && (
              <div className="space-y-4">
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Download Your Data</h3>
                  <p className="text-xs text-gray-400 mb-4">Export your sessions, homework, and progress history</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-colors border border-blue-100">
                      <Download className="w-4 h-4" />
                      Download My Data
                    </button>
                    <button className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 px-4 py-2.5 rounded-xl transition-colors border border-gray-200">
                      <FileText className="w-4 h-4" />
                      Export Progress Report
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-red-100 rounded-2xl shadow-sm p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Delete Account</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Permanently delete your account and all associated data. This cannot be undone.
                        Please contact your admin to request account deletion.
                      </p>
                    </div>
                  </div>
                  <button className="text-sm font-medium text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors border border-red-100">
                    Request Account Deletion
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Skill Detail Drawer ── */}
      <SkillDetailDrawer
        skillId={selectedSkillId}
        studentId={student.id}
        skillNodes={pathSkillNodes}
        noteLinks={skillNoteLinks}
        hwLinks={skillHomeworkLinks}
        onClose={() => setSelectedSkillId(null)}
      />

    </DashboardShell>
  );
}
