"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import CourseLibrary from "@/components/curriculum/CourseLibrary";
import CoursesOverview from "@/components/portal/CoursesOverview";
import Badge from "@/components/portal/Badge";
import StatCard from "@/components/portal/StatCard";
import { formatDate, formatTime24to12, resolveZoomUrl, sendSessionConfirmationEmail } from "@/lib/portal/utils";
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
  fetchHomeworkByTutor, insertHomework, deleteHomework,
  addHomeworkFeedback, markHomeworkComplete, unsubmitHomework,
  updateSessionZoomLink, updateSession,
  fetchBlockedDates, addBlockedDate, removeBlockedDate,
  fetchParentUpdatesByTutor, insertParentUpdate,
  autoCompletePastSessions,
  fetchBlockedSlots, toggleBlockedSlot,
  updateSessionNote, deleteSessionNote,
  updateStudentProfile, updateTutorProfile,
  fetchStudyLog,
  fetchStudentPlans, fetchStudentPlanFull,
  fetchCourses, fetchFullCatalog,
  assignLessonToStudent, updatePlanLessonStatus, removeLessonFromPlan,
  deleteStudentPlan, updatePlanSectionBars, updatePlanSkillBaseline,
  fetchSkillNodes, fetchNoteSkills, setNoteSkillLinks,
  setHomeworkSkillLinks,
  upsertVocabularyConfig,
  fetchVocabularyConfig, fetchVocabularySubmissions,
  updateVocabularyEntry,
  fetchPracticeTestResults, insertPracticeTestResult, deletePracticeTestResult,
  updateStudentPlan,
  logCompletedHomework,
  fetchSatPracticeTestConfig, upsertSatPracticeTestConfig,
  fetchSatPracticeTestSubmission, fetchSatPracticeTestAnswers,
  fetchStudentSkills, recalculateDomainSkillsFromPracticeTest,
} from "@/lib/portal/db";
import PlanWizard from "@/components/portal/PlanWizard";
import SATRoadmapGraph from "@/components/portal/SATRoadmapGraph";
import SkillPicker from "@/components/portal/SkillPicker";
import StudentSkillPanel from "@/components/portal/StudentSkillPanel";
import SkillDetailDrawer from "@/components/portal/SkillDetailDrawer";
import { getSubskills, STATUS_LABEL, studentStatusToSkillStatus } from "@/lib/portal/planConfig";
import type {
  Student, Tutor, Session, HoursBalance, TutorAvailability,
  SessionNote, Homework, BlockedDate, ParentUpdate, BlockedSlot, StudyLog,
  StudentPlanFull, Course, CourseCatalogFull, SkillBaseline, SkillNode,
  VocabularyAssignmentConfig, VocabularySubmissionEntry, PracticeTestResult,
  SatPracticeTestConfig, SatPracticeTestSubmission, SatPracticeTestAnswer, SatCategoryScore,
  StudentSkill,
} from "@/lib/portal/types";
import { ExternalLink, ChevronRight, CheckCircle, FileText, Upload, Search, Trash2, BookOpen, Plus, X, Users, CalendarDays, Clock, Bell, AlertCircle, Video, ChevronDown } from "lucide-react";

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
  { id: "overview",  label: "Overview"       },
  { id: "students",  label: "My Students"    },
  { id: "schedule",  label: "Schedule"       },
  { id: "notes",     label: "Session Notes"  },
  { id: "homework",  label: "Homework"       },
  { id: "courses",   label: "Courses"        },
  { id: "library",   label: "Course Library" },
  { id: "settings",  label: "Settings"       },
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

  // ── PERSONAL ZOOM LINK + MEETING ID ─────────────────────────────
  const [zoomLinkVal,     setZoomLinkVal]     = useState("");
  const [meetingIdVal,    setMeetingIdVal]    = useState("");
  const [zoomLinkSaving,  setZoomLinkSaving]  = useState(false);
  const [zoomLinkSaved,   setZoomLinkSaved]   = useState(false);

  // ── BOOKING LEAD TIME ───────────────────────────────────────────
  const [leadHours,  setLeadHours]  = useState<24 | 48>(24);
  const [leadSaved,  setLeadSaved]  = useState(false);
  const [leadSaving, setLeadSaving] = useState(false);
  const [leadError,  setLeadError]  = useState("");

  // ── CANCEL SESSION ──────────────────────────────────────────────
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // ── RESEND SESSION EMAIL ──────────────────────────────────────────
  const [resendingSessionId, setResendingSessionId] = useState<number | null>(null);
  const [resentSessionId,    setResentSessionId]    = useState<number | null>(null);

  // ── DUPLICATE SESSION (next week, same day/time) ────────────────
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null);
  const [duplicatedId,  setDuplicatedId]  = useState<number | null>(null);
  const [duplicateError, setDuplicateError] = useState("");

  // ── AVAILABILITY EDITOR ─────────────────────────────────────────
  const [availSlots,  setAvailSlots]  = useState<{ dayOfWeek: number; startTime: string; endTime: string }[]>([]);
  const [availDay,    setAvailDay]    = useState("1");
  const [availStart,  setAvailStart]  = useState("");
  const [availEnd,    setAvailEnd]    = useState("");
  const [availSaved,  setAvailSaved]  = useState(false);
  const [availSaving, setAvailSaving] = useState(false);

  // ── SESSION NOTES FORM ──────────────────────────────────────────
  const [noteStudentId, setNoteStudentId] = useState("");
  const [noteSessionId, setNoteSessionId] = useState("");
  const [noteTopic,     setNoteTopic]     = useState("");
  const [noteText,      setNoteText]      = useState("");
  const [noteKamiLink,  setNoteKamiLink]  = useState("");
  const [noteDate,      setNoteDate]      = useState("");
  const [noteFile,      setNoteFile]      = useState<File | null>(null);
  const [noteSaving,    setNoteSaving]    = useState(false);
  const [noteSkillIds,  setNoteSkillIds]  = useState<number[]>([]);
  const [allSkillNodes, setAllSkillNodes] = useState<SkillNode[]>([]);
  const [panelStudentSkills, setPanelStudentSkills] = useState<StudentSkill[]>([]);
  const [roadmapUpdateBanner, setRoadmapUpdateBanner] = useState<string | null>(null);
  const [noteSuccess,   setNoteSuccess]   = useState(false);
  const [noteError,     setNoteError]     = useState("");

  // ── HOMEWORK FORM ───────────────────────────────────────────────
  const [hwStudentId, setHwStudentId] = useState("");
  const [hwTask,      setHwTask]      = useState("");
  const [hwDue,       setHwDue]       = useState("");
  const [hwKamiLink,  setHwKamiLink]  = useState("");
  const [hwFile,      setHwFile]      = useState<File | null>(null);
  const [hwUploading, setHwUploading] = useState(false);
  const [hwSaving,    setHwSaving]    = useState(false);
  const [hwSuccess,   setHwSuccess]   = useState(false);
  const [hwError,     setHwError]     = useState("");
  const [hwShowForm,     setHwShowForm]     = useState(false);
  const [hwEstMins,      setHwEstMins]      = useState("");
  const [hwType,         setHwType]         = useState("");
  const [hwInstructions, setHwInstructions] = useState("");
  const [hwSkillIds,     setHwSkillIds]     = useState<number[]>([]);

  // Log Past Work form (backdated completed homework)
  const [hwPastShowForm,     setHwPastShowForm]     = useState(false);
  const [hwPastStudentId,    setHwPastStudentId]    = useState("");
  const [hwPastTask,         setHwPastTask]         = useState("");
  const [hwPastType,         setHwPastType]         = useState("");
  const [hwPastAssignedDate, setHwPastAssignedDate] = useState("");
  const [hwPastCompletedDate,setHwPastCompletedDate]= useState("");
  const [hwPastGrade,        setHwPastGrade]        = useState("");
  const [hwPastFeedback,     setHwPastFeedback]     = useState("");
  const [hwPastTimeMins,     setHwPastTimeMins]     = useState("");
  const [hwPastSaving,       setHwPastSaving]       = useState(false);
  const [hwPastError,        setHwPastError]        = useState("");

  // Vocabulary assignment creation
  const [hwVocabWords, setHwVocabWords] = useState<{ word: string; hint: string }[]>([{ word: "", hint: "" }]);

  // SAT Practice Test assignment config creation
  const [hwPtProvider,     setHwPtProvider]     = useState("bluebook");
  const [hwPtTestName,     setHwPtTestName]      = useState("");
  const [hwPtRwCount,      setHwPtRwCount]       = useState("54");
  const [hwPtMathCount,    setHwPtMathCount]     = useState("44");
  const [hwPtExternalLink, setHwPtExternalLink]  = useState("");

  // Tutor review of practice test submissions
  const [satPtReview,        setSatPtReview]        = useState<Record<number, { config: SatPracticeTestConfig; sub: SatPracticeTestSubmission; answers: SatPracticeTestAnswer[] } | null>>({});
  const [satPtReviewLoading, setSatPtReviewLoading] = useState<Record<number, boolean>>({});
  const [satPtReportOpening, setSatPtReportOpening] = useState<Record<number, boolean>>({});

  // Tutor review of vocabulary submissions (keyed by homework id)
  const [vocabReviewData,      setVocabReviewData]      = useState<Record<number, { config: VocabularyAssignmentConfig; entries: VocabularySubmissionEntry[] }>>({});
  const [vocabReviewLoading,   setVocabReviewLoading]   = useState<Record<number, boolean>>({});
  const [vocabFeedbackInputs,  setVocabFeedbackInputs]  = useState<Record<number, Record<number, string>>>({});   // hwId → entryId → feedback text
  const [vocabReviewSaving,    setVocabReviewSaving]    = useState<Record<number, boolean>>({});

  // ── HOMEWORK FEEDBACK ────────────────────────────────────────────
  const [hwFeedbackId,     setHwFeedbackId]     = useState<number | null>(null);
  const [hwFeedbackText,   setHwFeedbackText]   = useState("");
  const [hwGradeText,      setHwGradeText]      = useState("");
  const [hwFeedbackSaving, setHwFeedbackSaving] = useState(false);
  const [hwOpeningId,      setHwOpeningId]      = useState<number | null>(null);

  // ── HOMEWORK UNSUBMIT (send back to student) ─────────────────────
  const [hwUnsubmitId,      setHwUnsubmitId]      = useState<number | null>(null);
  const [hwUnsubmitNote,    setHwUnsubmitNote]    = useState("");
  const [hwUnsubmitDue,     setHwUnsubmitDue]     = useState("");
  const [hwUnsubmitSaving,  setHwUnsubmitSaving]  = useState(false);
  const [hwUnsubmitError,   setHwUnsubmitError]   = useState("");

  // ── STUDENT PROFILE MODAL ───────────────────────────────────────
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [planUploading,  setPlanUploading]  = useState(false);
  const [planUploadErr,  setPlanUploadErr]  = useState("");
  const [planUploaded,   setPlanUploaded]   = useState(false);
  const [planRemoving,   setPlanRemoving]   = useState(false);

  // ── BLOCKED DATES ───────────────────────────────────────────────
  const [blockDateInput, setBlockDateInput] = useState("");
  const [blockReason,    setBlockReason]    = useState("");
  const [blockSaving,    setBlockSaving]    = useState(false);
  const [blockError,     setBlockError]     = useState("");

  // ── SESSION DETAIL MODAL ────────────────────────────────────────
  const [sessionDetail,   setSessionDetail]   = useState<Session | null>(null);
  const [sdNoteTopic,     setSdNoteTopic]     = useState("");
  const [sdNoteText,      setSdNoteText]      = useState("");
  const [sdNoteKamiLink,  setSdNoteKamiLink]  = useState("");
  const [sdNoteDate,      setSdNoteDate]      = useState("");
  const [sdNoteSaving,    setSdNoteSaving]    = useState(false);
  const [sdNoteSuccess,   setSdNoteSuccess]   = useState(false);
  const [sdNoteError,     setSdNoteError]     = useState("");

  // ── ZOOM LINK ───────────────────────────────────────────────────
  const [zoomEditId,  setZoomEditId]  = useState<number | null>(null);
  const [zoomEditVal, setZoomEditVal] = useState("");
  const [zoomSaving,  setZoomSaving]  = useState(false);

  // ── NOTE EDIT ────────────────────────────────────────────────────
  const [noteEditId,       setNoteEditId]       = useState<number | null>(null);
  const [noteEditTopic,    setNoteEditTopic]    = useState("");
  const [noteEditText,     setNoteEditText]     = useState("");
  const [noteEditKamiLink, setNoteEditKamiLink] = useState("");
  const [noteEditDate,     setNoteEditDate]     = useState("");
  const [noteEditSaving,   setNoteEditSaving]   = useState(false);
  const [noteEditSkillIds, setNoteEditSkillIds] = useState<number[]>([]);

  // ── STUDENT PANEL ────────────────────────────────────────────────
  const [selectedStudentId,   setSelectedStudentId]   = useState<number | null>(null);
  const [studentPanelTab,     setStudentPanelTab]     = useState<"homework" | "sessions" | "update" | "accountability" | "plan" | "skills">("homework");
  const [tutorSkillId,        setTutorSkillId]        = useState<number | null>(null);
  const [previewLoadingId,    setPreviewLoadingId]    = useState<number | null>(null);

  // Plan sub-tab
  const [panelPlanFull,         setPanelPlanFull]         = useState<StudentPlanFull | null>(null);
  const [panelPlanLoading,      setPanelPlanLoading]      = useState(false);
  const [panelPlanError,        setPanelPlanError]        = useState("");
  const [panelPlanSuccess,      setPanelPlanSuccess]      = useState("");
  const [panelCourses,          setPanelCourses]          = useState<Course[]>([]);
  const [panelCatalog,          setPanelCatalog]          = useState<CourseCatalogFull | null>(null);
  const [panelShowPicker,       setPanelShowPicker]       = useState(false);
  const [panelPickerExpSec,     setPanelPickerExpSec]     = useState<number | null>(null);
  const [panelNewCourseId,      setPanelNewCourseId]      = useState<number | null>(null);
  const [panelNewTitle,         setPanelNewTitle]         = useState("");
  const [panelNewCurrentScore,  setPanelNewCurrentScore]  = useState("");
  const [panelNewTargetScore,   setPanelNewTargetScore]   = useState("");
  const [panelNewTargetDate,    setPanelNewTargetDate]    = useState("");
  const [panelCreating,         setPanelCreating]         = useState(false);
  const [panelDeletingPlan,     setPanelDeletingPlan]     = useState(false);
  const [panelShowBarsEditor,     setPanelShowBarsEditor]     = useState(false);
  const [panelBarsDraft,          setPanelBarsDraft]          = useState<Record<string, number>>({});
  const [panelSavingBars,         setPanelSavingBars]         = useState(false);
  const [panelShowBaselineEditor, setPanelShowBaselineEditor] = useState(false);
  const [panelBaselineDraft,      setPanelBaselineDraft]      = useState<SkillBaseline>({});
  const [panelBaselineExpCats,    setPanelBaselineExpCats]    = useState<Set<number>>(new Set());
  const [panelSavingBaseline,     setPanelSavingBaseline]     = useState(false);
  const [panelPlanView,           setPanelPlanView]           = useState<"lessons" | "roadmap">("lessons");
  const [panelTestResults,        setPanelTestResults]        = useState<PracticeTestResult[]>([]);
  const [panelShowLogTest,        setPanelShowLogTest]        = useState(false);
  const [panelTestDate,           setPanelTestDate]           = useState("");
  const [panelTestOverall,        setPanelTestOverall]        = useState("");
  const [panelTestRW,             setPanelTestRW]             = useState("");
  const [panelTestMath,           setPanelTestMath]           = useState("");
  const [panelTestNotes,          setPanelTestNotes]          = useState("");
  const [panelTestSaving,         setPanelTestSaving]         = useState(false);
  const [panelTestDeletingId,     setPanelTestDeletingId]     = useState<number | null>(null);
  const [selectedStudyLog,    setSelectedStudyLog]    = useState<StudyLog[]>([]);
  const [studyLogLoading,     setStudyLogLoading]     = useState(false);
  const [hwDeletingId,        setHwDeletingId]        = useState<number | null>(null);
  const [hwTabFilter,         setHwTabFilter]         = useState<"review" | "pending" | "graded" | "all">("review");
  const [hwSearchQuery,       setHwSearchQuery]       = useState("");
  const [hwFilterStudent,     setHwFilterStudent]     = useState("");
  const [hwReviewId,          setHwReviewId]          = useState<number | null>(null);
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

  // ── NOTE LIST PANEL ──────────────────────────────────────────────
  const [selectedNoteId,      setSelectedNoteId]      = useState<number | null>(null);
  const [noteSearchQuery,     setNoteSearchQuery]      = useState("");
  const [noteFilterStudentId, setNoteFilterStudentId] = useState("");
  const [showNoteForm,        setShowNoteForm]         = useState(false);

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
    if (tutor) {
      setLeadHours(tutor.bookingLeadHours === 48 ? 48 : 24);
      setZoomLinkVal(tutor.zoomLink ?? "");
      setMeetingIdVal(tutor.meetingId ?? "");
    }
  }, [tutor]);

  // Load SAT skill nodes once
  useEffect(() => {
    fetchSkillNodes("SAT").then(setAllSkillNodes).catch(() => {});
  }, []);

  // Load plan when plan sub-tab is opened
  useEffect(() => {
    if (studentPanelTab !== "plan" || !selectedStudentId) return;
    setPanelPlanLoading(true);
    setPanelPlanError("");
    setPanelPlanFull(null);
    setPanelCatalog(null);
    setPanelShowPicker(false);
    setPanelPlanSuccess("");
    setPanelStudentSkills([]);
    fetchStudentSkills(selectedStudentId, "SAT").then(setPanelStudentSkills).catch(() => {});
    (async () => {
      try {
        const [plans, courses] = await Promise.all([
          fetchStudentPlans(selectedStudentId),
          fetchCourses(),
        ]);
        setPanelCourses(courses);
        const activePlan = plans.find(p => p.status === "active") ?? plans[0] ?? null;
        if (activePlan) {
          const [full, catalog, testResults] = await Promise.all([
            fetchStudentPlanFull(selectedStudentId, activePlan.courseId),
            fetchFullCatalog(activePlan.courseId),
            fetchPracticeTestResults(selectedStudentId),
          ]);
          setPanelPlanFull(full);
          setPanelCatalog(catalog);
          setPanelTestResults(testResults);
        } else if (courses.length > 0) {
          setPanelNewCourseId(courses[0].id);
          setPanelNewTitle(`${courses[0].title} — Learning Plan`);
        }
      } catch (err) {
        setPanelPlanError(err instanceof Error ? err.message : "Failed to load plan");
      } finally {
        setPanelPlanLoading(false);
      }
    })();
  }, [studentPanelTab, selectedStudentId]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const upcoming = localSessions
    .filter((s) => s.status === "upcoming" && s.date >= todayIso)
    .sort((a, b) => a.date.localeCompare(b.date));

  function getStudent(id: number) { return myStudents.find((s) => s.id === id); }

  async function startStudentPreview(studentId: number) {
    setPreviewLoadingId(studentId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/tutor/start-preview", {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ studentId }),
      });
      const json = await res.json() as { previewUrl?: string; error?: string };
      if (!res.ok || !json.previewUrl) throw new Error(json.error ?? "Failed to start preview");
      router.push(json.previewUrl);
    } catch {
      setPreviewLoadingId(null);
    }
  }

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
      sendSessionConfirmationEmail(newSession.id);
      setSchedSuccess(true);
      setSelectedSlot(null); setSchedSubject(""); setSchedDuration("1"); setSchedSessionType("online"); setSchedZoom("");
      setTimeout(() => setSchedSuccess(false), 4000);
    } catch { setSchedError("Failed to schedule session."); }
  }

  async function savePersonalZoomLink() {
    setZoomLinkSaving(true); setZoomLinkSaved(false);
    try {
      await updateTutorProfile(tutorId, { zoomLink: zoomLinkVal.trim(), meetingId: meetingIdVal.trim() });
      setZoomLinkSaved(true); setTimeout(() => setZoomLinkSaved(false), 3000);
    } catch { /* silent */ } finally { setZoomLinkSaving(false); }
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
      await cancelSession(session.id);
      setLocalSessions((prev) => prev.map((s) => s.id === session.id ? { ...s, status: "cancelled" } : s));
      setBalances((prev) => prev.map((b) =>
        b.studentId === session.studentId
          ? { ...b, totalUsed: Math.max(0, b.totalUsed - session.durationHours), remaining: b.remaining + session.durationHours }
          : b
      ));
    } catch { /* silent */ } finally { setCancellingId(null); }
  }

  async function handleDuplicateSession(session: Session) {
    setDuplicatingId(session.id); setDuplicateError(""); setDuplicatedId(null);
    try {
      const [y, m, d] = session.date.split("-").map(Number);
      const nextDate = new Date(Date.UTC(y, m - 1, d + 7)).toISOString().slice(0, 10);
      const newSession = await insertSession({
        studentId: session.studentId, tutorId,
        subject: session.subject, sessionDate: nextDate,
        sessionTime: session.time, durationHours: session.durationHours,
        sessionType: session.sessionType,
      });
      setLocalSessions((prev) => [...prev, newSession]);
      sendSessionConfirmationEmail(newSession.id);
      setDuplicatedId(session.id);
      setTimeout(() => setDuplicatedId(null), 4000);
    } catch (e: unknown) {
      setDuplicateError(e instanceof Error ? e.message : "Failed to duplicate session.");
    } finally { setDuplicatingId(null); }
  }

  async function resendSessionEmail(sessionId: number) {
    setResendingSessionId(sessionId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/portal/send-session-confirmation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(session ? { authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ sessionId }),
      });
      const json = await res.json();
      if (json.sent) {
        setResentSessionId(sessionId);
        setTimeout(() => setResentSessionId(null), 3000);
      }
    } catch { /* silent */ } finally { setResendingSessionId(null); }
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
      const updated = await updateSessionNote(
        noteId,
        noteEditTopic.trim(),
        noteEditText.trim(),
        noteEditKamiLink.trim() || undefined,
        noteEditDate || undefined,
      );
      setSessionNotes((prev) => prev.map((n) => n.id === noteId ? updated : n));
      const note = sessionNotes.find((n) => n.id === noteId);
      if (note) {
        await setNoteSkillLinks(noteId, noteEditSkillIds, note.studentId, tutorId);
      }
      setNoteEditId(null);
      setNoteEditSkillIds([]);
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
        kamiLink: sdNoteKamiLink.trim() || undefined,
        noteDate: sdNoteDate || undefined,
      });
      setSessionNotes((prev) => [note, ...prev]);
      setSdNoteTopic(""); setSdNoteText(""); setSdNoteKamiLink(""); setSdNoteDate("");
      setSdNoteSuccess(true); setTimeout(() => setSdNoteSuccess(false), 3000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setSdNoteError(`Failed to save note: ${msg}`);
    }
    finally { setSdNoteSaving(false); }
  }

  async function submitNote(): Promise<number | null> {
    if (!noteTopic || !noteText || !noteStudentId) { setNoteError("Fill in student, topic, and notes."); return null; }
    setNoteSaving(true); setNoteError("");
    try {
      const note = await insertSessionNote({
        tutorId, studentId: Number(noteStudentId),
        topic: noteTopic, notes: noteText,
        sessionId: noteSessionId ? Number(noteSessionId) : undefined,
        kamiLink: noteKamiLink.trim() || undefined,
        noteDate: noteDate || undefined,
      });

      // Upload PDF attachment if one was selected
      if (noteFile) {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token ?? "";
        const fd = new FormData();
        fd.append("noteId", String(note.id));
        fd.append("file", noteFile);
        const res = await fetch("/api/session-notes/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (res.ok) {
          const { note: updated } = await res.json() as { note: Record<string, unknown> };
          const mapped: import("@/lib/portal/types").SessionNote = {
            ...note,
            attachmentUrl:      (updated.attachment_url      as string | undefined) ?? undefined,
            attachmentFilename: (updated.attachment_filename as string | undefined) ?? undefined,
          };
          setSessionNotes((prev) => [mapped, ...prev]);
        } else {
          setSessionNotes((prev) => [note, ...prev]);
        }
      } else {
        setSessionNotes((prev) => [note, ...prev]);
      }

      if (noteSkillIds.length > 0) {
        await setNoteSkillLinks(note.id, noteSkillIds, Number(noteStudentId), tutorId);
      }
      setNoteTopic(""); setNoteText(""); setNoteKamiLink(""); setNoteDate(""); setNoteSessionId(""); setNoteFile(null);
      setNoteSkillIds([]);
      setNoteSuccess(true); setTimeout(() => setNoteSuccess(false), 4000);
      return note.id;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setNoteError(`Failed to save notes: ${msg}`);
      return null;
    } finally { setNoteSaving(false); }
  }

  async function submitHomework() {
    if (!hwTask || !hwStudentId) { setHwError("Fill in student and task."); return; }
    setHwSaving(true); setHwUploading(false); setHwError("");
    try {
      const estMinsNum = hwEstMins ? Number.parseInt(hwEstMins, 10) : undefined;
      let hw = await insertHomework({
        tutorId, studentId: Number(hwStudentId), task: hwTask,
        dueDate: hwDue || undefined, kamiLink: hwKamiLink.trim() || undefined,
        estimatedMinutes: Number.isInteger(estMinsNum) && (estMinsNum ?? 0) > 0 ? estMinsNum : undefined,
        assignmentType:   hwType || undefined,
        instructions:     hwInstructions.trim() || undefined,
      });

      // Upload PDF attachment if provided
      if (hwFile) {
        setHwUploading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const fd = new FormData();
        fd.append("file", hwFile);
        fd.append("hwId", String(hw.id));
        const res = await fetch("/api/homework/attach", {
          method: "POST",
          headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
          body: fd,
        });
        if (res.ok) {
          const json = await res.json() as { homework: Record<string, unknown> };
          hw = { ...hw, attachmentUrl: json.homework.attachment_url as string, attachmentFilename: json.homework.attachment_filename as string };
        }
        setHwUploading(false);
      }

      if (hwType === "sat_vocabulary") {
        const validWords = hwVocabWords.filter((w) => w.word.trim());
        if (validWords.length === 0) { setHwError("Add at least one vocabulary word."); return; }
        await upsertVocabularyConfig(hw.id, validWords.map((w) => ({
          word:           w.word.trim(),
          hintDefinition: w.hint.trim() || undefined,
        })));
      }
      if (hwType === "sat_practice_test") {
        await upsertSatPracticeTestConfig({
          homeworkId:       hw.id,
          provider:         hwPtProvider,
          assignedTestName: hwPtTestName.trim() || undefined,
          rwQuestionCount:  parseInt(hwPtRwCount)   || 54,
          mathQuestionCount:parseInt(hwPtMathCount) || 44,
          externalLink:     hwPtExternalLink.trim() || undefined,
        });
        setHwPtProvider("bluebook"); setHwPtTestName("");
        setHwPtRwCount("54"); setHwPtMathCount("44"); setHwPtExternalLink("");
      }
      if (hwSkillIds.length > 0) {
        await setHomeworkSkillLinks(hw.id, hwSkillIds, Number(hwStudentId), tutorId);
      }
      setHomework((prev) => [hw, ...prev]);
      setHwTask(""); setHwDue(""); setHwKamiLink(""); setHwFile(null);
      setHwEstMins(""); setHwType(""); setHwInstructions(""); setHwSkillIds([]);
      setHwVocabWords([{ word: "", hint: "" }]);
      setHwSuccess(true); setTimeout(() => setHwSuccess(false), 4000);
    } catch { setHwError("Failed to assign homework."); }
    finally { setHwSaving(false); setHwUploading(false); }
  }

  async function openSubmission(hw: { id: number; submissionUrl?: string; submissionFilename?: string }) {
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

  async function saveFeedback(hwId: number) {
    if (!hwFeedbackText.trim()) return;
    setHwFeedbackSaving(true);
    try {
      const updated = await addHomeworkFeedback(hwId, hwFeedbackText.trim(), hwGradeText.trim() || undefined);
      setHomework((prev) => prev.map((h) => h.id === hwId ? updated : h));
      setHwFeedbackId(null);
      setHwFeedbackText("");
      setHwGradeText("");
      if (updated.assignmentType === "sat_practice_test") {
        void applyPracticeTestToRoadmap(hwId, updated.studentId);
      }
    } catch { /* silent */ } finally { setHwFeedbackSaving(false); }
  }

  async function saveUnsubmit(hwId: number) {
    if (!hwUnsubmitNote.trim() || !hwUnsubmitDue) {
      setHwUnsubmitError("A note and a new due date are required.");
      return;
    }
    setHwUnsubmitSaving(true);
    setHwUnsubmitError("");
    try {
      const updated = await unsubmitHomework(hwId, hwUnsubmitNote.trim(), hwUnsubmitDue);
      setHomework((prev) => prev.map((h) => h.id === hwId ? updated : h));
      setHwUnsubmitId(null);
      setHwUnsubmitNote("");
      setHwUnsubmitDue("");
    } catch {
      setHwUnsubmitError("Failed to send assignment back. Please try again.");
    } finally {
      setHwUnsubmitSaving(false);
    }
  }

  /** Grading a sat_practice_test homework is the tutor's review step — recalculate the
   *  8 domain-level student_skills from its category breakdown when that happens. */
  async function applyPracticeTestToRoadmap(hwId: number, studentId: number) {
    try {
      let ptData = satPtReview[hwId];
      if (ptData === undefined) {
        const config = await fetchSatPracticeTestConfig(hwId);
        const sub = config ? await fetchSatPracticeTestSubmission(hwId, studentId) : null;
        ptData = sub && config ? { config, sub, answers: [] } : null;
      }
      if (!ptData || ptData.sub.isDraft || !ptData.sub.categoryBreakdown) return;

      const changes = await recalculateDomainSkillsFromPracticeTest(
        studentId,
        ptData.sub.categoryBreakdown,
        {
          testLabel: ptData.sub.submittedTestName ?? ptData.config.assignedTestName ?? "Practice Test",
          testDate:  ptData.sub.completedDate,
        },
      );
      if (changes.length === 0) return;

      if (selectedStudentId === studentId) {
        fetchStudentSkills(studentId, "SAT").then(setPanelStudentSkills).catch(() => {});
      }
      const summary = changes
        .map((c) => `${c.title}: ${STATUS_LABEL[studentStatusToSkillStatus(c.before)]} → ${STATUS_LABEL[studentStatusToSkillStatus(c.after)]}`)
        .join(", ");
      setRoadmapUpdateBanner(`Roadmap updated — ${summary}`);
      setTimeout(() => setRoadmapUpdateBanner(null), 8000);
    } catch { /* non-critical — grading itself already succeeded */ }
  }

  async function completeHomework(hwId: number) {
    try {
      const updated = await markHomeworkComplete(hwId);
      setHomework((prev) => prev.map((h) => h.id === hwId ? updated : h));
    } catch { /* silent */ }
  }

  async function loadVocabReview(hwId: number) {
    if (vocabReviewData[hwId] || vocabReviewLoading[hwId]) return;
    setVocabReviewLoading((prev) => ({ ...prev, [hwId]: true }));
    try {
      const [config, entries] = await Promise.all([
        fetchVocabularyConfig(hwId),
        fetchVocabularySubmissions(hwId),
      ]);
      if (config) {
        setVocabReviewData((prev) => ({ ...prev, [hwId]: { config, entries } }));
        const feedbackMap: Record<number, string> = {};
        entries.forEach((e) => { feedbackMap[e.id] = e.tutorFeedback ?? ""; });
        setVocabFeedbackInputs((prev) => ({ ...prev, [hwId]: feedbackMap }));
      }
    } catch { /* silent */ } finally {
      setVocabReviewLoading((prev) => ({ ...prev, [hwId]: false }));
    }
  }

  async function saveVocabEntryReview(hwId: number, entryId: number, status: "correct" | "needs_revision") {
    const feedback = vocabFeedbackInputs[hwId]?.[entryId] ?? "";
    setVocabReviewSaving((prev) => ({ ...prev, [entryId]: true }));
    try {
      const updated = await updateVocabularyEntry(entryId, { tutorStatus: status, tutorFeedback: feedback || undefined });
      setVocabReviewData((prev) => {
        const cur = prev[hwId];
        if (!cur) return prev;
        return {
          ...prev,
          [hwId]: { ...cur, entries: cur.entries.map((e) => e.id === entryId ? updated : e) },
        };
      });
    } catch { /* silent */ } finally {
      setVocabReviewSaving((prev) => ({ ...prev, [entryId]: false }));
    }
  }

  async function openScoreReport(subId: number, path: string) {
    setSatPtReportOpening((prev) => ({ ...prev, [subId]: true }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/practice-test/score-report", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(session ? { authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ path }),
      });
      if (!res.ok) { alert("Could not open score report. Please try again."); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch { alert("Could not open score report. Please try again."); }
    finally { setSatPtReportOpening((prev) => ({ ...prev, [subId]: false })); }
  }

  async function loadSatPtReview(hwId: number, studentId: number) {
    if (satPtReview[hwId] !== undefined) return;
    setSatPtReviewLoading((prev) => ({ ...prev, [hwId]: true }));
    try {
      const config = await fetchSatPracticeTestConfig(hwId);
      if (!config) { setSatPtReview((prev) => ({ ...prev, [hwId]: null })); return; }
      const sub = await fetchSatPracticeTestSubmission(hwId, studentId);
      const answers = sub ? await fetchSatPracticeTestAnswers(sub.id) : [];
      setSatPtReview((prev) => ({
        ...prev,
        [hwId]: sub ? { config, sub, answers } : null,
      }));
    } catch {
      setSatPtReview((prev) => ({ ...prev, [hwId]: null }));
    } finally {
      setSatPtReviewLoading((prev) => ({ ...prev, [hwId]: false }));
    }
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

  async function handleDeleteHomework(hwId: number) {
    if (!confirm("Delete this assignment? This cannot be undone.")) return;
    setHwDeletingId(hwId);
    try {
      await deleteHomework(hwId);
      setHomework((prev) => prev.filter((h) => h.id !== hwId));
    } catch { alert("Failed to delete. Please try again."); }
    finally { setHwDeletingId(null); }
  }

  async function submitPastHomework() {
    if (!hwPastStudentId || !hwPastTask.trim() || !hwPastAssignedDate || !hwPastCompletedDate) {
      setHwPastError("Student, task, assigned date, and completed date are all required."); return;
    }
    if (hwPastCompletedDate < hwPastAssignedDate) {
      setHwPastError("Completed date cannot be before assigned date."); return;
    }
    setHwPastSaving(true); setHwPastError("");
    try {
      const hw = await logCompletedHomework({
        studentId:           Number(hwPastStudentId),
        tutorId,
        task:                hwPastTask.trim(),
        assignedDate:        hwPastAssignedDate,
        completedDate:       hwPastCompletedDate,
        assignmentType:      hwPastType || undefined,
        grade:               hwPastGrade.trim() || undefined,
        feedback:            hwPastFeedback.trim() || undefined,
        studentTimeMinutes:  hwPastTimeMins ? parseInt(hwPastTimeMins) : undefined,
      });
      setHomework((prev) => [hw, ...prev]);
      setHwPastShowForm(false);
      setHwPastStudentId(""); setHwPastTask(""); setHwPastType("");
      setHwPastAssignedDate(""); setHwPastCompletedDate("");
      setHwPastGrade(""); setHwPastFeedback(""); setHwPastTimeMins("");
    } catch (err) {
      setHwPastError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setHwPastSaving(false);
    }
  }

  async function sendParentUpdate(studentId: number) {
    if (!parentUpdateText.trim()) return;
    setParentUpdateSaving(true); setParentUpdateSuccess(false);
    try {
      const update = await insertParentUpdate(tutorId, studentId, parentUpdateText.trim(), puSelectedSessionIds);
      setParentUpdates((prev) => [update, ...prev]);
      // Fire email non-blocking — failures don't block the UI
      supabase.auth.getSession().then(({ data: { session } }) => {
        fetch("/api/portal/send-parent-update", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(session ? { authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ tutorId, studentId, message: parentUpdateText.trim(), sessionIds: puSelectedSessionIds }),
        }).then((r) => r.json()).then((j) => console.log("[email]", j)).catch(console.error);
      });
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

  async function uploadSuccessPlan(file: File) {
    if (!profileStudent) return;
    setPlanUploading(true); setPlanUploadErr(""); setPlanUploaded(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const form = new FormData();
      form.append("file", file);
      form.append("studentId", String(profileStudent.id));
      const res = await fetch("/api/student/success-plan/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
      });
      if (!res.ok) {
        const j = await res.json() as { error?: string };
        throw new Error(j.error ?? "Upload failed");
      }
      const j = await res.json() as { path?: string };
      const newUrl = j.path ?? profileStudent.successPlanUrl;
      const updated: Student = { ...profileStudent, successPlanUrl: newUrl };
      setMyStudents((prev) => prev.map((s) => s.id === updated.id ? updated : s));
      setProfileStudent(updated);
      setPlanUploaded(true);
      setTimeout(() => setPlanUploaded(false), 4000);
    } catch (e: unknown) {
      setPlanUploadErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setPlanUploading(false);
    }
  }

  async function removeSuccessPlan() {
    if (!profileStudent) return;
    if (!window.confirm("Remove the Success Plan PDF?")) return;
    setPlanRemoving(true); setPlanUploadErr("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const res = await fetch("/api/student/success-plan/remove", {
        method: "POST",
        headers: { "content-type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ studentId: profileStudent.id }),
      });
      if (!res.ok) {
        const j = await res.json() as { error?: string };
        throw new Error(j.error ?? "Remove failed");
      }
      const updated: Student = { ...profileStudent, successPlanUrl: undefined };
      setMyStudents((prev) => prev.map((s) => s.id === updated.id ? updated : s));
      setProfileStudent(updated);
    } catch (e: unknown) {
      setPlanUploadErr(e instanceof Error ? e.message : "Remove failed");
    } finally {
      setPlanRemoving(false);
    }
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
    {roadmapUpdateBanner && (
      <div className="fixed bottom-5 right-5 z-[100] max-w-sm bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-2xl shadow-lg px-4 py-3 flex items-start gap-2">
        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
        <span>{roadmapUpdateBanner}</span>
      </div>
    )}
    <DashboardShell role="tutor" userName={user?.fullName ?? tutor.name} navItems={navItems} activeTab={tab} onTabChange={handleTabChange}
      fullBleed={tab === "library" || tab === "notes"}>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (() => {
        const todaySessions  = upcoming.filter((s) => s.date === todayIso).sort((a, b) => timeTo24h(a.time).localeCompare(timeTo24h(b.time)));
        const futureSessions = upcoming.filter((s) => s.date > todayIso).slice(0, 6);
        const hwNeedsGrading = homework.filter((h) => h.status === "submitted");
        const weekAgoIso     = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const thisMonthPfx   = new Date().toISOString().slice(0, 7);
        const sessThisMonth  = localSessions.filter((s) => s.date.startsWith(thisMonthPfx)).length;
        const studentsNeedingUpdate = myStudents.filter((st) => {
          const past = localSessions.filter((s) => s.studentId === st.id && (s.status === "completed" || s.date < todayIso));
          if (past.length === 0) return false;
          const lastUpd = parentUpdates.filter((u) => u.studentId === st.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
          const lastUpdDate = lastUpd?.createdAt.slice(0, 10) ?? "0000-00-00";
          return past.some((s) => s.date >= weekAgoIso && s.date > lastUpdDate);
        });
        const AVATAR_COLORS = ["bg-blue-500","bg-violet-500","bg-emerald-500","bg-amber-500","bg-rose-500","bg-cyan-500","bg-indigo-500","bg-orange-500"];
        const avatarColor = (sid: number) => { const i = myStudents.findIndex((s) => s.id === sid); return AVATAR_COLORS[i % AVATAR_COLORS.length] ?? "bg-gray-400"; };

        return (
          <div className="space-y-6">
            {/* Zoom warning */}
            {!tutor.zoomLink && (
              <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Zoom link not set</p>
                  <p className="text-xs text-amber-600 mt-0.5">Students won&apos;t have a link to join. Ask admin to add your Zoom room link.</p>
                </div>
              </div>
            )}

            {/* Welcome + stat cards */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Dashboard</p>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome, {(user?.fullName ?? tutor.name).split(" ")[0]}
              </h1>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                  { label: "My Students",     value: myStudents.length, Icon: Users,       iconBg: "bg-blue-50",    iconColor: "text-blue-500"   },
                  { label: "Sessions / Month", value: sessThisMonth,     Icon: CalendarDays, iconBg: "bg-violet-50",  iconColor: "text-violet-500" },
                  { label: "Notes Written",   value: sessionNotes.filter(n => n.topic !== "_resource_").length, Icon: FileText, iconBg: "bg-emerald-50", iconColor: "text-emerald-500" },
                  { label: "To Grade",        value: hwNeedsGrading.length, Icon: CheckCircle, iconBg: hwNeedsGrading.length > 0 ? "bg-amber-50" : "bg-gray-50", iconColor: hwNeedsGrading.length > 0 ? "text-amber-500" : "text-gray-400" },
                ] as const).map(card => (
                  <div key={card.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{card.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    </div>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                      <card.Icon className={`w-4 h-4 ${card.iconColor}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Agenda */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Today&apos;s Agenda</p>
              {todaySessions.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl px-5 py-8 text-center shadow-sm">
                  <CalendarDays className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No sessions today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaySessions.map((s) => {
                    const st = getStudent(s.studentId);
                    const studentHw  = homework.filter((h) => h.studentId === s.studentId && h.status === "submitted");
                    const lastNote   = sessionNotes.filter((n) => n.studentId === s.studentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
                    const lastUpd    = parentUpdates.filter((u) => u.studentId === s.studentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
                    const lastUpdDate = lastUpd?.createdAt.slice(0, 10) ?? "0000-00-00";
                    const pastSt     = localSessions.filter((ps) => ps.studentId === s.studentId && (ps.status === "completed" || ps.date < todayIso));
                    const updateOverdue = pastSt.length > 0 && pastSt.some((ps) => ps.date >= weekAgoIso && ps.date > lastUpdDate);
                    return (
                      <div key={s.id}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest("button,a,input")) return;
                          setSdNoteTopic(""); setSdNoteText(""); setSdNoteKamiLink(""); setSdNoteError(""); setSdNoteSuccess(false);
                          setSessionDetail(s);
                        }}>
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarColor(s.studentId)}`}>
                            {st?.name[0] ?? "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="font-bold text-gray-900 text-base">{st?.name ?? "Student"}</p>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${s.sessionType === "in-person" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"}`}>
                                  {s.sessionType === "in-person" ? "In Person" : "Online"}
                                </span>
                                <button onClick={(e) => { e.stopPropagation(); handleCancelSession(s); }} disabled={cancellingId === s.id}
                                  className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40">
                                  {cancellingId === s.id ? "…" : "Cancel"}
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 mb-3">{s.subject} · {s.time} · {s.durationHours} hr</p>
                            <div className="flex flex-wrap gap-2">
                              {s.zoomLink ? (
                                <a href={resolveZoomUrl(s.zoomLink!)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors">
                                  <Video className="w-3 h-3" />Join Zoom
                                </a>
                              ) : (
                                <button onClick={(e) => { e.stopPropagation(); setZoomEditId(s.id); setZoomEditVal(""); }}
                                  className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-red-100">
                                  ⚠ Add Zoom
                                </button>
                              )}
                              {studentHw.length > 0 ? (
                                <button onClick={(e) => { e.stopPropagation(); setTab("homework"); }}
                                  className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-amber-100">
                                  ⚠ {studentHw.length} to grade
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-xl text-xs font-medium">
                                  ✓ Hw up to date
                                </span>
                              )}
                              {lastNote ? (
                                <span className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-600 border border-gray-100 px-3 py-1.5 rounded-xl text-xs">
                                  ✓ Last note: {formatDate(lastNote.createdAt.slice(0, 10))}
                                </span>
                              ) : (
                                <button onClick={(e) => { e.stopPropagation(); setTab("notes"); }}
                                  className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-amber-100">
                                  ⚠ No notes yet
                                </button>
                              )}
                              {updateOverdue ? (
                                <button onClick={(e) => { e.stopPropagation(); setSelectedStudentId(s.studentId); setStudentPanelTab("update"); setTab("students"); }}
                                  className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-orange-100">
                                  ⚠ Parent update needed
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-xl text-xs font-medium">
                                  ✓ Parent updated
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {zoomEditId === s.id && (
                          <div className="mt-4 flex items-center gap-2 pt-4 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                            <input value={zoomEditVal} onChange={(e) => setZoomEditVal(e.target.value)} placeholder="https://zoom.us/j/…"
                              className="rounded-xl border border-gray-300 px-3 py-1.5 text-xs flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <button onClick={() => saveZoomLink(s.id)} disabled={zoomSaving} className="text-xs text-blue-600 font-semibold px-3 py-1.5 bg-blue-50 rounded-xl">Save</button>
                            <button onClick={() => setZoomEditId(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Items */}
            {(hwNeedsGrading.length > 0 || studentsNeedingUpdate.length > 0) && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Action Items</p>
                <div className="space-y-2">
                  {hwNeedsGrading.length > 0 && (
                    <button onClick={() => setTab("homework")}
                      className="w-full flex items-center gap-4 bg-white border border-amber-200 rounded-2xl px-5 py-4 text-left hover:border-amber-300 hover:shadow-sm transition-all shadow-sm">
                      <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                        <CheckCircle className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{hwNeedsGrading.length} submission{hwNeedsGrading.length > 1 ? "s" : ""} waiting to be graded</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {hwNeedsGrading.map((h) => getStudent(h.studentId)?.name ?? "?").filter((v, i, a) => a.indexOf(v) === i).join(", ")}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>
                  )}
                  {studentsNeedingUpdate.length > 0 && (
                    <button onClick={() => { setTab("students"); setStudentPanelTab("update"); }}
                      className="w-full flex items-center gap-4 bg-white border border-orange-200 rounded-2xl px-5 py-4 text-left hover:border-orange-300 hover:shadow-sm transition-all shadow-sm">
                      <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{studentsNeedingUpdate.length} student{studentsNeedingUpdate.length > 1 ? "s" : ""} need a parent update</p>
                        <p className="text-xs text-gray-500 mt-0.5">{studentsNeedingUpdate.map((s) => s.name).join(", ")}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Coming Up */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Coming Up</p>
              {futureSessions.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl px-5 py-8 text-center shadow-sm">
                  <p className="text-sm text-gray-400">No upcoming sessions scheduled.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {futureSessions.map((s) => {
                    const st = getStudent(s.studentId);
                    return (
                      <div key={s.id}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3.5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest("button,a,input")) return;
                          setSdNoteTopic(""); setSdNoteText(""); setSdNoteKamiLink(""); setSdNoteError(""); setSdNoteSuccess(false);
                          setSessionDetail(s);
                        }}>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarColor(s.studentId)}`}>
                          {st?.name[0] ?? "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{st?.name ?? "Student"}</p>
                          <p className="text-xs text-gray-500">{s.subject} · {formatDate(s.date)} at {s.time}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${s.sessionType === "in-person" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"}`}>
                            {s.sessionType === "in-person" ? "In Person" : "Online"}
                          </span>
                          {s.zoomLink
                            ? <a href={resolveZoomUrl(s.zoomLink!)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs text-blue-600 font-medium hover:underline">Zoom →</a>
                            : <button onClick={(e) => { e.stopPropagation(); setZoomEditId(s.id); setZoomEditVal(""); }} className="text-xs text-gray-400 hover:text-blue-600 font-medium">+ Zoom</button>}
                          <button onClick={(e) => { e.stopPropagation(); handleCancelSession(s); }} disabled={cancellingId === s.id} className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40">
                            {cancellingId === s.id ? "…" : "Cancel"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── MY STUDENTS ── */}
      {tab === "students" && (() => {
        const AVATAR_COLORS_ST = ["bg-blue-500","bg-violet-500","bg-emerald-500","bg-amber-500","bg-rose-500","bg-cyan-500","bg-indigo-500","bg-orange-500"];
        const totalPendingHw  = homework.filter((h) => h.status === "submitted").length;
        const totalUpcoming   = localSessions.filter((s) => s.status === "upcoming" && s.date >= todayIso).length;
        const totalHrsRemain  = balances.reduce((sum, b) => sum + (myStudents.some(ms => ms.id === b.studentId) ? b.remaining : 0), 0);
        return (
        <div className="space-y-5">
          {/* Top stats */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">My Students</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{myStudents.length} Student{myStudents.length !== 1 ? "s" : ""}</h1>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([
                { label: "Total Students",   value: myStudents.length,  Icon: Users,        iconBg: "bg-blue-50",    iconColor: "text-blue-500"   },
                { label: "Upcoming Sessions", value: totalUpcoming,      Icon: CalendarDays, iconBg: "bg-violet-50",  iconColor: "text-violet-500" },
                { label: "To Grade",         value: totalPendingHw,     Icon: CheckCircle,  iconBg: totalPendingHw > 0 ? "bg-amber-50" : "bg-gray-50", iconColor: totalPendingHw > 0 ? "text-amber-500" : "text-gray-400" },
                { label: "Hours Remaining",  value: `${totalHrsRemain}h`, Icon: Clock,       iconBg: totalHrsRemain <= 4 ? "bg-red-50" : "bg-emerald-50", iconColor: totalHrsRemain <= 4 ? "text-red-500" : "text-emerald-500" },
              ] as const).map(card => (
                <div key={card.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                    <card.Icon className={`w-4 h-4 ${card.iconColor}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student list */}
          <div className="space-y-3">
            {myStudents.map((s, sIdx) => {
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
              const submittedHwCount = sHw.filter(h => h.status === "submitted").length;
              const avatarBg = AVATAR_COLORS_ST[sIdx % AVATAR_COLORS_ST.length] ?? "bg-gray-400";

              return (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Card header */}
                  <div
                    className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
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
                        setSelectedStudyLog([]); setStudyLogLoading(true);
                        fetchStudyLog(s.id, 30).then(setSelectedStudyLog).catch(() => {}).finally(() => setStudyLogLoading(false));
                      }
                    }}
                  >
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarBg}`}>
                      {s.name[0]}
                    </div>
                    {/* Name + meta */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.grade} Grade · {s.subjects.join(", ")}</p>
                    </div>
                    {/* Chips + actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${(bal?.remaining ?? 0) <= 2 ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                        {bal?.remaining ?? 0} hrs
                      </span>
                      {submittedHwCount > 0 && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                          {submittedHwCount} to grade
                        </span>
                      )}
                      {sSess.length > 0 && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                          {sSess.length} upcoming
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setProfileStudent(s); setPlanUploadErr(""); setPlanUploaded(false); }}
                        className="text-xs text-gray-500 hover:text-blue-600 border border-gray-200 rounded-xl px-2.5 py-1.5 font-medium"
                      >
                        Profile
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); void startStudentPreview(s.id); }}
                        disabled={previewLoadingId === s.id}
                        className="text-xs text-violet-600 hover:text-violet-700 border border-violet-200 hover:border-violet-300 bg-violet-50 hover:bg-violet-100 rounded-xl px-2.5 py-1.5 font-medium disabled:opacity-50 transition-colors"
                      >
                        {previewLoadingId === s.id ? "Loading…" : "View as Student"}
                      </button>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {isOpen && (
                    <div className="border-t border-gray-100">
                      {/* Sub-tabs */}
                      <div className="flex border-b border-gray-100">
                        {(["homework", "sessions", "update", "accountability", "plan", "skills"] as const).map((t2) => (
                          <button
                            key={t2}
                            onClick={() => setStudentPanelTab(t2)}
                            className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                              studentPanelTab === t2
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            {t2 === "homework" ? `Homework (${sHw.length})` : t2 === "sessions" ? `Sessions (${sSess.length})` : t2 === "update" ? "Parent Update" : t2 === "accountability" ? "Accountability" : t2 === "plan" ? "Learning Plan" : "Skills"}
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
                                      setSdNoteTopic(""); setSdNoteText(""); setSdNoteKamiLink("");
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
                        const coveredSessionIds = new Set(sUpdates.flatMap((u) => u.sessionIds));
                        const recentPastSessions = localSessions
                          .filter((sess) =>
                            sess.studentId === s.id &&
                            (sess.status === "completed" || sess.date < todayIso) &&
                            sess.date >= weekAgoIso3 &&
                            !coveredSessionIds.has(sess.id)
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

                      {/* ── Learning Plan sub-tab ── */}
                      {studentPanelTab === "plan" && (() => {
                        async function refreshPlan() {
                          if (!panelPlanFull) return;
                          const full = await fetchStudentPlanFull(panelPlanFull.studentId, panelPlanFull.courseId);
                          setPanelPlanFull(full);
                        }

                        if (panelPlanLoading) return (
                          <div className="flex items-center justify-center py-10">
                            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          </div>
                        );

                        return (
                          <div>
                            {panelPlanSuccess && (
                              <div className="px-4 pt-3">
                                <p className="text-xs text-emerald-600 font-medium">{panelPlanSuccess}</p>
                              </div>
                            )}

                            {/* ── No plan: 4-step wizard ── */}
                            {!panelPlanFull && tutor && selectedStudentId && (
                              <PlanWizard
                                courses={panelCourses}
                                defaultCourseId={panelNewCourseId}
                                tutorId={tutor.id}
                                studentId={selectedStudentId}
                                onComplete={(full, catalog) => {
                                  setPanelPlanFull(full);
                                  setPanelCatalog(catalog);
                                  setPanelPlanSuccess("Plan created!");
                                  setTimeout(() => setPanelPlanSuccess(""), 3000);
                                }}
                                onCancel={() => setStudentPanelTab("homework")}
                              />
                            )}

                            {/* ── Plan exists ── */}
                            {panelPlanFull && (() => {
                              const totalL = panelPlanFull.lessons.length;
                              const doneL  = panelPlanFull.lessons.filter(l => l.status === "completed").length;
                              const pctL   = totalL > 0 ? Math.round((doneL / totalL) * 100) : 0;

                              return (
                                <>
                                  {/* Plan header */}
                                  <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-sm font-semibold text-gray-900">{panelPlanFull.title}</p>
                                      <button
                                        onClick={async () => {
                                          if (!confirm("Delete this learning plan and all its lessons? This cannot be undone.")) return;
                                          setPanelDeletingPlan(true);
                                          try {
                                            await deleteStudentPlan(panelPlanFull.id);
                                            setPanelPlanFull(null);
                                            setPanelCatalog(null);
                                            setPanelShowBarsEditor(false);
                                            setPanelPlanSuccess("Plan deleted.");
                                            setTimeout(() => setPanelPlanSuccess(""), 3000);
                                          } catch (err) {
                                            setPanelPlanError(err instanceof Error ? err.message : "Delete failed");
                                          } finally {
                                            setPanelDeletingPlan(false);
                                          }
                                        }}
                                        disabled={panelDeletingPlan}
                                        className="text-xs text-red-400 hover:text-red-600 shrink-0 font-medium disabled:opacity-50"
                                      >
                                        {panelDeletingPlan ? "Deleting…" : "Delete plan"}
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                                      {panelPlanFull.startingScore && <span>Start: <strong>{panelPlanFull.startingScore}</strong></span>}
                                      {panelPlanFull.targetScore   && <span>Goal: <strong className="text-blue-600">{panelPlanFull.targetScore}</strong></span>}
                                      {panelPlanFull.targetDate    && <span>Target: {formatDate(panelPlanFull.targetDate)}</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                        <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${pctL}%` }} />
                                      </div>
                                      <span className="text-xs text-gray-500 shrink-0">{doneL}/{totalL}</span>
                                    </div>
                                  </div>

                                  {/* ── Practice Test Results ── */}
                                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
                                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Practice Tests</span>
                                      <button
                                        onClick={() => { setPanelShowLogTest(v => !v); setPanelTestDate(""); setPanelTestOverall(""); setPanelTestRW(""); setPanelTestMath(""); setPanelTestNotes(""); }}
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                                      >
                                        {panelShowLogTest ? "Cancel" : "+ Log Test"}
                                      </button>
                                    </div>

                                    {panelShowLogTest && (
                                      <div className="p-3 border-t border-gray-100 space-y-2.5 bg-white">
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Test Date <span className="text-red-400">*</span></label>
                                            <input type="date" value={panelTestDate} onChange={(e) => setPanelTestDate(e.target.value)}
                                              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                          </div>
                                          <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Overall Score <span className="font-normal normal-case">(optional)</span></label>
                                            <input type="number" min="400" max="1600" step="10" placeholder="1200"
                                              value={panelTestOverall} onChange={(e) => setPanelTestOverall(e.target.value)}
                                              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                          </div>
                                          <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">R&amp;W Score</label>
                                            <input type="number" min="200" max="800" step="10" placeholder="600"
                                              value={panelTestRW} onChange={(e) => setPanelTestRW(e.target.value)}
                                              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                          </div>
                                          <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Math Score</label>
                                            <input type="number" min="200" max="800" step="10" placeholder="600"
                                              value={panelTestMath} onChange={(e) => setPanelTestMath(e.target.value)}
                                              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                          </div>
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Notes</label>
                                          <input type="text" placeholder="e.g. Khan Academy Practice Test 2"
                                            value={panelTestNotes} onChange={(e) => setPanelTestNotes(e.target.value)}
                                            className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <button
                                          disabled={panelTestSaving || !panelTestDate || (!panelTestOverall && !panelTestRW && !panelTestMath)}
                                          onClick={async () => {
                                            if (!panelTestDate) return;
                                            const overall  = panelTestOverall ? parseInt(panelTestOverall)  : undefined;
                                            const rwScore  = panelTestRW      ? parseInt(panelTestRW)       : undefined;
                                            const mathScore= panelTestMath    ? parseInt(panelTestMath)     : undefined;
                                            setPanelTestSaving(true);
                                            try {
                                              const result = await insertPracticeTestResult({
                                                studentId:    panelPlanFull.studentId,
                                                planId:       panelPlanFull.id,
                                                testDate:     panelTestDate,
                                                overallScore: overall,
                                                rwScore,
                                                mathScore,
                                                tutorNotes:   panelTestNotes || undefined,
                                              });
                                              setPanelTestResults(prev => [...prev, result].sort((a, b) => a.testDate.localeCompare(b.testDate)));
                                              // Only update plan currentScore when we have a real composite score
                                              if (overall) {
                                                await updateStudentPlan(panelPlanFull.id, { currentScore: overall });
                                                const updated = await fetchStudentPlanFull(panelPlanFull.studentId, panelPlanFull.courseId);
                                                setPanelPlanFull(updated);
                                              }
                                              setPanelShowLogTest(false);
                                              setPanelTestDate(""); setPanelTestOverall(""); setPanelTestRW(""); setPanelTestMath(""); setPanelTestNotes("");
                                            } catch (err) {
                                              setPanelPlanError(err instanceof Error ? err.message : "Failed to save test");
                                            } finally {
                                              setPanelTestSaving(false);
                                            }
                                          }}
                                          className="w-full py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
                                        >
                                          {panelTestSaving ? "Saving…" : "Save Test Result"}
                                        </button>
                                      </div>
                                    )}

                                    {panelTestResults.length === 0 && !panelShowLogTest && (
                                      <p className="px-4 py-3 text-xs text-gray-400 border-t border-gray-100">No practice tests logged yet.</p>
                                    )}

                                    {panelTestResults.length > 0 && (
                                      <div className="divide-y divide-gray-100 border-t border-gray-100">
                                        {panelTestResults.map((tr) => (
                                          <div key={tr.id} className="flex items-center gap-3 px-4 py-2.5">
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                {tr.overallScore != null
                                                  ? <span className="text-xs font-bold text-gray-900">{tr.overallScore}</span>
                                                  : <span className="text-[10px] text-gray-400 italic">section only</span>
                                                }
                                                {tr.rwScore   && <span className="text-[10px] text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded font-semibold">R&amp;W {tr.rwScore}</span>}
                                                {tr.mathScore && <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-semibold">Math {tr.mathScore}</span>}
                                                {(() => {
                                                  if (tr.overallScore == null) return null;
                                                  const start = panelPlanFull.startingScore ?? panelPlanFull.currentScore;
                                                  if (!start) return null;
                                                  const diff = tr.overallScore - start;
                                                  if (diff === 0) return null;
                                                  return <span className={`text-[10px] font-bold ${diff > 0 ? "text-emerald-600" : "text-red-500"}`}>{diff > 0 ? "+" : ""}{diff}</span>;
                                                })()}
                                              </div>
                                              <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(tr.testDate)}{tr.tutorNotes ? ` · ${tr.tutorNotes}` : ""}</p>
                                            </div>
                                            <button
                                              onClick={async () => {
                                                if (!confirm("Delete this practice test result?")) return;
                                                setPanelTestDeletingId(tr.id);
                                                try {
                                                  await deletePracticeTestResult(tr.id);
                                                  const remaining = panelTestResults.filter(r => r.id !== tr.id);
                                                  setPanelTestResults(remaining);
                                                  // Keep plan currentScore in sync: use latest remaining composite, or null
                                                  const latestComposite = [...remaining].reverse().find(r => r.overallScore != null)?.overallScore ?? null;
                                                  await updateStudentPlan(panelPlanFull.id, { currentScore: latestComposite ?? 0 });
                                                  const updated = await fetchStudentPlanFull(panelPlanFull.studentId, panelPlanFull.courseId);
                                                  setPanelPlanFull(updated);
                                                } catch (err) {
                                                  setPanelPlanError(err instanceof Error ? err.message : "Delete failed");
                                                } finally {
                                                  setPanelTestDeletingId(null);
                                                }
                                              }}
                                              disabled={panelTestDeletingId === tr.id}
                                              className="p-1 text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40 shrink-0"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Skill Proficiency Editor (0–6) */}
                                  {panelCatalog && (() => {
                                    const scoreBtnClass = (s: number, current: number | undefined) => {
                                      if (current !== s) return "bg-white border-gray-200 text-gray-400 hover:border-gray-400";
                                      if (s <= 1) return "bg-red-500 border-red-500 text-white";
                                      if (s <= 3) return "bg-amber-400 border-amber-400 text-white";
                                      if (s <= 5) return "bg-blue-500 border-blue-500 text-white";
                                      return "bg-emerald-500 border-emerald-500 text-white";
                                    };
                                    return (
                                      <div className="border border-gray-100 rounded-xl overflow-hidden">
                                        <button
                                          onClick={() => {
                                            if (!panelShowBaselineEditor) {
                                              setPanelBaselineDraft(
                                                panelPlanFull.skillBaseline
                                                  ? JSON.parse(JSON.stringify(panelPlanFull.skillBaseline))
                                                  : {}
                                              );
                                              setPanelBaselineExpCats(new Set());
                                            }
                                            setPanelShowBaselineEditor(v => !v);
                                          }}
                                          className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 text-left"
                                        >
                                          <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Edit Skill Proficiency (0–6)</span>
                                          <span className="text-gray-400 text-sm">{panelShowBaselineEditor ? "▲" : "▼"}</span>
                                        </button>
                                        {panelShowBaselineEditor && (
                                          <div className="p-3 space-y-4">
                                            <p className="text-[10px] text-gray-400 leading-relaxed">
                                              Rate each category 0–6. Click the arrow to expand and rate individual subskills.
                                            </p>
                                            {panelCatalog.sections.map(section => (
                                              <div key={section.id}>
                                                <p className="text-xs font-semibold text-gray-700 mb-2">{section.title}</p>
                                                <div className="space-y-1.5">
                                                  {section.categories.map(cat => {
                                                    const catId = String(cat.id);
                                                    const catEntry = panelBaselineDraft[catId] ?? { subskills: {} };
                                                    const catScore = catEntry.score;
                                                    const isExp = panelBaselineExpCats.has(cat.id);
                                                    const subskills = getSubskills(cat.title);
                                                    return (
                                                      <div key={cat.id} className="rounded-lg border border-gray-100 overflow-hidden">
                                                        <div className="flex items-center gap-1.5 px-2 py-1.5">
                                                          {subskills.length > 0 && (
                                                            <button
                                                              onClick={() => setPanelBaselineExpCats(prev => {
                                                                const next = new Set(prev);
                                                                if (next.has(cat.id)) next.delete(cat.id); else next.add(cat.id);
                                                                return next;
                                                              })}
                                                              className="shrink-0"
                                                            >
                                                              <ChevronRight className={`w-3 h-3 text-gray-300 transition-transform ${isExp ? "rotate-90" : ""}`} />
                                                            </button>
                                                          )}
                                                          <span className="text-xs text-gray-700 flex-1 truncate">{cat.title}</span>
                                                          <div className="flex gap-0.5 shrink-0">
                                                            {[0,1,2,3,4,5,6].map(s => (
                                                              <button
                                                                key={s}
                                                                onClick={() => setPanelBaselineDraft(d => ({
                                                                  ...d,
                                                                  [catId]: { ...catEntry, score: catScore === s ? undefined : s },
                                                                }))}
                                                                className={`w-5 h-5 rounded-full border-2 text-[9px] font-bold transition-colors ${scoreBtnClass(s, catScore)}`}
                                                              >
                                                                {s}
                                                              </button>
                                                            ))}
                                                          </div>
                                                        </div>
                                                        {isExp && subskills.length > 0 && (
                                                          <div className="border-t border-gray-100 bg-gray-50 px-2 py-1.5 space-y-1.5">
                                                            {subskills.map(skill => {
                                                              const skillScore = catEntry.subskills?.[skill]?.score;
                                                              return (
                                                                <div key={skill} className="flex items-center gap-1.5">
                                                                  <span className="text-[11px] text-gray-500 flex-1 truncate pl-4">{skill}</span>
                                                                  <div className="flex gap-0.5 shrink-0">
                                                                    {[0,1,2,3,4,5,6].map(s => (
                                                                      <button
                                                                        key={s}
                                                                        onClick={() => setPanelBaselineDraft(d => ({
                                                                          ...d,
                                                                          [catId]: {
                                                                            ...catEntry,
                                                                            subskills: {
                                                                              ...(catEntry.subskills ?? {}),
                                                                              [skill]: { score: skillScore === s ? undefined : s },
                                                                            },
                                                                          },
                                                                        }))}
                                                                        className={`w-5 h-5 rounded-full border-2 text-[9px] font-bold transition-colors ${scoreBtnClass(s, skillScore)}`}
                                                                      >
                                                                        {s}
                                                                      </button>
                                                                    ))}
                                                                  </div>
                                                                </div>
                                                              );
                                                            })}
                                                          </div>
                                                        )}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            ))}
                                            <button
                                              onClick={async () => {
                                                setPanelSavingBaseline(true);
                                                try {
                                                  await updatePlanSkillBaseline(panelPlanFull.id, panelBaselineDraft);
                                                  const full = await fetchStudentPlanFull(panelPlanFull.studentId, panelPlanFull.courseId);
                                                  setPanelPlanFull(full);
                                                  setPanelShowBaselineEditor(false);
                                                  setPanelBaselineExpCats(new Set());
                                                  setPanelPlanSuccess("Proficiency saved!");
                                                  setTimeout(() => setPanelPlanSuccess(""), 3000);
                                                } catch (err) {
                                                  setPanelPlanError(err instanceof Error ? err.message : "Save failed");
                                                } finally {
                                                  setPanelSavingBaseline(false);
                                                }
                                              }}
                                              disabled={panelSavingBaseline}
                                              className="w-full bg-blue-600 text-white text-xs font-semibold rounded-lg py-2 disabled:opacity-50 hover:bg-blue-700"
                                            >
                                              {panelSavingBaseline ? "Saving…" : "Save Proficiency"}
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  {/* Lessons / Roadmap tabs */}
                                  <div className="flex border-b border-gray-100 -mx-1">
                                    {(["lessons", "roadmap"] as const).map(v => (
                                      <button
                                        key={v}
                                        onClick={() => setPanelPlanView(v)}
                                        className={`px-3 py-1.5 text-xs font-semibold capitalize border-b-2 transition-colors -mb-px ${
                                          panelPlanView === v
                                            ? "border-blue-500 text-blue-600"
                                            : "border-transparent text-gray-400 hover:text-gray-600"
                                        }`}
                                      >
                                        {v}
                                      </button>
                                    ))}
                                  </div>

                                  {/* Roadmap view */}
                                  {panelPlanView === "roadmap" && panelCatalog && (() => {
                                    const plMap: Record<number, typeof panelPlanFull.lessons[0]> =
                                      Object.fromEntries(panelPlanFull.lessons.map(l => [l.lessonId, l]));
                                    return (
                                      <div className="space-y-3">
                                        {panelCatalog.sections.map((section, si) => (
                                          <div key={section.id}>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{section.title}</p>
                                            <div className="overflow-x-auto">
                                              <SATRoadmapGraph
                                                section={section}
                                                skillBaseline={panelPlanFull.skillBaseline}
                                                planLessonMap={plMap}
                                                skillNodes={allSkillNodes}
                                                studentSkills={panelStudentSkills}
                                                onSkillClick={(id) => setTutorSkillId(id)}
                                              />
                                            </div>
                                            {si < panelCatalog.sections.length - 1 && <div className="border-t border-gray-100 mt-3" />}
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })()}

                                  {/* Lesson list */}
                                  {panelPlanView === "lessons" && (totalL === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-3">No lessons added yet.</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {panelPlanFull.lessons.map((pl, idx) => {
                                        const statusColor = pl.status === "completed"
                                          ? "text-emerald-600 bg-emerald-50"
                                          : pl.status === "in_progress"
                                            ? "text-blue-600 bg-blue-50"
                                            : "text-gray-500 bg-gray-100";
                                        return (
                                          <div key={pl.id} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3">
                                            <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                                              {pl.status === "completed" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : idx + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                              <p className={`text-sm font-medium truncate ${pl.status === "completed" ? "line-through text-gray-400" : "text-gray-900"}`}>
                                                {pl.lesson?.title ?? "Lesson"}
                                              </p>
                                              {pl.scheduledDate && (
                                                <p className="text-xs text-gray-400">{formatDate(pl.scheduledDate)}</p>
                                              )}
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}>
                                              {pl.status === "completed" ? "Done" : pl.status === "in_progress" ? "Active" : "Pending"}
                                            </span>
                                            <div className="flex gap-2 shrink-0">
                                              {pl.status !== "completed" && (
                                                <button
                                                  onClick={async () => {
                                                    try {
                                                      await updatePlanLessonStatus(pl.id, "completed");
                                                      await refreshPlan();
                                                      setPanelPlanSuccess("Marked complete!");
                                                      setTimeout(() => setPanelPlanSuccess(""), 3000);
                                                    } catch (err) {
                                                      setPanelPlanError(err instanceof Error ? err.message : "Error");
                                                    }
                                                  }}
                                                  className="text-xs text-emerald-600 hover:underline font-medium"
                                                >
                                                  ✓
                                                </button>
                                              )}
                                              {pl.status === "completed" && (
                                                <button
                                                  onClick={async () => {
                                                    try {
                                                      await updatePlanLessonStatus(pl.id, "pending");
                                                      await refreshPlan();
                                                    } catch (err) {
                                                      setPanelPlanError(err instanceof Error ? err.message : "Error");
                                                    }
                                                  }}
                                                  className="text-xs text-gray-400 hover:text-gray-600 font-medium"
                                                  title="Undo complete"
                                                >
                                                  ↩
                                                </button>
                                              )}
                                              <button
                                                onClick={async () => {
                                                  if (!confirm("Remove this lesson from the plan?")) return;
                                                  try {
                                                    await removeLessonFromPlan(pl.id);
                                                    await refreshPlan();
                                                  } catch (err) {
                                                    setPanelPlanError(err instanceof Error ? err.message : "Error");
                                                  }
                                                }}
                                                className="text-xs text-red-400 hover:text-red-600 font-medium"
                                              >
                                                ✕
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ))}

                                  {/* Add Lesson toggle */}
                                  {!panelShowPicker ? (
                                    <button
                                      onClick={() => setPanelShowPicker(true)}
                                      className="w-full text-sm text-blue-600 hover:underline font-medium py-1 text-center"
                                    >
                                      + Add Lesson
                                    </button>
                                  ) : (
                                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                                      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Add Lesson</p>
                                        <button onClick={() => { setPanelShowPicker(false); setPanelPickerExpSec(null); }} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
                                      </div>
                                      <div className="max-h-72 overflow-y-auto">
                                        {!panelCatalog ? (
                                          <p className="text-sm text-gray-400 text-center py-4">Loading catalog…</p>
                                        ) : panelCatalog.sections.length === 0 ? (
                                          <p className="text-sm text-gray-400 text-center py-4">No lessons in catalog yet.</p>
                                        ) : (
                                          panelCatalog.sections.map((sec) => (
                                            <div key={sec.id}>
                                              <button
                                                onClick={() => setPanelPickerExpSec(panelPickerExpSec === sec.id ? null : sec.id)}
                                                className="w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-50"
                                              >
                                                <span className="text-sm font-semibold text-gray-700">{sec.title}</span>
                                                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${panelPickerExpSec === sec.id ? "rotate-90" : ""}`} />
                                              </button>
                                              {panelPickerExpSec === sec.id && sec.categories.map((cat) => (
                                                <div key={cat.id} className="border-b border-gray-50 last:border-0">
                                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide px-6 py-2 bg-gray-50/50">{cat.title}</p>
                                                  {cat.lessons.length === 0 && (
                                                    <p className="text-xs text-gray-400 px-6 py-2 italic">No lessons yet</p>
                                                  )}
                                                  {cat.lessons.map((lesson) => {
                                                    const alreadyAdded = panelPlanFull.lessons.some(pl => pl.lessonId === lesson.id);
                                                    return (
                                                      <button
                                                        key={lesson.id}
                                                        disabled={alreadyAdded}
                                                        onClick={async () => {
                                                          try {
                                                            await assignLessonToStudent({ planId: panelPlanFull.id, lessonId: lesson.id });
                                                            await refreshPlan();
                                                            setPanelPlanSuccess(`"${lesson.title}" added!`);
                                                            setTimeout(() => setPanelPlanSuccess(""), 3000);
                                                          } catch (err) {
                                                            setPanelPlanError(err instanceof Error ? err.message : "Error");
                                                          }
                                                        }}
                                                        className={`w-full text-left px-8 py-2 text-sm flex items-center justify-between hover:bg-blue-50 transition-colors ${alreadyAdded ? "opacity-40 cursor-not-allowed" : ""}`}
                                                      >
                                                        <span className="text-gray-800">{lesson.title}</span>
                                                        {alreadyAdded
                                                          ? <span className="text-[10px] text-gray-400 shrink-0">Added</span>
                                                          : <span className="text-xs text-blue-600 font-medium shrink-0">+ Add</span>
                                                        }
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              ))}
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        );
                      })()}

                      {/* ── Accountability sub-tab ── */}
                      {studentPanelTab === "accountability" && (() => {
                        const weeklyGoal = s.weeklyStudyGoalMinutes ?? 180;
                        const todayIso2  = new Date().toISOString().slice(0, 10);
                        const weekStart  = new Date(todayIso2);
                        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                        const weekStartIso = weekStart.toISOString().slice(0, 10);
                        const thisWeekMins = selectedStudyLog
                          .filter((e) => e.logDate >= weekStartIso)
                          .reduce((acc, e) => acc + e.minutes, 0);
                        const goalPct = Math.min(100, Math.round((thisWeekMins / weeklyGoal) * 100));

                        const submittedHw = sHw.filter((h) => h.status !== "pending");
                        const completionRate = sHw.length > 0
                          ? Math.round((submittedHw.length / sHw.length) * 100)
                          : null;

                        const hwWithTimes = sHw.filter((h) => h.estimatedMinutes != null && h.studentTimeMinutes != null);
                        const avgEst = hwWithTimes.length > 0
                          ? Math.round(hwWithTimes.reduce((a, h) => a + (h.estimatedMinutes ?? 0), 0) / hwWithTimes.length)
                          : null;
                        const avgActual = hwWithTimes.length > 0
                          ? Math.round(hwWithTimes.reduce((a, h) => a + (h.studentTimeMinutes ?? 0), 0) / hwWithTimes.length)
                          : null;

                        return (
                          <div className="p-4 space-y-4">
                            {studyLogLoading ? (
                              <p className="text-sm text-gray-400 py-4 text-center">Loading…</p>
                            ) : (
                              <>
                                {/* Weekly goal */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Study This Week</p>
                                    <span className={`text-xs font-semibold ${goalPct >= 100 ? "text-emerald-600" : "text-gray-500"}`}>
                                      {thisWeekMins} / {weeklyGoal} min
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${goalPct >= 100 ? "bg-emerald-500" : goalPct >= 60 ? "bg-blue-500" : "bg-amber-400"}`}
                                      style={{ width: `${goalPct}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Stats row */}
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                                    <p className="text-2xl font-bold text-gray-900">{selectedStudyLog.reduce((a, e) => a + e.minutes, 0)}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-semibold">min (30d)</p>
                                  </div>
                                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                                    <p className="text-2xl font-bold text-gray-900">{completionRate != null ? `${completionRate}%` : "—"}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-semibold">completion</p>
                                  </div>
                                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                                    <p className="text-2xl font-bold text-gray-900">{avgEst != null ? `${avgEst}→${avgActual}` : "—"}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-semibold">est→actual</p>
                                  </div>
                                </div>

                                {/* Recent time logs */}
                                {selectedStudyLog.length > 0 ? (
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Study Sessions</p>
                                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                      {selectedStudyLog.slice(0, 10).map((e) => (
                                        <div key={e.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                                          <span className="text-gray-600">{formatDate(e.logDate)}</span>
                                          <span className="font-semibold text-gray-900">{e.minutes} min</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-400 text-center py-4">No study time logged in the last 30 days.</p>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })()}

                      {/* ── Skills sub-tab ── */}
                      {studentPanelTab === "skills" && (
                        <StudentSkillPanel studentId={s.id} allSkillNodes={allSkillNodes} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {myStudents.length === 0 && <p className="text-sm text-gray-500">No students assigned yet.</p>}
          </div>
        </div>
        );
      })()}

      {/* ── SCHEDULE ── */}
      {tab === "schedule" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Schedule</p>
              <h1 className="text-2xl font-bold text-gray-900">Weekly Calendar</h1>
            </div>
            {/* Mode toggle */}
            <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm shadow-sm bg-white">
              <button
                onClick={() => { setCalendarMode("schedule"); setSelectedSlot(null); }}
                className={`px-4 py-2 font-medium transition-colors ${calendarMode === "schedule" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                Schedule
              </button>
              <button
                onClick={() => { setCalendarMode("block"); setSelectedSlot(null); }}
                className={`px-4 py-2 font-medium transition-colors border-l border-gray-200 ${calendarMode === "block" ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                Block Time
              </button>
            </div>
          </div>

          {schedSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-4 py-3 text-sm">Session scheduled!</div>
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
              setSdNoteTopic(""); setSdNoteText(""); setSdNoteKamiLink(""); setSdNoteError(""); setSdNoteSuccess(false);
              setResentSessionId(null);
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

          {/* Availability editor */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Availability</p>
                <h3 className="font-semibold text-gray-900">My Weekly Hours</h3>
                <p className="text-xs text-gray-400 mt-0.5">Toggle days on, set your hours, then Save.</p>
              </div>
              {availSaved && <span className="text-xs text-emerald-600 font-semibold">Saved!</span>}
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
              className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {availSaving ? "Saving…" : "Save Availability"}
            </button>
          </div>

          {/* Blocked dates */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="mb-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Blocked Dates</p>
              <h3 className="font-semibold text-gray-900">Days Off</h3>
              <p className="text-xs text-gray-400 mt-0.5">Specific dates when you&apos;re unavailable — students cannot book on these days</p>
            </div>

            {blockedDates.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {blockedDates.map((b) => (
                  <span key={b.id} className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-xl px-3 py-1.5 text-sm text-orange-700">
                    <span>{b.blockedDate}</span>
                    {b.reason && <span className="text-orange-400 text-xs">· {b.reason}</span>}
                    <button onClick={() => deleteBlockDate(b.id)} className="text-orange-400 hover:text-orange-700 ml-1 font-bold leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
            {blockedDates.length === 0 && <p className="text-xs text-gray-400 mb-4">No dates blocked.</p>}

            <div className="flex flex-wrap gap-2 items-end">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date</label>
                <input type="date" value={blockDateInput} onChange={(e) => setBlockDateInput(e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex-1 min-w-40">
                <label className="block text-xs text-gray-500 mb-1">Reason (optional)</label>
                <input value={blockReason} onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g. Holiday, sick day…"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button onClick={addBlockDate} disabled={!blockDateInput || blockSaving}
                className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-40">
                {blockSaving ? "…" : "Block Date"}
              </button>
            </div>
            {blockError && <p className="text-xs text-red-500 mt-2">{blockError}</p>}
          </div>
        </div>
      )}

      {/* ── SETTINGS ── */}
      {tab === "settings" && (
        <div className="max-w-lg space-y-5">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Settings</p>
            <h1 className="text-2xl font-bold text-gray-900">My Preferences</h1>
          </div>

          {/* Zoom */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Meeting</p>
                <h3 className="font-semibold text-gray-900">Zoom Settings</h3>
              </div>
              {zoomLinkSaved && <span className="text-xs text-emerald-600 font-semibold">Saved!</span>}
            </div>
            <p className="text-xs text-gray-400 mb-4 mt-1">
              Set your personal meeting link and ID once — students can click to join or type the ID directly into Zoom.
            </p>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Join Link</label>
            <input
              value={zoomLinkVal}
              onChange={(e) => setZoomLinkVal(e.target.value)}
              placeholder="https://zoom.us/j/123456789"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Meeting ID</label>
            <input
              value={meetingIdVal}
              onChange={(e) => setMeetingIdVal(e.target.value)}
              placeholder="123 456 7890"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={savePersonalZoomLink} disabled={zoomLinkSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {zoomLinkSaving ? "Saving…" : "Save"}
            </button>
          </div>

          {/* Booking lead time */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Booking</p>
                <h3 className="font-semibold text-gray-900">Student Booking Window</h3>
              </div>
              {leadSaved && <span className="text-xs text-emerald-600 font-semibold">Saved!</span>}
            </div>
            <p className="text-xs text-gray-400 mb-4 mt-1">
              Students cannot book within this many hours of the start time.
              Currently: <span className="font-semibold text-gray-700">{tutor.bookingLeadHours} hours</span>.
            </p>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm w-fit mb-4 bg-white">
              {([24, 48] as const).map((h, i) => (
                <button key={h} type="button" onClick={() => setLeadHours(h)}
                  className={`px-5 py-2 font-medium transition-colors ${i > 0 ? "border-l border-gray-200" : ""} ${leadHours === h ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                  {h} hours
                </button>
              ))}
            </div>
            {leadError && <p className="text-xs text-red-500 mb-2">{leadError}</p>}
            <button onClick={saveLeadTime} disabled={leadSaving} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {leadSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* ── SESSION NOTES ── */}
      {tab === "notes" && (() => {
        const AVATAR_COLORS = ["bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-orange-500"];
        const avatarColor = (studentId: number) => {
          const idx = myStudents.findIndex((s) => s.id === studentId);
          return AVATAR_COLORS[idx % AVATAR_COLORS.length] ?? "bg-gray-400";
        };

        const allNotes = sessionNotes.filter((n) => n.topic !== "_resource_");
        const filtered = allNotes
          .filter((n) => !noteFilterStudentId || n.studentId === Number(noteFilterStudentId))
          .filter((n) => {
            if (!noteSearchQuery.trim()) return true;
            const q = noteSearchQuery.toLowerCase();
            const st = getStudent(n.studentId);
            return n.topic.toLowerCase().includes(q) || n.notes.toLowerCase().includes(q) || (st?.name.toLowerCase().includes(q) ?? false);
          })
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

        const selectedNote = selectedNoteId
          ? (allNotes.find((n) => n.id === selectedNoteId) ?? null)
          : null;
        const selectedNoteStudent = selectedNote ? getStudent(selectedNote.studentId) : null;

        return (
          <div className="flex flex-col h-full min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-gray-100 shrink-0">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Session Notes</p>
                <p className="text-sm font-bold text-gray-900">{allNotes.length} note{allNotes.length !== 1 ? "s" : ""}</p>
              </div>
              <button
                onClick={() => { setShowNoteForm(true); setSelectedNoteId(null); setNoteEditId(null); setNoteTopic(""); setNoteText(""); setNoteError(""); }}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
              >
                + New Note
              </button>
            </div>

            <div className="flex flex-1 min-h-0">
              {/* Left: note list */}
              <div className="w-72 shrink-0 border-r border-gray-200 bg-white flex flex-col min-h-0">
                <div className="p-3 border-b border-gray-100 space-y-2 shrink-0">
                  <input
                    value={noteSearchQuery}
                    onChange={(e) => setNoteSearchQuery(e.target.value)}
                    placeholder="Search notes…"
                    className="w-full rounded-xl border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={noteFilterStudentId}
                    onChange={(e) => setNoteFilterStudentId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All students</option>
                    {myStudents.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {filtered.length === 0 && (
                    <div className="py-12 text-center px-4">
                      <p className="text-xs text-gray-400">
                        {allNotes.length === 0 ? "No notes yet. Write your first one!" : "No notes match your filters."}
                      </p>
                    </div>
                  )}
                  {filtered.map((n) => {
                    const st = getStudent(n.studentId);
                    const isSelected = selectedNoteId === n.id;
                    return (
                      <button
                        key={n.id}
                        onClick={() => { setSelectedNoteId(n.id); setShowNoteForm(false); setNoteEditId(null); }}
                        className={`w-full flex items-start gap-3 px-4 py-3.5 text-left border-b border-gray-50 transition-colors relative ${
                          isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                        }`}
                      >
                        {isSelected && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-600 rounded-r" />}
                        <div className={`w-8 h-8 rounded-full ${avatarColor(n.studentId)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {st?.name[0] ?? "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <p className={`text-xs font-semibold truncate ${isSelected ? "text-blue-700" : "text-gray-900"}`}>{st?.name ?? "Student"}</p>
                            <span className="text-[10px] text-gray-400 shrink-0">{formatDate(n.createdAt.slice(0, 10))}</span>
                          </div>
                          <p className={`text-xs font-medium truncate ${isSelected ? "text-blue-600" : "text-blue-500"}`}>{n.topic}</p>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5 leading-normal">
                            {n.notes.slice(0, 70)}{n.notes.length > 70 ? "…" : ""}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: detail or form */}
              <div className="flex-1 overflow-y-auto bg-gray-50">
                {/* Empty state */}
                {!showNoteForm && !selectedNote && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <span className="text-5xl mb-4">📝</span>
                    <p className="text-sm font-semibold text-gray-700 mb-1">No note selected</p>
                    <p className="text-xs text-gray-400 mb-4">Select a note from the list or write a new one</p>
                    <button
                      onClick={() => { setShowNoteForm(true); setNoteTopic(""); setNoteText(""); setNoteError(""); }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
                    >
                      + Write First Note
                    </button>
                  </div>
                )}

                {/* Write form */}
                {showNoteForm && (
                  <div className="p-6 max-w-2xl">
                    <div className="flex items-center gap-3 mb-5">
                      {filtered.length > 0 && (
                        <button onClick={() => setShowNoteForm(false)} className="text-xs text-gray-400 hover:text-gray-600">← Back</button>
                      )}
                      <h2 className="text-base font-bold text-gray-900">New Session Note</h2>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Student</label>
                        <select
                          value={noteStudentId}
                          onChange={(e) => { setNoteStudentId(e.target.value); setNoteSessionId(""); setNoteDate(""); }}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select student…</option>
                          {myStudents.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      {noteStudentId && (() => {
                        const studentSessions = localSessions
                          .filter((s) => s.studentId === Number(noteStudentId) && s.status !== "cancelled" && s.date <= todayIso)
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .slice(0, 12);
                        if (studentSessions.length === 0) return null;
                        return (
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Session</label>
                            <select
                              value={noteSessionId}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNoteSessionId(val);
                                if (val) {
                                  const sess = localSessions.find((s) => s.id === Number(val));
                                  if (sess) setNoteDate(sess.date);
                                }
                              }}
                              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">No specific session…</option>
                              {studentSessions.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {formatDate(s.date)} · {s.subject} · {s.time}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })()}
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Topic</label>
                        <input
                          value={noteTopic}
                          onChange={(e) => setNoteTopic(e.target.value)}
                          placeholder="e.g. Linear equations, SAT Reading strategies…"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Notes</label>
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="What was covered, student progress, areas to revisit, what to assign next…"
                          rows={8}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Session Date (optional)</label>
                          <input
                            type="date"
                            value={noteDate}
                            onChange={(e) => setNoteDate(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Kami Link (optional)</label>
                          <input
                            value={noteKamiLink}
                            onChange={(e) => setNoteKamiLink(e.target.value)}
                            placeholder="https://app.kami.com/…"
                            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Attach PDF (optional)</label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                          onChange={(e) => setNoteFile(e.target.files?.[0] ?? null)}
                          className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {noteFile && <p className="text-[11px] text-gray-400 mt-1">{noteFile.name}</p>}
                      </div>
                      {allSkillNodes.length > 0 && (
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Skills Covered</label>
                          <SkillPicker nodes={allSkillNodes} value={noteSkillIds} onChange={setNoteSkillIds} />
                        </div>
                      )}
                      {noteError && <p className="text-xs text-red-500">{noteError}</p>}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={async () => {
                            const newId = await submitNote();
                            if (newId) { setShowNoteForm(false); setSelectedNoteId(newId); }
                          }}
                          disabled={noteSaving || !noteTopic || !noteText || !noteStudentId}
                          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40"
                        >
                          {noteSaving ? "Saving…" : "Save Note"}
                        </button>
                        {filtered.length > 0 && (
                          <button onClick={() => setShowNoteForm(false)} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Note detail */}
                {selectedNote && !showNoteForm && (() => {
                  const isEditing = noteEditId === selectedNote.id;
                  return (
                    <div className="p-6 max-w-2xl">
                      {/* Student header */}
                      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 mb-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${avatarColor(selectedNote.studentId)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                          {selectedNoteStudent?.name[0] ?? "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">{selectedNoteStudent?.name ?? "Student"}</p>
                          <p className="text-xs text-gray-400">{selectedNoteStudent?.grade} Grade · {selectedNoteStudent?.subjects.join(", ")}</p>
                        </div>
                        <button
                          onClick={() => { setNoteStudentId(String(selectedNote.studentId)); setNoteTopic(""); setNoteText(""); setNoteError(""); setShowNoteForm(true); setSelectedNoteId(null); }}
                          className="text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 font-medium whitespace-nowrap shrink-0"
                        >
                          + New Note
                        </button>
                      </div>

                      {/* Note content */}
                      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                        <div className="flex items-start justify-between mb-4">
                          <p className="text-xs text-gray-400">{formatDate(selectedNote.createdAt.slice(0, 10))}</p>
                          {!isEditing && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={async () => {
                                  setNoteEditId(selectedNote.id);
                                  setNoteEditTopic(selectedNote.topic);
                                  setNoteEditText(selectedNote.notes);
                                  setNoteEditKamiLink(selectedNote.kamiLink ?? "");
                                  setNoteEditDate(selectedNote.noteDate ?? "");
                                  const skills = await fetchNoteSkills(selectedNote.id);
                                  setNoteEditSkillIds(skills.map((s) => s.id));
                                }}
                                className="text-xs text-blue-600 border border-blue-200 rounded-lg px-2.5 py-1 hover:bg-blue-50 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => { removeSessionNote(selectedNote.id); setSelectedNoteId(null); }}
                                className="text-xs text-red-400 border border-red-100 rounded-lg px-2.5 py-1 hover:bg-red-50 font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-3">
                            <input
                              value={noteEditTopic}
                              onChange={(e) => setNoteEditTopic(e.target.value)}
                              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <textarea
                              value={noteEditText}
                              onChange={(e) => setNoteEditText(e.target.value)}
                              rows={10}
                              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 leading-relaxed"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Session Date</label>
                                <input
                                  type="date"
                                  value={noteEditDate}
                                  onChange={(e) => setNoteEditDate(e.target.value)}
                                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Kami Link</label>
                                <input
                                  value={noteEditKamiLink}
                                  onChange={(e) => setNoteEditKamiLink(e.target.value)}
                                  placeholder="https://app.kami.com/…"
                                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              {allSkillNodes.length > 0 && (
                                <div>
                                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Skills Covered</label>
                                  <SkillPicker nodes={allSkillNodes} value={noteEditSkillIds} onChange={setNoteEditSkillIds} />
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => saveNoteEdit(selectedNote.id)}
                                disabled={noteEditSaving || !noteEditTopic.trim() || !noteEditText.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40"
                              >
                                {noteEditSaving ? "Saving…" : "Save Changes"}
                              </button>
                              <button onClick={() => setNoteEditId(null)} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedNote.topic}</h2>
                            {selectedNote.noteDate && (
                              <p className="text-xs text-gray-400 mb-3">Session date: {formatDate(selectedNote.noteDate)}</p>
                            )}
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedNote.notes}</p>
                            {selectedNote.kamiLink && (
                              <a
                                href={selectedNote.kamiLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 mt-4 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-3 py-2 rounded-xl hover:bg-violet-100 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Open Kami Lesson
                              </a>
                            )}
                            {selectedNote.attachmentFilename && (
                              <p className="text-xs text-gray-400 mt-3">
                                Attachment: {selectedNote.attachmentFilename}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── HOMEWORK ── */}
      {tab === "homework" && (() => {
        const today       = new Date().toISOString().slice(0, 10);
        const weekAgo     = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const hwSubmitted = homework.filter((h) => h.status === "submitted");
        const hwPending   = homework.filter((h) => h.status === "pending");
        const hwCompleted = homework.filter((h) => h.status === "completed");
        const hwOverdue   = hwPending.filter((h) => !!h.dueDate && h.dueDate < today);
        const hwGradedThisWeek = hwCompleted.filter((h) => !!h.feedbackAt && h.feedbackAt.slice(0, 10) >= weekAgo);

        // ── filter + search ──────────────────────────────────────────
        const activeList =
          hwTabFilter === "review"  ? hwSubmitted :
          hwTabFilter === "pending" ? hwPending   :
          hwTabFilter === "graded"  ? hwCompleted :
          homework;

        const visibleItems = activeList
          .filter((h) => !hwFilterStudent || h.studentId === Number(hwFilterStudent))
          .filter((h) => {
            if (!hwSearchQuery.trim()) return true;
            const q = hwSearchQuery.toLowerCase();
            const st = getStudent(h.studentId);
            return h.task.toLowerCase().includes(q) || (st?.name.toLowerCase().includes(q) ?? false);
          })
          .sort((a, b) => {
            if (a.status === "submitted" && b.status !== "submitted") return -1;
            if (b.status === "submitted" && a.status !== "submitted") return 1;
            return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
          });

        const AVATAR_COLORS = ["bg-blue-500","bg-violet-500","bg-emerald-500","bg-amber-500","bg-rose-500","bg-cyan-500","bg-indigo-500","bg-orange-500"];
        const avatarColor = (studentId: number) => {
          const idx = myStudents.findIndex((s) => s.id === studentId);
          return AVATAR_COLORS[idx % AVATAR_COLORS.length] ?? "bg-gray-400";
        };

        const reviewItem    = hwReviewId !== null ? (homework.find((h) => h.id === hwReviewId) ?? null) : null;
        const reviewStudent = reviewItem ? getStudent(reviewItem.studentId) : null;

        const mkStatusBadge = (h: Homework) => {
          const isOv = h.status === "pending" && !!h.dueDate && h.dueDate < today;
          const isReturned = h.status === "pending" && !!h.returnedNote;
          if (h.status === "submitted") return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />Needs Review</span>;
          if (h.status === "completed") return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />Graded</span>;
          if (isOv) return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />Overdue</span>;
          if (isReturned) return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />Returned</span>;
          return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />Pending</span>;
        };


        return (
          <>
            {/* ── Page header ── */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Homework</h1>
                <p className="text-sm text-gray-400 mt-1">Assign, review, and track student work.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => { setHwPastShowForm(true); setHwPastError(""); if (myStudents.length > 0 && !hwPastStudentId) setHwPastStudentId(String(myStudents[0].id)); }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  Log Past Work
                </button>
                <button
                  onClick={() => { setHwShowForm(true); }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> New Assignment
                </button>
              </div>
            </div>

            {/* ── Summary stat cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {([
                { key: "review",  value: hwSubmitted.length,     label: "Needs Review",     valCls: "text-blue-600",    borderCls: hwTabFilter === "review"  ? "border-blue-400 ring-2 ring-blue-100"    : "border-gray-100 hover:border-gray-300" },
                { key: "pending", value: hwPending.length,       label: "Pending",           valCls: "text-amber-600",   borderCls: hwTabFilter === "pending" ? "border-amber-400 ring-2 ring-amber-50"   : "border-gray-100 hover:border-gray-300" },
                { key: "graded",  value: hwGradedThisWeek.length, label: "Graded This Week", valCls: "text-emerald-600", borderCls: hwTabFilter === "graded"  ? "border-emerald-500 ring-2 ring-emerald-50" : "border-gray-100 hover:border-gray-300" },
                { key: "pending", value: hwOverdue.length,       label: "Overdue",           valCls: hwOverdue.length > 0 ? "text-red-600" : "text-gray-300", borderCls: hwOverdue.length > 0 ? "border-red-200 hover:border-red-300" : "border-gray-100 hover:border-gray-300" },
              ] as const).map(({ key, value, label, valCls, borderCls }) => (
                <button key={label} onClick={() => setHwTabFilter(key)}
                  className={`text-left bg-white border rounded-xl p-4 transition-all ${borderCls}`}>
                  <p className={`text-2xl font-bold ${valCls}`}>{value}</p>
                  <p className="text-xs font-semibold text-gray-500 mt-1">{label}</p>
                </button>
              ))}
            </div>

            {/* ── Filter tabs + search ── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
              <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 shrink-0">
                {([
                  { key: "review",  label: hwSubmitted.length > 0 ? `Review (${hwSubmitted.length})` : "Review" },
                  { key: "pending", label: "Pending" },
                  { key: "graded",  label: "Graded" },
                  { key: "all",     label: "All" },
                ] as const).map(({ key, label }) => (
                  <button key={key} onClick={() => setHwTabFilter(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      hwTabFilter === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    value={hwSearchQuery}
                    onChange={(e) => setHwSearchQuery(e.target.value)}
                    placeholder="Search assignments…"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {myStudents.length > 1 && (
                  <select value={hwFilterStudent} onChange={(e) => setHwFilterStudent(e.target.value)}
                    className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600">
                    <option value="">All students</option>
                    {myStudents.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
              </div>
            </div>

            {/* ── Assignment list ── */}
            {visibleItems.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-500">
                  {hwTabFilter === "review"  ? "Nothing waiting for review — all caught up!"
                  : hwTabFilter === "pending" ? "No pending assignments."
                  : hwTabFilter === "graded"  ? "No graded assignments yet."
                  : "No assignments yet."}
                </p>
                {(hwTabFilter === "all" || homework.length === 0) && (
                  <p className="text-xs text-gray-400 mt-1">Click &quot;+ New Assignment&quot; to get started.</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {visibleItems.map((h) => {
                  const st = getStudent(h.studentId);
                  const isOverdue = h.status === "pending" && !!h.dueDate && h.dueDate < today;
                  return (
                    <div
                      key={h.id}
                      onClick={() => { setHwReviewId(h.id); setHwFeedbackId(null); setHwFeedbackText(""); setHwGradeText(""); setHwUnsubmitId(null); setHwUnsubmitNote(""); setHwUnsubmitDue(""); setHwUnsubmitError(""); }}
                      className={`bg-white border rounded-xl px-4 py-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                        h.status === "submitted" ? "border-blue-200 hover:border-blue-300"
                        : isOverdue              ? "border-red-200 hover:border-red-300"
                        : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      {/* Student avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarColor(h.studentId)}`}>
                        {st?.name[0] ?? "?"}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{h.task}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-gray-400">{st?.name}</span>
                          {h.dueDate && (
                            <span className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
                              · Due {formatDate(h.dueDate)}
                            </span>
                          )}
                          {h.submittedAt && (
                            <span className="text-xs text-gray-400">· Submitted {formatDate(h.submittedAt.slice(0, 10))}</span>
                          )}
                          {h.assignmentType && (
                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              {h.assignmentType === "sat_vocabulary" ? "Vocabulary"
                                : h.assignmentType === "sat_practice_test" ? "SAT Practice Test"
                                : h.assignmentType.replace(/_/g, " ")}
                            </span>
                          )}
                          {h.estimatedMinutes != null && h.studentTimeMinutes != null && (
                            <span className="text-[10px] text-blue-500 font-medium">
                              {h.studentTimeMinutes}m&thinsp;/&thinsp;{h.estimatedMinutes}m est.
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status + delete */}
                      <div className="flex items-center gap-2 shrink-0">
                        {mkStatusBadge(h)}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteHomework(h.id); }}
                          disabled={hwDeletingId === h.id}
                          title="Delete assignment"
                          className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                        >
                          {hwDeletingId === h.id ? <span className="text-xs text-gray-400">…</span> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Log Past Work Modal ── */}
            {hwPastShowForm && (
              <Modal title="Log Past Assignment" subtitle="Record work the student already completed" onClose={() => { setHwPastShowForm(false); setHwPastError(""); }} size="xl">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Student</label>
                    <select value={hwPastStudentId} onChange={(e) => setHwPastStudentId(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select student…</option>
                      {myStudents.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Assignment Description</label>
                    <textarea value={hwPastTask} onChange={(e) => setHwPastTask(e.target.value)}
                      placeholder="e.g. Khan Academy — Linear Equations Practice (30 problems)"
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Type <span className="font-normal text-gray-400 normal-case tracking-normal">(optional)</span></label>
                    <select value={hwPastType} onChange={(e) => setHwPastType(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select type…</option>
                      <option value="problems">Problems</option>
                      <option value="reading">Reading</option>
                      <option value="practice_test">Practice Test</option>
                      <option value="review">Review</option>
                      <option value="essay">Essay</option>
                      <option value="sat_vocabulary">SAT Vocabulary</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Date Assigned <span className="text-red-400">*</span></label>
                      <input type="date" value={hwPastAssignedDate} onChange={(e) => setHwPastAssignedDate(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Date Completed <span className="text-red-400">*</span></label>
                      <input type="date" value={hwPastCompletedDate} onChange={(e) => setHwPastCompletedDate(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Time Spent <span className="font-normal text-gray-400 normal-case tracking-normal">(optional)</span></label>
                      <div className="flex items-center gap-2">
                        <input type="number" min="1" max="600" placeholder="30"
                          value={hwPastTimeMins} onChange={(e) => setHwPastTimeMins(e.target.value)}
                          className="w-24 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <span className="text-sm text-gray-400">min</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Grade <span className="font-normal text-gray-400 normal-case tracking-normal">(optional)</span></label>
                      <input type="text" value={hwPastGrade} onChange={(e) => setHwPastGrade(e.target.value)}
                        placeholder="A+, 95%, 9/10, ✓…"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Feedback <span className="font-normal text-gray-400 normal-case tracking-normal">(optional)</span></label>
                    <textarea value={hwPastFeedback} onChange={(e) => setHwPastFeedback(e.target.value)}
                      placeholder="Notes or feedback on the work…"
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  {hwPastError && <p className="text-sm text-red-500">{hwPastError}</p>}
                  <div className="flex justify-end pt-2 border-t border-gray-100">
                    <button onClick={submitPastHomework} disabled={hwPastSaving || !hwPastStudentId || !hwPastTask.trim() || !hwPastAssignedDate || !hwPastCompletedDate}
                      className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                      {hwPastSaving ? "Saving…" : "Log Completed Work"}
                    </button>
                  </div>
                </div>
              </Modal>
            )}

            {/* ── New Assignment Modal ── */}
            {hwShowForm && (
              <Modal title="New Assignment" onClose={() => { setHwShowForm(false); setHwSuccess(false); setHwError(""); }} size="xl">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Student</label>
                    <select value={hwStudentId} onChange={(e) => setHwStudentId(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select student…</option>
                      {myStudents.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Assignment</label>
                    <textarea value={hwTask} onChange={(e) => setHwTask(e.target.value)}
                      placeholder="e.g. Complete problems 1–20 from Chapter 4"
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Type <span className="font-normal text-gray-400 normal-case tracking-normal">(optional)</span></label>
                      <select value={hwType} onChange={(e) => {
                          const t = e.target.value;
                          setHwType(t);
                          if (t !== "sat_vocabulary") setHwVocabWords([{ word: "", hint: "" }]);
                          if (t === "sat_practice_test") {
                            setHwPtProvider("bluebook");
                            setHwPtExternalLink("https://bluebook.collegeboard.org/students");
                            setHwPtRwCount("54");
                            setHwPtMathCount("44");
                          }
                        }}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select type…</option>
                        <option value="problems">Problems</option>
                        <option value="reading">Reading</option>
                        <option value="practice_test">Practice Test</option>
                        <option value="sat_practice_test">SAT Practice Test</option>
                        <option value="review">Review</option>
                        <option value="essay">Essay</option>
                        <option value="sat_vocabulary">SAT Vocabulary</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Est. Time <span className="font-normal text-gray-400 normal-case tracking-normal">(optional)</span></label>
                      <div className="flex items-center gap-2">
                        <input type="number" min="1" max="600" placeholder="30"
                          value={hwEstMins} onChange={(e) => setHwEstMins(e.target.value)}
                          className="w-20 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <span className="text-sm text-gray-400">min</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Instructions <span className="font-normal text-gray-400 normal-case tracking-normal">(optional)</span></label>
                    <textarea value={hwInstructions} onChange={(e) => setHwInstructions(e.target.value)}
                      placeholder="Specific steps or guidance for the student…"
                      rows={2}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  {/* SAT Practice Test config */}
                  {hwType === "sat_practice_test" && (
                    <div className="space-y-3 border border-blue-100 bg-blue-50 rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Practice Test Config</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Provider</label>
                          <select value={hwPtProvider} onChange={(e) => setHwPtProvider(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="bluebook">College Board Bluebook</option>
                            <option value="college_board_pdf">College Board PDF</option>
                            <option value="metaminds">MetaMinds</option>
                            <option value="act">ACT</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Test Name</label>
                          <input type="text" value={hwPtTestName} onChange={(e) => setHwPtTestName(e.target.value)}
                            placeholder="SAT Practice Test 3"
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">R&amp;W Questions</label>
                          <input type="number" value={hwPtRwCount} onChange={(e) => setHwPtRwCount(e.target.value)}
                            min="1" max="100"
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Math Questions</label>
                          <input type="number" value={hwPtMathCount} onChange={(e) => setHwPtMathCount(e.target.value)}
                            min="1" max="100"
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Bluebook / External Link <span className="font-normal text-gray-400 normal-case tracking-normal">(optional)</span></label>
                        <input type="url" value={hwPtExternalLink} onChange={(e) => setHwPtExternalLink(e.target.value)}
                          placeholder="https://bluebook.collegeboard.org/..."
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  )}
                  {/* Vocabulary word list */}
                  {hwType === "sat_vocabulary" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Vocabulary Words <span className="text-red-400">*</span></label>
                      <div className="space-y-2">
                        {hwVocabWords.map((w, i) => (
                          <div key={i} className="flex gap-2 items-start">
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <input value={w.word}
                                onChange={(e) => setHwVocabWords((prev) => prev.map((x, j) => j === i ? { ...x, word: e.target.value } : x))}
                                placeholder={`Word ${i + 1}`}
                                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                              <input value={w.hint}
                                onChange={(e) => setHwVocabWords((prev) => prev.map((x, j) => j === i ? { ...x, hint: e.target.value } : x))}
                                placeholder="Hint (optional)"
                                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            {hwVocabWords.length > 1 && (
                              <button onClick={() => setHwVocabWords((prev) => prev.filter((_, j) => j !== i))}
                                className="p-2.5 text-gray-400 hover:text-red-500 transition-colors shrink-0">
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setHwVocabWords((prev) => [...prev, { word: "", hint: "" }])}
                        className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Add Word
                      </button>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Due Date <span className="font-normal text-gray-400 normal-case tracking-normal">(optional)</span></label>
                    <input type="date" value={hwDue} onChange={(e) => setHwDue(e.target.value)}
                      className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  {hwType !== "sat_vocabulary" && hwType !== "sat_practice_test" && (<>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">PDF Attachment <span className="font-normal text-gray-400 normal-case tracking-normal">(optional)</span></label>
                      <input type="file" accept=".pdf,application/pdf"
                        onChange={(e) => setHwFile(e.target.files?.[0] ?? null)}
                        className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                      {hwFile && <p className="text-xs text-gray-400 mt-1">{hwFile.name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Kami Link <span className="font-normal text-gray-400 normal-case tracking-normal">(optional)</span></label>
                      <input value={hwKamiLink} onChange={(e) => setHwKamiLink(e.target.value)}
                        placeholder="https://app.kami.com/..."
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </>)}
                  {allSkillNodes.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Skills Practiced <span className="font-normal text-gray-400 normal-case tracking-normal">(optional)</span></label>
                      <SkillPicker nodes={allSkillNodes} value={hwSkillIds} onChange={setHwSkillIds} />
                    </div>
                  )}
                  {hwSuccess && <p className="text-sm text-emerald-600 font-medium">✓ Assignment assigned!</p>}
                  {hwError && <p className="text-sm text-red-500">{hwError}</p>}
                  <div className="flex justify-end pt-2 border-t border-gray-100">
                    <button onClick={submitHomework} disabled={hwSaving || hwUploading}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                      {hwUploading ? "Uploading PDF…" : hwSaving ? "Saving…" : "Assign"}
                    </button>
                  </div>
                </div>
              </Modal>
            )}

            {/* ── Review / Detail Modal ── */}
            {hwReviewId !== null && reviewItem !== null && (() => {
              const h  = reviewItem;
              const st = reviewStudent;
              const isFeedbackOpen   = hwFeedbackId === h.id;
              const isUnsubmitOpen   = hwUnsubmitId === h.id;
              const vocabReview      = h.assignmentType === "sat_vocabulary" ? vocabReviewData[h.id]    : undefined;
              const vocabLoadingFlag = h.assignmentType === "sat_vocabulary" ? !!vocabReviewLoading[h.id] : false;
              return (
                <Modal
                  title={h.task}
                  subtitle={st?.name}
                  onClose={() => { setHwReviewId(null); setHwFeedbackId(null); setHwFeedbackText(""); setHwGradeText(""); setHwUnsubmitId(null); setHwUnsubmitNote(""); setHwUnsubmitDue(""); setHwUnsubmitError(""); }}
                  size="xl"
                >
                  <div className="space-y-5">
                    {/* Meta chips */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg">Assigned {formatDate(h.assignedDate)}</span>
                      {h.dueDate && (
                        <span className={`px-2.5 py-1 rounded-lg ${h.dueDate < today && h.status === "pending" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                          Due {formatDate(h.dueDate)}
                        </span>
                      )}
                      {h.submittedAt && <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">Submitted {formatDate(h.submittedAt.slice(0, 10))}</span>}
                      {h.assignmentType && (
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg capitalize">
                          {h.assignmentType === "sat_vocabulary" ? "Vocabulary"
                            : h.assignmentType === "sat_practice_test" ? "SAT Practice Test"
                            : h.assignmentType.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>

                    {/* Instructions */}
                    {h.instructions && (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Instructions</p>
                        <p className="text-sm text-amber-900 whitespace-pre-wrap">{h.instructions}</p>
                      </div>
                    )}

                    {/* Sent back to student */}
                    {h.returnedNote && h.status !== "completed" && (
                      <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                        <p className="text-[10px] font-bold text-orange-700 uppercase tracking-widest mb-1">
                          Sent Back to Student{h.returnedAt ? ` · ${formatDate(h.returnedAt.slice(0, 10))}` : ""}
                        </p>
                        <p className="text-sm text-orange-900 whitespace-pre-wrap">{h.returnedNote}</p>
                      </div>
                    )}

                    {/* Tutor-attached resources */}
                    {(h.attachmentUrl || h.kamiLink) && (
                      <div className="flex flex-wrap gap-2">
                        {h.attachmentUrl && (
                          <button onClick={() => openSubmission(h)} disabled={hwOpeningId === h.id}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 disabled:opacity-50">
                            <FileText className="w-3.5 h-3.5" />{h.attachmentFilename ?? "PDF Attachment"}
                          </button>
                        )}
                        {h.kamiLink && (
                          <a href={h.kamiLink} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-lg hover:bg-violet-100">
                            ✏️ Open in Kami
                          </a>
                        )}
                      </div>
                    )}

                    {/* Student submission file */}
                    {h.submissionUrl && h.submissionFilename && (
                      <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
                        <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-sm font-medium text-gray-700 flex-1 truncate">{h.submissionFilename}</span>
                        <button onClick={() => openSubmission(h)} disabled={hwOpeningId === h.id}
                          className="text-sm text-blue-600 font-semibold hover:text-blue-700 shrink-0 disabled:opacity-50">
                          {hwOpeningId === h.id ? "Opening…" : "Open →"}
                        </button>
                      </div>
                    )}

                    {/* Student-reported time + difficulty + note */}
                    {(h.studentTimeMinutes != null || h.difficultyRating || h.studentNote) && (
                      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Student Report</p>
                        <div className="flex flex-wrap items-center gap-3">
                          {h.studentTimeMinutes != null && (
                            <span className="text-sm text-gray-700">
                              ⏱ <strong>{h.studentTimeMinutes} min</strong> reported
                              {h.estimatedMinutes != null && <span className="text-gray-400 text-xs"> (est. {h.estimatedMinutes} min)</span>}
                            </span>
                          )}
                          {h.difficultyRating && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              h.difficultyRating === "easy" ? "bg-emerald-100 text-emerald-700"
                              : h.difficultyRating === "difficult" ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                            }`}>{h.difficultyRating.charAt(0).toUpperCase() + h.difficultyRating.slice(1)}</span>
                          )}
                        </div>
                        {h.studentNote && <p className="text-sm text-gray-600 italic">&ldquo;{h.studentNote}&rdquo;</p>}
                      </div>
                    )}

                    {/* Vocabulary review */}
                    {h.assignmentType === "sat_vocabulary" && (() => {
                      if (!vocabReview && !vocabLoadingFlag) return (
                        <button onClick={() => void loadVocabReview(h.id)}
                          className="text-sm font-semibold text-violet-600 hover:text-violet-700 border border-violet-200 bg-violet-50 px-4 py-2.5 rounded-xl transition-colors">
                          Load Vocabulary Submission
                        </button>
                      );
                      if (vocabLoadingFlag) return <p className="text-sm text-gray-400">Loading vocabulary…</p>;
                      if (!vocabReview) return null;
                      return (
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vocabulary Submission</p>
                          {vocabReview.config.words.map((word, i) => {
                            const entry   = vocabReview.entries.find((e) => e.wordIndex === i);
                            const fbInput = vocabFeedbackInputs[h.id]?.[entry?.id ?? -1] ?? "";
                            const saving  = entry ? !!vocabReviewSaving[entry.id] : false;
                            return (
                              <div key={i} className={`bg-gray-50 border rounded-xl p-3 space-y-2 ${
                                entry?.tutorStatus === "correct"        ? "border-emerald-300"
                                : entry?.tutorStatus === "needs_revision" ? "border-amber-300"
                                : "border-gray-200"
                              }`}>
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <p className="font-semibold text-sm text-gray-900">{word.word}</p>
                                  {entry && (
                                    <div className="flex items-center gap-1.5">
                                      <button onClick={() => void saveVocabEntryReview(h.id, entry.id, "correct")} disabled={saving}
                                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 ${entry.tutorStatus === "correct" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"}`}>
                                        ✓ Correct
                                      </button>
                                      <button onClick={() => void saveVocabEntryReview(h.id, entry.id, "needs_revision")} disabled={saving}
                                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 ${entry.tutorStatus === "needs_revision" ? "bg-amber-500 text-white border-amber-500" : "bg-white text-amber-700 border-amber-200 hover:bg-amber-50"}`}>
                                        Revise
                                      </button>
                                    </div>
                                  )}
                                </div>
                                {entry ? (
                                  <>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>
                                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-0.5">Definition</p>
                                        <p className="text-gray-700">{entry.definition}</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-0.5">Sentence</p>
                                        <p className="text-gray-700">{entry.sentence}</p>
                                      </div>
                                    </div>
                                    {entry.confidence && <p className="text-xs text-gray-400">Confidence: <span className="font-semibold">{entry.confidence}</span></p>}
                                    <input
                                      value={fbInput}
                                      onChange={(e) => setVocabFeedbackInputs((prev) => ({ ...prev, [h.id]: { ...(prev[h.id] ?? {}), [entry.id]: e.target.value } }))}
                                      placeholder="Optional feedback for this word…"
                                      className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </>
                                ) : (
                                  <p className="text-xs text-gray-400 italic">Not yet submitted</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* SAT Practice Test review */}
                    {h.assignmentType === "sat_practice_test" && (() => {
                      const ptData    = satPtReview[h.id];
                      const ptLoading = !!satPtReviewLoading[h.id];

                      if (ptData === undefined && !ptLoading) return (
                        <button
                          onClick={() => st && void loadSatPtReview(h.id, st.id)}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 bg-blue-50 px-4 py-2.5 rounded-xl transition-colors">
                          Load Practice Test Submission
                        </button>
                      );
                      if (ptLoading) return <p className="text-sm text-gray-400">Loading submission…</p>;
                      if (!ptData) return <p className="text-sm text-gray-400 italic">No submission found.</p>;

                      const { config, sub, answers } = ptData;
                      const getModAnswers = (sec: "rw"|"math", mod: 1|2) =>
                        answers.filter((a) => a.section === sec && a.module === mod)
                          .sort((a, b) => a.questionNumber - b.questionNumber);
                      const getModCount = (sec: "rw"|"math", mod: 1|2) => {
                        const total = sec === "rw" ? config.rwQuestionCount : config.mathQuestionCount;
                        return mod === 1 ? Math.ceil(total / 2) : Math.floor(total / 2);
                      };

                      const CHOICE_COLORS: Record<string, string> = {
                        A: "bg-blue-100 text-blue-700", B: "bg-violet-100 text-violet-700",
                        C: "bg-emerald-100 text-emerald-700", D: "bg-amber-100 text-amber-700",
                      };

                      return (
                        <div className="space-y-5 pt-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Practice Test Submission</p>

                          {/* Header: assigned vs submitted */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-xl p-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Assigned</p>
                              <p className="text-sm font-semibold text-gray-800">{config.assignedTestName ?? "—"}</p>
                              <p className="text-xs text-gray-500">{config.provider}</p>
                            </div>
                            <div className={`rounded-xl p-3 ${sub.submittedTestName !== config.assignedTestName ? "bg-amber-50 border border-amber-200" : "bg-emerald-50"}`}>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Submitted</p>
                              <p className="text-sm font-semibold text-gray-800">{sub.submittedTestName ?? "—"}</p>
                              <p className="text-xs text-gray-500">{sub.submittedProvider ?? config.provider}</p>
                              {sub.submittedTestName !== config.assignedTestName && (
                                <p className="text-[10px] text-amber-600 font-semibold mt-1">⚠ Differs from assigned</p>
                              )}
                            </div>
                          </div>

                          {/* Scores */}
                          <div className="grid grid-cols-3 gap-3">
                            {([
                              { label: "Total Score", value: sub.scorePending ? "Pending" : (sub.totalScore?.toString() ?? "—") },
                              { label: "R&W Score",   value: sub.rwScore?.toString()   ?? "—" },
                              { label: "Math Score",  value: sub.mathScore?.toString() ?? "—" },
                            ] as const).map(({ label, value }) => (
                              <div key={label} className="bg-blue-50 rounded-xl p-3 text-center">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                                <p className="text-xl font-bold text-blue-700">{value}</p>
                              </div>
                            ))}
                          </div>

                          {/* Date + Time */}
                          <div className="flex gap-4 text-sm text-gray-600">
                            {sub.completedDate && <span>Completed: <strong>{formatDate(sub.completedDate)}</strong></span>}
                            {sub.activeMinutes && <span>Time: <strong>{sub.activeMinutes} min</strong></span>}
                            {sub.completionScope === "partial" && <span className="text-amber-600 font-semibold">Partial test</span>}
                          </div>

                          {/* Answer grid — 4 sub-grids (R&W M1/M2, Math M1/M2) */}
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Answers ({answers.length} / {config.rwQuestionCount + config.mathQuestionCount})</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {([
                                { sec: "rw"   as const, mod: 1 as const, label: "Reading & Writing — Module 1" },
                                { sec: "rw"   as const, mod: 2 as const, label: "Reading & Writing — Module 2" },
                                { sec: "math" as const, mod: 1 as const, label: "Math — Module 1" },
                                { sec: "math" as const, mod: 2 as const, label: "Math — Module 2" },
                              ]).map(({ sec, mod, label }) => {
                                const modAnswers = getModAnswers(sec, mod);
                                const modCount   = getModCount(sec, mod);
                                return (
                                  <div key={`${sec}-m${mod}`}>
                                    <p className="text-xs font-semibold text-gray-600 mb-2">{label} ({modAnswers.length}/{modCount})</p>
                                    <div className="space-y-0.5 max-h-64 overflow-y-auto pr-1">
                                      {Array.from({ length: modCount }, (_, i) => i + 1).map((num) => {
                                        const ans = modAnswers.find((a) => a.questionNumber === num);
                                        return (
                                          <div key={num} className="flex items-center gap-2 py-0.5 border-b border-gray-50">
                                            <span className="text-[11px] text-gray-400 w-5 text-right shrink-0">{num}</span>
                                            {!ans ? (
                                              <span className="text-xs text-red-400 font-semibold">Unanswered</span>
                                            ) : ans.responseType === "skipped" ? (
                                              <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold">Skip</span>
                                            ) : ans.responseType === "numeric" ? (
                                              <span className="text-[11px] px-2 py-0.5 rounded bg-violet-100 text-violet-700 font-mono">{ans.numericResponse ?? "—"}</span>
                                            ) : (
                                              <span className={`text-[11px] w-6 h-6 rounded flex items-center justify-center font-bold ${ans.selectedChoice ? CHOICE_COLORS[ans.selectedChoice] : "bg-gray-100"}`}>
                                                {ans.selectedChoice ?? "?"}
                                              </span>
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

                          {/* Reflection */}
                          {(sub.reflectionRanOutOfTime || sub.reflectionDifficultSection || sub.reflectionTroubleTopics || sub.reflectionReviewRequests) && (
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Student Reflection</p>
                              <div className="space-y-2">
                                {sub.reflectionDifficultSection && (
                                  <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Most Difficult Section</p><p className="text-sm text-gray-700">{sub.reflectionDifficultSection}</p></div>
                                )}
                                {sub.reflectionRanOutOfTime && (
                                  <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Ran Out of Time</p><p className="text-sm text-gray-700">{sub.reflectionRanOutOfTime}</p></div>
                                )}
                                {sub.reflectionTroubleTopics && (
                                  <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Trouble Topics</p><p className="text-sm text-gray-700">{sub.reflectionTroubleTopics}</p></div>
                                )}
                                {sub.reflectionReviewRequests && (
                                  <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">Would Like to Review</p><p className="text-sm text-gray-700">{sub.reflectionReviewRequests}</p></div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Score report */}
                          {sub.scoreReportUrl && (
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Score Report</p>
                              <button
                                onClick={() => void openScoreReport(sub.id, sub.scoreReportUrl!)}
                                disabled={!!satPtReportOpening[sub.id]}
                                className="text-sm text-blue-600 hover:text-blue-700 underline disabled:opacity-50">
                                {satPtReportOpening[sub.id] ? "Opening…" : (sub.scoreReportFilename ?? "View Score Report")}
                              </button>
                            </div>
                          )}

                          {/* Draft warning */}
                          {sub.isDraft && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                              This submission is still in draft — the student has not finalized it.
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Existing grade (completed, not editing) */}
                    {h.status === "completed" && (h.grade || h.feedback) && !isFeedbackOpen && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-2">
                        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Grade &amp; Feedback</p>
                        {h.grade && <span className="font-bold text-emerald-800 bg-emerald-100 inline-block px-3 py-0.5 rounded-full text-sm">{h.grade}</span>}
                        {h.feedback && <p className="text-sm text-gray-700 whitespace-pre-wrap">{h.feedback}</p>}
                        <button onClick={() => { setHwFeedbackId(h.id); setHwGradeText(h.grade ?? ""); setHwFeedbackText(h.feedback ?? ""); }}
                          className="text-xs text-emerald-700 hover:underline font-medium">Edit →</button>
                      </div>
                    )}

                    {/* Grade form */}
                    {(h.status === "submitted" || (h.status === "completed" && isFeedbackOpen)) && (
                      <div className="border-t border-gray-100 pt-4">
                        {!isFeedbackOpen && !isUnsubmitOpen ? (
                          <div className="flex items-center gap-4">
                            <button onClick={() => { setHwFeedbackId(h.id); setHwGradeText(""); setHwFeedbackText(""); }}
                              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                              + Grade This Assignment
                            </button>
                            {h.status === "submitted" && (
                              <button onClick={() => { setHwUnsubmitId(h.id); setHwUnsubmitNote(""); setHwUnsubmitDue(h.dueDate ?? ""); setHwUnsubmitError(""); }}
                                className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors">
                                ↩ Send Back to Student
                              </button>
                            )}
                          </div>
                        ) : isFeedbackOpen ? (
                          <div className="space-y-3">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Grade &amp; Feedback</p>
                            <input type="text" value={hwGradeText} onChange={(e) => setHwGradeText(e.target.value)}
                              placeholder="Grade (A+, 95%, 9/10, ✓…)"
                              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <textarea value={hwFeedbackText} onChange={(e) => setHwFeedbackText(e.target.value)}
                              placeholder="Write your feedback for the student…"
                              rows={4}
                              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <div className="flex items-center gap-2">
                              <button onClick={() => saveFeedback(h.id)} disabled={hwFeedbackSaving || !hwFeedbackText.trim()}
                                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-colors">
                                {hwFeedbackSaving ? "Saving…" : "Submit Grade"}
                              </button>
                              <button onClick={() => { setHwFeedbackId(null); setHwFeedbackText(""); setHwGradeText(""); }}
                                className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Unsubmit / send back form */}
                    {h.status === "submitted" && isUnsubmitOpen && (
                      <div className="border-t border-gray-100 pt-4 space-y-3">
                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Send Back to Student</p>
                        <p className="text-xs text-gray-400">
                          This reverts the assignment to Pending so the student can finish and resubmit it.
                        </p>
                        <textarea value={hwUnsubmitNote} onChange={(e) => setHwUnsubmitNote(e.target.value)}
                          placeholder="What still needs to be finished or fixed…"
                          rows={3}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500" />
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">New Due Date</label>
                          <input type="date" value={hwUnsubmitDue} onChange={(e) => setHwUnsubmitDue(e.target.value)}
                            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                        </div>
                        {hwUnsubmitError && <p className="text-sm text-red-500">{hwUnsubmitError}</p>}
                        <div className="flex items-center gap-2">
                          <button onClick={() => saveUnsubmit(h.id)} disabled={hwUnsubmitSaving || !hwUnsubmitNote.trim() || !hwUnsubmitDue}
                            className="px-5 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-40 transition-colors">
                            {hwUnsubmitSaving ? "Sending Back…" : "Send Back to Student"}
                          </button>
                          <button onClick={() => { setHwUnsubmitId(null); setHwUnsubmitNote(""); setHwUnsubmitDue(""); setHwUnsubmitError(""); }}
                            className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
                        </div>
                      </div>
                    )}

                    {/* Mark done (for pending) */}
                    {h.status === "pending" && (
                      <div className="border-t border-gray-100 pt-3 flex items-center gap-3">
                        <button onClick={() => { completeHomework(h.id); setHwReviewId(null); }}
                          className="text-xs font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors">
                          Mark Done
                        </button>
                        <button onClick={() => { handleDeleteHomework(h.id); setHwReviewId(null); }} disabled={hwDeletingId === h.id}
                          className="text-xs text-red-400 hover:text-red-600 font-medium disabled:opacity-40 transition-colors">
                          {hwDeletingId === h.id ? "Deleting…" : "Delete Assignment"}
                        </button>
                      </div>
                    )}
                  </div>
                </Modal>
              );
            })()}
          </>
        );
      })()}


      {/* ── COURSE LIBRARY ── */}
      {tab === "courses" && <CoursesOverview students={myStudents} role="tutor" />}

      {tab === "library" && <CourseLibrary />}

    </DashboardShell>

    {/* ── SKILL DETAIL DRAWER (roadmap node clicks in student plan view) ── */}
    {tutorSkillId !== null && selectedStudentId !== null && (
      <SkillDetailDrawer
        skillId={tutorSkillId}
        studentId={selectedStudentId}
        skillNodes={allSkillNodes}
        editable
        onSaved={(updated) => setPanelStudentSkills((prev) => [...prev.filter((s) => s.skillId !== updated.skillId), updated])}
        onClose={() => setTutorSkillId(null)}
      />
    )}

    {/* ── SESSION DETAIL MODAL (global — works from overview & calendar) ── */}
    {sessionDetail && (() => {
      const sd = sessionDetail;
      const sdStudent = getStudent(sd.studentId);
      const sdMatchesSession = (n: { sessionId: number | null; noteDate?: string; createdAt: string; topic: string }) =>
        n.sessionId === sd.id ||
        n.noteDate === sd.date ||
        (!n.sessionId && !n.noteDate && n.createdAt.slice(0, 10) === sd.date);
      const sdNotes = sessionNotes.filter((n) => n.topic !== "_resource_" && sdMatchesSession(n));
      const sdLinks = sessionNotes.filter((n) => n.topic === "_resource_"  && sdMatchesSession(n));
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
                  <button onClick={() => resendSessionEmail(sd.id)} disabled={resendingSessionId === sd.id}
                    className="text-xs text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 disabled:opacity-40">
                    {resendingSessionId === sd.id ? "Sending…" : resentSessionId === sd.id ? "Sent ✓" : "Email Confirmation"}
                  </button>
                )}
                {!editingSession && (
                  <button onClick={() => handleDuplicateSession(sd)} disabled={duplicatingId === sd.id}
                    className="text-xs text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 disabled:opacity-40">
                    {duplicatingId === sd.id ? "Duplicating…" : duplicatedId === sd.id ? "Booked ✓" : "Duplicate to Next Week"}
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
            {duplicateError && (
              <p className="text-xs text-red-500 -mt-3">{duplicateError}</p>
            )}

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
                            <button onClick={async () => {
                              setNoteEditId(n.id); setNoteEditTopic(n.topic); setNoteEditText(n.notes);
                              setNoteEditKamiLink(n.kamiLink ?? ""); setNoteEditDate(n.noteDate ?? "");
                              const skills = await fetchNoteSkills(n.id);
                              setNoteEditSkillIds(skills.map((s) => s.id));
                            }}
                              className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded px-2 py-0.5 font-medium">Edit</button>
                            <button onClick={() => removeSessionNote(n.id)}
                              className="text-xs text-red-400 hover:text-red-600 border border-red-200 rounded px-2 py-0.5 font-medium">Remove</button>
                          </div>
                        </div>
                        {n.noteDate && <p className="text-[11px] text-gray-400 mb-1">Session: {formatDate(n.noteDate)}</p>}
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{n.notes}</p>
                        {n.kamiLink && (
                          <a href={n.kamiLink} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-lg hover:bg-violet-100">
                            <ExternalLink className="w-3 h-3" /> Kami Lesson
                          </a>
                        )}
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Session Date (optional)</label>
                  <input type="date" value={sdNoteDate} onChange={(e) => setSdNoteDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Kami Link (optional)</label>
                  <input value={sdNoteKamiLink} onChange={(e) => setSdNoteKamiLink(e.target.value)} placeholder="https://app.kami.com/…" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
              </div>
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
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Success Plan PDF</p>

              {/* Current PDF */}
              {profileStudent.successPlanUrl && (
                <div className="flex items-center gap-2 mb-3 p-2.5 bg-blue-50 border border-blue-100 rounded-xl">
                  <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-xs text-blue-700 font-medium flex-1 truncate">
                    {profileStudent.successPlanUrl.split("/").pop()?.replace(/^\d+_/, "") ?? "Success Plan"}
                  </span>
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
                          body: JSON.stringify({ path: profileStudent.successPlanUrl }),
                        });
                        if (!res.ok) throw new Error("Failed to load");
                        const blob = await res.blob();
                        window.open(URL.createObjectURL(blob), "_blank");
                      } catch {
                        alert("Could not open the PDF.");
                      }
                    }}
                    className="text-xs text-blue-600 hover:underline shrink-0 font-medium"
                  >
                    View
                  </button>
                  <button
                    onClick={removeSuccessPlan}
                    disabled={planRemoving}
                    className="text-xs text-red-500 hover:underline shrink-0 font-medium disabled:opacity-50"
                  >
                    {planRemoving ? "Removing…" : "Remove"}
                  </button>
                </div>
              )}

              {/* Upload new PDF */}
              <label className={`flex items-center gap-2 w-full cursor-pointer border-2 border-dashed rounded-xl px-4 py-3 transition-colors ${planUploading ? "border-gray-200 bg-gray-50" : "border-gray-200 hover:border-blue-300 bg-white"}`}>
                <Upload className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-500">
                  {planUploading ? "Uploading…" : profileStudent.successPlanUrl ? "Replace PDF" : "Upload Success Plan PDF"}
                </span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  disabled={planUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadSuccessPlan(f);
                    e.target.value = "";
                  }}
                />
              </label>
              {planUploadErr && <p className="text-xs text-red-500 mt-1.5">{planUploadErr}</p>}
              {planUploaded && <p className="text-xs text-emerald-600 font-medium mt-1.5">PDF uploaded successfully.</p>}
            </div>
          </div>
        </Modal>
      );
    })()}
    </>
  );
}
