"use client";

import { useState } from "react";
import { Edit3, Plus } from "lucide-react";
import { CATEGORIES } from "@/lib/data";
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
  { id: "budget",    label: "Opozorilo pri proračunu", desc: "Ko porabiš 80 % kategorije", on: true },
  { id: "birthday",  label: "Rojstni dnevi",           desc: "7 dni vnaprej",              on: true },
  { id: "deadline",  label: "Roki dokumentov",         desc: "Zavarovanja, pogodbe",        on: true },
  { id: "report",    label: "Mesečno poročilo",        desc: "1. v mesecu po e-pošti",      on: false },
];

const topLevelTypes = ["income", "fixed", "variable", "savings"] as const;

export default function Settings() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFS.map((n) => [n.id, n.on]))
  );
  const [openType, setOpenType] = useState<string | null>("income");

  const toggle = (id: string) =>
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));

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
                      const children = CATEGORIES.filter(
                        (c) => c.parentCode === parent.code
                      );
                      return (
                        <div key={parent.code}>
                          {/* Starš */}
                          <div className="flex items-center gap-2 py-1.5">
                            <span className="sif-code">{parent.code}</span>
                            <span className="text-xs font-medium text-neutral-700 flex-1">{parent.name}</span>
                            <button className="text-neutral-300 hover:text-neutral-500 p-0.5">
                              <Edit3 size={11} />
                            </button>
                          </div>
                          {/* Otroci */}
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
            <div className="card-title">Gospodinjstvo</div>
            {[
              { label: "Ime gospodinjstva", value: "Novak" },
              { label: "Valuta",            value: "EUR €" },
              { label: "Država",            value: "Slovenija" },
              { label: "Davčna lestvica",   value: "SLO 2026" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-neutral-50 last:border-0">
                <span className="text-xs text-neutral-600">{row.label}</span>
                <span className="text-xs text-neutral-500 font-medium">{row.value}</span>
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

          {/* Verzija */}
          <div className="text-center text-[10px] text-neutral-300 pt-2">
            Moje finance v0.1.0 · Podatki shranjeni lokalno
          </div>
        </div>
      </div>
    </div>
  );
}
