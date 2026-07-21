import { NextResponse } from "next/server";
import { authenticate, isAuthError, adminClient } from "@/lib/apiAuth";

/**
 * GET /api/cms/catalog?courseId=<id>
 * Returns the full nested catalog tree for a course:
 *   Course → Sections → Categories → Lessons (with resources)
 *
 * Accessible to admins and tutors. Students cannot browse the raw catalog.
 */
export async function GET(request: Request) {
  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;

  if (caller.role === "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const courseIdStr = searchParams.get("courseId");
  if (!courseIdStr) {
    return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
  }
  const courseId = Number.parseInt(courseIdStr, 10);
  if (!Number.isInteger(courseId)) {
    return NextResponse.json({ error: "Invalid courseId" }, { status: 400 });
  }

  const admin = adminClient();

  // Parallel fetch: course, modules, lessons, resources
  const [courseRes, modulesRes, lessonsRes, resourcesRes] = await Promise.all([
    admin.from("courses").select("*").eq("id", courseId).single(),
    admin.from("modules").select("*").eq("course_id", courseId).order("position"),
    admin.from("lessons")
      .select("*")
      .in("module_id", await (async () => {
        const { data } = await admin.from("modules").select("id").eq("course_id", courseId);
        return (data ?? []).map((r: { id: number }) => r.id);
      })()),
    admin.from("lesson_resources")
      .select("*")
      .in("lesson_id", await (async () => {
        const { data: mods } = await admin.from("modules").select("id").eq("course_id", courseId);
        const modIds = (mods ?? []).map((r: { id: number }) => r.id);
        if (modIds.length === 0) return [-1];
        const { data: les } = await admin.from("lessons").select("id").in("module_id", modIds);
        return (les ?? []).map((r: { id: number }) => r.id);
      })())
      .order("position"),
  ]);

  if (courseRes.error)    return NextResponse.json({ error: courseRes.error.message },    { status: 500 });
  if (modulesRes.error)   return NextResponse.json({ error: modulesRes.error.message },   { status: 500 });
  if (lessonsRes.error)   return NextResponse.json({ error: lessonsRes.error.message },   { status: 500 });
  if (resourcesRes.error) return NextResponse.json({ error: resourcesRes.error.message }, { status: 500 });

  // Build nested structure
  const modules   = modulesRes.data   ?? [];
  const lessons   = lessonsRes.data   ?? [];
  const resources = resourcesRes.data ?? [];

  type ResRow = { id: number; lesson_id: number; [k: string]: unknown };
  type LesRow = { id: number; module_id: number; [k: string]: unknown };
  type ModRow = { id: number; parent_id: number | null; position: number; [k: string]: unknown };

  const resByLesson = new Map<number, ResRow[]>();
  for (const r of resources as ResRow[]) {
    if (!resByLesson.has(r.lesson_id)) resByLesson.set(r.lesson_id, []);
    resByLesson.get(r.lesson_id)!.push(r);
  }

  const lessByMod = new Map<number, (LesRow & { resources: ResRow[] })[]>();
  for (const l of lessons as LesRow[]) {
    if (!lessByMod.has(l.module_id)) lessByMod.set(l.module_id, []);
    lessByMod.get(l.module_id)!.push({ ...l, resources: resByLesson.get(l.id) ?? [] });
  }

  const catsBySection = new Map<number, (ModRow & { lessons: (LesRow & { resources: ResRow[] })[] })[]>();
  for (const m of modules as ModRow[]) {
    if (m.parent_id != null) {
      if (!catsBySection.has(m.parent_id)) catsBySection.set(m.parent_id, []);
      catsBySection.get(m.parent_id)!.push({ ...m, lessons: lessByMod.get(m.id) ?? [] });
    }
  }

  const sections = (modules as ModRow[])
    .filter((m) => m.parent_id == null)
    .sort((a, b) => a.position - b.position)
    .map((m) => ({
      ...m,
      categories: (catsBySection.get(m.id) ?? []).sort((a, b) => a.position - b.position),
    }));

  return NextResponse.json({ course: courseRes.data, sections });
}
