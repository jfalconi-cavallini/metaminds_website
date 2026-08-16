import type { PurchaseOption } from "./types";

export const PROGRAM_CATALOG: Record<string, string[]> = {
  "Test Prep": [
    "SAT Prep",
    "ACT Prep",
    "PSAT Prep",
    "AP Exam Prep",
  ],
  "AP Courses": [
    "AP Calculus AB",
    "AP Calculus BC",
    "AP Statistics",
    "AP Computer Science A",
    "AP Computer Science Principles",
    "AP Physics 1",
    "AP Physics 2",
    "AP Physics C: Mechanics",
    "AP Chemistry",
    "AP Biology",
    "AP Environmental Science",
    "AP Psychology",
    "AP English Language",
    "AP English Literature",
    "AP US History",
    "AP World History",
    "AP Macroeconomics",
  ],
  "Academics": [
    "Elementary School Math",
    "Middle School Math",
    "Algebra I",
    "Algebra II",
    "Geometry",
    "Pre-Calculus",
    "Calculus",
    "Physics",
    "Chemistry",
    "Biology",
    "English / Writing",
    "Reading Comprehension",
    "History / Social Studies",
  ],
  "Coding & Technology": [
    "Python",
    "Java",
    "JavaScript",
    "Scratch",
    "Robotics",
    "Data Science",
  ],
};

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
