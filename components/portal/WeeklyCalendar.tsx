"use client";

import { useState } from "react";
import type { Session, TutorAvailability } from "@/lib/portal/types";

const ROW_H      = 28;   // px per 30-min slot
const SLOT_START = 9;    // 9 AM
const SLOTS      = Array.from({ length: 25 }, (_, i) => SLOT_START + i * 0.5); // 9:00–21:00

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
  mode: "book" | "tutor" | "view";
  onSlotSelect?: (date: string, time: string) => void;
  selectedSlot?: { date: string; time: string } | null;
  bookingLeadHours?: number;
  onSessionClick?: (session: Session) => void;
  blockedDates?: string[];
  resolveStudentName?: (id: number) => string | undefined;
}

export default function WeeklyCalendar({
  availability, sessions, mode, onSlotSelect, selectedSlot,
  bookingLeadHours, onSessionClick, blockedDates, resolveStudentName,
}: Props) {
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
  const showNowBar = nowH >= SLOT_START && nowH <= SLOT_START + 12;

  const weekLabel = `${days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${days[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div>
      {/* ── Week navigation ── */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          ← Prev
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-800">{weekLabel}</p>
          {weekOffset === 0 && <p className="text-[10px] text-blue-500 font-medium mt-0.5">This Week</p>}
        </div>
        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          Next →
        </button>
      </div>

      {/* ── Mode hint ── */}
      {mode === "book" && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
          <span className="text-base">📅</span>
          <span>Click any <strong>green slot</strong> to book a session with your tutor.</span>
        </div>
      )}
      {mode === "tutor" && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
          <span className="text-base">📅</span>
          <span>Click any slot to schedule a session. <strong>Green</strong> = your availability window. Click a blue block to view/edit session details.</span>
        </div>
      )}

      {/* ── Calendar grid ── */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="min-w-[620px]">

          {/* Day column headers */}
          <div className="flex border-b-2 border-gray-200 bg-gray-50">
            <div className="w-14 shrink-0 border-r border-gray-200" />
            <div className="flex-1 grid grid-cols-7">
              {days.map((d, i) => {
                const iso       = toISO(d);
                const isToday   = iso === todayISO;
                const isBlocked = blockedDates?.includes(iso) ?? false;
                return (
                  <div
                    key={i}
                    className={`py-3 text-center border-r border-gray-100 last:border-r-0 ${
                      isBlocked ? "bg-orange-50" : isToday ? "bg-blue-50" : ""
                    }`}
                  >
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${
                      isToday ? "text-blue-500" : isBlocked ? "text-orange-400" : "text-gray-400"
                    }`}>
                      {DAY_SHORT[d.getDay()]}
                    </p>
                    <div className={`mx-auto mt-1 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${
                      isToday
                        ? "bg-blue-600 text-white shadow-sm"
                        : isBlocked
                        ? "bg-orange-100 text-orange-600"
                        : "text-gray-800 hover:bg-gray-100"
                    }`}>
                      {d.getDate()}
                    </div>
                    {isBlocked && (
                      <p className="text-[9px] text-orange-400 font-semibold mt-0.5 tracking-wide uppercase">Off</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid body */}
          <div className="flex">

            {/* Time gutter */}
            <div className="w-14 shrink-0 border-r border-gray-200 bg-white relative z-10">
              {SLOTS.map((slot) => (
                <div key={slot} className="relative" style={{ height: ROW_H }}>
                  {/* Show hour label offset upward so it sits ON the line */}
                  {slot % 1 === 0 && slot > SLOT_START && (
                    <span className="absolute -top-[9px] right-2 text-[10px] text-gray-400 font-medium select-none leading-none whitespace-nowrap">
                      {hourLabel(slot)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Day columns */}
            <div className="flex-1 grid grid-cols-7">
              {days.map((d, dayIdx) => {
                const dateISO   = toISO(d);
                const dow       = d.getDay();
                const isToday   = dateISO === todayISO;
                const isBlocked = blockedDates?.includes(dateISO) ?? false;

                const daySessions = sessions.filter(
                  (s) => s.date === dateISO && s.status !== "cancelled",
                );

                // Selected slot position for this day
                const selH =
                  selectedSlot?.date === dateISO
                    ? parseTimeToHour(selectedSlot.time)
                    : null;
                const selTopPx =
                  selH !== null && selH >= SLOT_START
                    ? (selH - SLOT_START) * 2 * ROW_H
                    : null;

                return (
                  <div
                    key={dayIdx}
                    className={`relative border-r border-gray-100 last:border-r-0 ${
                      isBlocked ? "bg-orange-50/40" : isToday ? "bg-blue-50/20" : ""
                    }`}
                  >

                    {/* ── Background slot rows (clickable) ── */}
                    {SLOTS.map((slot) => {
                      const isHalf   = slot % 1 !== 0;
                      const occupied = slotOccupied(dateISO, slot, sessions);
                      const avail    = inAvailability(dow, slot, availability);

                      const slotH  = Math.floor(slot);
                      const slotM  = slot % 1 >= 0.5 ? "30" : "00";
                      const slotDT = new Date(
                        `${dateISO}T${String(slotH).padStart(2, "0")}:${slotM}:00`,
                      );
                      const isPast     = slotDT <= now;
                      const hoursUntil = (slotDT.getTime() - now.getTime()) / (1000 * 60 * 60);
                      const isTooSoon  =
                        mode === "book" &&
                        bookingLeadHours != null &&
                        !isPast &&
                        hoursUntil < bookingLeadHours;
                      const notBookable = isPast || isTooSoon;

                      const clickable =
                        !occupied &&
                        !notBookable &&
                        !isBlocked &&
                        (mode === "tutor" || (mode === "book" && avail));

                      const slotTime = hourToTimeString(slot);

                      // Slot background color
                      let bg = "";
                      if (occupied) {
                        bg = ""; // session block painted above
                      } else if (isBlocked) {
                        bg = "";
                      } else if (isPast) {
                        bg = "bg-gray-50/70";
                      } else if (isTooSoon && avail) {
                        bg = "bg-amber-50";
                      } else if (avail && clickable) {
                        bg = "bg-emerald-50 hover:bg-emerald-100";
                      } else if (!avail && mode === "tutor" && !notBookable) {
                        bg = "hover:bg-gray-50";
                      }

                      return (
                        <div
                          key={slot}
                          style={{ height: ROW_H }}
                          title={
                            clickable
                              ? `Book ${slotTime}`
                              : isTooSoon
                              ? `Within ${bookingLeadHours}h booking window`
                              : isBlocked
                              ? "Day blocked off"
                              : undefined
                          }
                          onClick={() => {
                            if (clickable) onSlotSelect?.(dateISO, slotTime);
                          }}
                          className={`relative ${bg} ${clickable ? "cursor-pointer group" : "cursor-default"} ${
                            isHalf
                              ? "border-b border-dashed border-gray-100"
                              : "border-b border-gray-200"
                          }`}
                        >
                          {/* Hover time label */}
                          {clickable && (
                            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[1]">
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md shadow-sm ${
                                avail
                                  ? "text-emerald-700 bg-emerald-100 border border-emerald-200"
                                  : "text-gray-600 bg-white border border-gray-300"
                              }`}>
                                {slotTime}
                              </span>
                            </span>
                          )}
                          {/* Too-soon lock */}
                          {isTooSoon && avail && (
                            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="text-[9px] text-amber-400">🔒</span>
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {/* ── Session event blocks (absolute, spans full duration) ── */}
                    {daySessions.map((session) => {
                      const startH = parseTimeToHour(session.time);
                      if (startH < SLOT_START || startH > SLOT_START + 12) return null;

                      const topPx     = (startH - SLOT_START) * 2 * ROW_H;
                      const heightPx  = Math.max(ROW_H - 2, session.durationHours * 2 * ROW_H - 2);
                      const stuName   = resolveStudentName?.(session.studentId);
                      const inPerson  = session.sessionType === "in-person";
                      const canClick  = (mode === "tutor" || mode === "view") && !!onSessionClick;
                      const showExtra = heightPx > ROW_H * 1.5;

                      return (
                        <div
                          key={session.id}
                          style={{
                            position: "absolute",
                            top: topPx,
                            height: heightPx,
                            left: 3,
                            right: 3,
                          }}
                          onClick={() => canClick && onSessionClick!(session)}
                          className={`rounded-lg z-10 px-2 pt-1.5 pb-1 overflow-hidden shadow-md border ${
                            inPerson
                              ? "bg-violet-600 border-violet-500"
                              : "bg-blue-600 border-blue-500"
                          } ${canClick ? "cursor-pointer hover:brightness-90 active:brightness-75 transition-all" : "pointer-events-none"}`}
                        >
                          <p className="text-white text-[10px] font-bold leading-tight truncate">
                            {session.subject}
                          </p>
                          {stuName && (
                            <p className={`text-[9px] leading-tight truncate mt-0.5 ${inPerson ? "text-violet-200" : "text-blue-200"}`}>
                              {stuName}
                            </p>
                          )}
                          {showExtra && (
                            <p className={`text-[9px] leading-tight mt-0.5 opacity-80 ${inPerson ? "text-violet-100" : "text-blue-100"}`}>
                              {session.time} · {session.durationHours}h · {inPerson ? "In-Person" : "Online"}
                            </p>
                          )}
                          {canClick && (
                            <p className={`text-[8px] mt-0.5 opacity-60 ${inPerson ? "text-violet-100" : "text-blue-100"}`}>
                              tap to view →
                            </p>
                          )}
                        </div>
                      );
                    })}

                    {/* ── Selected slot highlight ── */}
                    {selTopPx !== null && (
                      <div
                        style={{
                          position: "absolute",
                          top: selTopPx,
                          height: ROW_H - 2,
                          left: 3,
                          right: 3,
                        }}
                        className="rounded-md bg-emerald-500 z-[5] flex items-center justify-center shadow-sm border border-emerald-400"
                      >
                        <span className="text-white text-[9px] font-bold leading-none tracking-wide">
                          {selectedSlot!.time}
                        </span>
                      </div>
                    )}

                    {/* ── Current-time indicator (today only) ── */}
                    {isToday && showNowBar && (
                      <div
                        style={{ position: "absolute", top: nowTopPx, left: 0, right: 0 }}
                        className="z-20 flex items-center pointer-events-none"
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow shrink-0 -ml-1.5 border-2 border-white" />
                        <div className="flex-1 h-px bg-red-400" />
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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 px-0.5">
        {availability.length > 0 && (
          <LegendDot color="bg-emerald-100 border border-emerald-300" label="Available" />
        )}
        <LegendDot color="bg-blue-600"   label="Booked (online)" />
        <LegendDot color="bg-violet-600" label="Booked (in-person)" />
        {mode !== "view" && (
          <LegendDot color="bg-emerald-500" label="Selected slot" />
        )}
        {mode === "book" && bookingLeadHours != null && (
          <LegendDot color="bg-amber-50 border border-amber-200" label={`Within ${bookingLeadHours}h window 🔒`} />
        )}
        {mode === "tutor" && (
          <LegendDot color="bg-gray-50 border border-gray-200" label="Outside availability (schedulable)" />
        )}
        {(blockedDates?.length ?? 0) > 0 && (
          <LegendDot color="bg-orange-100 border border-orange-200" label="Blocked off" />
        )}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-3 h-0.5 bg-red-400 inline-block" />
          <span>Now</span>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-500">
      <span className={`w-3 h-3 rounded-sm inline-block shrink-0 ${color}`} />
      {label}
    </span>
  );
}
