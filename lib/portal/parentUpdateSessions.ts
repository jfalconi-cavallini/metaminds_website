/** A session row, reduced to the fields that decide whether it can be tagged on a parent update. */
export interface ParentUpdateSessionRef {
  id: number;
  student_id: number;
  tutor_id: number;
}

/**
 * Parse `sessionIds` from a parent-update request.
 * `null` / `undefined` means the caller tagged no sessions.
 * Returns `null` when the value is present but not an array of integers.
 */
export function parseSessionIdList(raw: unknown): number[] | null {
  if (raw == null) return [];
  if (!Array.isArray(raw)) return null;
  const ids: number[] = [];
  for (const value of raw) {
    if (typeof value !== "number" || !Number.isInteger(value)) return null;
    ids.push(value);
  }
  return ids;
}

/**
 * Session ids in `requested` that are missing from `sessions` or that belong
 * to a different student or tutor. Duplicates are reported once.
 */
export function foreignParentUpdateSessionIds(
  requested: readonly number[],
  sessions: readonly ParentUpdateSessionRef[],
  studentId: number,
  tutorId: number,
): number[] {
  const owned = new Set<number>();
  for (const session of sessions) {
    if (session.student_id === studentId && session.tutor_id === tutorId) {
      owned.add(session.id);
    }
  }
  const foreign: number[] = [];
  const seen = new Set<number>();
  for (const id of requested) {
    if (seen.has(id)) continue;
    seen.add(id);
    if (!owned.has(id)) foreign.push(id);
  }
  return foreign;
}

/** `requested`, in order, with foreign ids and duplicates removed. */
export function ownedParentUpdateSessionIds(
  requested: readonly number[],
  sessions: readonly ParentUpdateSessionRef[],
  studentId: number,
  tutorId: number,
): number[] {
  const foreign = new Set(foreignParentUpdateSessionIds(requested, sessions, studentId, tutorId));
  const kept: number[] = [];
  const seen = new Set<number>();
  for (const id of requested) {
    if (seen.has(id) || foreign.has(id)) continue;
    seen.add(id);
    kept.push(id);
  }
  return kept;
}
