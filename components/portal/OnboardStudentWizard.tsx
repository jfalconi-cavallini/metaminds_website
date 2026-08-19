"use client";

import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { supabase } from "@/lib/supabase";
import { fetchCourses } from "@/lib/portal/db";
import type { Tutor, Course } from "@/lib/portal/types";
import { DISPLAY_GROUP_ORDER, displayGroupFor } from "@/lib/portal/utils";

const GRADES = [
  "Kindergarten", "1st", "2nd", "3rd", "4th", "5th",
  "6th", "7th", "8th", "9th", "10th", "11th", "12th",
  "College Freshman", "College Sophomore", "College Junior", "College Senior",
];

interface OnboardResult {
  studentId: number;
  studentName: string;
  studentEmail: string;
  studentTempPassword: string;
  parentTempPassword: string | null;
  results: {
    studentCreated:     boolean;
    studentAuthCreated: boolean;
    parentAuthCreated:  boolean;
    packageAssigned:    boolean;
    tutorAssigned:      boolean;
    coursesEnrolled:    boolean;
    studentEmailSent:   boolean;
    parentEmailSent:    boolean;
    errors:             string[];
  };
}

interface Props {
  tutors: Tutor[];
  onSuccess: () => void;
  onClose: () => void;
}

export default function OnboardStudentWizard({ tutors, onSuccess, onClose }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | "success">(1);

  // ── Step 1 fields ────────────────────────────────────────────────
  const [firstName,      setFirstName]      = useState("");
  const [lastName,       setLastName]       = useState("");
  const [email,          setEmail]          = useState("");
  const [phone,          setPhone]          = useState("");
  const [grade,          setGrade]          = useState("");
  const [school,         setSchool]         = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [parentName,     setParentName]     = useState("");
  const [parentEmail,    setParentEmail]    = useState("");
  const [parentPhone,    setParentPhone]    = useState("");
  const [step1Error,     setStep1Error]     = useState("");

  // ── Step 2 fields ────────────────────────────────────────────────
  const [packageHours,  setPackageHours]  = useState("4");
  const [packageExpiry, setPackageExpiry] = useState("");
  const [tutorId,       setTutorId]       = useState("");
  const [courses,       setCourses]       = useState<Course[]>([]);
  const [courseIds,     setCourseIds]     = useState<number[]>([]);
  const [status,        setStatus]        = useState<"active" | "inactive" | "paused">("active");
  const [step2Error,    setStep2Error]    = useState("");

  useEffect(() => {
    fetchCourses({ all: true }).then(setCourses).catch(console.error);
  }, []);

  // ── Submission ───────────────────────────────────────────────────
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState("");
  const [result,       setResult]       = useState<OnboardResult | null>(null);

  // ── Clipboard ────────────────────────────────────────────────────
  const [copiedStudent, setCopiedStudent] = useState(false);
  const [copiedParent,  setCopiedParent]  = useState(false);

  // ── Validation ───────────────────────────────────────────────────
  function validateStep1(): boolean {
    if (!firstName.trim()) { setStep1Error("First name is required."); return false; }
    if (!lastName.trim())  { setStep1Error("Last name is required."); return false; }
    if (!email.trim() || !email.includes("@")) { setStep1Error("Valid student email is required."); return false; }
    if (!grade)            { setStep1Error("Grade is required."); return false; }
    if (!parentName.trim()) { setStep1Error("Parent name is required."); return false; }
    if (!parentEmail.trim() || !parentEmail.includes("@")) { setStep1Error("Valid parent email is required."); return false; }
    setStep1Error("");
    return true;
  }

  function validateStep2(): boolean {
    if (!packageExpiry) { setStep2Error("Package expiry date is required."); return false; }
    setStep2Error("");
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expired — please refresh and sign in again.");

      const res = await fetch("/api/admin/onboard-student", {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          firstName:      firstName.trim(),
          lastName:       lastName.trim(),
          email:          email.trim(),
          phone:          phone.trim()         || undefined,
          grade,
          school:         school.trim()        || undefined,
          graduationYear: graduationYear.trim() || undefined,
          parentName:     parentName.trim(),
          parentEmail:    parentEmail.trim(),
          parentPhone:    parentPhone.trim()   || undefined,
          packageHours:   Number(packageHours),
          packageExpiry,
          tutorId:        tutorId ? Number(tutorId) : undefined,
          courseIds,
          status,
        }),
      });

      const data = await res.json() as OnboardResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Onboarding failed");

      setResult(data);
      setStep("success");
      onSuccess();
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Onboarding failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function copyCredentials(text: string, which: "student" | "parent") {
    navigator.clipboard.writeText(text).catch(() => undefined);
    if (which === "student") {
      setCopiedStudent(true);
      setTimeout(() => setCopiedStudent(false), 2000);
    } else {
      setCopiedParent(true);
      setTimeout(() => setCopiedParent(false), 2000);
    }
  }

  const stepNum = step === "success" ? 3 : (step as number);
  const stepLabels = ["Student & Parent Info", "Package & Program", "Review"];

  // ── Render ───────────────────────────────────────────────────────
  return (
    <Modal
      onClose={onClose}
      title={step === "success" ? "Onboarding Complete" : "Create Student Account"}
      subtitle={step === "success" ? undefined : `Step ${stepNum} of 3 — ${stepLabels[stepNum - 1]}`}
      size="xl"
    >
      {/* Step indicator */}
      {step !== "success" && (
        <div className="flex items-center gap-1 mb-6">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 transition-colors ${
                stepNum === s ? "bg-blue-600 text-white" :
                stepNum > s   ? "bg-emerald-500 text-white" :
                                "bg-gray-100 text-gray-400"
              }`}>
                {stepNum > s ? "✓" : s}
              </div>
              {s < 3 && (
                <div className={`flex-1 h-0.5 ${stepNum > s ? "bg-emerald-400" : "bg-gray-200"}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ── STEP 1: Student & Parent Info ── */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Student info */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Student Information</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">First Name *</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Romir"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Last Name *</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Sharma"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Email *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@email.com"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 000-0000"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Grade *</label>
                <select value={grade} onChange={(e) => setGrade(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select grade…</option>
                  {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">School <span className="text-gray-400 font-normal">(optional)</span></label>
                <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="School name"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Graduation Year <span className="text-gray-400 font-normal">(optional)</span></label>
                <input value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} placeholder="2027"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Parent info */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Parent / Guardian</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Parent Name *</label>
                <input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Priya Sharma"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Parent Email *</label>
                <input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder="parent@email.com"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Parent Phone <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="tel" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder="(555) 000-0000"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {step1Error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{step1Error}</p>
          )}

          <div className="flex justify-between pt-1">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            <button
              onClick={() => { if (validateStep1()) setStep(2); }}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Package & Program ── */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Package */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Package</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Hours</label>
                <select value={packageHours} onChange={(e) => setPackageHours(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="1">1 Hour</option>
                  <option value="4">4 Hours</option>
                  <option value="8">8 Hours</option>
                  <option value="20">20 Hours</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Expiry Date *</label>
                <input type="date" value={packageExpiry} onChange={(e) => setPackageExpiry(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Course Offerings */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Courses</p>
            <p className="text-xs text-gray-400 mb-3">Select all that apply — more can be added later. A course&apos;s curriculum doesn&apos;t need to be built yet to enroll a student in it.</p>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {DISPLAY_GROUP_ORDER.filter((group) => courses.some((c) => displayGroupFor(c.subject) === group)).map((group) => (
                <div key={group}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{group}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {courses.filter((c) => displayGroupFor(c.subject) === group).map((c) => {
                      const selected = courseIds.includes(c.id);
                      return (
                        <button key={c.id} type="button"
                          onClick={() => setCourseIds((prev) => selected ? prev.filter((x) => x !== c.id) : [...prev, c.id])}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                            selected
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                          }`}
                        >
                          {c.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {courseIds.length > 0 && (
              <p className="text-xs text-blue-600 mt-2 font-medium">{courseIds.length} course{courseIds.length !== 1 ? "s" : ""} selected</p>
            )}
          </div>

          {/* Tutor */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Assigned Tutor</p>
            <select value={tutorId} onChange={(e) => setTutorId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">No tutor assigned yet</option>
              {tutors.filter((t) => !t.archived).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.subjects.length ? ` — ${t.subjects.join(", ")}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Status</p>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm w-fit">
              {(["active", "inactive", "paused"] as const).map((s, i) => (
                <button key={s} type="button" onClick={() => setStatus(s)}
                  className={`px-5 py-2 font-medium capitalize transition-colors ${i > 0 ? "border-l border-gray-200" : ""} ${
                    status === s
                      ? s === "active"   ? "bg-emerald-600 text-white"
                      : s === "paused"   ? "bg-amber-500 text-white"
                      :                    "bg-gray-500 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {step2Error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{step2Error}</p>
          )}

          <div className="flex justify-between pt-1">
            <button onClick={() => setStep(1)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              ← Back
            </button>
            <button
              onClick={() => { if (validateStep2()) setStep(3); }}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
            >
              Review & Create →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Review ── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Student</p>
              <p className="text-sm font-semibold text-gray-900">{firstName} {lastName}</p>
              <p className="text-xs text-gray-500 mt-0.5">{email}</p>
              <p className="text-xs text-gray-400 mt-0.5">{grade}{school ? ` · ${school}` : ""}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Parent</p>
              <p className="text-sm font-semibold text-gray-900">{parentName}</p>
              <p className="text-xs text-gray-500 mt-0.5">{parentEmail}</p>
              {parentEmail.toLowerCase() === email.toLowerCase() && (
                <p className="text-xs text-amber-600 mt-0.5">Same email as student</p>
              )}
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Package</p>
              <p className="text-sm font-semibold text-gray-900">{packageHours} Hour{Number(packageHours) !== 1 ? "s" : ""}</p>
              <p className="text-xs text-gray-400 mt-0.5">Expires {packageExpiry}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Courses & Tutor</p>
              <p className="text-sm font-semibold text-gray-900">
                {courseIds.length > 0 ? courses.filter((c) => courseIds.includes(c.id)).map((c) => c.title).join(", ") : "None selected"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {tutorId ? tutors.find((t) => t.id === Number(tutorId))?.name ?? "—" : "Tutor TBD"}
              </p>
              <span className={`inline-block mt-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                status === "active"   ? "bg-emerald-100 text-emerald-700" :
                status === "paused"   ? "bg-amber-100 text-amber-700" :
                                        "bg-gray-100 text-gray-500"
              }`}>{status}</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 leading-relaxed">
            Two accounts will be created (student + parent). Both will receive welcome emails with temporary credentials and be required to set a new password on first login.
          </div>

          {submitError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{submitError}</p>
          )}

          <div className="flex justify-between pt-1">
            <button onClick={() => setStep(2)} disabled={submitting}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
              ← Back
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {submitting && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {submitting ? "Creating Account…" : "Create Student Account"}
            </button>
          </div>
        </div>
      )}

      {/* ── SUCCESS ── */}
      {step === "success" && result && (
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center pt-1 pb-2">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
              ✓
            </div>
            <h3 className="text-lg font-bold text-gray-900">{result.studentName} is ready!</h3>
            <p className="text-sm text-gray-500 mt-0.5">Review the status below and share credentials with the family.</p>
          </div>

          {/* Checklist */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100 text-sm">
            {[
              { label: "Student Created",             ok: result.results.studentCreated,     warn: false },
              { label: "Portal Login Created",        ok: result.results.studentAuthCreated, warn: !result.results.studentAuthCreated },
              { label: "Parent Account Created",      ok: result.results.parentAuthCreated,  warn: !result.results.parentAuthCreated },
              { label: "Package Assigned",            ok: result.results.packageAssigned,    warn: !result.results.packageAssigned },
              { label: "Tutor Assigned",              ok: result.results.tutorAssigned,      warn: !result.results.tutorAssigned && !tutorId },
              { label: "Courses Enrolled",            ok: result.results.coursesEnrolled,    warn: !result.results.coursesEnrolled },
              { label: "Student Welcome Email Sent",  ok: result.results.studentEmailSent,   warn: !result.results.studentEmailSent },
              { label: "Parent Welcome Email Sent",   ok: result.results.parentEmailSent,    warn: !result.results.parentEmailSent },
              { label: "Password Reset on First Login", ok: result.results.studentAuthCreated, warn: false },
            ].map(({ label, ok, warn }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-2.5">
                <span className={`font-bold text-sm w-4 shrink-0 ${ok ? "text-emerald-500" : warn ? "text-amber-500" : "text-gray-300"}`}>
                  {ok ? "✓" : warn ? "!" : "—"}
                </span>
                <span className={ok ? "text-gray-800" : warn ? "text-amber-700" : "text-gray-400"}>{label}</span>
              </div>
            ))}
          </div>

          {/* Credentials */}
          <div className="space-y-2">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Student Login</p>
              <p className="text-sm text-blue-900"><strong>Email:</strong> {result.studentEmail}</p>
              <p className="text-sm text-blue-900 mt-0.5">
                <strong>Temp Password:</strong>{" "}
                <code className="font-mono bg-white px-1.5 py-0.5 rounded text-blue-700 border border-blue-100">
                  {result.studentTempPassword}
                </code>
              </p>
              <button
                onClick={() => copyCredentials(`Email: ${result.studentEmail}\nPassword: ${result.studentTempPassword}`, "student")}
                className="mt-2 text-xs text-blue-600 hover:underline font-medium"
              >
                {copiedStudent ? "Copied!" : "Copy credentials"}
              </button>
            </div>

            {result.parentTempPassword && result.results.parentAuthCreated && (
              <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-2">Parent Login</p>
                <p className="text-sm text-violet-900"><strong>Email:</strong> {parentEmail}</p>
                <p className="text-sm text-violet-900 mt-0.5">
                  <strong>Temp Password:</strong>{" "}
                  <code className="font-mono bg-white px-1.5 py-0.5 rounded text-violet-700 border border-violet-100">
                    {result.parentTempPassword}
                  </code>
                </p>
                <button
                  onClick={() => copyCredentials(`Email: ${parentEmail}\nPassword: ${result.parentTempPassword!}`, "parent")}
                  className="mt-2 text-xs text-violet-600 hover:underline font-medium"
                >
                  {copiedParent ? "Copied!" : "Copy credentials"}
                </button>
              </div>
            )}
          </div>

          {/* Warnings */}
          {result.results.errors.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-amber-700 mb-1">Some steps completed with warnings:</p>
              {result.results.errors.map((err, i) => (
                <p key={i} className="text-xs text-amber-600">· {err}</p>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button onClick={onClose}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
              Done
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
