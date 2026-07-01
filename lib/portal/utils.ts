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

export const purchaseOptions: PurchaseOption[] = [
  { id: "1hr", label: "1 Hour",  hours: 1, price: 70,  priceLabel: "$70"  },
  { id: "4hr", label: "4 Hours", hours: 4, price: 260, priceLabel: "$260" },
  { id: "8hr", label: "8 Hours", hours: 8, price: 480, priceLabel: "$480" },
];
