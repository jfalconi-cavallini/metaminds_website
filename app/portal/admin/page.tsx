"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import Badge from "@/components/portal/Badge";
import StatCard from "@/components/portal/StatCard";
import Modal from "@/components/portal/Modal";
import { formatDate, formatTime24to12 } from "@/lib/portal/utils";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import AvailabilityGrid from "@/components/portal/AvailabilityGrid";
import {
  fetchStudents, fetchTutors, fetchSessions, fetchAllPackages,
  insertSession, cancelSession,
  createStudent, createTutor, assignStudentToTutor, addPackageHours,
  updateSessionZoomLink, fetchTutorAvailability, fetchSessionsByTutor,
  bulkInsertSessions, updateStudentProfile, updateTutorProfile,
  archiveStudent, restoreStudent, archiveTutor, restoreTutor,
  countHomeworkByStatus,
} from "@/lib/portal/db";
import type { Student, Tutor, Session, HoursBalance, TutorAvailability } from "@/lib/portal/types";

const navItems = [
  { id: "overview",  label: "Overview"  },
  { id: "students",  label: "Students"  },
  { id: "tutors",    label: "Tutors"    },
  { id: "sessions",  label: "Sessions"  },
  { id: "packages",  label: "Packages"  },
];


export default function AdminPortal() {
  const { user, authLoaded } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("overview");

  const handleTabChange = useCallback((id: string) => {
    setTab(id);
  }, []);

  const [students,         setStudents]         = useState<Student[]>([]);
  const [tutors,           setTutors]           = useState<Tutor[]>([]);
  const [sessions,         setSessions]         = useState<Session[]>([]);
  const [packages,         setPackages]         = useState<HoursBalance[]>([]);
  const [submittedHwCount, setSubmittedHwCount] = useState(0);
  const [loading,          setLoading]          = useState(true);

  // ── PROFILE MODALS ─────────────────────────────────────────────
  const [profileStudent,  setProfileStudent]  = useState<Student | null>(null);
  const [profileTutor,    setProfileTutor]    = useState<Tutor | null>(null);
  const [editingProfile,  setEditingProfile]  = useState(false);
  const [profileSaving,   setProfileSaving]   = useState(false);
  // Student edit fields
  const [pfName,         setPfName]         = useState("");
  const [pfEmail,        setPfEmail]        = useState("");
  const [pfGrade,        setPfGrade]        = useState("");
  const [pfSubjects,     setPfSubjects]     = useState("");
  const [pfPhone,        setPfPhone]        = useState("");
  const [pfParentName,   setPfParentName]   = useState("");
  const [pfParentEmail,  setPfParentEmail]  = useState("");
  const [pfParentPhone,  setPfParentPhone]  = useState("");
  const [pfNotes,        setPfNotes]        = useState("");
  // Tutor edit fields
  const [pfTutName,      setPfTutName]      = useState("");
  const [pfTutEmail,     setPfTutEmail]     = useState("");
  const [pfTutSubjects,  setPfTutSubjects]  = useState("");
  const [pfTutPhone,     setPfTutPhone]     = useState("");
  const [pfTutBio,       setPfTutBio]       = useState("");
  const [pfTutPhoto,     setPfTutPhoto]     = useState("");

  useEffect(() => {
    if (!authLoaded) return;
    if (!user || user.role !== "admin") {
      router.push("/login");
      return;
    }
    async function load() {
      try {
        const [s, t, sess, pkgs, hwCount] = await Promise.all([
          fetchStudents({ all: true }), fetchTutors({ all: true }), fetchSessions(), fetchAllPackages(),
          countHomeworkByStatus("submitted"),
        ]);
        setStudents(s); setTutors(t); setSessions(sess); setPackages(pkgs);
        setSubmittedHwCount(hwCount);
      } catch (err) { console.error("Admin load error:", err); }
      finally { setLoading(false); }
    }
    load();
  }, [authLoaded, user, router]);

  // ── ARCHIVE ─────────────────────────────────────────────────────
  const [showArchivedStudents, setShowArchivedStudents] = useState(false);
  const [showArchivedTutors,   setShowArchivedTutors]   = useState(false);
  const [archivingId,          setArchivingId]          = useState<number | null>(null);

  // ── DELETE (permanent) ──────────────────────────────────────────
  const [deleteTarget,   setDeleteTarget]   = useState<{ id: number; name: string; type: "student" | "tutor" } | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError,    setDeleteError]    = useState("");
  const [deleteLoading,  setDeleteLoading]  = useState(false);
  const [showDeletePw,   setShowDeletePw]   = useState(false);

  async function submitDelete() {
    if (!deleteTarget || !deletePassword) return;
    setDeleteLoading(true); setDeleteError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expired — please refresh and sign in again.");
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          role: deleteTarget.type,
          linkedId: deleteTarget.id,
          adminPassword: deletePassword,
        }),
      });
      const result = await res.json() as { error?: string };
      if (!res.ok) throw new Error(result.error ?? "Delete failed");
      if (deleteTarget.type === "student") {
        setStudents((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      } else {
        setTutors((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      }
      setDeleteTarget(null); setDeletePassword("");
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
    } finally { setDeleteLoading(false); }
  }

  async function handleArchiveStudent(id: number) {
    setArchivingId(id);
    try {
      await archiveStudent(id);
      setStudents((prev) => prev.map((s) => s.id === id ? { ...s, archived: true } : s));
    } catch { /* silent */ } finally { setArchivingId(null); }
  }

  async function handleRestoreStudent(id: number) {
    setArchivingId(id);
    try {
      await restoreStudent(id);
      setStudents((prev) => prev.map((s) => s.id === id ? { ...s, archived: false } : s));
    } catch { /* silent */ } finally { setArchivingId(null); }
  }

  async function handleArchiveTutor(id: number) {
    setArchivingId(id);
    try {
      await archiveTutor(id);
      setTutors((prev) => prev.map((t) => t.id === id ? { ...t, archived: true } : t));
    } catch { /* silent */ } finally { setArchivingId(null); }
  }

  async function handleRestoreTutor(id: number) {
    setArchivingId(id);
    try {
      await restoreTutor(id);
      setTutors((prev) => prev.map((t) => t.id === id ? { ...t, archived: false } : t));
    } catch { /* silent */ } finally { setArchivingId(null); }
  }

  // ── SESSION FORM ────────────────────────────────────────────────
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessStudentId,   setSessStudentId]   = useState("");
  const [sessTutorId,     setSessTutorId]     = useState("");
  const [sessSubject,     setSessSubject]     = useState("");
  const [sessDate,        setSessDate]        = useState("");
  const [sessTime,        setSessTime]        = useState("");
  const [sessDuration,    setSessDuration]    = useState("1");
  const [sessType,        setSessType]        = useState<"online" | "in-person">("online");
  const [sessZoom,        setSessZoom]        = useState("");
  const [sessSuccess,     setSessSuccess]     = useState(false);
  const [sessError,       setSessError]       = useState("");

  // ── BULK SCHEDULE ──────────────────────────────────────────────
  const [showBulkForm,   setShowBulkForm]   = useState(false);
  const [bulkStudentId,  setBulkStudentId]  = useState("");
  const [bulkTutorId,    setBulkTutorId]    = useState("");
  const [bulkSubject,    setBulkSubject]    = useState("");
  const [bulkStartDate,  setBulkStartDate]  = useState("");
  const [bulkTime,       setBulkTime]       = useState("");
  const [bulkDuration,   setBulkDuration]   = useState("1");
  const [bulkType,       setBulkType]       = useState<"online" | "in-person">("online");
  const [bulkZoom,       setBulkZoom]       = useState("");
  const [bulkCount,      setBulkCount]      = useState("8");
  const [bulkSaving,     setBulkSaving]     = useState(false);
  const [bulkSuccess,    setBulkSuccess]    = useState(false);
  const [bulkError,      setBulkError]      = useState("");

  useEffect(() => {
    if (students.length > 0 && !sessStudentId) setSessStudentId(String(students[0].id));
    if (tutors.length   > 0 && !sessTutorId)   setSessTutorId(String(tutors[0].id));
  }, [students, tutors, sessStudentId, sessTutorId]);

  async function submitSession() {
    if (!sessDate || !sessTime || !sessSubject) return;
    setSessError("");
    try {
      const newSession = await insertSession({
        studentId:     Number(sessStudentId),
        tutorId:       Number(sessTutorId),
        subject:       sessSubject,
        sessionDate:   sessDate,
        sessionTime:   formatTime24to12(sessTime),
        durationHours: Number(sessDuration),
        sessionType:   sessType,
        notes:         sessZoom ? undefined : undefined,
      });
      if (sessZoom) await updateSessionZoomLink(newSession.id, sessZoom);
      setSessions((prev) => [{ ...newSession, zoomLink: sessZoom || undefined }, ...prev]);
      setSessSuccess(true); setShowSessionForm(false);
      setSessSubject(""); setSessDate(""); setSessTime(""); setSessZoom("");
      setTimeout(() => setSessSuccess(false), 4000);
    } catch { setSessError("Failed to create session."); }
  }

  // ── BULK SCHEDULE HELPERS ───────────────────────────────────────
  function getBulkDates(): string[] {
    if (!bulkStartDate || !bulkCount) return [];
    const dates: string[] = [];
    const start = new Date(bulkStartDate + "T12:00:00"); // noon avoids DST edge
    const n = Math.min(Math.max(1, Number(bulkCount)), 52);
    for (let i = 0; i < n; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i * 7);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  }

  async function submitBulkSchedule() {
    if (!bulkStartDate || !bulkTime || !bulkSubject || !bulkStudentId || !bulkTutorId) {
      setBulkError("Fill in all required fields."); return;
    }
    setBulkSaving(true); setBulkError("");
    try {
      const timeStr = formatTime24to12(bulkTime);
      const rows = getBulkDates().map((date) => ({
        studentId: Number(bulkStudentId), tutorId: Number(bulkTutorId),
        subject: bulkSubject, sessionDate: date, sessionTime: timeStr,
        durationHours: Number(bulkDuration), sessionType: bulkType,
        zoomLink: bulkZoom || undefined,
      }));
      const newSessions = await bulkInsertSessions(rows);
      setSessions((prev) => [...newSessions, ...prev]);
      setBulkSuccess(true); setShowBulkForm(false);
      setBulkSubject(""); setBulkStartDate(""); setBulkTime(""); setBulkZoom(""); setBulkCount("8");
      setTimeout(() => setBulkSuccess(false), 5000);
    } catch (e: unknown) { setBulkError(e instanceof Error ? e.message : "Failed to schedule sessions."); }
    finally { setBulkSaving(false); }
  }

  // ── STUDENT FORM ────────────────────────────────────────────────
  const [showStudentForm,  setShowStudentForm]  = useState(false);
  const [newStudName,      setNewStudName]      = useState("");
  const [newStudEmail,     setNewStudEmail]     = useState("");
  const [newStudPassword,  setNewStudPassword]  = useState("");
  const [newStudGrade,     setNewStudGrade]     = useState("");
  const [newStudSubjects,  setNewStudSubjects]  = useState("");
  const [studFormError,    setStudFormError]    = useState("");
  const [studFormSuccess,  setStudFormSuccess]  = useState("")
  const [studFormLoading,  setStudFormLoading]  = useState(false);

  async function submitNewStudent() {
    if (!newStudName || !newStudEmail || !newStudPassword) {
      setStudFormError("Name, email, and password are required."); return;
    }
    setStudFormLoading(true); setStudFormError(""); setStudFormSuccess("");
    let createdStudentId: number | null = null;
    try {
      // 1. Create DB record
      const s = await createStudent({
        name: newStudName, email: newStudEmail, grade: newStudGrade,
        subjects: newStudSubjects.split(",").map((x) => x.trim()).filter(Boolean),
      });
      createdStudentId = s.id;
      setStudents((prev) => [...prev, s]);

      // 2. Create Supabase Auth account + link to DB record
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Your session has expired — please refresh and sign in again.");
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: newStudEmail,
          password: newStudPassword,
          fullName: newStudName,
          role: "student",
          linkedId: s.id,
        }),
      });
      const result = await res.json() as { error?: string };
      if (!res.ok) throw new Error(result.error ?? `Server error ${res.status}`);

      setStudFormSuccess(`Account created! ${newStudName} can now log in with ${newStudEmail}.`);
      setNewStudName(""); setNewStudEmail(""); setNewStudPassword(""); setNewStudGrade(""); setNewStudSubjects("");
      setTimeout(() => { setShowStudentForm(false); setStudFormSuccess(""); }, 4000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setStudFormError(`${msg}${createdStudentId ? ` (Student DB record #${createdStudentId} was created — re-submit or delete it manually in Supabase)` : ""}`);
    } finally { setStudFormLoading(false); }
  }

  // ── TUTOR FORM ──────────────────────────────────────────────────
  const [showTutorForm,   setShowTutorForm]   = useState(false);
  const [newTutName,      setNewTutName]      = useState("");
  const [newTutEmail,     setNewTutEmail]     = useState("");
  const [newTutPassword,  setNewTutPassword]  = useState("");
  const [newTutSubjs,     setNewTutSubjs]     = useState("");
  const [tutFormError,    setTutFormError]    = useState("");
  const [tutFormSuccess,  setTutFormSuccess]  = useState("");
  const [tutFormLoading,  setTutFormLoading]  = useState(false);

  async function submitNewTutor() {
    if (!newTutName || !newTutEmail || !newTutPassword) {
      setTutFormError("Name, email, and password are required."); return;
    }
    setTutFormLoading(true); setTutFormError(""); setTutFormSuccess("");
    let createdTutorId: number | null = null;
    try {
      // 1. Create DB record
      const t = await createTutor({
        name: newTutName, email: newTutEmail,
        subjects: newTutSubjs.split(",").map((x) => x.trim()).filter(Boolean),
      });
      createdTutorId = t.id;
      setTutors((prev) => [...prev, t]);

      // 2. Create Supabase Auth account + link to DB record
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Your session has expired — please refresh and sign in again.");
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: newTutEmail,
          password: newTutPassword,
          fullName: newTutName,
          role: "tutor",
          linkedId: t.id,
        }),
      });
      const result = await res.json() as { error?: string };
      if (!res.ok) throw new Error(result.error ?? `Server error ${res.status}`);

      setTutFormSuccess(`Account created! ${newTutName} can now log in with ${newTutEmail}.`);
      setNewTutName(""); setNewTutEmail(""); setNewTutPassword(""); setNewTutSubjs("");
      setTimeout(() => { setShowTutorForm(false); setTutFormSuccess(""); }, 4000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setTutFormError(`${msg}${createdTutorId ? ` (Tutor DB record #${createdTutorId} was created — re-submit or delete it manually in Supabase)` : ""}`);
    } finally { setTutFormLoading(false); }
  }

  // ── ASSIGN TUTOR ────────────────────────────────────────────────
  const [assignFor,      setAssignFor]      = useState<number | null>(null);
  const [assignTutorId,  setAssignTutorId]  = useState("");
  const [assignLoading,  setAssignLoading]  = useState(false);

  async function submitAssign(studentId: number) {
    setAssignLoading(true);
    try {
      await assignStudentToTutor(studentId, Number(assignTutorId));
      setStudents((prev) => prev.map((s) =>
        s.id === studentId ? { ...s, assignedTutorId: Number(assignTutorId) } : s
      ));
      setAssignFor(null);
    } catch { /* silent */ }
    finally { setAssignLoading(false); }
  }

  // ── CANCEL SESSION ──────────────────────────────────────────────
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  async function handleCancelSession(s: Session) {
    setCancellingId(s.id);
    try {
      await cancelSession(s.id, s.durationHours, s.studentId);
      setSessions((prev) => prev.map((x) => x.id === s.id ? { ...x, status: "cancelled" } : x));
      setPackages((prev) => prev.map((b) =>
        b.studentId === s.studentId
          ? { ...b, totalUsed: Math.max(0, b.totalUsed - s.durationHours), remaining: b.remaining + s.durationHours }
          : b
      ));
    } catch { /* silent */ }
    finally { setCancellingId(null); }
  }

  // ── ZOOM LINK EDIT ──────────────────────────────────────────────
  const [zoomEditId,   setZoomEditId]   = useState<number | null>(null);
  const [zoomEditVal,  setZoomEditVal]  = useState("");
  const [zoomSaving,   setZoomSaving]   = useState(false);

  // ── TUTOR SCHEDULE VIEW ─────────────────────────────────────────
  const [schedTutor,    setSchedTutor]    = useState<Tutor | null>(null);
  const [schedAvail,    setSchedAvail]    = useState<TutorAvailability[]>([]);
  const [schedSessions, setSchedSessions] = useState<Session[]>([]);
  const [schedLoading,  setSchedLoading]  = useState(false);

  async function openTutorSchedule(tutor: Tutor) {
    setSchedTutor(tutor);
    setSchedLoading(true);
    try {
      const [avail, sess] = await Promise.all([
        fetchTutorAvailability(tutor.id),
        fetchSessionsByTutor(tutor.id),
      ]);
      setSchedAvail(avail);
      setSchedSessions(sess);
    } catch { /* silent */ }
    finally { setSchedLoading(false); }
  }

  async function saveZoomLink(sessionId: number) {
    setZoomSaving(true);
    try {
      await updateSessionZoomLink(sessionId, zoomEditVal);
      setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, zoomLink: zoomEditVal || undefined } : s));
      setZoomEditId(null);
    } catch { /* silent */ }
    finally { setZoomSaving(false); }
  }

  // ── ADD HOURS MODAL ─────────────────────────────────────────────
  const [addHoursFor,    setAddHoursFor]    = useState<number | null>(null);
  const [addHoursAmt,    setAddHoursAmt]    = useState("4");
  const [addHoursExpiry, setAddHoursExpiry] = useState("");
  const [addHoursLoading,setAddHoursLoading]= useState(false);
  const [addHoursError,  setAddHoursError]  = useState("");

  async function submitAddHours() {
    if (!addHoursFor || !addHoursExpiry) { setAddHoursError("Select an expiry date."); return; }
    setAddHoursLoading(true); setAddHoursError("");
    try {
      const updated = await addPackageHours(addHoursFor, Number(addHoursAmt), addHoursExpiry);
      setPackages((prev) => {
        const exists = prev.find((b) => b.studentId === addHoursFor);
        if (exists) return prev.map((b) => b.studentId === addHoursFor ? updated : b);
        return [...prev, updated];
      });
      setAddHoursFor(null);
    } catch { setAddHoursError("Failed to add hours."); }
    finally { setAddHoursLoading(false); }
  }

  // ── HELPERS ─────────────────────────────────────────────────────
  function getStudent(id: number) { return students.find((s) => s.id === id); }
  function getTutor(id: number)   { return tutors.find((t) => t.id === id);   }

  function openStudentProfile(s: Student) {
    setProfileStudent(s); setEditingProfile(false);
    setPfName(s.name); setPfEmail(s.email); setPfGrade(s.grade);
    setPfSubjects(s.subjects.join(", ")); setPfPhone(s.phone ?? "");
    setPfParentName(s.parentName ?? ""); setPfParentEmail(s.parentEmail ?? "");
    setPfParentPhone(s.parentPhone ?? ""); setPfNotes(s.notes ?? "");
  }

  function openTutorProfile(t: Tutor) {
    setProfileTutor(t); setEditingProfile(false);
    setPfTutName(t.name); setPfTutEmail(t.email);
    setPfTutSubjects(t.subjects.join(", ")); setPfTutPhone(t.phone ?? ""); setPfTutBio(t.bio ?? "");
    setPfTutPhoto(t.photoUrl ?? "");
  }

  async function saveStudentProfile() {
    if (!profileStudent) return;
    setProfileSaving(true);
    try {
      const updated = await updateStudentProfile(profileStudent.id, {
        name: pfName, email: pfEmail, grade: pfGrade,
        subjects: pfSubjects.split(",").map((s) => s.trim()).filter(Boolean),
        phone: pfPhone, parentName: pfParentName, parentEmail: pfParentEmail,
        parentPhone: pfParentPhone, notes: pfNotes,
      });
      // Sync auth email if it changed
      if (pfEmail && pfEmail !== profileStudent.email) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          fetch("/api/admin/update-email", {
            method: "POST",
            headers: { "content-type": "application/json", "authorization": `Bearer ${session.access_token}` },
            body: JSON.stringify({ role: "student", linkedId: profileStudent.id, newEmail: pfEmail }),
          }).catch(console.error);
        }
      }
      setStudents((prev) => prev.map((s) => s.id === updated.id ? updated : s));
      setProfileStudent(updated); setEditingProfile(false);
    } catch { /* silent */ } finally { setProfileSaving(false); }
  }

  async function saveTutorProfile() {
    if (!profileTutor) return;
    setProfileSaving(true);
    try {
      const updated = await updateTutorProfile(profileTutor.id, {
        name: pfTutName, email: pfTutEmail,
        subjects: pfTutSubjects.split(",").map((s) => s.trim()).filter(Boolean),
        phone: pfTutPhone, bio: pfTutBio, photoUrl: pfTutPhoto,
      });
      // Sync auth email if it changed
      if (pfTutEmail && pfTutEmail !== profileTutor.email) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          fetch("/api/admin/update-email", {
            method: "POST",
            headers: { "content-type": "application/json", "authorization": `Bearer ${session.access_token}` },
            body: JSON.stringify({ role: "tutor", linkedId: profileTutor.id, newEmail: pfTutEmail }),
          }).catch(console.error);
        }
      }
      setTutors((prev) => prev.map((t) => t.id === updated.id ? updated : t));
      setProfileTutor(updated); setEditingProfile(false);
    } catch { /* silent */ } finally { setProfileSaving(false); }
  }

  const adminName = user?.fullName ?? "Jose Falconi";
  const upcoming  = sessions.filter((s) => s.status === "upcoming");
  const totalHoursSold = packages.reduce((sum, b) => sum + b.totalPurchased, 0);

  if (!authLoaded || loading) {
    return (
      <DashboardShell role="admin" userName="Admin" navItems={navItems} activeTab={tab} onTabChange={handleTabChange}>
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading dashboard…</div>
      </DashboardShell>
    );
  }

  return (
    <>
    <DashboardShell role="admin" userName={adminName} navItems={navItems} activeTab={tab} onTabChange={handleTabChange}>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (() => {
        const todayIso    = new Date().toISOString().slice(0, 10);
        const tomorrowD   = new Date(); tomorrowD.setDate(tomorrowD.getDate() + 1);
        const tomorrowIso = tomorrowD.toISOString().slice(0, 10);
        const todaySess    = sessions.filter((s) => s.date === todayIso    && s.status === "upcoming");
        const tomorrowSess = sessions.filter((s) => s.date === tomorrowIso && s.status === "upcoming");
        const lowHours     = students.filter((s) => !s.archived && (packages.find((p) => p.studentId === s.id)?.remaining ?? 99) < 3);
        const activeStudents = students.filter((s) => !s.archived);

        return (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Overview</h1>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard label="Active Students"   value={activeStudents.length} />
              <StatCard label="Active Tutors"     value={tutors.filter((t) => !t.archived).length} />
              <StatCard label="Upcoming Sessions" value={upcoming.length} />
              <StatCard label="Total Hours Sold"  value={totalHoursSold} />
            </div>

            {/* Today's Tasks */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Today&apos;s Tasks</h2>
              {todaySess.length === 0 && tomorrowSess.length === 0 && submittedHwCount === 0 && lowHours.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-sm text-green-700 font-medium">
                  All clear — nothing needs your attention right now.
                </div>
              ) : (
                <div className="space-y-2">
                  {todaySess.length > 0 && (
                    <button onClick={() => setTab("sessions")}
                      className="w-full flex items-start gap-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3.5 text-left hover:bg-blue-100 transition-colors">
                      <span className="text-xl shrink-0">📅</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-blue-900 text-sm">{todaySess.length} session{todaySess.length > 1 ? "s" : ""} today</p>
                        <p className="text-xs text-blue-600 mt-0.5 truncate">
                          {todaySess.map((s) => `${getStudent(s.studentId)?.name ?? "?"} with ${getTutor(s.tutorId)?.name ?? "?"} at ${s.time}`).join("  ·  ")}
                        </p>
                      </div>
                      <span className="text-blue-500 text-sm font-medium shrink-0">View →</span>
                    </button>
                  )}

                  {tomorrowSess.length > 0 && (
                    <button onClick={() => setTab("sessions")}
                      className="w-full flex items-start gap-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-left hover:bg-gray-100 transition-colors">
                      <span className="text-xl shrink-0">📅</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-700 text-sm">{tomorrowSess.length} session{tomorrowSess.length > 1 ? "s" : ""} tomorrow</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {tomorrowSess.map((s) => `${getStudent(s.studentId)?.name ?? "?"} at ${s.time}`).join("  ·  ")}
                        </p>
                      </div>
                      <span className="text-gray-400 text-sm font-medium shrink-0">View →</span>
                    </button>
                  )}

                  {submittedHwCount > 0 && (
                    <div className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5">
                      <span className="text-xl shrink-0">📋</span>
                      <div>
                        <p className="font-semibold text-amber-800 text-sm">{submittedHwCount} homework submission{submittedHwCount > 1 ? "s" : ""} waiting for tutor review</p>
                        <p className="text-xs text-amber-600 mt-0.5">Tutors should grade these in their Homework tab</p>
                      </div>
                    </div>
                  )}

                  {lowHours.length > 0 && (
                    <button onClick={() => setTab("packages")}
                      className="w-full flex items-start gap-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3.5 text-left hover:bg-red-100 transition-colors">
                      <span className="text-xl shrink-0">⚠️</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-red-800 text-sm">{lowHours.length} student{lowHours.length > 1 ? "s" : ""} running low on hours (&lt; 3 remaining)</p>
                        <p className="text-xs text-red-600 mt-0.5">
                          {lowHours.map((s) => `${s.name} (${packages.find((p) => p.studentId === s.id)?.remaining ?? 0} hr${(packages.find((p) => p.studentId === s.id)?.remaining ?? 0) === 1 ? "" : "s"})`).join(", ")}
                        </p>
                      </div>
                      <span className="text-red-500 text-sm font-medium shrink-0">Add Hours →</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Upcoming sessions table */}
            <h2 className="text-lg font-semibold text-gray-900 mb-3">All Upcoming Sessions</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left">Tutor</th>
                    <th className="px-4 py-3 text-left">Date & Time</th>
                    <th className="px-4 py-3 text-left">Subject</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Zoom</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {upcoming.map((s) => (
                    <tr key={s.id} className={s.date === todayIso ? "bg-blue-50" : ""}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {getStudent(s.studentId)?.name ?? "—"}
                        {s.date === todayIso && <span className="ml-2 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-medium">TODAY</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{getTutor(s.tutorId)?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(s.date)} {s.time}</td>
                      <td className="px-4 py-3 text-gray-600">{s.subject}</td>
                      <td className="px-4 py-3"><Badge status={s.sessionType} /></td>
                      <td className="px-4 py-3">
                        {s.zoomLink
                          ? <a href={s.zoomLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs underline">Join</a>
                          : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                  {upcoming.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">No upcoming sessions.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ── STUDENTS ── */}
      {tab === "students" && (() => {
        const archivedCount = students.filter((s) => s.archived).length;
        const visibleStudents = students.filter((s) => showArchivedStudents ? true : !s.archived);
        return (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Students</h1>
            <div className="flex items-center gap-2">
              {archivedCount > 0 && (
                <button
                  onClick={() => setShowArchivedStudents((v) => !v)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${showArchivedStudents ? "bg-gray-700 text-white border-gray-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
                >
                  {showArchivedStudents ? "Hide Archived" : `Show Archived (${archivedCount})`}
                </button>
              )}
              <button
                onClick={() => { setShowStudentForm(true); setStudFormError(""); }}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700"
              >
                + Create Account
              </button>
            </div>
          </div>

          {showStudentForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
              <h3 className="font-semibold text-gray-900 mb-1">New Student Account</h3>
              <p className="text-xs text-gray-500 mb-4">Creates the portal profile and a login account in one step.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <input value={newStudName}     onChange={(e) => setNewStudName(e.target.value)}     placeholder="Full Name *"               className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white" />
                <input value={newStudEmail}    onChange={(e) => setNewStudEmail(e.target.value)}    placeholder="Email Address *" type="email" className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white" />
                <input value={newStudPassword} onChange={(e) => setNewStudPassword(e.target.value)} placeholder="Temporary Password *" type="password" className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white" />
                <input value={newStudGrade}    onChange={(e) => setNewStudGrade(e.target.value)}    placeholder="Grade Level (e.g. 7th)"    className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white" />
                <input value={newStudSubjects} onChange={(e) => setNewStudSubjects(e.target.value)} placeholder="Subjects (comma-separated)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white sm:col-span-2" />
              </div>
              <p className="text-xs text-gray-400 mb-3">Share the email + temporary password with the student so they can log in.</p>
              {studFormSuccess && <p className="text-xs text-green-600 font-medium mb-2">✓ {studFormSuccess}</p>}
              {studFormError   && <p className="text-xs text-red-500 mb-2">{studFormError}</p>}
              <div className="flex gap-3">
                <button onClick={submitNewStudent} disabled={studFormLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {studFormLoading ? "Creating…" : "Create Account"}
                </button>
                <button onClick={() => { setShowStudentForm(false); setStudFormError(""); setStudFormSuccess(""); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Grade</th>
                  <th className="px-4 py-3 text-left">Subjects</th>
                  <th className="px-4 py-3 text-left">Tutor</th>
                  <th className="px-4 py-3 text-left">Hrs Left</th>
                  <th className="px-4 py-3 text-left"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleStudents.map((s) => {
                  const balance = packages.find((b) => b.studentId === s.id);
                  const tutor   = getTutor(s.assignedTutorId ?? 0);
                  return (
                    <React.Fragment key={s.id}>
                      <tr className={s.archived ? "opacity-50 bg-gray-50" : ""}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => openStudentProfile(s)}>{s.name}</span>
                            {s.archived && <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium">Archived</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{s.grade || "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{s.subjects.join(", ") || "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{tutor?.name ?? <span className="text-gray-300">Unassigned</span>}</td>
                        <td className="px-4 py-3">
                          <span className={`font-medium ${(balance?.remaining ?? 0) <= 2 ? "text-red-500" : "text-blue-600"}`}>
                            {balance?.remaining ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {!s.archived && (
                              <button
                                onClick={() => { setAssignFor(assignFor === s.id ? null : s.id); setAssignTutorId(String(s.assignedTutorId ?? tutors[0]?.id ?? "")); }}
                                className="text-blue-600 text-xs font-medium hover:underline"
                              >
                                {s.assignedTutorId ? "Change Tutor" : "Assign Tutor"}
                              </button>
                            )}
                            {s.archived ? (
                              <>
                                <button onClick={() => handleRestoreStudent(s.id)} disabled={archivingId === s.id}
                                  className="text-xs text-green-600 hover:underline font-medium disabled:opacity-40">
                                  {archivingId === s.id ? "…" : "Restore"}
                                </button>
                                <button onClick={() => { setDeleteTarget({ id: s.id, name: s.name, type: "student" }); setDeletePassword(""); setDeleteError(""); setShowDeletePw(false); }}
                                  className="text-xs text-red-500 hover:underline font-medium">
                                  Delete
                                </button>
                              </>
                            ) : (
                              <button onClick={() => handleArchiveStudent(s.id)} disabled={archivingId === s.id}
                                className="text-xs text-gray-400 hover:text-red-500 font-medium disabled:opacity-40 transition-colors">
                                {archivingId === s.id ? "…" : "Archive"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {assignFor === s.id && (
                        <tr className="bg-blue-50">
                          <td colSpan={6} className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <select
                                value={assignTutorId}
                                onChange={(e) => setAssignTutorId(e.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                              >
                                {tutors.filter((t) => !t.archived).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                              </select>
                              <button
                                onClick={() => submitAssign(s.id)}
                                disabled={assignLoading}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
                              >
                                {assignLoading ? "Saving…" : "Confirm"}
                              </button>
                              <button onClick={() => setAssignFor(null)} className="text-sm text-gray-500">Cancel</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {visibleStudents.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                    {showArchivedStudents ? "No archived students." : "No active students."}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        );
      })()}

      {/* ── TUTORS ── */}
      {tab === "tutors" && (() => {
        const archivedCount = tutors.filter((t) => t.archived).length;
        const visibleTutors = tutors.filter((t) => showArchivedTutors ? true : !t.archived);
        return (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Tutors</h1>
            <div className="flex items-center gap-2">
              {archivedCount > 0 && (
                <button
                  onClick={() => setShowArchivedTutors((v) => !v)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${showArchivedTutors ? "bg-gray-700 text-white border-gray-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
                >
                  {showArchivedTutors ? "Hide Archived" : `Show Archived (${archivedCount})`}
                </button>
              )}
              <button
                onClick={() => { setShowTutorForm(true); setTutFormError(""); }}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700"
              >
                + Create Account
              </button>
            </div>
          </div>

          {showTutorForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
              <h3 className="font-semibold text-gray-900 mb-1">New Tutor Account</h3>
              <p className="text-xs text-gray-500 mb-4">Creates the portal profile and a login account in one step.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <input value={newTutName}     onChange={(e) => setNewTutName(e.target.value)}     placeholder="Full Name *"               className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white" />
                <input value={newTutEmail}    onChange={(e) => setNewTutEmail(e.target.value)}    placeholder="Email Address *" type="email" className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white" />
                <input value={newTutPassword} onChange={(e) => setNewTutPassword(e.target.value)} placeholder="Temporary Password *" type="password" className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white" />
                <input value={newTutSubjs}    onChange={(e) => setNewTutSubjs(e.target.value)}    placeholder="Subjects (comma-separated)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white" />
              </div>
              <p className="text-xs text-gray-400 mb-3">Share the email + temporary password with the tutor so they can log in.</p>
              {tutFormSuccess && <p className="text-xs text-green-600 font-medium mb-2">✓ {tutFormSuccess}</p>}
              {tutFormError   && <p className="text-xs text-red-500 mb-2">{tutFormError}</p>}
              <div className="flex gap-3">
                <button onClick={submitNewTutor} disabled={tutFormLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {tutFormLoading ? "Creating…" : "Create Account"}
                </button>
                <button onClick={() => { setShowTutorForm(false); setTutFormError(""); setTutFormSuccess(""); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Subjects</th>
                  <th className="px-4 py-3 text-left">Students</th>
                  <th className="px-4 py-3 text-left"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleTutors.map((t) => (
                  <tr key={t.id} className={t.archived ? "opacity-50 bg-gray-50" : ""}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => openTutorProfile(t)}>{t.name}</span>
                        {t.archived && <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium">Archived</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{t.email}</td>
                    <td className="px-4 py-3 text-gray-600">{t.subjects.join(", ")}</td>
                    <td className="px-4 py-3 text-gray-600">{t.assignedStudentIds.length}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {!t.archived && (
                          <button onClick={() => openTutorSchedule(t)} className="text-blue-600 text-xs font-medium hover:underline">
                            View Schedule
                          </button>
                        )}
                        {t.archived ? (
                          <>
                            <button onClick={() => handleRestoreTutor(t.id)} disabled={archivingId === t.id}
                              className="text-xs text-green-600 hover:underline font-medium disabled:opacity-40">
                              {archivingId === t.id ? "…" : "Restore"}
                            </button>
                            <button onClick={() => { setDeleteTarget({ id: t.id, name: t.name, type: "tutor" }); setDeletePassword(""); setDeleteError(""); setShowDeletePw(false); }}
                              className="text-xs text-red-500 hover:underline font-medium">
                              Delete
                            </button>
                          </>
                        ) : (
                          <button onClick={() => handleArchiveTutor(t.id)} disabled={archivingId === t.id}
                            className="text-xs text-gray-400 hover:text-red-500 font-medium disabled:opacity-40 transition-colors">
                            {archivingId === t.id ? "…" : "Archive"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {visibleTutors.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                    {showArchivedTutors ? "No archived tutors." : "No active tutors."}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        );
      })()}

      {/* ── TUTOR SCHEDULE MODAL ── */}
      {schedTutor && (
        <Modal
          onClose={() => setSchedTutor(null)}
          title={`${schedTutor.name}'s Schedule`}
          subtitle={schedTutor.subjects.join(", ")}
          size="xl"
        >
          {schedLoading ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Loading…</div>
          ) : (
            <div className="space-y-6">

              {/* ── Upcoming booked sessions ── */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Upcoming Sessions ({schedSessions.filter((s) => s.status === "upcoming").length})
                </h4>
                {schedSessions.filter((s) => s.status === "upcoming").length === 0 ? (
                  <p className="text-sm text-gray-400">No upcoming sessions.</p>
                ) : (
                  <div className="space-y-2">
                    {schedSessions
                      .filter((s) => s.status === "upcoming")
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((s) => {
                        const st = students.find((x) => x.id === s.studentId);
                        return (
                          <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
                            <div>
                              <span className="text-sm font-medium text-gray-900">{st?.name ?? "—"}</span>
                              <span className="text-sm text-gray-400 ml-1.5">· {s.subject} · {s.durationHours}h</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              {s.zoomLink && (
                                <a href={s.zoomLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">Zoom</a>
                              )}
                              <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(s.date)} · {s.time}</span>
                              <Badge status={s.sessionType} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* ── Weekly availability pattern ── */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Weekly Availability
                </h4>
                {schedAvail.length === 0 ? (
                  <p className="text-sm text-gray-400">No availability set.</p>
                ) : (
                  <AvailabilityGrid slots={schedAvail} />
                )}
              </div>

            </div>
          )}
        </Modal>
      )}

      {/* ── SESSIONS ── */}
      {tab === "sessions" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowBulkForm((v) => !v); setBulkError(""); setShowSessionForm(false); }}
                className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg text-sm hover:bg-emerald-700"
              >
                Bulk Schedule
              </button>
              <button
                onClick={() => { setShowSessionForm((v) => !v); setSessError(""); setShowBulkForm(false); }}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700"
              >
                + Single Session
              </button>
            </div>
          </div>

          {(sessSuccess || bulkSuccess) && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm mb-4">
              {bulkSuccess ? `${getBulkDates().length || "All"} sessions scheduled!` : "Session created!"}
            </div>
          )}

          {showBulkForm && (() => {
            const previewDates = getBulkDates();
            return (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6">
                <h3 className="font-semibold text-gray-900 mb-1">Bulk Schedule — Weekly Recurring</h3>
                <p className="text-xs text-gray-500 mb-4">Creates one session per week starting from the selected date.</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Student</label>
                      <select value={bulkStudentId} onChange={(e) => setBulkStudentId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                        <option value="">Select student…</option>
                        {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Tutor</label>
                      <select value={bulkTutorId} onChange={(e) => setBulkTutorId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                        <option value="">Select tutor…</option>
                        {tutors.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <input value={bulkSubject} onChange={(e) => setBulkSubject(e.target.value)} placeholder="Subject (e.g. Algebra)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="col-span-1">
                      <label className="block text-xs text-gray-500 mb-1">Start date</label>
                      <input type="date" value={bulkStartDate} onChange={(e) => setBulkStartDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Time</label>
                      <input type="time" value={bulkTime} onChange={(e) => setBulkTime(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Duration</label>
                      <select value={bulkDuration} onChange={(e) => setBulkDuration(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                        <option value="1">1 hr</option>
                        <option value="1.5">1.5 hrs</option>
                        <option value="2">2 hrs</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1"># of sessions</label>
                      <input type="number" min="1" max="52" value={bulkCount} onChange={(e) => setBulkCount(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm w-fit">
                    {(["online", "in-person"] as const).map((type, i) => (
                      <button key={type} type="button" onClick={() => setBulkType(type)}
                        className={`px-4 py-2 font-medium transition-colors ${i > 0 ? "border-l border-gray-200" : ""} ${bulkType === type ? "bg-emerald-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                        {type === "online" ? "Online" : "In-Person"}
                      </button>
                    ))}
                  </div>
                  <input value={bulkZoom} onChange={(e) => setBulkZoom(e.target.value)} placeholder="Zoom link (optional — same for all sessions)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />

                  {/* Preview */}
                  {previewDates.length > 0 && (
                    <div className="bg-white border border-emerald-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Preview — {previewDates.length} sessions, every week starting {previewDates[0]}:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {previewDates.map((d) => (
                          <span key={d} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">{d}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {bulkError && <p className="text-xs text-red-500">{bulkError}</p>}
                  <div className="flex gap-3">
                    <button onClick={submitBulkSchedule} disabled={bulkSaving || !bulkStartDate || !bulkTime || !bulkSubject || !bulkStudentId || !bulkTutorId}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-40">
                      {bulkSaving ? `Scheduling ${previewDates.length} sessions…` : `Schedule ${previewDates.length || "All"} Sessions`}
                    </button>
                    <button onClick={() => setShowBulkForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
                  </div>
                </div>
              </div>
            );
          })()}

          {showSessionForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Create Session</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select value={sessStudentId} onChange={(e) => setSessStudentId(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select value={sessTutorId}   onChange={(e) => setSessTutorId(e.target.value)}   className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    {tutors.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <input value={sessSubject} onChange={(e) => setSessSubject(e.target.value)} placeholder="Subject" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={sessDate} onChange={(e) => setSessDate(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  <input type="time" value={sessTime} onChange={(e) => setSessTime(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select value={sessDuration} onChange={(e) => setSessDuration(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <option value="1">1 hour</option>
                    <option value="1.5">1.5 hours</option>
                    <option value="2">2 hours</option>
                  </select>
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                    {(["online", "in-person"] as const).map((type, i) => (
                      <button key={type} type="button" onClick={() => setSessType(type)}
                        className={`flex-1 px-3 py-2 font-medium transition-colors ${i > 0 ? "border-l border-gray-200" : ""} ${sessType === type ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                      >{type === "online" ? "Online" : "In-Person"}</button>
                    ))}
                  </div>
                </div>
                <input value={sessZoom} onChange={(e) => setSessZoom(e.target.value)} placeholder="Zoom link (optional)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                {sessError && <p className="text-xs text-red-500">{sessError}</p>}
                <div className="flex gap-3">
                  <button onClick={submitSession} disabled={!sessDate || !sessTime || !sessSubject} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">Create</button>
                  <button onClick={() => setShowSessionForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Tutor</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Subject</th>
                  <th className="px-4 py-3 text-left">Dur</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Zoom</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map((s) => (
                  <React.Fragment key={s.id}>
                    <tr className={s.status === "cancelled" ? "opacity-50" : ""}>
                      <td className="px-4 py-3 font-medium text-gray-900">{getStudent(s.studentId)?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{getTutor(s.tutorId)?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(s.date)} {s.time}</td>
                      <td className="px-4 py-3 text-gray-600">{s.subject}</td>
                      <td className="px-4 py-3 text-gray-600">{s.durationHours}h</td>
                      <td className="px-4 py-3"><Badge status={s.sessionType} /></td>
                      <td className="px-4 py-3">
                        {zoomEditId === s.id ? (
                          <div className="flex gap-1">
                            <input value={zoomEditVal} onChange={(e) => setZoomEditVal(e.target.value)} placeholder="https://zoom.us/j/..." className="rounded border border-gray-300 px-2 py-1 text-xs w-36" />
                            <button onClick={() => saveZoomLink(s.id)} disabled={zoomSaving} className="text-xs text-blue-600 hover:underline">Save</button>
                            <button onClick={() => setZoomEditId(null)} className="text-xs text-gray-400">✕</button>
                          </div>
                        ) : s.zoomLink ? (
                          <div className="flex items-center gap-1">
                            <a href={s.zoomLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs underline">Join</a>
                            <button onClick={() => { setZoomEditId(s.id); setZoomEditVal(s.zoomLink ?? ""); }} className="text-gray-400 text-xs hover:text-gray-600">✎</button>
                          </div>
                        ) : (
                          <button onClick={() => { setZoomEditId(s.id); setZoomEditVal(""); }} className="text-gray-400 text-xs hover:text-blue-600">+ Add</button>
                        )}
                      </td>
                      <td className="px-4 py-3"><Badge status={s.status} /></td>
                      <td className="px-4 py-3">
                        {s.status === "upcoming" && (
                          <button onClick={() => handleCancelSession(s)} disabled={cancellingId === s.id} className="text-xs text-red-500 hover:underline disabled:opacity-40">
                            {cancellingId === s.id ? "…" : "Cancel"}
                          </button>
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
                {sessions.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400 text-sm">No sessions yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PACKAGES ── */}
      {tab === "packages" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Packages & Hours</h1>
            <button
              onClick={() => setAddHoursFor(students[0]?.id ?? null)}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700"
            >
              + Add Hours
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Purchased</th>
                  <th className="px-4 py-3 text-left">Used</th>
                  <th className="px-4 py-3 text-left">Remaining</th>
                  <th className="px-4 py-3 text-left">Expires</th>
                  <th className="px-4 py-3 text-left">Progress</th>
                  <th className="px-4 py-3 text-left"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {packages.map((b) => {
                  const student = getStudent(b.studentId);
                  const pct = Math.min(100, (b.totalUsed / b.totalPurchased) * 100);
                  return (
                    <tr key={b.studentId}>
                      <td className="px-4 py-3 font-medium text-gray-900">{student?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{b.totalPurchased} hr</td>
                      <td className="px-4 py-3 text-gray-600">{b.totalUsed} hr</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${b.remaining <= 2 ? "text-red-500" : "text-blue-600"}`}>{b.remaining} hr</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{b.expiresAt}</td>
                      <td className="px-4 py-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setAddHoursFor(b.studentId); setAddHoursAmt("4"); setAddHoursExpiry(b.expiresAt); setAddHoursError(""); }} className="text-blue-600 text-xs font-medium hover:underline">+ Add Hours</button>
                      </td>
                    </tr>
                  );
                })}
                {/* Students without packages */}
                {students.filter((s) => !packages.find((b) => b.studentId === s.id)).map((s) => (
                  <tr key={s.id} className="opacity-60">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 text-gray-400" colSpan={5}>No package</td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setAddHoursFor(s.id); setAddHoursAmt("4"); setAddHoursExpiry(""); setAddHoursError(""); }} className="text-blue-600 text-xs font-medium hover:underline">+ Create Package</button>
                    </td>
                  </tr>
                ))}
                {packages.length === 0 && students.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">No packages yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ADD HOURS MODAL ── */}
      {addHoursFor && (
        <Modal
          onClose={() => setAddHoursFor(null)}
          title="Add Package Hours"
          subtitle={getStudent(addHoursFor)?.name}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hours to add</label>
              <select value={addHoursAmt} onChange={(e) => setAddHoursAmt(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
                <option value="1">1 hour</option>
                <option value="4">4 hours</option>
                <option value="8">8 hours</option>
                <option value="20">20 hours</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Expiry date</label>
              <input type="date" value={addHoursExpiry} onChange={(e) => setAddHoursExpiry(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            </div>
            {addHoursError && <p className="text-xs text-red-500">{addHoursError}</p>}
            <button onClick={submitAddHours} disabled={addHoursLoading} className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {addHoursLoading ? "Saving…" : "Confirm"}
            </button>
          </div>
        </Modal>
      )}

    </DashboardShell>

    {/* ── STUDENT PROFILE MODAL ── */}
    {profileStudent && (() => {
      const ps = profileStudent;
      const balance = packages.find((b) => b.studentId === ps.id);
      const assignedTutor = getTutor(ps.assignedTutorId ?? 0);
      return (
        <Modal onClose={() => { setProfileStudent(null); setEditingProfile(false); }} title={ps.name} subtitle={`${ps.grade} Grade`} size="xl">
          {!editingProfile ? (
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Hours Left</p>
                  <p className="text-xl font-bold text-blue-600">{balance?.remaining ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tutor</p>
                  <p className="text-sm font-medium text-gray-800">{assignedTutor?.name ?? <span className="text-gray-400">Unassigned</span>}</p>
                </div>
              </div>
              {ps.notes && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{ps.notes}</p>
                </div>
              )}
              <button onClick={() => setEditingProfile(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Edit Profile</button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input value={pfName}  onChange={(e) => setPfName(e.target.value)}  placeholder="Full name"        className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <input value={pfEmail} onChange={(e) => setPfEmail(e.target.value)} placeholder="Email" type="email" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <input value={pfGrade} onChange={(e) => setPfGrade(e.target.value)} placeholder="Grade (e.g. 10th)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <input value={pfPhone} onChange={(e) => setPfPhone(e.target.value)} placeholder="Student phone"    className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <input value={pfSubjects} onChange={(e) => setPfSubjects(e.target.value)} placeholder="Subjects (comma-separated)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm col-span-2" />
              </div>
              <p className="text-xs font-semibold text-gray-500 mt-2">Parent / Guardian</p>
              <div className="grid grid-cols-2 gap-3">
                <input value={pfParentName}  onChange={(e) => setPfParentName(e.target.value)}  placeholder="Parent name"  className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <input value={pfParentPhone} onChange={(e) => setPfParentPhone(e.target.value)} placeholder="Parent phone" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <input value={pfParentEmail} onChange={(e) => setPfParentEmail(e.target.value)} placeholder="Parent email" type="email" className="rounded-lg border border-gray-300 px-3 py-2 text-sm col-span-2" />
              </div>
              <textarea value={pfNotes} onChange={(e) => setPfNotes(e.target.value)} placeholder="Internal notes about this student…" rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none" />
              <div className="flex gap-3">
                <button onClick={saveStudentProfile} disabled={profileSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {profileSaving ? "Saving…" : "Save"}
                </button>
                <button onClick={() => setEditingProfile(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
              </div>
            </div>
          )}
        </Modal>
      );
    })()}

    {/* ── DELETE CONFIRMATION MODAL ── */}
    {deleteTarget && (
      <Modal
        onClose={() => { setDeleteTarget(null); setDeletePassword(""); setDeleteError(""); }}
        title="Permanently Delete"
        subtitle={deleteTarget.name}
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            <strong>This cannot be undone.</strong> The {deleteTarget.type} account and all associated data will be permanently removed.
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Enter your admin password to confirm</label>
            <div className="relative">
              <input
                type={showDeletePw ? "text" : "password"}
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Admin password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-14 text-sm"
                onKeyDown={(e) => { if (e.key === "Enter") submitDelete(); }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowDeletePw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-medium"
              >
                {showDeletePw ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {deleteError && <p className="text-xs text-red-500">{deleteError}</p>}
          <div className="flex gap-3">
            <button
              onClick={submitDelete}
              disabled={deleteLoading || !deletePassword}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              {deleteLoading ? "Deleting…" : "Permanently Delete"}
            </button>
            <button
              onClick={() => { setDeleteTarget(null); setDeletePassword(""); setDeleteError(""); }}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    )}

    {/* ── TUTOR PROFILE MODAL ── */}
    {profileTutor && (() => {
      const pt = profileTutor;
      const assignedStudents = students.filter((s) => pt.assignedStudentIds.includes(s.id));
      return (
        <Modal onClose={() => { setProfileTutor(null); setEditingProfile(false); }} title={pt.name} subtitle="Tutor" size="xl">
          {!editingProfile ? (
            <div className="space-y-4">
              {/* Photo + contact side by side */}
              <div className="flex items-start gap-4">
                {pt.photoUrl ? (
                  <img src={pt.photoUrl} alt={pt.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold shrink-0 select-none">
                    {pt.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contact</p>
                      <ProfileRow label="Email" value={pt.email} />
                      <ProfileRow label="Phone" value={pt.phone} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Subjects</p>
                      <div className="flex flex-wrap gap-1">
                        {pt.subjects.map((sub) => <span key={sub} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{sub}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {pt.bio && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Bio</p>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{pt.bio}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Students ({assignedStudents.length})</p>
                <div className="flex flex-wrap gap-2">
                  {assignedStudents.map((s) => <span key={s.id} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">{s.name}</span>)}
                  {assignedStudents.length === 0 && <span className="text-xs text-gray-400">None assigned</span>}
                </div>
              </div>
              <button onClick={() => setEditingProfile(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Edit Profile</button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input value={pfTutName}  onChange={(e) => setPfTutName(e.target.value)}  placeholder="Full name"   className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <input value={pfTutEmail} onChange={(e) => setPfTutEmail(e.target.value)} placeholder="Email" type="email" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <input value={pfTutPhone} onChange={(e) => setPfTutPhone(e.target.value)} placeholder="Phone"       className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <input value={pfTutSubjects} onChange={(e) => setPfTutSubjects(e.target.value)} placeholder="Subjects (comma-separated)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <textarea value={pfTutBio} onChange={(e) => setPfTutBio(e.target.value)} placeholder="Tutor bio / background…" rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none" />
              <div>
                <label className="block text-xs text-gray-500 mb-1">Photo URL (paste a link to a headshot image)</label>
                <input value={pfTutPhoto} onChange={(e) => setPfTutPhoto(e.target.value)} placeholder="https://example.com/photo.jpg" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                {pfTutPhoto && (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={pfTutPhoto} alt="Preview" className="w-12 h-12 rounded-full object-cover border border-gray-200" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <span className="text-xs text-gray-400">Preview</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={saveTutorProfile} disabled={profileSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {profileSaving ? "Saving…" : "Save"}
                </button>
                <button onClick={() => setEditingProfile(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
              </div>
            </div>
          )}
        </Modal>
      );
    })()}
    </>
  );
}

function ProfileRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm mb-1">
      <span className="text-gray-400 w-24 shrink-0">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}
