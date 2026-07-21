"use client";

import { useState } from "react";
import type { Session, TutorAvailability } from "@/lib/portal/types";

const ROW_H      = 36;   // px per 30-min slot — spacious, Google-Calendar feel
const SLOT_START = 8;    // 8 AM
const SLOTS      = Array.from({ length: 28 }, (_, i) => SLOT_START + i * 0.5); // 8:00–21:30

const DAY_FULL  = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function hourLabel(h: number): string {
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

export function hourToTimeString(slot: number): string {
  const h    = Math.floor(slot);
  const mins = slot % 1 >= 0.5 ? "30" : "00";
  if (h === 0)  return `12:${mins} AM`;
  if (h === 12) return `12:${mins} PM`;
  if (h > 12)   return `${h - 12}:${mins} PM`;
  return `${h}:${mins} AM`;
}

export function parseTimeToHour(time: string): number {
  if (!time) return -1;
  const ampm = time.match(/(\d+)(?::(\d+))?\s*(AM|PM)/i);
  if (ampm) {
    let h = parseInt(ampm[1]);
    const m = parseInt(ampm[2] ?? "0");
    if (ampm[3].toUpperCase() === "PM" && h !== 12) h += 12;
    if (ampm[3].toUpperCase() === "AM" && h === 12) h = 0;
    return h + m / 60;
  }
  const h24 = time.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) return parseInt(h24[1]) + parseInt(h24[2]) / 60;
  return -1;
}

export interface CalendarSessionAction {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: "primary" | "danger" | "default";
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekDays(sunday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function inAvailability(dow: number, slot: number, avail: TutorAvailability[]): boolean {
  return avail.some((a) => {
    if (a.dayOfWeek !== dow) return false;
    return slot >= parseTimeToHour(a.startTime) && slot < parseTimeToHour(a.endTime);
  });
}

function slotOccupied(dateISO: string, slot: number, sessions: Session[]): boolean {
  return sessions.some((s) => {
    if (s.date !== dateISO || s.status === "cancelled") return false;
    const start = parseTimeToHour(s.time);
    return slot >= start && slot < start + s.durationHours;
  });
}

interface Props {
  availability: TutorAvailability[];
  sessions: Session[];
  visibleSessions?: Session[];   // sessions to render as blocks; falls back to sessions if omitted
  mode: "book" | "tutor" | "view";
  onSlotSelect?: (date: string, time: string) => void;
  selectedSlot?: { date: string; time: string } | null;
  bookingLeadHours?: number;
  onSessionClick?: (session: Session) => void;
  getSessionActions?: (session: Session) => CalendarSessionAction[];
  blockedDates?: string[];
  blockedSlots?: { date: string; time: string }[];
  onSlotBlock?: (date: string, time: string) => void;
  resolveStudentName?: (id: number) => string | undefined;
}

export default function WeeklyCalendar({
  availability, sessions, visibleSessions, mode, onSlotSelect, selectedSlot,
  bookingLeadHours, onSessionClick, getSessionActions, blockedDates, blockedSlots,
  onSlotBlock, resolveStudentName,
}: Props) {
  const renderSessions = visibleSessions ?? sessions;
  const [weekOffset, setWeekOffset] = useState(0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now     = new Date();
  const sunday  = new Date(today);
  sunday.setDate(today.getDate() - today.getDay() + weekOffset * 7);
  const days     = getWeekDays(sunday);
  const todayISO = toISO(today);

  const nowH       = now.getHours() + now.getMinutes() / 60;
  const nowTopPx   = (nowH - SLOT_START) * 2 * ROW_H;
  const showNowBar = nowH >= SLOT_START && nowH <= SLOT_START + 14;

  const blockMode = !!onSlotBlock;

  const weekLabel = `${days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${days[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div>
      {/* ── Week navigation ── */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setWeekOffset(0)}
          className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-all shrink-0 ${
            weekOffset === 0
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "text-gray-600 bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
          }`}
        >
          Today
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="w-8 h-8 flex items-center justify-center text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium"
            aria-label="Previous week"
          >
            ‹
          </button>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="w-8 h-8 flex items-center justify-center text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium"
            aria-label="Next week"
          >
            ›
          </button>
        </div>
        <p className="text-sm font-semibold text-gray-700 flex-1 text-center">{weekLabel}</p>
        <div className="shrink-0 text-xs text-gray-400 font-medium">Week</div>
      </div>

      {/* ── Mode hints ── */}
      {mode === "book" && (
        <div className="flex items-center gap-2.5 mb-4 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span>Click any <strong>green slot</strong> to book a session with your tutor.</span>
        </div>
      )}
      {mode === "tutor" && !blockMode && (
        <div className="flex items-center gap-2.5 mb-4 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          <span>Click any available slot to schedule a session. Click a session block to manage it.</span>
        </div>
      )}
      {blockMode && (
        <div className="flex items-center gap-2.5 mb-4 px-4 py-2.5 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700">
          <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
          <span><strong>Block mode:</strong> Click a slot to block it. Click an orange slot to unblock.</span>
        </div>
      )}

      {/* ── Calendar grid ── */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="min-w-[640px]">

          {/* Day column headers */}
          <div className="flex border-b border-gray-200 bg-gray-50/80 sticky top-0 z-30">
            {/* Time gutter spacer */}
            <div className="w-16 shrink-0 border-r border-gray-200" />
            {/* Day headers */}
            <div className="flex-1 grid grid-cols-7">
              {days.map((d, i) => {
                const iso        = toISO(d);
                const isToday    = iso === todayISO;
                const isBlocked  = blockedDates?.includes(iso) ?? false;
                return (
                  <div
                    key={i}
                    className={`py-3 px-1 text-center border-r border-gray-100 last:border-r-0 ${
                      isBlocked ? "bg-orange-50/60" : isToday ? "bg-blue-50/60" : ""
                    }`}
                  >
                    <p className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-1.5 ${
                      isToday ? "text-blue-500" : isBlocked ? "text-orange-400" : "text-gray-400"
                    }`}>
                      {DAY_SHORT[d.getDay()]}
                    </p>
                    <div className={`mx-auto w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${
                      isToday
                        ? "bg-blue-600 text-white shadow-sm"
                        : isBlocked
                        ? "bg-orange-100 text-orange-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}>
                      {d.getDate()}
                    </div>
                    {isBlocked && (
                      <p className="text-[8px] text-orange-400 font-bold mt-1 tracking-widest uppercase">Off</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scrollable grid body */}
          <div className="flex overflow-y-auto" style={{ maxHeight: 560 }}>

            {/* Time gutter */}
            <div className="w-16 shrink-0 border-r border-gray-200 bg-white relative z-10">
              {SLOTS.map((slot) => (
                <div key={slot} className="relative select-none" style={{ height: ROW_H }}>
                  {slot % 1 === 0 && slot > SLOT_START && (
                    <span className="absolute -top-[9px] right-2 text-[10px] text-gray-400 font-medium leading-none whitespace-nowrap">
                      {hourLabel(slot)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Day columns */}
            <div className="flex-1 grid grid-cols-7">
              {days.map((d, dayIdx) => {
                const dateISO      = toISO(d);
                const dow          = d.getDay();
                const isToday      = dateISO === todayISO;
                const isDayBlocked = blockedDates?.includes(dateISO) ?? false;

                const daySessions = renderSessions.filter(
                  (s) => s.date === dateISO && s.status !== "cancelled",
                );

                const selH = selectedSlot?.date === dateISO
                  ? parseTimeToHour(selectedSlot.time)
                  : null;
                const selTopPx = selH !== null && selH >= SLOT_START
                  ? (selH - SLOT_START) * 2 * ROW_H
                  : null;

                return (
                  <div
                    key={dayIdx}
                    className={`relative border-r border-gray-100 last:border-r-0 ${
                      isDayBlocked ? "bg-orange-50/30" : isToday ? "bg-blue-50/20" : ""
                    }`}
                  >

                    {/* ── Background slot rows ── */}
                    {SLOTS.map((slot) => {
                      const isHalf        = slot % 1 !== 0;
                      const occupied      = slotOccupied(dateISO, slot, sessions);
                      const avail         = inAvailability(dow, slot, availability);
                      const slotTime      = hourToTimeString(slot);
                      const isSlotBlocked = blockedSlots?.some(
                        (b) => b.date === dateISO && b.time === slotTime,
                      ) ?? false;

                      const slotH  = Math.floor(slot);
                      const slotM  = slot % 1 >= 0.5 ? "30" : "00";
                      const slotDT = new Date(`${dateISO}T${String(slotH).padStart(2, "0")}:${slotM}:00`);
                      const isPast     = slotDT <= now;
                      const hoursUntil = (slotDT.getTime() - now.getTime()) / (1000 * 60 * 60);
                      const isTooSoon  = mode === "book" && bookingLeadHours != null && !isPast && hoursUntil < bookingLeadHours;
                      const notBookable = isPast || isTooSoon;

                      // ── Block mode ──
                      if (blockMode) {
                        const canBlock = !occupied && !isPast && !isDayBlocked;
                        let bg = "";
                        if (occupied || isDayBlocked) bg = "";
                        else if (isSlotBlocked)       bg = "bg-orange-100 hover:bg-orange-200 cursor-pointer";
                        else if (isPast)              bg = "";
                        else if (avail)               bg = "bg-emerald-50 hover:bg-orange-50 cursor-pointer";
                        else                          bg = "hover:bg-orange-50/60 cursor-pointer";

                        return (
                          <div
                            key={slot}
                            style={{ height: ROW_H }}
                            onClick={() => canBlock && onSlotBlock!(dateISO, slotTime)}
                            className={`relative ${bg} ${
                              isHalf
                                ? "border-b border-dashed border-gray-100/80"
                                : "border-b border-gray-100"
                            }`}
                          >
                            {isSlotBlocked && (
                              <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-[9px] font-semibold text-orange-400">blocked</span>
                              </span>
                            )}
                          </div>
                        );
                      }

                      // ── Normal booking / view mode ──
                      const clickable =
                        !occupied &&
                        !notBookable &&
                        !isDayBlocked &&
                        !isSlotBlocked &&
                        (mode === "tutor" || (mode === "book" && avail));

                      let bg = "";
                      if (occupied)                           bg = "";
                      else if (isDayBlocked || isSlotBlocked) bg = "bg-orange-50/50";
                      else if (isPast)                        bg = "";
                      else if (isTooSoon && avail)            bg = "bg-amber-50/60";
                      else if (avail && clickable)            bg = "bg-emerald-50 hover:bg-emerald-100/80";
                      else if (!avail && mode === "tutor" && !notBookable) bg = "hover:bg-gray-50/60";

                      return (
                        <div
                          key={slot}
                          style={{ height: ROW_H }}
                          title={
                            isSlotBlocked    ? `Blocked`
                              : clickable    ? `Book at ${slotTime}`
                              : isTooSoon    ? `Within ${bookingLeadHours}h booking window`
                              : isDayBlocked ? "Day blocked"
                              : undefined
                          }
                          onClick={() => { if (clickable) onSlotSelect?.(dateISO, slotTime); }}
                          className={`relative ${bg} ${clickable ? "cursor-pointer group" : "cursor-default"} ${
                            isHalf
                              ? "border-b border-dashed border-gray-100/80"
                              : "border-b border-gray-100"
                          }`}
                        >
                          {clickable && (
                            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[1]">
                              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-sm">
                                {slotTime}
                              </span>
                            </span>
                          )}
                          {isSlotBlocked && !occupied && (
                            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="text-[9px] font-semibold text-orange-300">🚫</span>
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {/* ── Session event blocks ── */}
                    {daySessions.map((session) => {
                      const startH = parseTimeToHour(session.time);
                      if (startH < SLOT_START || startH > SLOT_START + 14) return null;

                      const topPx    = (startH - SLOT_START) * 2 * ROW_H;
                      const heightPx = Math.max(ROW_H - 2, session.durationHours * 2 * ROW_H - 2);
                      const stuName  = resolveStudentName?.(session.studentId);
                      const inPerson = session.sessionType === "in-person";
                      const endH     = startH + session.durationHours;
                      const timeEnd  = hourToTimeString(endH);

                      const actions     = getSessionActions?.(session) ?? [];
                      const hasActions  = actions.length > 0;
                      const canClickBase = (mode === "tutor" || mode === "view") && !!onSessionClick;
                      const isClickable  = canClickBase || hasActions;

                      const showTimeRange  = heightPx >= 52;
                      const showTypeBadge  = heightPx >= 76;
                      const showHoverBar   = heightPx >= 52 && hasActions;

                      return (
                        <div
                          key={session.id}
                          style={{ position: "absolute", top: topPx, height: heightPx, left: 2, right: 2 }}
                          onClick={() => { if (canClickBase) onSessionClick!(session); }}
                          className={`group rounded-lg z-10 overflow-hidden border shadow-sm ${
                            inPerson
                              ? "bg-violet-600 border-violet-500"
                              : "bg-blue-600 border-blue-500"
                          } ${isClickable ? "cursor-pointer transition-all hover:brightness-95 hover:shadow-md" : "pointer-events-none"}`}
                        >
                          {/* Card content */}
                          <div className="px-2 pt-1.5 pb-1">
                            <p className="text-white text-[10px] font-bold leading-tight truncate">
                              {session.subject}
                            </p>
                            {stuName && (
                              <p className={`text-[9px] leading-tight truncate mt-0.5 ${inPerson ? "text-violet-200" : "text-blue-200"}`}>
                                {stuName}
                              </p>
                            )}
                            {showTimeRange && (
                              <p className={`text-[9px] leading-tight mt-0.5 ${inPerson ? "text-violet-200" : "text-blue-200"}`}>
                                {session.time} – {timeEnd}
                              </p>
                            )}
                            {showTypeBadge && (
                              <span className={`inline-block mt-1 text-[8px] font-bold px-1.5 py-0.5 rounded-sm ${
                                inPerson
                                  ? "bg-violet-500/40 text-violet-100"
                                  : "bg-blue-500/40 text-blue-100"
                              }`}>
                                {inPerson ? "In-Person" : "Online"}
                              </span>
                            )}
                          </div>

                          {/* Hover action bar */}
                          {showHoverBar && (
                            <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/25 backdrop-blur-[2px] px-1.5 py-1 flex items-center gap-1 flex-wrap">
                              {actions.map((action) => (
                                <button
                                  key={action.label}
                                  onClick={action.onClick}
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                                    action.variant === "primary"
                                      ? "bg-white text-blue-700 hover:bg-blue-50"
                                      : action.variant === "danger"
                                      ? "bg-red-500 text-white hover:bg-red-600"
                                      : "bg-white/25 text-white hover:bg-white/40"
                                  }`}
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* ── Selected slot highlight ── */}
                    {selTopPx !== null && (
                      <div
                        style={{ position: "absolute", top: selTopPx, height: ROW_H - 2, left: 2, right: 2 }}
                        className="rounded-lg bg-emerald-500 z-[5] flex items-center justify-center shadow-md border border-emerald-400"
                      >
                        <span className="text-white text-[9px] font-bold tracking-wide">
                          {selectedSlot!.time}
                        </span>
                      </div>
                    )}

                    {/* ── Current-time indicator (Google Calendar red line) ── */}
                    {isToday && showNowBar && (
                      <div
                        style={{ position: "absolute", top: nowTopPx, left: 0, right: 0 }}
                        className="z-20 flex items-center pointer-events-none"
                      >
                        <div className="w-3 h-3 rounded-full bg-red-500 shrink-0 -ml-1.5 shadow-sm border-2 border-white" />
                        <div className="flex-1 h-[1.5px] bg-red-500 opacity-90" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3 px-0.5">
        {availability.length > 0 && (
          <LegendItem color="bg-emerald-100 border border-emerald-300" label="Available" />
        )}
        <LegendItem color="bg-blue-600"   label="Booked (online)" />
        <LegendItem color="bg-violet-600" label="Booked (in-person)" />
        {!blockMode && mode !== "view" && (
          <LegendItem color="bg-emerald-500" label="Selected" />
        )}
        {mode === "book" && bookingLeadHours != null && (
          <LegendItem color="bg-amber-50 border border-amber-200" label={`${bookingLeadHours}h window 🔒`} />
        )}
        {blockMode && (
          <LegendItem color="bg-orange-100 border border-orange-300" label="Blocked (click to unblock)" />
        )}
        {(blockedDates?.length ?? 0) > 0 && (
          <LegendItem color="bg-orange-50 border border-orange-200" label="Day off" />
        )}
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-4 h-[2px] bg-red-500 inline-block rounded-full" />
          Now
        </span>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-500">
      <span className={`w-2.5 h-2.5 rounded-sm inline-block shrink-0 ${color}`} />
      {label}
    </span>
  );
}
