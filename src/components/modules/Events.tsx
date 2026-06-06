"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, BellOff, Check, Loader2, Pencil, Pill, Plus, Trash2, UserRound, X } from "lucide-react";
import { EVENTS, MEMBERS } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import {
  EVENT_DOT, EVENT_LABEL, EVENT_PILL, EVENT_TYPES,
  REMINDER_OPTIONS,
} from "@/lib/eventTypes";
import AppSelect from "@/components/ui/AppSelect";
import type { CalendarEvent, EventType, Member, ReminderFrequency } from "@/types";
import clsx from "clsx";

function todayIso() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function reminderTimes(pattern?: string) {
  if (!pattern) return [];
  return Array.from(pattern.matchAll(/\b([01]\d|2[0-3]):([0-5]\d)\b/g)).map((match) => match[0]);
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

export default function Events() {
  const [events, setEvents] = useState<CalendarEvent[]>(EVENTS);
  const [members, setMembers] = useState<Member[]>(MEMBERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formOpen, setFormOpen] = useState(true);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState({
    title: "",
    date: todayIso(),
    type: "doctor" as EventType,
    memberId: "",
    personName: "",
    description: "",
    reminderEnabled: true,
    reminderFrequency: "none" as ReminderFrequency,
    reminderPattern: "",
  });

  const eventTypeOptions = EVENT_TYPES.map((type) => ({
    value: type,
    label: EVENT_LABEL[type],
  }));

  const memberOptions = [
    { value: "", label: "Skupno / brez osebe" },
    { value: "__other__", label: "Druga oseba" },
    ...members.map((member) => ({ value: member.id, label: member.name })),
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const [{ data: eventRows, error: eventsError }, { data: memberRows, error: membersError }] = await Promise.all([
      supabase.from("events").select("*").order("date", { ascending: true }),
      supabase.from("members").select("*").order("name", { ascending: true }),
    ]);

    if (eventsError || membersError) {
      setError(eventsError?.message ?? membersError?.message ?? "Napaka pri nalaganju dogodkov.");
      setEvents(EVENTS);
      setMembers(MEMBERS);
      setLoading(false);
      return;
    }

    setEvents((eventRows ?? []).map((row) => mapEvent(row)));
    setMembers((memberRows ?? []).map((row) => mapMember(row)));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const checkMedicationReminders = () => {
      if (Notification.permission !== "granted") return;
      const now = new Date();
      const today = todayIso();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      events
        .filter((event) => event.type === "medication" && event.reminderEnabled)
        .forEach((event) => {
          if (event.date > today) return;
          const times = reminderTimes(event.reminderPattern);
          if (!times.includes(currentTime)) return;
          const notificationKey = `medication-reminder:${event.id}:${today}:${currentTime}`;
          if (localStorage.getItem(notificationKey)) return;
          localStorage.setItem(notificationKey, "sent");
          new Notification("Moje finance - opomnik za zdravilo", {
            body: `${event.title}${event.description ? ` - ${event.description}` : ""}`,
          });
        });
    };

    checkMedicationReminders();
    const interval = window.setInterval(checkMedicationReminders, 30_000);
    return () => window.clearInterval(interval);
  }, [events]);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.date.localeCompare(b.date)),
    [events]
  );

  const isMedication = form.type === "medication";
  const valid = form.title.trim().length > 0
    && form.date.length > 0
    && (!isMedication || !form.reminderEnabled || form.reminderPattern.trim().length > 0);

  function updateType(type: EventType) {
    setForm((current) => ({
      ...current,
      type,
      reminderEnabled: type === "medication" ? true : current.reminderEnabled,
      reminderFrequency: type === "medication" ? "daily" : current.reminderFrequency,
    }));
  }

  function resetForm() {
    setForm({
      title: "",
      date: todayIso(),
      type: "doctor",
      memberId: "",
      personName: "",
      description: "",
      reminderEnabled: true,
      reminderFrequency: "none",
      reminderPattern: "",
    });
    setEditing(null);
  }

  function editEvent(event: CalendarEvent) {
    setEditing(event);
    setSuccess("");
    setError("");
    setForm({
      title: event.title,
      date: event.date,
      type: event.type,
      memberId: event.memberId ?? (event.personName ? "__other__" : ""),
      personName: event.personName ?? "",
      description: event.description ?? event.notes ?? "",
      reminderEnabled: event.reminderEnabled ?? false,
      reminderFrequency: event.reminderFrequency ?? "none",
      reminderPattern: event.reminderPattern ?? "",
    });
    setFormOpen(true);
  }

  async function saveEvent() {
    if (!valid) return;
    setSaving(true);
    setError("");
    setSuccess("");

    if (isMedication && form.reminderEnabled && !form.reminderPattern.trim()) {
      setSaving(false);
      setError("Pri zdravilu vpiši ure opomnika, npr. 08:00, 16:00, 22:00.");
      return;
    }
    if (isMedication && form.reminderEnabled && reminderTimes(form.reminderPattern).length === 0) {
      setSaving(false);
      setError("Ure opomnika morajo biti v obliki HH:MM, npr. 08:00, 16:00, 22:00.");
      return;
    }

    if (isMedication && form.reminderEnabled && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }

    const supabase = createClient();
    const { data: householdId, error: householdError } = await supabase.rpc("get_household_id");
    if (householdError || !householdId) {
      setSaving(false);
      setError(householdError?.message ?? "Gospodinjstvo ni najdeno.");
      return;
    }

    const payload = {
      household_id: householdId,
      title: form.title.trim(),
      date: form.date,
      type: form.type,
      member_id: form.memberId && form.memberId !== "__other__" ? form.memberId : null,
      person_name: form.memberId === "__other__" ? form.personName.trim() || null : null,
      description: form.description.trim() || null,
      notes: form.description.trim() || null,
      reminder_enabled: form.reminderEnabled,
      reminder_frequency: form.reminderEnabled ? form.reminderFrequency : "none",
      reminder_pattern: form.reminderPattern.trim() || null,
      source: isMedication ? "medication" : "manual",
    };

    const query = editing
      ? supabase.from("events").update(payload).eq("id", editing.id)
      : supabase.from("events").insert(payload);

    const { data: saved, error: saveError } = await query.select().single();

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }

    if (saved) {
      const nextEvent = mapEvent(saved);
      setEvents((current) => editing
        ? current.map((event) => event.id === nextEvent.id ? nextEvent : event)
        : [nextEvent, ...current]
      );
    }
    setSuccess(editing ? "Dogodek je posodobljen." : "Dogodek je dodan.");
    resetForm();
    setFormOpen(false);
  }

  async function deleteEvent(event: CalendarEvent) {
    const confirmed = window.confirm("Izbrišem ta dogodek?");
    if (!confirmed) return;
    setError("");
    setSuccess("");
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("events").delete().eq("id", event.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setEvents((current) => current.filter((item) => item.id !== event.id));
    if (editing?.id === event.id) resetForm();
    setSuccess("Dogodek je izbrisan.");
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Dogodki</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Ročni dogodki, opomniki in urniki zdravil po osebi</p>
        </div>
        {!formOpen && (
          <button className="btn-primary" onClick={() => { resetForm(); setFormOpen(true); }}>
            <Plus size={14} />Nov dogodek
          </button>
        )}
      </div>

      {success && (
        <div className="rounded-lg border border-income-200 bg-income-50 px-3 py-2 text-xs text-income-700 flex items-center gap-2">
          <Check size={13} />{success}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
        {formOpen && <div className="card xl:col-span-1">
          <div className="card-title">
            <span>{editing ? "Uredi dogodek" : "Nov dogodek"}</span>
            <button
              className="btn-ghost"
              onClick={() => { resetForm(); setFormOpen(false); }}
              aria-label="Zapri obrazec"
            >
              <X size={14} />
            </button>
          </div>

          {error && (
            <div className="mb-3 rounded-lg border border-expense-200 bg-expense-50 px-3 py-2 text-xs text-expense-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-neutral-500 mb-1">Šifrant dogodka</label>
              <AppSelect
                value={form.type}
                placeholder="Izberi tip"
                options={eventTypeOptions}
                onChange={(type) => updateType(type as EventType)}
              />
            </div>

            <div>
              <label className="block text-[10px] text-neutral-500 mb-1">Opis dogodka *</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                placeholder={isMedication ? "npr. Jutranje zdravilo" : "npr. Zdravnik, obletnica, rok"}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-neutral-500 mb-1">Datum *</label>
                <input
                  type="date"
                  className="input"
                  value={form.date}
                  onChange={(e) => setForm((current) => ({ ...current, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[10px] text-neutral-500 mb-1">Oseba</label>
                <AppSelect
                  value={form.memberId}
                  placeholder="Skupno"
                  options={memberOptions}
                  onChange={(memberId) => setForm((current) => ({ ...current, memberId }))}
                />
              </div>
            </div>

            {form.memberId === "__other__" && (
              <div>
                <label className="block text-[10px] text-neutral-500 mb-1">Ime osebe</label>
                <input
                  className="input"
                  value={form.personName}
                  onChange={(e) => setForm((current) => ({ ...current, personName: e.target.value }))}
                  placeholder="npr. mama, oče, babica, skrbovana oseba"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] text-neutral-500 mb-1">
                {isMedication ? "Navodilo za jemanje" : "Opis in opomba"}
              </label>
              <textarea
                className="input min-h-20 resize-none"
                value={form.description}
                onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                placeholder={isMedication ? "npr. 1 tableta po hrani ali posebna navodila" : "Podrobnosti, lokacija, znesek ali opomba"}
              />
            </div>

            <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 space-y-3">
              <label className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-xs font-medium text-neutral-700">
                  {form.reminderEnabled ? <Bell size={14} className="text-brand-600" /> : <BellOff size={14} className="text-neutral-400" />}
                  Obvestilo
                </span>
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, reminderEnabled: !current.reminderEnabled }))}
                  className={clsx(
                    "h-5 w-9 rounded-full p-0.5 transition-colors",
                    form.reminderEnabled ? "bg-brand-600" : "bg-neutral-300"
                  )}
                >
                  <span className={clsx(
                    "block h-4 w-4 rounded-full bg-white transition-transform",
                    form.reminderEnabled && "translate-x-4"
                  )} />
                </button>
              </label>

              {form.reminderEnabled && (
                <>
                  <AppSelect
                    value={form.reminderFrequency}
                    placeholder="Izberi opomnik"
                    options={REMINDER_OPTIONS}
                    onChange={(value) => setForm((current) => ({ ...current, reminderFrequency: value as ReminderFrequency }))}
                  />
                  {(form.reminderFrequency === "custom" || isMedication) && (
                    <div>
                      <label className="block text-[10px] text-neutral-500 mb-1">
                        {isMedication ? "Ure opomnika *" : "Niz opomnika"}
                      </label>
                      <input
                        className="input"
                        value={form.reminderPattern}
                        onChange={(e) => setForm((current) => ({ ...current, reminderPattern: e.target.value }))}
                        placeholder={isMedication ? "npr. 08:00, 16:00, 22:00" : "npr. pon-pet 07:30"}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <button
              className="btn-primary w-full justify-center disabled:opacity-40"
              disabled={!valid || saving}
              onClick={saveEvent}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {editing ? "Shrani dogodek" : "Dodaj dogodek"}
            </button>
          </div>
        </div>}

        <div className={clsx("card", formOpen ? "xl:col-span-2" : "xl:col-span-3")}>
          <div className="card-title">Vpisani dogodki in opomniki</div>
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-neutral-400">
              <Loader2 size={16} className="animate-spin" />Nalagam...
            </div>
          )}
          {!loading && <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {sortedEvents.map((event) => {
              const member = members.find((m) => m.id === event.memberId);
              const personLabel = member?.name ?? event.personName;
              const reminderLabel = REMINDER_OPTIONS.find((option) => option.value === event.reminderFrequency)?.label ?? event.reminderFrequency;
              const detailText = event.description ?? event.notes;
              return (
                <div key={event.id} className="rounded-lg border border-neutral-100 p-3 hover:border-neutral-200 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={clsx("mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0", EVENT_DOT[event.type])} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-medium text-neutral-800 truncate">{event.title}</div>
                        <span className={clsx("pill text-[10px] flex-shrink-0", EVENT_PILL[event.type])}>
                          {EVENT_LABEL[event.type]}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-neutral-400">
                        <span>{event.date}</span>
                        {personLabel && <span className="inline-flex items-center gap-1"><UserRound size={10} />{personLabel}</span>}
                        {event.reminderEnabled && <span className="inline-flex items-center gap-1"><Bell size={10} />{reminderLabel}</span>}
                      </div>
                      {(event.description || event.notes || event.reminderPattern) && (
                        <div className="mt-2 text-[11px] text-neutral-500 leading-relaxed">
                          {event.type === "medication" && event.reminderPattern && (
                            <div className="font-medium text-emerald-700">Ure opomnika: {event.reminderPattern}</div>
                          )}
                          {detailText && <div>{detailText}</div>}
                          {event.type !== "medication" && event.reminderPattern && event.reminderPattern !== detailText ? (
                            <div>Opomnik: {event.reminderPattern}</div>
                          ) : null}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {event.type === "medication" && (
                        <Pill size={15} className="text-emerald-600 flex-shrink-0" />
                      )}
                      <button className="btn-secondary px-2 py-1" onClick={() => editEvent(event)} title="Uredi">
                        <Pencil size={12} />
                      </button>
                      <button className="btn-secondary px-2 py-1 text-expense-700 hover:bg-expense-50" onClick={() => deleteEvent(event)} title="Izbriši">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>}
        </div>
      </div>
    </div>
  );
}
