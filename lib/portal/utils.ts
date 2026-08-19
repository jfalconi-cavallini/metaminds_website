import type { PurchaseOption } from "./types";

/**
 * Course Offerings (the `courses` table) are the canonical catalog — see
 * migration 053. This is a *display-grouping* label only, mapping a course's
 * `subject` column to a friendlier section heading in the Courses UI. It is
 * not a second catalog: every name shown to a user comes from the database,
 * never from a hardcoded list here.
 */
export const SUBJECT_DISPLAY_GROUP: Record<string, string> = {
  SAT:      "Test Prep",
  ACT:      "Test Prep",
  GED:      "Test Prep",
  AP:       "AP Courses",
  Math:     "Academics",
  English:  "Academics",
  Coding:   "Coding & STEM",
  Robotics: "Coding & STEM",
  STEM:     "Coding & STEM",
};

export const DISPLAY_GROUP_ORDER = ["Test Prep", "AP Courses", "Academics", "Coding & STEM"];

export function displayGroupFor(subject: string): string {
  return SUBJECT_DISPLAY_GROUP[subject] ?? "Other";
}

export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function formatTime24to12(time: string): string {
  if (!time || time.includes(" ")) return time;
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/** Extracts a usable URL from a zoom link field.
 * Handles bare domains, full URLs, and pasted Zoom invitation text
 * (including single-slash https:/ variants from Zoom invites). */
export function resolveZoomUrl(raw: string): string {
  if (!raw) return "#";
  // Already a clean URL
  if (/^https?:\/\//i.test(raw)) return raw;
  // Prefer the /j/ join link inside invitation text (handles https:/ single-slash too)
  const joinMatch = raw.match(/https?:\/{1,2}[^\s]*\/j\/[^\s]+/i);
  if (joinMatch) {
    const url = joinMatch[0].replace(/^https?:\/(?!\/)/, "https://");
    return url;
  }
  // Any https:// URL in the text
  const anyMatch = raw.match(/https?:\/{1,2}[^\s]+/);
  if (anyMatch) {
    return anyMatch[0].replace(/^https?:\/(?!\/)/, "https://");
  }
  // Bare domain
  return `https://${raw}`;
}

export const purchaseOptions: PurchaseOption[] = [
  { id: "1hr", label: "1 Hour",  hours: 1, price: 70,  priceLabel: "$70"  },
  { id: "4hr", label: "4 Hours", hours: 4, price: 260, priceLabel: "$260" },
  { id: "8hr", label: "8 Hours", hours: 8, price: 480, priceLabel: "$480" },
];
