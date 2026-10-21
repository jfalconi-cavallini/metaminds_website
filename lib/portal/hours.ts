import type { HoursBalance } from "./types";

/** Smallest package increment an admin can add. */
export const MIN_PURCHASED_HOURS = 0.5;
/** Largest amount that can be added in a single purchase. */
export const MAX_PURCHASED_HOURS = 100;

const HALF_STEP = 0.5;

/**
 * Rejects anything that is not a positive half-hour increment within the
 * allowed range. Accepts a number or a numeric string so both the form and
 * the API can share one check. Returns an error message, or null when valid.
 */
export function purchasedHoursError(hours: unknown): string | null {
  const value = typeof hours === "number"
    ? hours
    : typeof hours === "string" && hours.trim() !== ""
      ? Number(hours)
      : Number.NaN;

  if (!Number.isFinite(value)) return "Enter a valid number of hours.";
  if (value < MIN_PURCHASED_HOURS) return `Hours must be at least ${MIN_PURCHASED_HOURS}.`;
  if (value > MAX_PURCHASED_HOURS) return `Hours cannot exceed ${MAX_PURCHASED_HOURS}.`;

  const halves = value / HALF_STEP;
  if (Math.abs(halves - Math.round(halves)) > 1e-6) {
    return "Hours must be in half-hour increments (for example 3.5).";
  }
  return null;
}

/** Snap a validated amount onto an exact multiple of 0.5. */
export function normalizePurchasedHours(hours: number): number {
  return Math.round(hours / HALF_STEP) * HALF_STEP;
}

/** Round to the hundredth so numeric(6,2) values display without float dust. */
export function roundHours(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

/**
 * Display hours with their decimals intact. Whole numbers stay whole
 * ("4"); half hours stay one decimal ("3.5"); hundredths stay two ("3.25").
 */
export function formatHours(value: number): string {
  const rounded = roundHours(value);
  const negative = rounded < 0;
  const text = Math.abs(rounded).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  return negative ? `-${text}` : text;
}

export function toHoursBalance(row: {
  student_id: number;
  total_hours: unknown;
  hours_used: unknown;
  expires_at: string;
}): HoursBalance {
  const totalPurchased = roundHours(Number(row.total_hours));
  const totalUsed = roundHours(Number(row.hours_used));
  return {
    studentId: row.student_id,
    totalPurchased,
    totalUsed,
    remaining: roundHours(totalPurchased - totalUsed),
    expiresAt: row.expires_at,
  };
}
