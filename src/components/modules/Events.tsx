"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, BellOff, Loader2, Plus, Pill, UserRound } from "lucide-react";
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
  return new Date().toISOString().slice(0, 10);
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

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.date.localeCompare(b.date)),
    [events]
  );

  const valid = form.title.trim().length > 0 && form.date.length > 0;
  const isMedication = form.type === "medication";

  async function addEvent() {
    if (!valid) return;
    setSaving(true);
    setError("");

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

    const { data: inserted, error: insertError } = await supabase
      .from("events")
      .insert(payload)
      .select()
      .single();

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (inserted) {
      setEvents((current) => [mapEvent(inserted), ...current]);
    }
    setForm((current) => ({
      ...current,
      title: "",
      description: "",
      personName: "",
      reminderPattern: isMedication ? current.reminderPattern : "",
    }));
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Dogodki</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Ročni dogodki, opomniki in urniki zdravil po osebi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
        <div className="card xl:col-span-1">
          <div className="card-title">Nov dogodek</div>

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
                onChange={(type) => setForm((current) => ({ ...current, type: type as EventType }))}
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
                {isMedication ? "Urnik jemanja / niz" : "Opis in opomba"}
              </label>
              <textarea
                className="input min-h-20 resize-none"
                value={form.description}
                onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                placeholder={isMedication ? "npr. 08:00 1 tableta; 20:00 1 tableta po hrani" : "Podrobnosti, lokacija, znesek ali opomba"}
              />
            </div>

            <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 space-y-3">
              <label className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-xs font-medium text-neutral-700">
                  {form.reminderEnabled ? <Bell size={14} className="text-brand-600" /> : <BellOff size={14} className="text-neutral-400" />}
                  Notification
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
                    <input
                      className="input"
                      value={form.reminderPattern}
                      onChange={(e) => setForm((current) => ({ ...current, reminderPattern: e.target.value }))}
                      placeholder="npr. 08:00,20:00 ali pon-pet 07:30"
                    />
                  )}
                </>
              )}
            </div>

            <button
              className="btn-primary w-full justify-center disabled:opacity-40"
              disabled={!valid || saving}
              onClick={addEvent}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Dodaj dogodek
            </button>
          </div>
        </div>

        <div className="card xl:col-span-2">
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
                        {event.reminderEnabled && <span className="inline-flex items-center gap-1"><Bell size={10} />{event.reminderFrequency}</span>}
                      </div>
                      {(event.description || event.notes || event.reminderPattern) && (
                        <div className="mt-2 text-[11px] text-neutral-500 leading-relaxed">
                          {event.description ?? event.notes}
                          {event.reminderPattern ? ` · ${event.reminderPattern}` : ""}
                        </div>
                      )}
                    </div>
                    {event.type === "medication" && (
                      <Pill size={15} className="mt-0.5 text-emerald-600 flex-shrink-0" />
                    )}
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
