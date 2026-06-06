"use client";

import { useState } from "react";
import { Edit3, Plus, Check, X, Copy, Link, Loader2, RotateCcw } from "lucide-react";
import { CATEGORIES } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import clsx from "clsx";

const TYPE_PILL: Record<string, string> = {
  income:   "pill pill-green",
  fixed:    "pill pill-red",
  variable: "pill pill-amber",
  savings:  "pill pill-blue",
};
const TYPE_LABEL: Record<string, string> = {
  income: "Prihodki", fixed: "Stalni", variable: "Variabilni", savings: "Prihranki",
};

const NOTIFS = [
  { id: "budget",   label: "Opozorilo pri proračunu", desc: "Ko porabiš 80 % kategorije", on: true  },
  { id: "birthday", label: "Rojstni dnevi",           desc: "7 dni vnaprej",              on: true  },
  { id: "deadline", label: "Roki dokumentov",         desc: "Zavarovanja, pogodbe",        on: true  },
  { id: "overdue",  label: "Zapadle položnice",        desc: "Ko račun preseže rok plačila", on: true  },
  { id: "report",   label: "Mesečno poročilo",        desc: "1. v mesecu po e-pošti",      on: false },
];

const HOUSEHOLD_FIELDS = [
  { key: "name",     label: "Ime gospodinjstva", editable: true  },
  { key: "currency", label: "Valuta",            editable: false },
  { key: "country",  label: "Država",            editable: true  },
  { key: "taxScale", label: "Davčna lestvica",   editable: false },
] as const;

type HouseholdKey = typeof HOUSEHOLD_FIELDS[number]["key"];

const topLevelTypes = ["income", "fixed", "variable", "savings"] as const;

export default function Settings() {
  const supabase = createClient();

  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFS.map((n) => [n.id, n.on]))
  );
  const [openType, setOpenType] = useState<string | null>("income");

  // Povabilo
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  async function generateInvite() {
    setInviteLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: profile } = await db.from("user_profiles").select("household_id").maybeSingle();
    if (!profile) { setInviteLoading(false); return; }

    const { data: invite } = await db
      .from("household_invites")
      .insert({ household_id: profile.household_id })
      .select("token")
      .single();

    if (invite) setInviteLink(`${window.location.origin}/invite/${invite.token}`);
    setInviteLoading(false);
  }

  function copyLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const [household, setHousehold] = useState<Record<HouseholdKey, string>>({
    name:     "Novak",
    currency: "EUR €",
    country:  "Slovenija",
    taxScale: "SLO 2026",
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<HouseholdKey, string>>(household);

  function startEdit() { setDraft(household); setEditing(true); }
  function saveEdit()  { setHousehold(draft); setEditing(false); }
  function cancelEdit(){ setEditing(false); }

  const toggle = (id: string) =>
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));

  async function resetTestData() {
    const confirmed = window.confirm(
      "Izbrišem testne dogodke, dokumente, transakcije in proračun za to gospodinjstvo? Člani ostanejo."
    );
    if (!confirmed) return;

    setResetLoading(true);
    setResetMessage("");
    setResetError("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("reset_household_test_data", {
      p_reset_members: false,
    });
    setResetLoading(false);

    if (error) {
      setResetError(error.message);
      return;
    }

    setResetMessage("Testni podatki gospodinjstva so pobrisani.");
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Nastavitve</h1>
        <p className="text-xs text-neutral-400 mt-0.5">Šifranti, profil in sistem</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Šifranti */}
        <div className="card">
          <div className="card-title">
            Šifranti — kategorije
            <button className="btn-secondary text-xs"><Plus size={12} />Nova kategorija</button>
          </div>

          {topLevelTypes.map((type) => {
            const parents = CATEGORIES.filter((c) => c.type === type && !c.parentCode);
            const isOpen = openType === type;
            return (
              <div key={type} className="mb-1">
                <button
                  className="w-full flex items-center justify-between py-2 text-xs font-medium text-neutral-700 hover:text-neutral-900"
                  onClick={() => setOpenType(isOpen ? null : type)}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-neutral-300">{isOpen ? "▾" : "▸"}</span>
                    {TYPE_LABEL[type]}
                  </span>
                  <span className={clsx("pill text-[10px]", TYPE_PILL[type])}>
                    {CATEGORIES.filter((c) => c.type === type).length}
                  </span>
                </button>

                {isOpen && (
                  <div className="ml-3 border-l border-neutral-100 pl-3 mb-2">
                    {parents.map((parent) => {
                      const children = CATEGORIES.filter((c) => c.parentCode === parent.code);
                      return (
                        <div key={parent.code}>
                          <div className="flex items-center gap-2 py-1.5">
                            <span className="sif-code">{parent.code}</span>
                            <span className="text-xs font-medium text-neutral-700 flex-1">{parent.name}</span>
                            <button className="text-neutral-300 hover:text-neutral-500 p-0.5">
                              <Edit3 size={11} />
                            </button>
                          </div>
                          {children.map((child) => (
                            <div key={child.code} className="flex items-center gap-2 py-1 pl-4">
                              <span className="sif-code">{child.code}</span>
                              <span className="text-xs text-neutral-500 flex-1">{child.name}</span>
                              <button className="text-neutral-200 hover:text-neutral-400 p-0.5">
                                <Edit3 size={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="border-b border-neutral-50" />
              </div>
            );
          })}
        </div>

        {/* Desni stolpec */}
        <div className="space-y-4">

          {/* Gospodinjstvo */}
          <div className="card">
            <div className="card-title">
              Gospodinjstvo
              {!editing ? (
                <button onClick={startEdit} className="btn-secondary text-xs">
                  <Edit3 size={12} />Uredi
                </button>
              ) : (
                <div className="flex gap-1.5">
                  <button onClick={saveEdit} className="btn-primary text-xs py-1">
                    <Check size={12} />Shrani
                  </button>
                  <button onClick={cancelEdit} className="btn-secondary text-xs py-1">
                    <X size={12} />Prekliči
                  </button>
                </div>
              )}
            </div>

            {HOUSEHOLD_FIELDS.map((field) => (
              <div
                key={field.key}
                className="flex items-center justify-between py-2 border-b border-neutral-50 last:border-0 gap-4"
              >
                <span className="text-xs text-neutral-600 flex-shrink-0">{field.label}</span>
                {editing && field.editable ? (
                  <input
                    type="text"
                    value={draft[field.key]}
                    onChange={(e) => setDraft((d) => ({ ...d, [field.key]: e.target.value }))}
                    className="text-xs text-neutral-800 font-medium text-right bg-neutral-50 border border-neutral-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-400 w-36"
                  />
                ) : (
                  <span className="text-xs text-neutral-500 font-medium">{household[field.key]}</span>
                )}
              </div>
            ))}
          </div>

          {/* Obvestila */}
          <div className="card">
            <div className="card-title">Obvestila</div>
            {NOTIFS.map((n) => (
              <div key={n.id} className="flex items-center justify-between py-2.5 border-b border-neutral-50 last:border-0">
                <div>
                  <div className="text-xs font-medium text-neutral-700">{n.label}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">{n.desc}</div>
                </div>
                <button
                  onClick={() => toggle(n.id)}
                  className={clsx(
                    "w-9 h-5 rounded-full relative transition-colors flex-shrink-0",
                    toggles[n.id] ? "bg-income-500" : "bg-neutral-200"
                  )}
                  aria-label={`Preklopi ${n.label}`}
                >
                  <span
                    className={clsx(
                      "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform",
                      toggles[n.id] ? "translate-x-4" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>
            ))}
          </div>

          {/* Povabilo */}
          <div className="card">
            <div className="card-title">
              Povabi člana
            </div>
            <p className="text-xs text-neutral-500 mb-3">
              Ustvari enkratno povabilo in pošlji povezavo osebi, ki se želi pridružiti.
            </p>
            {!inviteLink ? (
              <button
                onClick={generateInvite}
                disabled={inviteLoading}
                className="btn-secondary w-full justify-center disabled:opacity-50"
              >
                <Link size={13} />
                {inviteLoading ? "Ustvarjam…" : "Ustvari povabilo"}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2">
                  <span className="text-[11px] text-neutral-500 flex-1 truncate">{inviteLink}</span>
                  <button onClick={copyLink} className="flex-shrink-0 text-brand-600 hover:text-brand-700">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[10px] text-neutral-400">Veljavno 7 dni · Ena oseba</p>
                <button
                  onClick={() => { setInviteLink(null); setCopied(false); }}
                  className="btn-ghost text-xs w-full justify-center"
                >
                  Novo povabilo
                </button>
              </div>
            )}
          </div>

          {/* Verzija */}
          <div className="card border-expense-200">
            <div className="card-title text-expense-700">Testiranje</div>
            <p className="text-xs text-neutral-500 mb-3">
              Pobriše samo podatke trenutnega gospodinjstva: dogodke, dokumente, transakcije in proračun. Uporabnik, gospodinjstvo, člani in šifranti ostanejo.
            </p>
            {resetMessage && (
              <p className="mb-2 rounded-lg border border-income-200 bg-income-50 px-3 py-2 text-xs text-income-700">
                {resetMessage}
              </p>
            )}
            {resetError && (
              <p className="mb-2 rounded-lg border border-expense-200 bg-expense-50 px-3 py-2 text-xs text-expense-700">
                {resetError}
              </p>
            )}
            <button
              onClick={resetTestData}
              disabled={resetLoading}
              className="btn-secondary w-full justify-center text-expense-700 hover:bg-expense-50 disabled:opacity-50"
            >
              {resetLoading ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
              Testni reset mojega gospodinjstva
            </button>
          </div>

          {/* Verzija */}
          <div className="text-center text-[10px] text-neutral-300 pt-2">
            Moje finance v0.1.0 · Podatki shranjeni varno v Supabase
          </div>
        </div>
      </div>
    </div>
  );
}
