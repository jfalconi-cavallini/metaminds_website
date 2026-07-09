import type { PurchaseOption } from "./types";

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
 * Handles bare domains, full URLs, and pasted Zoom invitation text. */
export function resolveZoomUrl(raw: string): string {
  if (!raw) return "#";
  // Already a proper URL
  if (/^https?:\/\//i.test(raw)) return raw;
  // Contains a URL somewhere in the text (e.g. full invitation paste)
  const match = raw.match(/https?:\/\/[^\s]+/);
  if (match) return match[0];
  // Bare domain like zoom.us/j/...
  return `https://${raw}`;
}

export const purchaseOptions: PurchaseOption[] = [
  { id: "1hr", label: "1 Hour",  hours: 1, price: 70,  priceLabel: "$70"  },
  { id: "4hr", label: "4 Hours", hours: 4, price: 260, priceLabel: "$260" },
  { id: "8hr", label: "8 Hours", hours: 8, price: 480, priceLabel: "$480" },
];
