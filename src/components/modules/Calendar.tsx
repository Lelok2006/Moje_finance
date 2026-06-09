"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft, ChevronRight, Loader2, Plus, X,
} from "lucide-react";
import { DOCUMENTS, EVENTS, MEMBERS } from "@/lib/data";
import { daysUntil } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import AppSelect from "@/components/ui/AppSelect";
import {
  EVENT_CELL_BG,
  EVENT_DOT,
  EVENT_ICON,
  EVENT_LABEL,
  EVENT_PILL,
  EVENT_PRIORITY,
  EVENT_TYPES,
} from "@/lib/eventTypes";
import type { CalendarEvent, EventType, Member, ReminderFrequency } from "@/types";
import clsx from "clsx";

const MONTHS_SL = [
  "Januar","Februar","Marec","April","Maj","Junij",
  "Julij","Avgust","September","Oktober","November","December",
];
const DAYS_SL = ["Pon","Tor","Sre","Čet","Pet","Sob","Ned"];

function primaryType(evs: CalendarEvent[]): EventType {
  for (const t of EVENT_PRIORITY) if (evs.some((e) => e.type === t)) return t;
  return "other";
}

const DEFAULT_VISIBLE_TYPES = EVENT_TYPES.filter((type) =>
  type !== "school_holiday" && type !== "public_holiday"
);
const OPTIONAL_CALENDAR_TYPES: EventType[] = ["school_holiday", "public_holiday"];
const MAIN_CALENDAR_TYPES = EVENT_TYPES.filter((type) => !OPTIONAL_CALENDAR_TYPES.includes(type));
const CALENDAR_LAYERS_STORAGE_KEY = "lifedesk-calendar-layers";
const SCHOOL_HOLIDAY_GROUP_STORAGE_KEY = "lifedesk-school-holiday-group";

const SCHOOL_HOLIDAY_GROUPS = [
  {
    value: "west",
    label: "Zahodni del",
  },
  {
    value: "east",
    label: "Vzhodni del",
  },
] as const;

type SchoolHolidayGroup = (typeof SCHOOL_HOLIDAY_GROUPS)[number]["value"];

const SCHOOL_HOLIDAY_RANGES: Array<{
  schoolYear: string;
  title: string;
  start: string;
  end: string;
  group?: SchoolHolidayGroup;
}> = [
  { schoolYear: "2025/2026", title: "Jesenske šolske počitnice", start: "2025-10-27", end: "2025-10-31" },
  { schoolYear: "2025/2026", title: "Novoletne šolske počitnice", start: "2025-12-25", end: "2026-01-02" },
  { schoolYear: "2025/2026", title: "Zimske šolske počitnice", start: "2026-02-16", end: "2026-02-20", group: "west" },
  { schoolYear: "2025/2026", title: "Zimske šolske počitnice", start: "2026-02-23", end: "2026-02-27", group: "east" },
  { schoolYear: "2025/2026", title: "Prvomajske šolske počitnice", start: "2026-04-27", end: "2026-05-01" },
  { schoolYear: "2025/2026", title: "Poletne šolske počitnice", start: "2026-06-26", end: "2026-08-31" },
  { schoolYear: "2026/2027", title: "Jesenske šolske počitnice", start: "2026-10-26", end: "2026-10-30" },
  { schoolYear: "2026/2027", title: "Novoletne šolske počitnice", start: "2026-12-25", end: "2027-01-02" },
  { schoolYear: "2026/2027", title: "Zimske šolske počitnice", start: "2027-02-15", end: "2027-02-19", group: "east" },
  { schoolYear: "2026/2027", title: "Zimske šolske počitnice", start: "2027-02-22", end: "2027-02-26", group: "west" },
  { schoolYear: "2026/2027", title: "Prvomajske šolske počitnice", start: "2027-04-27", end: "2027-05-02" },
  { schoolYear: "2026/2027", title: "Poletne šolske počitnice", start: "2027-06-28", end: "2027-08-31" },
];

const SLOVENIAN_WORK_FREE_DAYS = [
  { month: 1, day: 1, title: "Novo leto" },
  { month: 1, day: 2, title: "Novo leto" },
  { month: 2, day: 8, title: "Prešernov dan" },
  { month: 4, day: 27, title: "Dan upora proti okupatorju" },
  { month: 5, day: 1, title: "Praznik dela" },
  { month: 5, day: 2, title: "Praznik dela" },
  { month: 6, day: 25, title: "Dan državnosti" },
  { month: 8, day: 15, title: "Marijino vnebovzetje" },
  { month: 10, day: 31, title: "Dan reformacije" },
  { month: 11, day: 1, title: "Dan spomina na mrtve" },
  { month: 12, day: 25, title: "Božič" },
  { month: 12, day: 26, title: "Dan samostojnosti in enotnosti" },
] as const;

function toLocalIso(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function easterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const easterMonth = Math.floor((h + l - 7 * m + 114) / 31);
  const easterDay = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, easterMonth - 1, easterDay);
}

function workFreeDayEventsForYear(year: number, savedEvents: CalendarEvent[]): CalendarEvent[] {
  const easter = easterSunday(year);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  const days = [
    ...SLOVENIAN_WORK_FREE_DAYS.map((holiday) => ({
      title: holiday.title,
      date: `${year}-${String(holiday.month).padStart(2, "0")}-${String(holiday.day).padStart(2, "0")}`,
    })),
    { title: "Velikonočni ponedeljek", date: toLocalIso(easterMonday) },
  ];
  const savedKeys = new Set(savedEvents.map((event) => `${event.date}|${event.title}|${event.type}`));

  return days
    .filter((holiday) => !savedKeys.has(`${holiday.date}|${holiday.title}|public_holiday`))
    .map((holiday) => ({
      id: `work-free-${holiday.date}-${holiday.title}`,
      title: holiday.title,
      date: holiday.date,
      type: "public_holiday" as EventType,
      notes: "Slovenski dela prost dan",
      description: "Slovenski dela prost dan",
      source: "manual",
      reminderEnabled: false,
      reminderFrequency: "none",
    }));
}

function datesInRange(startIso: string, endIso: string) {
  const dates: string[] = [];
  const current = new Date(startIso);
  const end = new Date(endIso);

  while (current <= end) {
    dates.push(toLocalIso(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function schoolHolidayEventsForYear(
  year: number,
  group: SchoolHolidayGroup,
  savedEvents: CalendarEvent[]
): CalendarEvent[] {
  const savedKeys = new Set(savedEvents.map((event) => `${event.date}|${event.title}|${event.type}`));
  const groupLabel = SCHOOL_HOLIDAY_GROUPS.find((item) => item.value === group)?.label ?? group;

  return SCHOOL_HOLIDAY_RANGES.flatMap((range) => {
    if (range.group && range.group !== group) return [];
    return datesInRange(range.start, range.end)
      .filter((date) => date.startsWith(`${year}-`))
      .filter((date) => !savedKeys.has(`${date}|${range.title}|school_holiday`))
      .map((date) => ({
        id: `school-holiday-${range.schoolYear}-${range.group ?? "all"}-${date}`,
        title: range.title,
        date,
        type: "school_holiday" as EventType,
        notes: range.group ? `${range.schoolYear} · ${groupLabel}` : range.schoolYear,
        description: range.group ? `${range.schoolYear} · ${groupLabel}` : range.schoolYear,
        source: "manual",
        reminderEnabled: false,
        reminderFrequency: "none" as ReminderFrequency,
      }));
  });
}

function mapEvent(row: Record<string, unknown>): CalendarEvent {
  return {
    id: String(row.id),
    title: String(row.title),
    date: String(row.date),
    type: row.type as EventType,
    memberId: row.member_id ? String(row.member_id) : undefined,
    personName: row.person_name ? String(row.person_name) : undefined,
    description: row.description ? String(row.description) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    reminderEnabled: Boolean(row.reminder_enabled),
    reminderFrequency: (row.reminder_frequency as ReminderFrequency | null) ?? "none",
    reminderPattern: row.reminder_pattern ? String(row.reminder_pattern) : undefined,
    source: (row.source as CalendarEvent["source"] | null) ?? "manual",
  };
}

function mapMember(row: Record<string, unknown>): Member {
  return {
    id: String(row.id),
    name: String(row.name),
    initials: String(row.initials),
    type: row.type as Member["type"],
    birthDate: row.birth_date ? String(row.birth_date) : undefined,
    color: row.color ? String(row.color) : "bg-neutral-100 text-neutral-500",
    isAdmin: Boolean(row.is_admin),
  };
}

function documentEvent(doc: Record<string, unknown>): CalendarEvent | null {
  const expiryDate = doc.expiry_date ? String(doc.expiry_date) : undefined;
  const dueDateValue = doc.due_date ? String(doc.due_date) : undefined;
  const documentDate = doc.document_date ? String(doc.document_date) : undefined;
  const status = doc.status ? String(doc.status) : "";
  const paymentStatus = doc.payment_status ? String(doc.payment_status) : "unknown";
  if (paymentStatus === "paid" || paymentStatus === "canceled" || status === "archived") return null;
  const dueDate = expiryDate ?? dueDateValue ?? (status === "pending_confirm" ? documentDate : undefined);
  if (!dueDate) return null;
  return {
    id: `doc-${String(doc.id)}`,
    title: expiryDate ? `Obveznost — ${String(doc.name)}` : `Valuta — ${String(doc.name)}`,
    date: dueDate,
    type: expiryDate ? "obligation" : "payment_due",
    notes: doc.ocr_amount ? `${Number(doc.ocr_amount)} EUR` : undefined,
    source: "document",
    reminderEnabled: true,
    reminderFrequency: "none",
  };
}

const MOCK_FINANCIAL_EVENTS: CalendarEvent[] = DOCUMENTS.flatMap((doc) => {
  const dueDate = doc.expiryDate ?? (doc.status === "pending_confirm" ? doc.documentDate : undefined);
  if (!dueDate) return [];
  return [{
    id: `doc-${doc.id}`,
    title: doc.expiryDate ? `Obveznost — ${doc.name}` : `Valuta — ${doc.name}`,
    date: dueDate,
    type: doc.expiryDate ? "obligation" : "payment_due",
    notes: doc.ocrAmount ? `${doc.ocrAmount} EUR` : undefined,
    source: "document",
    reminderEnabled: true,
    reminderFrequency: "none",
  }];
});

// ── Modal za dodajanje dogodka ────────────────────────────────
interface ModalProps {
  defaultDate: string;
  members: Member[];
  onSave: (ev: Omit<CalendarEvent, "id">) => void;
  onClose: () => void;
}

function EventModal({ defaultDate, members, onSave, onClose }: ModalProps) {
  const [form, setForm] = useState({
    title:    "",
    date:     defaultDate,
    type:     "other" as EventType,
    memberId: "",
    personName: "",
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
      memberId: form.memberId && form.memberId !== "__other__" ? form.memberId : undefined,
      personName: form.memberId === "__other__" ? form.personName.trim() || undefined : undefined,
      notes:    form.notes.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-sm">
        {/* Glava */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <span className="text-sm font-semibold text-neutral-900">Nov dogodek</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
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
              className="input"
            />
          </div>

          {/* Datum */}
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Datum *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="input"
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
            <AppSelect
              value={form.memberId}
              placeholder="— skupno —"
              options={[
                { value: "", label: "— skupno —" },
                { value: "__other__", label: "Druga oseba" },
                ...members.map((m) => ({ value: m.id, label: m.name })),
              ]}
              onChange={(memberId) => setForm((f) => ({ ...f, memberId }))}
            />
          </div>

          {form.memberId === "__other__" && (
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Ime osebe</label>
              <input
                type="text"
                value={form.personName}
                onChange={(e) => setForm((f) => ({ ...f, personName: e.target.value }))}
                placeholder="npr. mama, oče, babica"
                className="input"
              />
            </div>
          )}

          {/* Opomba */}
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Opomba (neobvezno)</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="npr. 18 dni, Triglav avto…"
              className="input"
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

  const [events, setEvents] = useState<CalendarEvent[]>([...EVENTS, ...MOCK_FINANCIAL_EVENTS]);
  const [members, setMembers] = useState<Member[]>(MEMBERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [visibleTypes, setVisibleTypes] = useState<EventType[]>(DEFAULT_VISIBLE_TYPES);
  const [schoolHolidayGroup, setSchoolHolidayGroup] = useState<SchoolHolidayGroup>("west");

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const [{ data: eventRows, error: eventsError }, { data: memberRows, error: membersError }, { data: docRows, error: docsError }] = await Promise.all([
      supabase.from("events").select("*").order("date", { ascending: true }),
      supabase.from("members").select("*").order("name", { ascending: true }),
      supabase
        .from("documents")
        .select("id,name,status,document_date,expiry_date,due_date,ocr_amount,payment_status")
        .or("expiry_date.not.is.null,due_date.not.is.null,document_date.not.is.null"),
    ]);

    if (eventsError || membersError || docsError) {
      setError(eventsError?.message ?? membersError?.message ?? docsError?.message ?? "Napaka pri nalaganju koledarja.");
      setEvents([...EVENTS, ...MOCK_FINANCIAL_EVENTS]);
      setMembers(MEMBERS);
      setLoading(false);
      return;
    }

    const financialEvents = (docRows ?? [])
      .map((row) => documentEvent(row))
      .filter((event): event is CalendarEvent => event !== null);

    setEvents([...(eventRows ?? []).map((row) => mapEvent(row)), ...financialEvents]);
    setMembers((memberRows ?? []).map((row) => mapMember(row)));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(CALENDAR_LAYERS_STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return;
      const next = parsed.filter((type): type is EventType => EVENT_TYPES.includes(type as EventType));
      if (next.length > 0) setVisibleTypes(next);
    } catch {
      window.localStorage.removeItem(CALENDAR_LAYERS_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(SCHOOL_HOLIDAY_GROUP_STORAGE_KEY);
    if (stored === "west" || stored === "east") setSchoolHolidayGroup(stored);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CALENDAR_LAYERS_STORAGE_KEY, JSON.stringify(visibleTypes));
  }, [visibleTypes]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SCHOOL_HOLIDAY_GROUP_STORAGE_KEY, schoolHolidayGroup);
  }, [schoolHolidayGroup]);

  function prevMonth() { setViewDate(new Date(year, month - 1, 1)); setSelectedDate(null); }
  function nextMonth() { setViewDate(new Date(year, month + 1, 1)); setSelectedDate(null); }

  function toDateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const calendarEvents = [
    ...events,
    ...workFreeDayEventsForYear(year, events),
    ...schoolHolidayEventsForYear(year, schoolHolidayGroup, events),
  ];
  const visibleEvents = calendarEvents.filter((event) => visibleTypes.includes(event.type));

  function eventsOn(day: number) { return visibleEvents.filter((e) => e.date === toDateStr(day)); }

  function toggleType(type: EventType) {
    const willShow = !visibleTypes.includes(type);

    setVisibleTypes((current) => current.includes(type)
      ? current.filter((item) => item !== type)
      : [...current, type]
    );

    if (willShow && OPTIONAL_CALENDAR_TYPES.includes(type)) {
      const matchingEvents = calendarEvents
        .filter((event) => event.type === type)
        .sort((a, b) => {
          const aPast = a.date < todayStr;
          const bPast = b.date < todayStr;
          if (aPast !== bPast) return aPast ? 1 : -1;
          return a.date.localeCompare(b.date);
        });
      const target = matchingEvents[0];

      if (target) {
        const [targetYear, targetMonth] = target.date.split("-").map(Number);
        setViewDate(new Date(targetYear, targetMonth - 1, 1));
        setSelectedDate(target.date);
      }
    }
  }

  function typeCount(type: EventType) {
    return calendarEvents.filter((event) => event.type === type).length;
  }

  async function addEvent(data: Omit<CalendarEvent, "id">) {
    const supabase = createClient();
    const { data: householdId, error: householdError } = await supabase.rpc("get_household_id");
    if (householdError || !householdId) {
      setError(householdError?.message ?? "Gospodinjstvo ni najdeno.");
      return;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("events")
      .insert({
        household_id: householdId,
        title: data.title,
        date: data.date,
        type: data.type,
        member_id: data.memberId ?? null,
        person_name: data.personName ?? null,
        notes: data.notes ?? null,
        description: data.description ?? data.notes ?? null,
        reminder_enabled: data.reminderEnabled ?? false,
        reminder_frequency: data.reminderFrequency ?? "none",
        reminder_pattern: data.reminderPattern ?? null,
        source: data.source ?? "manual",
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (inserted) {
      setEvents((prev) => [...prev, mapEvent(inserted)]);
    }
    setShowModal(false);
  }

  const selectedEvents = selectedDate ? visibleEvents.filter((e) => e.date === selectedDate) : [];

  // Vsi prihodnji dogodki, urejeni po datumu
  const upcoming = visibleEvents
    .map((e) => ({ ...e, days: daysUntil(e.date) }))
    .filter((e) => e.days >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Dogodki tega meseca
  const thisMonthEvents = visibleEvents
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

      {error && (
        <div className="rounded-lg border border-expense-200 bg-expense-50 px-3 py-2 text-xs text-expense-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Loader2 size={16} className="animate-spin" />Nalagam koledar...
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

        {/* Levo: mesečna mreža + dogodki meseca */}
        <div className="lg:col-span-2 space-y-4">

          {/* Mreža */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                <ChevronLeft size={16} className="text-neutral-500" />
              </button>
              <span className="text-sm font-semibold text-neutral-900">
                {MONTHS_SL[month]} {year}
              </span>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
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
                      "hover:bg-neutral-50 dark:hover:bg-neutral-800"
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

          <div className="card">
            <div className="card-title">
              <span>Plasti koledarja</span>
              <span className="text-[11px] font-normal text-neutral-400">vklopi, kar uporabljaš</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {MAIN_CALENDAR_TYPES.map((type) => {
                const active = visibleTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleType(type)}
                    className={clsx(
                      "pill text-[11px] transition-all",
                      active ? EVENT_PILL[type] : "pill-gray opacity-60"
                    )}
                  >
                    <span className={clsx("w-2 h-2 rounded-full", active ? EVENT_DOT[type] : "bg-neutral-300")} />
                    {EVENT_LABEL[type]}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 p-3">
              <div className="text-xs font-medium text-neutral-700 mb-2">Opcijsko</div>
              <div className="flex flex-wrap gap-2">
                {OPTIONAL_CALENDAR_TYPES.map((type) => {
                  const active = visibleTypes.includes(type);
                  const count = typeCount(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleType(type)}
                      className={clsx(
                        "pill text-[11px] transition-all",
                        active ? EVENT_PILL[type] : "pill-gray opacity-70"
                      )}
                    >
                      <span className={clsx("w-2 h-2 rounded-full", active ? EVENT_DOT[type] : "bg-neutral-300")} />
                      {active ? "Vklopljeno: " : "Vklopi: "}{EVENT_LABEL[type]} ({count})
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 max-w-xs">
                <label className="block text-[10px] uppercase tracking-wide text-neutral-400 mb-1">
                  Regija za zimske počitnice
                </label>
                <AppSelect
                  value={schoolHolidayGroup}
                  placeholder="Izberi regijo"
                  options={SCHOOL_HOLIDAY_GROUPS.map((group) => ({ value: group.value, label: group.label }))}
                  onChange={(value) => setSchoolHolidayGroup(value as SchoolHolidayGroup)}
                />
              </div>
            </div>
            <p className="text-[11px] text-neutral-400 mt-3">
              Šolske počitnice in dela prosti dnevi niso privzeto prikazani. Vklopi jih tukaj, če jih želiš videti v koledarju.
              Dela prosti dnevi in šolske počitnice se izračunajo za prikazano leto; izbrana regija vpliva na zimske počitnice.
            </p>
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
                  const member = members.find((m) => m.id === ev.memberId);
                  const personLabel = member?.name ?? ev.personName;
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
                        EVENT_CELL_BG[ev.type]
                      )}>
                        {EVENT_ICON[ev.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-neutral-800 truncate">{ev.title}</div>
                        {(ev.notes || personLabel) && (
                          <div className="text-[10px] text-neutral-400">
                            {ev.notes}{ev.notes && personLabel ? " · " : ""}{personLabel}
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
                const member = members.find((m) => m.id === ev.memberId);
                const personLabel = member?.name ?? ev.personName;
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
                        {personLabel ? ` · ${personLabel}` : ""}
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
          members={members}
          onSave={addEvent}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
