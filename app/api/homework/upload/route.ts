import { NextResponse } from "next/server";
import https from "node:https";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";

// All outbound requests use node:https with rejectUnauthorized:false because
// the dev network intercepts TLS (VPN / corporate proxy).

interface HttpsResult {
  ok: boolean;
  status: number;
  text: string;
}

function httpsRequest(
  url: string,
  method: string,
  headers: Record<string, string | number>,
  body?: Buffer | string,
): Promise<HttpsResult> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        hostname:           parsed.hostname,
        path:               parsed.pathname + parsed.search,
        method,
        rejectUnauthorized: false,
        headers,
      },
      (res) => {
        let text = "";
        res.on("data", (chunk: Buffer) => { text += chunk.toString(); });
        res.on("end", () => {
          const status = res.statusCode ?? 0;
          resolve({ ok: status >= 200 && status < 300, status, text });
        });
      },
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

export async function POST(request: Request) {
  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Missing Supabase env vars" }, { status: 500 });
  }

  const base = supabaseUrl.replace(/\/$/, "");

  // Parse multipart form
  let file: File | null = null;
  let hwId: string | null = null;
  try {
    const formData = await request.formData();
    file  = formData.get("file")  as File   | null;
    hwId  = formData.get("hwId")  as string | null;
  } catch (e: unknown) {
    return NextResponse.json({ error: `FormData: ${e instanceof Error ? e.message : e}` }, { status: 400 });
  }

  if (!file || !hwId) {
    return NextResponse.json({ error: "Missing file or hwId" }, { status: 400 });
  }
  const hwIdNum = Number.parseInt(hwId, 10);
  if (!Number.isInteger(hwIdNum)) {
    return NextResponse.json({ error: "Invalid hwId" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  // Ownership check: only the owning student (or an admin) may submit here.
  const { data: hwRow, error: hwLookupError } = await adminClient()
    .from("homework")
    .select("student_id")
    .eq("id", hwIdNum)
    .single();
  if (hwLookupError || !hwRow) {
    return NextResponse.json({ error: "Homework not found" }, { status: 404 });
  }
  const owns = caller.role === "student" && caller.linkedId === hwRow.student_id;
  if (!owns && caller.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer   = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/\s+/g, "_");
  const path     = `hw_${hwId}/${Date.now()}_${safeName}`;

  // ── 1. Upload file to Supabase Storage ──────────────────────────
  let upload: HttpsResult;
  try {
    upload = await httpsRequest(
      `${base}/storage/v1/object/homework-submissions/${path}`,
      "POST",
      {
        authorization:    `Bearer ${serviceKey}`,
        "content-type":   file.type || "application/pdf",
        "content-length": buffer.length,
        "x-upsert":       "true",
      },
      buffer,
    );
  } catch (e: unknown) {
    return NextResponse.json({ error: `Network: ${e instanceof Error ? e.message : e}` }, { status: 500 });
  }

  if (!upload.ok) {
    return NextResponse.json({ error: `Storage ${upload.status}: ${upload.text}` }, { status: 500 });
  }

  // ── 2. Update homework row via Supabase REST API ─────────────────
  const body = JSON.stringify({
    submission_url:      path,
    submission_filename: file.name,
    submitted_at:        new Date().toISOString(),
    status:              "submitted",
  });

  let db: HttpsResult;
  try {
    db = await httpsRequest(
      `${base}/rest/v1/homework?id=eq.${hwIdNum}&select=*`,
      "PATCH",
      {
        authorization:    `Bearer ${serviceKey}`,
        apikey:           serviceKey,
        "content-type":   "application/json",
        "content-length": Buffer.byteLength(body),
        prefer:           "return=representation",
      },
      body,
    );
  } catch (e: unknown) {
    return NextResponse.json({ error: `DB network: ${e instanceof Error ? e.message : e}` }, { status: 500 });
  }

  if (!db.ok) {
    return NextResponse.json({ error: `DB ${db.status}: ${db.text}` }, { status: 500 });
  }

  let rows: unknown[];
  try {
    rows = JSON.parse(db.text) as unknown[];
  } catch {
    return NextResponse.json({ error: "DB response parse failed" }, { status: 500 });
  }

  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row) {
    return NextResponse.json({ error: "Homework row not found" }, { status: 404 });
  }

  return NextResponse.json({ homework: row });
}
