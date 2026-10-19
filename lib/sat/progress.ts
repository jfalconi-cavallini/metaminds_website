import { isPracticeUserId } from "./access.ts";
import type { StoredSession } from "./session.ts";

export const SAT_PROGRESS_STORAGE_KEY = "metaminds.sat-practice.v1";

/** Browser progress for one signed-in user. Supabase persistence is a later migration. */
export function progressStorageKey(userId: string): string {
  if (!isPracticeUserId(userId)) {
    throw new Error("Invalid practice progress user id.");
  }
  return `${SAT_PROGRESS_STORAGE_KEY}.${userId}`;
}

export interface SatProgressV1 {
  version: 1;
  active: StoredSession | null;
  completed: StoredSession[];
}

export interface ProgressStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function emptyProgress(): SatProgressV1 {
  return { version: 1, active: null, completed: [] };
}

export function isStoredSession(value: unknown): value is StoredSession {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string" || value.id === "") return false;
  if (typeof value.startedAt !== "string") return false;
  if (value.finishedAt !== null && typeof value.finishedAt !== "string") return false;
  if (typeof value.timed !== "boolean") return false;
  if (typeof value.durationSeconds !== "number" || !Number.isFinite(value.durationSeconds)) return false;
  if (!Array.isArray(value.questionIds) || value.questionIds.some((id) => typeof id !== "string")) return false;
  if (!isRecord(value.answers)) return false;
  return true;
}

export function readProgress(raw: string | null): SatProgressV1 {
  if (!raw) return emptyProgress();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== 1) return emptyProgress();
    const completed = Array.isArray(parsed.completed)
      ? parsed.completed.filter(isStoredSession).slice(-50)
      : [];
    const active = isStoredSession(parsed.active) ? parsed.active : null;
    return { version: 1, active, completed };
  } catch {
    return emptyProgress();
  }
}

export function loadProgress(storage: ProgressStorage, userId: string): SatProgressV1 {
  return readProgress(storage.getItem(progressStorageKey(userId)));
}

export function saveProgress(storage: ProgressStorage, progress: SatProgressV1, userId: string): void {
  const completed = progress.completed.filter(isStoredSession).slice(-50);
  const active = progress.active && isStoredSession(progress.active) ? progress.active : null;
  storage.setItem(
    progressStorageKey(userId),
    JSON.stringify({ version: 1, active, completed } satisfies SatProgressV1),
  );
}
