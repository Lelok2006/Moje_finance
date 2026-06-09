"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2, UserPlus, X } from "lucide-react";
import { EVENTS, MEMBERS, TRANSACTIONS } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { formatEur, daysUntil } from "@/lib/utils";
import { EVENT_CELL_BG, EVENT_ICON, EVENT_LABEL, EVENT_PILL } from "@/lib/eventTypes";
import AppSelect from "@/components/ui/AppSelect";
import type { CalendarEvent, EventType, Member, MemberType, ReminderFrequency, Transaction } from "@/types";
import clsx from "clsx";

const MEMBER_TYPE_OPTIONS = [
  { value: "adult", label: "Odrasli" },
  { value: "child", label: "Otrok" },
  { value: "pet",   label: "Hišni ljubljenček" },
];

function initialsFor(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";
}

function mapMember(row: Record<string, unknown>): Member {
  return {
    id: String(row.id),
    name: String(row.name),
    initials: String(row.initials),
    type: row.type as MemberType,
    birthDate: row.birth_date ? String(row.birth_date) : undefined,
    color: row.color ? String(row.color) : "bg-neutral-100 text-neutral-600",
    isAdmin: Boolean(row.is_admin),
  };
}

function mapTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: String(row.id),
    date: String(row.date),
    description: String(row.description),
    amount: Number(row.amount),
    type: row.type as Transaction["type"],
    categoryCode: row.category_code ? String(row.category_code) : "",
    memberId: row.member_id ? String(row.member_id) : undefined,
    documentId: row.document_id ? String(row.document_id) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
  };
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

export default function Members() {
  const [members, setMembers] = useState<Member[]>(MEMBERS);
  const [transactions, setTransactions] = useState<Transaction[]>(TRANSACTIONS);
  const [events, setEvents] = useState<CalendarEvent[]>(EVENTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState<Member | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "adult" as MemberType,
    birthDate: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const [{ data: memberRows, error: membersError }, { data: txRows }, { data: eventRows }] = await Promise.all([
      supabase.from("members").select("*").order("name", { ascending: true }),
      supabase.from("transactions").select("*"),
      supabase.from("events").select("*").order("date", { ascending: true }),
    ]);

    if (membersError) {
      setError(membersError.message);
      setMembers(MEMBERS);
      setTransactions(TRANSACTIONS);
      setEvents(EVENTS);
      setLoading(false);
      return;
    }

    setMembers((memberRows ?? []).map((row) => mapMember(row)));
    setTransactions((txRows ?? []).map((row) => mapTransaction(row)));
    setEvents((eventRows ?? []).map((row) => mapEvent(row)));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const upcoming = useMemo(
    () => [...events].sort((a, b) => a.date.localeCompare(b.date)),
    [events]
  );

  function openNew() {
    setEditing(null);
    setForm({ name: "", type: "adult", birthDate: "" });
    setError("");
    setSuccess("");
    setFormOpen(true);
  }

  function openEdit(member: Member) {
    setEditing(member);
    setForm({
      name: member.name,
      type: member.type,
      birthDate: member.birthDate ?? "",
    });
    setError("");
    setSuccess("");
    setFormOpen(true);
  }

  async function saveMember() {
    if (!form.name.trim()) {
      setError("Ime člana je obvezno.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    const supabase = createClient();
    const payload = {
      name: form.name.trim(),
      initials: initialsFor(form.name),
      type: form.type,
      birth_date: form.birthDate || null,
      color: form.type === "adult"
        ? "bg-brand-50 text-brand-600"
        : form.type === "child"
          ? "bg-warn-50 text-warn-700"
          : "bg-purple-50 text-purple-700",
    };

    let result;
    if (editing) {
      result = await supabase.from("members").update(payload).eq("id", editing.id).select().single();
    } else {
      const { data: householdId, error: householdError } = await supabase.rpc("get_household_id");
      if (householdError || !householdId) {
        setSaving(false);
        setError(householdError?.message ?? "Gospodinjstvo ni najdeno.");
        return;
      }
      result = await supabase
        .from("members")
        .insert({ ...payload, household_id: householdId, is_admin: false })
        .select()
        .single();
    }

    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }

    const saved = mapMember(result.data);
    setMembers((current) => editing
      ? current.map((member) => member.id === saved.id ? saved : member)
      : [...current, saved]
    );
    setSuccess(editing ? "Član je posodobljen." : "Član je dodan.");
    setFormOpen(false);
    setEditing(null);
  }

  async function deleteMember(member: Member) {
    if (member.isAdmin) {
      setError("Skrbnika gospodinjstva ni mogoče izbrisati tukaj.");
      return;
    }

    const confirmed = window.confirm(`Izbrišem člana ${member.name}? Povezani dogodki in transakcije ostanejo, vendar ne bodo več vezani na člana.`);
    if (!confirmed) return;

    setError("");
    setSuccess("");
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("members").delete().eq("id", member.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setMembers((current) => current.filter((item) => item.id !== member.id));
    setSuccess("Član je izbrisan.");
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Člani gospodinjstva</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Osebe, statistike in dogodki</p>
        </div>
        <button className="btn-primary" onClick={openNew}><UserPlus size={14} />Dodaj člana</button>
      </div>

      {error && (
        <div className="rounded-lg border border-expense-200 bg-expense-50 px-3 py-2 text-xs text-expense-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-income-200 bg-income-50 px-3 py-2 text-xs text-income-700 flex items-center gap-2">
          <Check size={13} />{success}
        </div>
      )}

      {formOpen && (
        <div className="card max-w-lg">
          <div className="card-title">
            <span>{editing ? "Uredi člana" : "Nov član"}</span>
            <button className="btn-ghost" onClick={() => setFormOpen(false)} aria-label="Zapri obrazec">
              <X size={14} />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-neutral-500 mb-1">Ime *</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                placeholder="npr. Ana Novak"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-neutral-500 mb-1">Tip</label>
                <AppSelect
                  value={form.type}
                  placeholder="Izberi tip"
                  options={MEMBER_TYPE_OPTIONS}
                  onChange={(type) => setForm((current) => ({ ...current, type: type as MemberType }))}
                />
              </div>
              <div>
                <label className="block text-[10px] text-neutral-500 mb-1">Rojstni datum</label>
                <input
                  type="date"
                  className="input"
                  value={form.birthDate}
                  onChange={(e) => setForm((current) => ({ ...current, birthDate: e.target.value }))}
                />
              </div>
            </div>
            <button className="btn-primary justify-center w-full" disabled={saving} onClick={saveMember}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {editing ? "Shrani člana" : "Dodaj člana"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-neutral-400">
          <Loader2 size={16} className="animate-spin" />Nalagam člane...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => {
            const memberIncome  = transactions.filter((tx) => tx.memberId === member.id && tx.type === "income").reduce((sum, tx) => sum + tx.amount, 0);
            const memberExpense = transactions.filter((tx) => tx.memberId === member.id && tx.type === "expense").reduce((sum, tx) => sum + tx.amount, 0);
            const age = member.birthDate
              ? Math.floor((Date.now() - new Date(member.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
              : null;

            return (
              <div key={member.id} className="card border text-center">
                <div className={clsx("w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold mx-auto mb-3", member.color)}>
                  {member.initials}
                </div>
                <div className="text-sm font-semibold text-neutral-900">{member.name}</div>
                <div className="text-xs text-neutral-400 mt-0.5 mb-3">
                  {member.type === "adult" ? "Odrasli" : member.type === "child" ? "Otrok" : "Hišni ljubljenček"}
                  {age ? ` · ${age} let` : ""}
                </div>
                <div className="flex gap-1 justify-center flex-wrap mb-3">
                  {member.isAdmin && <span className="pill pill-blue">Skrbnik</span>}
                  <span className={clsx("pill", member.type === "adult" ? "pill-green" : member.type === "child" ? "pill-amber" : "pill-purple")}>
                    {member.type === "adult" ? "Odrasli" : member.type === "child" ? "Otrok" : "Žival"}
                  </span>
                </div>
                <div className="flex justify-center gap-6 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-income-700">{formatEur(memberIncome)}</div>
                    <div className="text-[10px] text-neutral-400">Prihodki</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-expense-700">{formatEur(memberExpense)}</div>
                    <div className="text-[10px] text-neutral-400">Odhodki</div>
                  </div>
                </div>
                <div className="mt-3 flex justify-center gap-2">
                  <button className="btn-secondary" onClick={() => openEdit(member)}>
                    Uredi
                  </button>
                  {!member.isAdmin && (
                    <button className="btn-secondary text-expense-700 hover:bg-expense-50" onClick={() => deleteMember(member)}>
                      Izbriši
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card">
        <div className="card-title">Dogodki in opomniki</div>
        <div>
          {upcoming.map((event) => {
            const d = new Date(event.date);
            const days = daysUntil(event.date);
            const member = members.find((item) => item.id === event.memberId);
            return (
              <div key={event.id} className="flex items-center gap-3 py-2.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                <div className="w-11 text-center flex-shrink-0">
                  <div className="text-base font-semibold text-neutral-900 leading-none">{d.getDate()}</div>
                  <div className="text-[10px] text-neutral-400 uppercase">
                    {d.toLocaleString("sl-SI", { month: "short" })}
                  </div>
                </div>
                <div className={clsx("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-neutral-500", EVENT_CELL_BG[event.type])}>
                  {EVENT_ICON[event.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-neutral-800">{event.title}</div>
                  <div className="text-[10px] text-neutral-400">
                    {days > 0 ? `čez ${days} dni` : days === 0 ? "danes" : `pred ${Math.abs(days)} dnevi`}
                    {event.notes ? ` · ${event.notes}` : ""}
                    {member ? ` · ${member.name}` : event.personName ? ` · ${event.personName}` : ""}
                  </div>
                </div>
                <span className={clsx("pill text-[10px] flex-shrink-0", EVENT_PILL[event.type])}>
                  {EVENT_LABEL[event.type]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
