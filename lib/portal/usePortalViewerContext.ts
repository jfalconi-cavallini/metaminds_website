"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetchStudents } from "@/lib/portal/db";
import type { AuthUser } from "@/lib/auth";

export interface PortalViewerContext {
  viewerRole:          "student" | "parent" | "admin" | "tutor";
  effectiveStudentId:  number | null;
  isAdminPreview:      boolean;
  isTutorPreview:      boolean;
  previewViewAs:       "student" | "parent";
  previewStudentName:  string | null;
  previewId:           number | null;
  // A parent's linked children (empty for every other role). When there's
  // more than one, the portal shows a switcher; activeStudentId is which
  // one is currently being viewed, persisted per-parent in localStorage.
  parentStudents:      { id: number; name: string }[];
  activeStudentId:     number | null;
  switchStudent:       (id: number) => void;
  // true once the auth/preview check has resolved and data loading can begin
  previewReady:        boolean;
  // Granular capability flags — all false during any preview
  // Parents may gain some of these later; do not collapse into a single readOnly flag
  canSubmitHomework:   boolean;
  canManageSchedule:   boolean;
  canPurchaseHours:    boolean;
  canReply:            boolean;
  canEditAccount:      boolean;
  exitPreview:         () => Promise<void>;
}

/**
 * Resolves who is viewing the student portal and what they may do.
 *
 * Three valid cases:
 *   student → uses their own linkedId, full capabilities
 *   parent  → uses their linked student's id; caps expand independently later
 *   admin   → requires ?preview=<token>; server-validated, read-only
 *
 * All routing for invalid states (unauthenticated, wrong role, bad token)
 * is handled here so the student portal page does not need to know about it.
 */
export function usePortalViewerContext(
  user: AuthUser | null,
  authLoaded: boolean,
): PortalViewerContext {
  const router = useRouter();

  const [previewStudentId,   setPreviewStudentId]   = useState<number | null>(null);
  const [previewStudentName, setPreviewStudentName] = useState<string | null>(null);
  const [previewId,          setPreviewId]          = useState<number | null>(null);
  const [previewViewAs,      setPreviewViewAs]      = useState<"student" | "parent">("student");
  const [previewReady,       setPreviewReady]       = useState(false);
  const [previewerRole,      setPreviewerRole]      = useState<"admin" | "tutor" | null>(null);
  const [parentStudents,     setParentStudents]     = useState<{ id: number; name: string }[]>([]);
  const [activeStudentId,    setActiveStudentIdState] = useState<number | null>(null);

  // Ref prevents the effect from starting a second validation or redirecting
  // when onAuthStateChange re-fires the effect with a new `user` object reference
  // after validation has already started or completed. Guards both the
  // admin/tutor preview-token flow and the parent multi-child load below.
  const validationState = useRef<"idle" | "validating" | "done">("idle");

  useEffect(() => {
    if (!authLoaded) return;

    if (!user) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) router.push("/login");
      });
      return;
    }

    if (user.role === "admin" || user.role === "tutor") {
      // If validation already started or completed, do not re-enter the flow.
      if (validationState.current !== "idle") return;

      const params     = new URLSearchParams(window.location.search);
      const adminToken = user.role === "admin" ? params.get("preview")       : null;
      const tutorToken = user.role === "tutor" ? params.get("tutorPreview")  : null;
      const token      = adminToken ?? tutorToken;

      if (!token) {
        router.push(user.role === "admin" ? "/portal/admin" : "/portal/tutor");
        return;
      }

      validationState.current = "validating";

      // Remove token from URL now (before async work) so back-navigation is clean.
      window.history.replaceState({}, "", "/portal/student");

      const validateUrl = user.role === "admin"
        ? `/api/admin/validate-preview?token=${encodeURIComponent(token)}`
        : `/api/tutor/validate-preview?token=${encodeURIComponent(token)}`;

      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();

          const res = await fetch(validateUrl, {
            headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
          });

          if (!res.ok) {
            validationState.current = "idle";
            router.push(user.role === "admin" ? "/portal/admin" : "/portal/tutor");
            return;
          }

          const data = await res.json() as {
            studentId: number;
            studentName: string;
            previewId: number;
            viewAs?: "student" | "parent";
          };

          setPreviewStudentId(data.studentId);
          setPreviewStudentName(data.studentName);
          setPreviewId(data.previewId);
          setPreviewViewAs(data.viewAs ?? "student");
          setPreviewerRole(user.role as "admin" | "tutor");
          validationState.current = "done";
          setPreviewReady(true);
        } catch {
          validationState.current = "idle";
          router.push(user.role === "admin" ? "/portal/admin" : "/portal/tutor");
        }
      })();
      return;
    }

    if (user.role === "student") {
      if (!user.linkedId) {
        router.push("/login");
        return;
      }
      setPreviewReady(true);
      return;
    }

    if (user.role === "parent") {
      if (validationState.current !== "idle") return;
      validationState.current = "validating";

      (async () => {
        try {
          const students = await fetchStudents();
          if (students.length === 0) {
            validationState.current = "idle";
            router.push("/login");
            return;
          }

          setParentStudents(students.map((s) => ({ id: s.id, name: s.name })));

          const storageKey = `mm_active_child_${user.id}`;
          let chosen: number | null = null;
          try {
            const stored = window.localStorage.getItem(storageKey);
            if (stored && students.some((s) => s.id === Number(stored))) chosen = Number(stored);
          } catch { /* localStorage unavailable — fall through to defaults */ }
          if (chosen === null && user.linkedId && students.some((s) => s.id === user.linkedId)) {
            chosen = user.linkedId;
          }
          if (chosen === null) chosen = students[0].id;

          setActiveStudentIdState(chosen);
          validationState.current = "done";
          setPreviewReady(true);
        } catch {
          validationState.current = "idle";
          router.push("/login");
        }
      })();
      return;
    }

    // Unreachable given AuthUser's role union, but keeps every path covered.
    router.push("/login");
  }, [authLoaded, user, router]);

  const isAdminPreview     = user?.role === "admin"  && previewStudentId !== null;
  const isTutorPreview     = user?.role === "tutor"  && previewStudentId !== null;
  const isAnyPreview       = isAdminPreview || isTutorPreview;
  const isParent           = user?.role === "parent";
  const effectiveStudentId = isAnyPreview ? previewStudentId : (isParent ? activeStudentId : (user?.linkedId ?? null));

  function switchStudent(id: number) {
    setActiveStudentIdState(id);
    if (user) {
      try { window.localStorage.setItem(`mm_active_child_${user.id}`, String(id)); } catch { /* ignore */ }
    }
  }

  async function exitPreview() {
    if (previewId !== null) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const endUrl = previewerRole === "tutor" ? "/api/tutor/end-preview" : "/api/admin/end-preview";
        await fetch(endUrl, {
          method:  "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? ""}`,
          },
          body: JSON.stringify({ previewId }),
        });
      } catch {
        // Best-effort — the session expires naturally after 90 minutes
      }
    }
    validationState.current = "idle";
    router.push(previewerRole === "tutor" ? "/portal/tutor" : "/portal/admin");
  }

  return {
    viewerRole:          (user?.role ?? "student") as PortalViewerContext["viewerRole"],
    effectiveStudentId,
    isAdminPreview,
    isTutorPreview,
    previewViewAs,
    previewStudentName,
    previewId,
    parentStudents,
    activeStudentId,
    switchStudent,
    previewReady,
    canSubmitHomework:   !isAnyPreview && !isParent,
    canManageSchedule:   !isAnyPreview && !isParent,
    canPurchaseHours:    !isAnyPreview && !isParent,
    canReply:            !isAnyPreview,
    canEditAccount:      !isAnyPreview && !isParent,
    exitPreview,
  };
}
