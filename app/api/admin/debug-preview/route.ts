import { NextResponse } from "next/server";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";

export async function GET(request: Request) {
  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;
  if (caller.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url    = new URL(request.url);
  const rawId  = url.searchParams.get("previewId");
  const previewId = rawId ? parseInt(rawId, 10) : null;
  if (!previewId || isNaN(previewId)) {
    return NextResponse.json({ error: "Missing or invalid previewId" }, { status: 400 });
  }

  const admin = adminClient();

  // ── Schema verification ──────────────────────────────────────────────────────
  // Check migration 040: table exists
  const { error: tableErr } = await admin
    .from("admin_preview_sessions")
    .select("id")
    .limit(0);
  const migration040Ok = !tableErr;

  // Check migration 042: view_as column exists
  const { data: viewAsTest, error: colErr } = await admin
    .from("admin_preview_sessions")
    .select("view_as")
    .limit(0);
  const migration042Ok = !colErr && viewAsTest !== undefined;

  // ── DB record ────────────────────────────────────────────────────────────────
  const { data: preview, error: fetchErr } = await admin
    .from("admin_preview_sessions")
    .select("id, admin_id, student_id, view_as, started_at, expires_at, ended_at")
    .eq("id", previewId)
    .single();

  const envInfo = {
    supabaseUrl:       process.env.NEXT_PUBLIC_SUPABASE_URL   ?? null,
    vercelGitCommit:  (process.env.VERCEL_GIT_COMMIT_SHA ?? "not-set").slice(0, 8),
    nodeEnv:           process.env.NODE_ENV ?? "unknown",
  };

  const schemaInfo = {
    migration040_table_exists: migration040Ok,
    migration042_view_as_col:  migration042Ok,
  };

  if (fetchErr || !preview) {
    console.error(`[debug-preview] fetch failed for previewId=${previewId}:`, fetchErr?.message);
    return NextResponse.json({
      found:      false,
      row:        null,
      error:      fetchErr?.message ?? "Record not found",
      schemaInfo,
      envInfo,
    });
  }

  const p = preview as {
    id: number;
    admin_id: string;
    student_id: number;
    view_as: string;
    started_at: string;
    expires_at: string;
    ended_at: string | null;
  };

  console.log(`[debug-preview] OK previewId=${p.id} adminMatch=${p.admin_id === caller.id} viewAs=${p.view_as}`);

  return NextResponse.json({
    found: true,
    row: {
      id:           p.id,
      admin_id:     p.admin_id.slice(0, 8) + "…",   // masked
      admin_id_full: p.admin_id,                      // needed for match check
      admin_matches: p.admin_id === caller.id,
      student_id:   p.student_id,
      view_as:      p.view_as,
      started_at:   p.started_at,
      expires_at:   p.expires_at,
      ended_at:     p.ended_at,
      now:          new Date().toISOString(),
      expired:      new Date(p.expires_at) < new Date(),
    },
    error:      null,
    schemaInfo,
    envInfo,
  });
}
