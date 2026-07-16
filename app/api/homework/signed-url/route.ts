import { NextResponse } from "next/server";
import https from "node:https";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";

// Fetch a private file from Supabase Storage using the service role key
// and return it directly — avoids signed-URL API quirks entirely.
function httpsGet(
  url: string,
  serviceKey: string,
): Promise<{ ok: boolean; status: number; headers: Record<string, string>; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        hostname:           parsed.hostname,
        path:               parsed.pathname + parsed.search,
        method:             "GET",
        rejectUnauthorized: false,
        headers: {
          authorization: `Bearer ${serviceKey}`,
          apikey:        serviceKey,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const status = res.statusCode ?? 0;
          resolve({
            ok:      status >= 200 && status < 300,
            status,
            headers: res.headers as Record<string, string>,
            body:    Buffer.concat(chunks),
          });
        });
      },
    );
    req.on("error", reject);
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

  let storagePath: string;
  try {
    const body = await request.json() as { path?: string };
    if (!body.path) throw new Error("missing path");
    storagePath = body.path;
  } catch {
    return NextResponse.json({ error: "Missing storage path" }, { status: 400 });
  }

  // Storage paths look like "hw_<homeworkId>/<timestamp>_<filename>" —
  // recover the homework id so we can check the caller actually owns it.
  const hwIdMatch = storagePath.match(/^hw_(\d+)\//);
  if (!hwIdMatch) {
    return NextResponse.json({ error: "Invalid storage path" }, { status: 400 });
  }
  const hwIdNum = Number.parseInt(hwIdMatch[1], 10);

  const { data: hwRow, error: hwLookupError } = await adminClient()
    .from("homework")
    .select("student_id, tutor_id")
    .eq("id", hwIdNum)
    .single();
  if (hwLookupError || !hwRow) {
    return NextResponse.json({ error: "Homework not found" }, { status: 404 });
  }
  const owns =
    (caller.role === "student" && caller.linkedId === hwRow.student_id) ||
    (caller.role === "tutor" && caller.linkedId === hwRow.tutor_id);
  if (!owns && caller.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fileUrl = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/homework-submissions/${storagePath}`;
  console.log("[file-proxy] fetching:", fileUrl);

  let result: { ok: boolean; status: number; headers: Record<string, string>; body: Buffer };
  try {
    result = await httpsGet(fileUrl, serviceKey);
  } catch (e: unknown) {
    return NextResponse.json({ error: `Network: ${e instanceof Error ? e.message : e}` }, { status: 500 });
  }

  if (!result.ok) {
    return NextResponse.json(
      { error: `Storage ${result.status}: ${result.body.toString()}` },
      { status: 500 },
    );
  }

  const contentType = result.headers["content-type"] || "application/octet-stream";
  return new Response(result.body.buffer as ArrayBuffer, {
    status: 200,
    headers: { "content-type": contentType },
  });
}
