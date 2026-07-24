"use client";

import { useEffect, useState, useRef } from "react";
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

  // Ref prevents the effect from starting a second validation or redirecting
  // when onAuthStateChange re-fires the effect with a new `user` object reference
  // after validation has already started or completed.
  const validationState = useRef<"idle" | "validating" | "done">("idle");

  useEffect(() => {
    if (!authLoaded) {
      console.log("[preview] step1: auth not loaded yet, waiting");
      return;
    }

    if (!user) {
      console.log("[preview] step2: authLoaded=true but user=null — checking session");
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          console.log("[preview] step2a: no session found → redirect /login");
          router.push("/login");
        } else {
          console.log("[preview] step2b: session exists but user not set yet — waiting for useAuth");
        }
      });
      return;
    }

    console.log(`[preview] step3: user loaded, role=${user.role}, validationState=${validationState.current}`);

    if (user.role === "admin") {
      // If validation already started or completed, do not re-enter the flow.
      // onAuthStateChange re-fires this effect with a new `user` object even
      // though the admin hasn't changed — we must not redirect in that case.
      if (validationState.current !== "idle") {
        console.log(`[preview] step4: validation already ${validationState.current}, skipping re-run`);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const token  = params.get("preview");
      console.log(`[preview] step5: token in URL = ${token ? token.slice(0, 8) + "…" : "null"}`);

      if (!token) {
        console.log("[preview] step5a: no token → redirect /portal/admin");
        router.push("/portal/admin");
        return;
      }

      validationState.current = "validating";
      console.log("[preview] step6: starting server-side token validation");

      // Remove token from URL now (before async work) so back-navigation is clean.
      // We've already captured it in `token` above.
      window.history.replaceState({}, "", "/portal/student");

      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          console.log(`[preview] step7: session for validate call present=${!!session}`);

          const res = await fetch(
            `/api/admin/validate-preview?token=${encodeURIComponent(token)}`,
            { headers: { Authorization: `Bearer ${session?.access_token ?? ""}` } },
          );
          console.log(`[preview] step8: validate-preview response status=${res.status}`);

          if (!res.ok) {
            const body = await res.json().catch(() => ({})) as { error?: string };
            console.log(`[preview] step8a: validation failed: ${body.error ?? "unknown"} → redirect /portal/admin`);
            validationState.current = "idle";
            router.push("/portal/admin");
            return;
          }

          const data = await res.json() as {
            studentId: number;
            studentName: string;
            previewId: number;
            viewAs: "student" | "parent";
          };
          console.log(`[preview] step9: validation OK — studentId=${data.studentId} viewAs=${data.viewAs}`);

          setPreviewStudentId(data.studentId);
          setPreviewStudentName(data.studentName);
          setPreviewId(data.previewId);
          setPreviewViewAs(data.viewAs ?? "student");
          validationState.current = "done";
          setPreviewReady(true);
          console.log("[preview] step10: previewReady=true, preview is live");
        } catch (err) {
          console.error("[preview] step8b: unexpected error during validation:", err);
          validationState.current = "idle";
          router.push("/portal/admin");
        }
      })();
      return;
    }

    // Reject any other non-student/parent roles
    if ((user.role !== "student" && user.role !== "parent") || !user.linkedId) {
      console.log(`[preview] step11: unexpected role=${user.role} linkedId=${user.linkedId} → redirect /login`);
      router.push("/login");
      return;
    }

    console.log(`[preview] step12: normal ${user.role} flow, setting previewReady`);
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
    validationState.current = "idle";
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
