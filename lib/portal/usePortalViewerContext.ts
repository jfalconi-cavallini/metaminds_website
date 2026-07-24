"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { AuthUser } from "@/lib/auth";

export interface PortalViewerContext {
  viewerRole:          "student" | "parent" | "admin";
  effectiveStudentId:  number | null;
  isAdminPreview:      boolean;
  previewViewAs:       "student" | "parent";
  previewStudentName:  string | null;
  previewId:           number | null;
  // true once the auth/preview check has resolved and data loading can begin
  previewReady:        boolean;
  // Granular capability flags — all false during admin preview
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

  useEffect(() => {
    if (!authLoaded) return;

    // Not authenticated yet — wait for session or redirect to login
    if (!user) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) router.push("/login");
      });
      return;
    }

    if (user.role === "admin") {
      const params = new URLSearchParams(window.location.search);
      const token  = params.get("preview");
      if (!token) {
        // Admin visited /portal/student without a preview token — redirect home
        router.push("/portal/admin");
        return;
      }
      // Validate the token server-side; student ID comes from DB, never from URL
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch(
            `/api/admin/validate-preview?token=${encodeURIComponent(token)}`,
            { headers: { Authorization: `Bearer ${session?.access_token ?? ""}` } },
          );
          if (!res.ok) { router.push("/portal/admin"); return; }
          const data = await res.json() as {
            studentId: number;
            studentName: string;
            previewId: number;
            viewAs: "student" | "parent";
          };
          setPreviewStudentId(data.studentId);
          setPreviewStudentName(data.studentName);
          setPreviewId(data.previewId);
          setPreviewViewAs(data.viewAs ?? "student");
          // Remove the token from the URL — keeps it out of browser history going forward
          window.history.replaceState({}, "", "/portal/student");
          setPreviewReady(true);
        } catch {
          router.push("/portal/admin");
        }
      })();
      return;
    }

    // Reject any other non-student/parent roles
    if ((user.role !== "student" && user.role !== "parent") || !user.linkedId) {
      router.push("/login");
      return;
    }

    setPreviewReady(true);
  }, [authLoaded, user, router]);

  const isAdminPreview    = user?.role === "admin" && previewStudentId !== null;
  const isParent          = user?.role === "parent";
  const effectiveStudentId = isAdminPreview ? previewStudentId : (user?.linkedId ?? null);

  async function exitPreview() {
    if (previewId !== null) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await fetch("/api/admin/end-preview", {
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
    router.push("/portal/admin");
  }

  return {
    viewerRole:          (user?.role ?? "student") as PortalViewerContext["viewerRole"],
    effectiveStudentId,
    isAdminPreview,
    previewViewAs,
    previewStudentName,
    previewId,
    previewReady,
    canSubmitHomework:   !isAdminPreview && !isParent,
    canManageSchedule:   !isAdminPreview && !isParent,
    canPurchaseHours:    !isAdminPreview && !isParent,
    canReply:            !isAdminPreview,
    canEditAccount:      !isAdminPreview && !isParent,
    exitPreview,
  };
}
