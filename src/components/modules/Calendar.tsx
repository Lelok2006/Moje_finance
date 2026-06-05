"use client";

import { useState } from "react";
import {
  ChevronLeft, ChevronRight, Plus, Cake, Plane,
  Clock, BookOpen, Tag, X,
} from "lucide-react";
import { EVENTS, MEMBERS } from "@/lib/data";
import { daysUntil } from "@/lib/utils";
import type { CalendarEvent, EventType } from "@/types";
import clsx from "clsx";

const MONTHS_SL = [
  "Januar","Februar","Marec","April","Maj","Junij",
  "Julij","Avgust","September","Oktober","November","December",
];
const DAYS_SL = ["Pon","Tor","Sre","Čet","Pet","Sob","Ned"];

const EVENT_DOT: Record<string, string> = {
  birthday: "bg-purple-500",
  holiday:  "bg-amber-500",
  deadline: "bg-expense-500",
  school:   "bg-brand-500",
  other:    "bg-neutral-400",
};
const EVENT_CELL_BG: Record<string, string> = {
  deadline: "bg-expense-50 ring-1 ring-expense-200",
  birthday: "bg-purple-50 ring-1 ring-purple-200",
  holiday:  "bg-amber-50 ring-1 ring-amber-200",
  school:   "bg-brand-50 ring-1 ring-brand-200",
  other:    "bg-neutral-100",
};
const EVENT_PILL: Record<string, string> = {
  birthday: "pill pill-purple",
  holiday:  "pill pill-amber",
  deadline: "pill pill-red",
  school:   "pill pill-amber",
  other:    "pill pill-blue",
};
const EVENT_LABEL: Record<string, string> = {
  birthday: "Rojstni dan",
  holiday:  "Dopust",
  deadline: "Rok",
  school:   "Šola",
  other:    "Ostalo",
};
const EVENT_ICON: Record<string, React.ReactNode> = {
  birthday: <Cake size={14} />,
  holiday:  <Plane size={14} />,
  deadline: <Clock size={14} />,
  school:   <BookOpen size={14} />,
  other:    <Tag size={14} />,
};
const EVENT_TYPES: EventType[] = ["birthday","holiday","deadline","school","other"];
const EVENT_PRIORITY = ["deadline","birthday","holiday","school","other"];

function primaryType(evs: CalendarEvent[]): string {
  for (const t of EVENT_PRIORITY) if (evs.some((e) => e.type === t)) return t;
  return "other";
}

// ── Modal za dodajanje dogodka ────────────────────────────────
interface ModalProps {
  defaultDate: string;
  onSave: (ev: Omit<CalendarEvent, "id">) => void;
  onClose: () => void;
}

function EventModal({ defaultDate, onSave, onClose }: ModalProps) {
  const [form, setForm] = useState({
    title:    "",
    date:     defaultDate,
    type:     "other" as EventType,
    memberId: "",
    notes:    "",
  });

  const valid = form.title.trim() !== "" && form.date !== "";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    onSave({
      title:    form.title.trim(),
      date:     form.date,
      type:     form.type,
      memberId: form.memberId || undefined,
      notes:    form.notes.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        {/* Glava */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-neutral-100">
          <span className="text-sm font-semibold text-neutral-900">Nov dogodek</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100">
            <X size={16} className="text-neutral-500" />
          </button>
        </div>

        <form onSubmit={submit} className="px-5 py-4 space-y-4">
          {/* Naslov */}
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Naslov *</label>
            <input
              autoFocus
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="npr. Zobozdravnik, Zavarovanje…"
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>

          {/* Datum */}
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Datum *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>

          {/* Tip */}
          <div>
            <label className="block text-xs text-neutral-500 mb-1.5">Tip</label>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={clsx(
                    "pill text-[11px] transition-all",
                    form.type === t ? EVENT_PILL[t] + " ring-1 ring-offset-1" : "pill-gray opacity-60"
                  )}
                >
                  {EVENT_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Član */}
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Član (neobvezno)</label>
            <select
              value={form.memberId}
              onChange={(e) => setForm((f) => ({ ...f, memberId: e.target.value }))}
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white"
            >
              <option value="">— skupno —</option>
              {MEMBERS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Opomba */}
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Opomba (neobvezno)</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="npr. 18 dni, Triglav avto…"
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>

          {/* Gumbi */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Prekliči
            </button>
            <button
              type="submit"
              disabled={!valid}
              className={clsx("btn-primary flex-1 justify-center", !valid && "opacity-40 cursor-not-allowed")}
            >
              Dodaj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Glavna komponenta ─────────────────────────────────────────
export default function Calendar() {
  const today = new Date();
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const [events, setEvents] = useState<CalendarEvent[]>(EVENTS);
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;

  function prevMonth() { setViewDate(new Date(year, month - 1, 1)); setSelectedDate(null); }
  function nextMonth() { setViewDate(new Date(year, month + 1, 1)); setSelectedDate(null); }

  function toDateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  function eventsOn(day: number) { return events.filter((e) => e.date === toDateStr(day)); }

  function addEvent(data: Omit<CalendarEvent, "id">) {
    setEvents((prev) => [...prev, { ...data, id: `e-${Date.now()}` }]);
    setShowModal(false);
  }

  const selectedEvents = selectedDate ? events.filter((e) => e.date === selectedDate) : [];

  // Vsi prihodnji dogodki, urejeni po datumu
  const upcoming = events
    .map((e) => ({ ...e, days: daysUntil(e.date) }))
    .filter((e) => e.days >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Dogodki tega meseca
  const thisMonthEvents = events
    .filter((e) => {
      const [y, m] = e.date.split("-").map(Number);
      return y === year && m === month + 1;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="p-4 md:p-6 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Koledar</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Dogodki, roki in opomniki</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowModal(true); }}>
          <Plus size={14} />Nov dogodek
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

        {/* Levo: mesečna mreža + dogodki meseca */}
        <div className="lg:col-span-2 space-y-4">

          {/* Mreža */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
                <ChevronLeft size={16} className="text-neutral-500" />
              </button>
              <span className="text-sm font-semibold text-neutral-900">
                {MONTHS_SL[month]} {year}
              </span>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
                <ChevronRight size={16} className="text-neutral-500" />
              </button>
            </div>

            {/* Dnevi v tednu */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS_SL.map((d, i) => (
                <div key={d} className={clsx(
                  "text-center text-[10px] font-medium uppercase py-1",
                  i >= 5 ? "text-neutral-300" : "text-neutral-400"
                )}>
                  {d}
                </div>
              ))}
            </div>

            {/* Celice */}
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, i) => {
                if (day === null) return <div key={`e-${i}`} className="min-h-[44px]" />;
                const ds = toDateStr(day);
                const dayEvents = eventsOn(day);
                const hasEvents = dayEvents.length > 0;
                const isToday = ds === todayStr;
                const isSelected = ds === selectedDate;
                const isWeekend = i % 7 >= 5;
                const cellBg = hasEvents ? EVENT_CELL_BG[primaryType(dayEvents)] : "";

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : ds)}
                    className={clsx(
                      "flex flex-col items-center pt-1.5 pb-1 rounded-lg transition-colors min-h-[44px]",
                      isToday    ? "bg-brand-600" :
                      isSelected ? "bg-brand-50 ring-1 ring-brand-400" :
                      hasEvents  ? cellBg :
                      "hover:bg-neutral-50"
                    )}
                  >
                    <span className={clsx(
                      "text-xs font-medium leading-none",
                      isToday    ? "text-white" :
                      isSelected ? "text-brand-700" :
                      isWeekend  ? "text-neutral-400" :
                      "text-neutral-700"
                    )}>
                      {day}
                    </span>
                    {hasEvents && (
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                        {dayEvents.slice(0, 3).map((ev, j) => (
                          <span key={j} className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0", EVENT_DOT[ev.type])} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-neutral-50">
              {EVENT_TYPES.map((t) => (
                <div key={t} className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                  <span className={clsx("w-2 h-2 rounded-full", EVENT_DOT[t])} />
                  {EVENT_LABEL[t]}
                </div>
              ))}
            </div>
          </div>

          {/* Dogodki tega meseca / izbranega dne */}
          <div className="card">
            <div className="card-title">
              {selectedDate
                ? `Dogodki — ${new Date(selectedDate).getDate()}. ${MONTHS_SL[new Date(selectedDate).getMonth()]}`
                : `Dogodki — ${MONTHS_SL[month]} ${year}`}
              {selectedDate && (
                <button onClick={() => setSelectedDate(null)} className="btn-ghost text-xs">
                  Pokaži vse
                </button>
              )}
            </div>

            {(selectedDate ? selectedEvents : thisMonthEvents).length === 0 ? (
              <p className="text-xs text-neutral-400 py-4 text-center">
                {selectedDate ? "Na ta dan ni dogodkov." : "Ta mesec ni vpisanih dogodkov."}
              </p>
            ) : (
              <div>
                {(selectedDate ? selectedEvents : thisMonthEvents).map((ev) => {
                  const member = MEMBERS.find((m) => m.id === ev.memberId);
                  const d = new Date(ev.date);
                  return (
                    <div key={ev.id} className="flex items-center gap-3 py-2.5 border-b border-neutral-50 last:border-0">
                      <div className="w-9 text-center flex-shrink-0">
                        <div className="text-sm font-semibold text-neutral-900 leading-none">{d.getDate()}</div>
                        <div className="text-[9px] text-neutral-400 uppercase">
                          {d.toLocaleString("sl-SI", { month: "short" })}
                        </div>
                      </div>
                      <div className={clsx(
                        "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                        ev.type === "deadline" ? "bg-expense-50 text-expense-700" :
                        ev.type === "birthday" ? "bg-purple-50 text-purple-700" :
                        ev.type === "school"   ? "bg-brand-50 text-brand-600" :
                        "bg-warn-50 text-warn-700"
                      )}>
                        {EVENT_ICON[ev.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-neutral-800 truncate">{ev.title}</div>
                        {(ev.notes || member) && (
                          <div className="text-[10px] text-neutral-400">
                            {ev.notes}{ev.notes && member ? " · " : ""}{member?.name}
                          </div>
                        )}
                      </div>
                      <span className={clsx("pill text-[10px] flex-shrink-0", EVENT_PILL[ev.type])}>
                        {EVENT_LABEL[ev.type]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Desno: vsi prihajajoči dogodki */}
        <div className="card">
          <div className="card-title">Prihajajoči dogodki</div>
          {upcoming.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">Ni prihodnjih dogodkov.</p>
          ) : (
            <div>
              {upcoming.map((ev) => {
                const d = new Date(ev.date);
                const member = MEMBERS.find((m) => m.id === ev.memberId);
                return (
                  <div key={ev.id} className="flex items-center gap-3 py-2.5 border-b border-neutral-50 last:border-0">
                    <div className="w-9 text-center flex-shrink-0">
                      <div className="text-sm font-semibold text-neutral-900 leading-none">{d.getDate()}</div>
                      <div className="text-[9px] text-neutral-400 uppercase">
                        {d.toLocaleString("sl-SI", { month: "short" })}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-neutral-800 truncate">{ev.title}</div>
                      <div className="text-[10px] text-neutral-400">
                        {ev.days === 0 ? "danes" : `čez ${ev.days} dni`}
                        {member ? ` · ${member.name}` : ""}
                      </div>
                    </div>
                    <span className={clsx("pill text-[10px] flex-shrink-0", EVENT_PILL[ev.type])}>
                      {EVENT_LABEL[ev.type]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <EventModal
          defaultDate={selectedDate ?? todayStr}
          onSave={addEvent}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
