/**
 * POST /api/admin/seed-skills
 *
 * Seeds the skill_nodes table with the canonical skill tree for a given course.
 * Admin-only. Idempotent — safe to call multiple times.
 *
 * Body: { course: "SAT" }   (only "SAT" is supported today)
 *
 * Returns: { inserted, skipped, total, errors }
 */

import { NextResponse }              from "next/server";
import { adminClient, authenticate, isAuthError } from "@/lib/apiAuth";
import { seedSATSkillTree }          from "@/lib/portal/satSkillSeed";

export async function POST(request: Request) {
  const caller = await authenticate(request);
  if (isAuthError(caller)) return caller;
  if (caller.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let course = "SAT";
  try {
    const body = await request.json() as { course?: string };
    if (body.course) course = body.course;
  } catch {
    // body is optional — default to SAT
  }

  const admin = adminClient();

  if (course === "SAT") {
    const result = await seedSATSkillTree(admin);
    return NextResponse.json(result);
  }

  return NextResponse.json(
    { error: `No seed data for course: ${course}` },
    { status: 400 },
  );
}
