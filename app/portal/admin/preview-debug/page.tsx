"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ── types ────────────────────────────────────────────────────────────────────

interface AuthState {
  ok:              boolean;
  sessionExists:   boolean;
  userId:          string | null;
  email:           string | null;
  role:            string | null;
  tokenPrefix:     string | null;
}

interface StartResult {
  step:        "start";
  httpStatus:  number;
  ok:          boolean;
  previewId:   number | null;
  studentName: string | null;
  previewUrl:  string | null;
  tokenMasked: string | null;
  error:       string | null;
  rawBody:     Record<string, unknown>;
}

interface DbRow {
  id:           number;
  admin_id:     string;   // masked
  admin_matches: boolean;
  student_id:   number;
  view_as:      string;
  started_at:   string;
  expires_at:   string;
  ended_at:     string | null;
  now:          string;
  expired:      boolean;
}

interface DbResult {
  step:   "db";
  ok:     boolean;
  found:  boolean;
  row:    DbRow | null;
  error:  string | null;
  schema: { migration040_table_exists: boolean; migration042_view_as_col: boolean } | null;
  env:    { supabaseUrl: string | null; vercelGitCommit: string; nodeEnv: string } | null;
}

interface ValidateResult {
  step:        "validate";
  httpStatus:  number;
  ok:          boolean;
  studentId:   number | null;
  studentName: string | null;
  viewAs:      string | null;
  previewId:   number | null;
  error:       string | null;
  rawBody:     Record<string, unknown>;
}

// ── helpers ──────────────────────────────────────────────────────────────────

const ck = (v: boolean) => (v ? "✅" : "❌");

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr className="border-t border-gray-100 first:border-0">
      <td className="py-1.5 pr-4 text-gray-500 font-normal whitespace-nowrap w-48 text-xs">{label}</td>
      <td className="py-1.5 text-gray-900 text-xs font-mono">{value}</td>
    </tr>
  );
}

function Section({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
        {badge && <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
      ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
    }`}>
      {ck(ok)} {label}
    </span>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function PreviewDebugPage() {
  const router = useRouter();

  const [authState,      setAuthState]      = useState<AuthState | null>(null);
  const [students,       setStudents]       = useState<{ id: number; name: string }[]>([]);
  const [studentId,      setStudentId]      = useState<number | null>(null);
  const [viewAs,         setViewAs]         = useState<"student" | "parent">("student");
  const [startResult,    setStartResult]    = useState<StartResult | null>(null);
  const [dbResult,       setDbResult]       = useState<DbResult | null>(null);
  const [validateResult, setValidateResult] = useState<ValidateResult | null>(null);
  const [busy,           setBusy]           = useState<string | null>(null);
  const [navLog,         setNavLog]         = useState<string[]>([]);

  // ── Step 1: auth ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthState({ ok: false, sessionExists: false, userId: null, email: null, role: null, tokenPrefix: null });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      setAuthState({
        ok:            !!profile && profile.role === "admin",
        sessionExists: true,
        userId:        session.user.id,
        email:         session.user.email ?? null,
        role:          profile?.role ?? "unknown",
        tokenPrefix:   session.access_token.slice(0, 12) + "…",
      });
    })();
  }, []);

  // Load students
  useEffect(() => {
    supabase.from("students").select("id, name").eq("archived", false).order("name")
      .then(({ data }) => {
        if (data && data.length > 0) {
          const rows = data as { id: number; name: string }[];
          setStudents(rows);
          setStudentId(rows[0].id);
        }
      });
  }, []);

  // ── Step 2: start-preview ───────────────────────────────────────────────────
  async function runStart() {
    if (!studentId) return;
    setBusy("start");
    setStartResult(null);
    setDbResult(null);
    setValidateResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log(`[debug] start-preview → studentId=${studentId} viewAs=${viewAs} token=${session?.access_token?.slice(0, 12)}…`);
      const res = await fetch("/api/admin/start-preview", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
        body:    JSON.stringify({ studentId, viewAs }),
      });
      const body = await res.json() as Record<string, unknown>;
      const previewUrl  = typeof body.previewUrl === "string" ? body.previewUrl : null;
      const tokenMatch  = previewUrl?.match(/preview=([^&]+)/);
      const tokenMasked = tokenMatch ? tokenMatch[1].slice(0, 8) + "…" : null;
      console.log(`[debug] start-preview ← status=${res.status} previewId=${body.previewId} tokenMasked=${tokenMasked}`);
      setStartResult({
        step:        "start",
        httpStatus:  res.status,
        ok:          res.status === 200,
        previewId:   typeof body.previewId === "number" ? body.previewId : null,
        studentName: typeof body.studentName === "string" ? body.studentName : null,
        previewUrl,
        tokenMasked,
        error:       typeof body.error === "string" ? body.error : null,
        rawBody:     body,
      });
    } catch (err) {
      console.error("[debug] start-preview threw:", err);
      setStartResult({
        step: "start", httpStatus: 0, ok: false, previewId: null, studentName: null,
        previewUrl: null, tokenMasked: null, error: String(err), rawBody: {},
      });
    } finally {
      setBusy(null);
    }
  }

  // ── Step 3: DB record ────────────────────────────────────────────────────────
  async function runDbCheck() {
    if (!startResult?.previewId) return;
    setBusy("db");
    setDbResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res  = await fetch(`/api/admin/debug-preview?previewId=${startResult.previewId}`, {
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      });
      const body = await res.json() as {
        found: boolean;
        row: DbRow | null;
        error: string | null;
        schemaInfo: DbResult["schema"];
        envInfo: DbResult["env"];
      };
      console.log(`[debug] db-check ← found=${body.found} schema=`, body.schemaInfo, "env=", body.envInfo);
      setDbResult({
        step:   "db",
        ok:     body.found,
        found:  body.found,
        row:    body.row,
        error:  body.error,
        schema: body.schemaInfo ?? null,
        env:    body.envInfo ?? null,
      });
    } catch (err) {
      console.error("[debug] db-check threw:", err);
      setDbResult({ step: "db", ok: false, found: false, row: null, error: String(err), schema: null, env: null });
    } finally {
      setBusy(null);
    }
  }

  // ── Step 4: validate-preview ─────────────────────────────────────────────────
  async function runValidate() {
    if (!startResult?.previewUrl) return;
    setBusy("validate");
    setValidateResult(null);
    try {
      const tokenMatch = startResult.previewUrl.match(/preview=([^&]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;
      if (!token) {
        setValidateResult({
          step: "validate", httpStatus: 0, ok: false, studentId: null,
          studentName: null, viewAs: null, previewId: null,
          error: "Cannot extract token from previewUrl", rawBody: {},
        });
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      console.log(`[debug] validate-preview → token=${token.slice(0, 8)}…`);
      const res  = await fetch(`/api/admin/validate-preview?token=${encodeURIComponent(token)}`, {
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      });
      const body = await res.json() as Record<string, unknown>;
      console.log(`[debug] validate-preview ← status=${res.status}`, body);
      setValidateResult({
        step:        "validate",
        httpStatus:  res.status,
        ok:          res.status === 200,
        studentId:   typeof body.studentId === "number" ? body.studentId : null,
        studentName: typeof body.studentName === "string" ? body.studentName : null,
        viewAs:      typeof body.viewAs === "string" ? body.viewAs : null,
        previewId:   typeof body.previewId === "number" ? body.previewId : null,
        error:       typeof body.error === "string" ? body.error : null,
        rawBody:     body,
      });
    } catch (err) {
      console.error("[debug] validate-preview threw:", err);
      setValidateResult({
        step: "validate", httpStatus: 0, ok: false, studentId: null,
        studentName: null, viewAs: null, previewId: null,
        error: String(err), rawBody: {},
      });
    } finally {
      setBusy(null);
    }
  }

  // ── Step 5: guard decision (computed, no navigation) ─────────────────────────
  function guardDecision() {
    if (!validateResult?.ok) return null;
    const d = validateResult;
    return {
      authLoaded:          true,
      resolvedRole:        "admin",
      tokenPresent:        true,
      validationLoading:   false,
      validationOk:        d.ok,
      effectiveStudentId:  d.studentId,
      previewViewAs:       d.viewAs,
      finalDecision:       d.ok && d.studentId ? "LOAD STUDENT PORTAL" : "REDIRECT — missing data",
      canSubmitHomework:   false,
      canManageSchedule:   false,
      canPurchaseHours:    false,
      canReply:            false,
      canEditAccount:      false,
    };
  }

  // ── Step 6: navigation ────────────────────────────────────────────────────────
  function addNavLog(msg: string) {
    setNavLog(prev => [...prev, `${new Date().toISOString().slice(11, 23)} ${msg}`]);
  }

  function doHardNav() {
    if (!startResult?.previewUrl) return;
    addNavLog(`window.location.assign("${startResult.previewUrl}")`);
    window.location.assign(startResult.previewUrl);
  }

  function doSoftNav() {
    if (!startResult?.previewUrl) return;
    addNavLog(`router.push("${startResult.previewUrl}")`);
    router.push(startResult.previewUrl);
  }

  const guard = guardDecision();

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.push("/portal/admin")} className="text-blue-600 hover:underline text-sm">
            ← Admin Portal
          </button>
          <h1 className="text-lg font-bold text-gray-900">Preview Flow Diagnostic</h1>
        </div>

        {/* ── step 1 ── */}
        <Section title="Step 1 — Auth State" badge="auto">
          {!authState ? (
            <p className="text-xs text-gray-400">Loading…</p>
          ) : (
            <>
              <div className="mb-3"><StatusBadge ok={authState.ok} label={authState.ok ? "Admin authenticated" : "NOT admin or no session"} /></div>
              <table className="w-full"><tbody>
                <Row label="Session exists"  value={<>{ck(authState.sessionExists)} {String(authState.sessionExists)}</>} />
                <Row label="User ID"         value={authState.userId ?? "—"} />
                <Row label="Email"           value={authState.email ?? "—"} />
                <Row label="Role"            value={authState.role ?? "—"} />
                <Row label="Token prefix"    value={authState.tokenPrefix ?? "—"} />
              </tbody></table>
              {!authState.ok && (
                <p className="mt-3 text-xs text-red-600 font-medium">
                  ⚠ Not authenticated as admin — start-preview will return 403. Log in at /login first.
                </p>
              )}
            </>
          )}
        </Section>

        {/* ── step 2 ── */}
        <Section title="Step 2 — Start Preview">
          <div className="flex flex-wrap gap-2 mb-4">
            <select value={studentId ?? ""} onChange={e => setStudentId(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm min-w-[180px]">
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} (ID {s.id})</option>
              ))}
            </select>
            <select value={viewAs} onChange={e => setViewAs(e.target.value as "student" | "parent")}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
              <option value="student">student</option>
              <option value="parent">parent</option>
            </select>
            <button onClick={runStart} disabled={busy === "start" || !studentId}
              className="px-4 py-1.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
              {busy === "start" ? "Starting…" : "POST /api/admin/start-preview"}
            </button>
          </div>
          {startResult && (
            <>
              <div className="mb-2"><StatusBadge ok={startResult.ok} label={`HTTP ${startResult.httpStatus}`} /></div>
              <table className="w-full"><tbody>
                <Row label="previewId"    value={startResult.previewId ?? "—"} />
                <Row label="studentName"  value={startResult.studentName ?? "—"} />
                <Row label="previewUrl"   value={startResult.previewUrl ? `/portal/student?preview=${startResult.tokenMasked}` : "—"} />
                <Row label="error"        value={startResult.error ?? "none"} />
              </tbody></table>
              {startResult.error && (
                <pre className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700 overflow-auto max-h-24">
                  {JSON.stringify(startResult.rawBody, null, 2)}
                </pre>
              )}
            </>
          )}
        </Section>

        {/* ── step 3 ── */}
        <Section title="Step 3 — Database Record">
          <button onClick={runDbCheck} disabled={busy === "db" || !startResult?.previewId}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 mb-4">
            {busy === "db" ? "Checking…" : "GET /api/admin/debug-preview"}
          </button>
          {dbResult && (
            <>
              <div className="mb-2"><StatusBadge ok={dbResult.ok} label={dbResult.found ? "Row found" : "Row NOT found"} /></div>
              {dbResult.error && <p className="text-xs text-red-600 mb-2">Error: {dbResult.error}</p>}
              {dbResult.row && (
                <table className="w-full mb-3"><tbody>
                  <Row label="id"            value={dbResult.row.id} />
                  <Row label="admin_id"      value={<>{dbResult.row.admin_id} {ck(dbResult.row.admin_matches)} admin matches</>} />
                  <Row label="student_id"    value={dbResult.row.student_id} />
                  <Row label="view_as"       value={dbResult.row.view_as} />
                  <Row label="started_at"    value={dbResult.row.started_at} />
                  <Row label="expires_at"    value={<>{dbResult.row.expires_at} {ck(!dbResult.row.expired)} {dbResult.row.expired ? "EXPIRED" : "valid"}</>} />
                  <Row label="ended_at"      value={dbResult.row.ended_at ?? <span className="text-emerald-600">null ✅</span>} />
                </tbody></table>
              )}
              {dbResult.schema && (
                <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
                  <div className="font-semibold text-gray-600 mb-1">Schema (migrations)</div>
                  <div>{ck(dbResult.schema.migration040_table_exists)} Migration 040 — admin_preview_sessions table</div>
                  <div>{ck(dbResult.schema.migration042_view_as_col)} Migration 042 — view_as column</div>
                </div>
              )}
              {dbResult.env && (
                <div className="mt-3 bg-blue-50 rounded-lg p-3 text-xs space-y-1">
                  <div className="font-semibold text-blue-700 mb-1">Environment</div>
                  <div>Supabase URL: <span className="font-mono">{dbResult.env.supabaseUrl ?? "NOT SET"}</span></div>
                  <div>Vercel git SHA: <span className="font-mono">{dbResult.env.vercelGitCommit}</span></div>
                  <div>NODE_ENV: <span className="font-mono">{dbResult.env.nodeEnv}</span></div>
                </div>
              )}
            </>
          )}
        </Section>

        {/* ── step 4 ── */}
        <Section title="Step 4 — Validate Preview Token">
          <button onClick={runValidate} disabled={busy === "validate" || !startResult?.previewUrl}
            className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 mb-4">
            {busy === "validate" ? "Validating…" : "GET /api/admin/validate-preview"}
          </button>
          {validateResult && (
            <>
              <div className="mb-2"><StatusBadge ok={validateResult.ok} label={`HTTP ${validateResult.httpStatus}`} /></div>
              {validateResult.error && <p className="text-xs text-red-600 mb-2">Error: {validateResult.error}</p>}
              <table className="w-full mb-2"><tbody>
                <Row label="studentId"    value={validateResult.studentId ?? "—"} />
                <Row label="studentName"  value={validateResult.studentName ?? "—"} />
                <Row label="viewAs"       value={validateResult.viewAs ?? "—"} />
                <Row label="previewId"    value={validateResult.previewId ?? "—"} />
              </tbody></table>
              <pre className="bg-gray-50 rounded-lg p-2 text-xs overflow-auto max-h-32 text-gray-700">
                {JSON.stringify(validateResult.rawBody, null, 2)}
              </pre>
            </>
          )}
        </Section>

        {/* ── step 5 ── */}
        {guard && (
          <Section title="Step 5 — Portal Guard Decision" badge="computed">
            <table className="w-full"><tbody>
              <Row label="authLoaded"         value={<>{ck(guard.authLoaded)} {String(guard.authLoaded)}</>} />
              <Row label="resolvedRole"       value={guard.resolvedRole} />
              <Row label="tokenPresent"       value={<>{ck(guard.tokenPresent)} {String(guard.tokenPresent)}</>} />
              <Row label="validationOk"       value={<>{ck(guard.validationOk)} {String(guard.validationOk)}</>} />
              <Row label="effectiveStudentId" value={guard.effectiveStudentId ?? "—"} />
              <Row label="previewViewAs"      value={guard.previewViewAs ?? "—"} />
              <Row label="canSubmitHomework"  value={<>{ck(false)} false (read-only)</>} />
              <Row label="canReply"           value={<>{ck(false)} false (read-only)</>} />
            </tbody></table>
            <div className={`mt-3 px-3 py-2 rounded-lg text-xs font-semibold ${
              guard.finalDecision.startsWith("LOAD")
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}>
              Final decision: {guard.finalDecision}
            </div>
          </Section>
        )}

        {/* ── step 6 ── */}
        {startResult?.previewUrl && (
          <Section title="Step 6 — Navigate to Student Portal">
            <p className="text-xs text-gray-500 mb-3">
              Token: <span className="font-mono">{startResult.tokenMasked}</span>
              {" "}— URL: <span className="font-mono">/portal/student?preview={startResult.tokenMasked}</span>
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={doHardNav}
                className="px-4 py-1.5 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
                Hard Nav (window.location.assign)
              </button>
              <button onClick={doSoftNav}
                className="px-4 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">
                Soft Nav (router.push)
              </button>
            </div>
            {navLog.length > 0 && (
              <pre className="bg-gray-50 rounded-lg p-2 text-xs text-gray-700">
                {navLog.join("\n")}
              </pre>
            )}
            <p className="text-xs text-amber-600 mt-2">
              ⚠ Hard Nav does a full page reload — session is read from cookie on reload. Soft Nav uses Next.js router (RSC fetch).
            </p>
          </Section>
        )}

      </div>
    </div>
  );
}
