/** Sessions are stored as a bare date + a "4:00 PM"-style string, with no
 *  zone attached anywhere in the schema. By convention (matching the
 *  reminders cron in app/api/cron/send-reminders/route.ts) that string is
 *  wall-clock time in the business's home zone — the "platform timezone".
 *  Everything here converts FROM that assumption TO a viewer's own zone,
 *  for display only; nothing about storage or booking logic changes. */
export const PLATFORM_TIMEZONE = "America/New_York";

function parseTime12h(time: string): { hour: number; minute: number } {
  const m = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return { hour: 0, minute: 0 };
  let hour = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  return { hour, minute };
}

function formatTime12h(hour: number, minute: number): string {
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

/** Converts a wall-clock date+time believed to be in `zone` into the correct
 *  UTC instant, using the real IANA database via Intl (so DST transitions
 *  are handled correctly) rather than a fixed offset table. */
function zonedWallTimeToUtc(dateISO: string, hour: number, minute: number, zone: string): Date {
  const [y, m, d] = dateISO.split("-").map(Number);
  const guessUtc = new Date(Date.UTC(y, m - 1, d, hour, minute));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(guessUtc);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const readHour = get("hour") % 24; // ICU sometimes formats midnight as "24"
  const asIfLocal = Date.UTC(get("year"), get("month") - 1, get("day"), readHour, get("minute"));
  const diff = guessUtc.getTime() - asIfLocal;
  return new Date(guessUtc.getTime() + diff);
}

function zoneAbbrev(utcDate: Date, zone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "short" }).formatToParts(utcDate);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
}

export interface ConvertedSession {
  dateISO:    string;
  time12h:    string;
  /** -1/0/1 calendar days relative to the original platform-time date —
   *  a late-evening ET session can land on the next (or previous) day
   *  once converted, and that has to stay visible, not silently wrong. */
  dayShift:   -1 | 0 | 1;
  zoneAbbrev: string;
}

/** Converts a session's platform-time date + "4:00 PM"-style time into the
 *  given viewer timezone. `toZone` falsy/empty falls back to platform time
 *  (dayShift 0) — the correct behavior before a student's zone is known. */
export function convertSessionDisplay(dateISO: string, time12h: string, toZone?: string | null): ConvertedSession {
  const zone = toZone && toZone.trim() ? toZone : PLATFORM_TIMEZONE;
  const { hour, minute } = parseTime12h(time12h);
  const utc = zonedWallTimeToUtc(dateISO, hour, minute, PLATFORM_TIMEZONE);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(utc);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  const newDateISO = `${get("year")}-${get("month")}-${get("day")}`;
  const newHour    = Number(get("hour")) % 24;
  const newMinute  = Number(get("minute"));

  const origDayMs = Date.parse(`${dateISO}T00:00:00Z`);
  const newDayMs  = Date.parse(`${newDateISO}T00:00:00Z`);
  const dayShift  = Math.round((newDayMs - origDayMs) / 86_400_000) as -1 | 0 | 1;

  return {
    dateISO:    newDateISO,
    time12h:    formatTime12h(newHour, newMinute),
    dayShift,
    zoneAbbrev: zoneAbbrev(utc, zone),
  };
}
