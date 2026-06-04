"use client";

import { useState } from "react";
import { Plus, Filter, Download, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { TRANSACTIONS, CATEGORIES } from "@/lib/data";
import { formatEur, formatDate, getCategory, categoryColor } from "@/lib/utils";
import clsx from "clsx";

export default function Finance() {
  const [filter, setFilter] = useState<"vse" | "prihodki" | "odhodki">("vse");

  const income  = TRANSACTIONS.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = TRANSACTIONS.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const filtered = TRANSACTIONS
    .filter((t) => filter === "vse" || (filter === "prihodki" ? t.type === "income" : t.type === "expense"))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="p-4 md:p-6 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Finance</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Prihodki, odhodki in proračun</p>
        </div>
        <button className="btn-primary">
          <Plus size={14} /> Novi vnos
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="kpi-card">
          <div className="kpi-label"><TrendingUp size={12} className="text-income-700" />Prihodki junij</div>
          <div className="kpi-value text-income-700">{formatEur(income)}</div>
          <div className="kpi-delta">+8 % vs maj</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label"><TrendingDown size={12} className="text-expense-700" />Odhodki junij</div>
          <div className="kpi-value text-expense-700">{formatEur(expense)}</div>
          <div className="kpi-delta">Stalni: 807 €</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label"><PiggyBank size={12} className="text-brand-600" />Prihranki leto</div>
          <div className="kpi-value text-brand-600">5.820 €</div>
          <div className="kpi-delta">Cilj: 8.000 €</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Skupaj sredstva</div>
          <div className="kpi-value text-purple-700">12.400 €</div>
          <div className="kpi-delta">Vsi računi</div>
        </div>
      </div>

      {/* Tabela transakcij */}
      <div className="card">
        <div className="card-title">
          <span>Transakcije — junij 2026</span>
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-xs"><Filter size={12} />Filtriraj</button>
            <button className="btn-secondary text-xs"><Download size={12} />CSV</button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-3 p-1 bg-neutral-50 rounded-lg w-fit">
          {(["vse", "prihodki", "odhodki"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "text-xs px-3 py-1.5 rounded-md transition-all capitalize",
                filter === f
                  ? "bg-white text-neutral-800 font-medium shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Desktop tabela */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left text-xs text-neutral-400 font-medium pb-2 w-8"></th>
                <th className="text-left text-xs text-neutral-400 font-medium pb-2">Opis</th>
                <th className="text-left text-xs text-neutral-400 font-medium pb-2">Datum</th>
                <th className="text-left text-xs text-neutral-400 font-medium pb-2">Kategorija</th>
                <th className="text-left text-xs text-neutral-400 font-medium pb-2">Član</th>
                <th className="text-right text-xs text-neutral-400 font-medium pb-2">Znesek</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => {
                const cat = getCategory(tx.categoryCode);
                return (
                  <tr key={tx.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                    <td className="py-2.5 pr-2">
                      <div className={clsx(
                        "w-7 h-7 rounded-lg flex items-center justify-center text-xs",
                        tx.type === "income" ? "bg-income-50 text-income-700" : "bg-expense-50 text-expense-700"
                      )}>
                        {tx.type === "income" ? "↓" : "↑"}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="text-xs font-medium text-neutral-800">{tx.description}</div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="text-xs text-neutral-500">{formatDate(tx.date)}</div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={clsx("sif-code mr-1")}>{cat?.code}</span>
                      <span className="text-xs text-neutral-500 hidden lg:inline">{cat?.name}</span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="text-xs text-neutral-500">{tx.memberId ?? "Skupno"}</span>
                    </td>
                    <td className="py-2.5 text-right">
                      <span className={clsx(
                        "text-xs font-semibold",
                        tx.type === "income" ? "text-income-700" : "text-expense-700"
                      )}>
                        {tx.type === "income" ? "+" : "−"}{formatEur(tx.amount)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile seznam */}
        <div className="sm:hidden space-y-0">
          {filtered.map((tx) => {
            const cat = getCategory(tx.categoryCode);
            return (
              <div key={tx.id} className="tx-row">
                <div className={clsx(
                  "tx-icon",
                  tx.type === "income" ? "bg-income-50 text-income-700" : "bg-expense-50 text-expense-700"
                )}>
                  {tx.type === "income" ? "↓" : "↑"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-neutral-800 truncate">{tx.description}</div>
                  <div className="text-[10px] text-neutral-400">{formatDate(tx.date)} · {cat?.name}</div>
                </div>
                <div className={clsx(
                  "text-xs font-semibold whitespace-nowrap",
                  tx.type === "income" ? "text-income-700" : "text-expense-700"
                )}>
                  {tx.type === "income" ? "+" : "−"}{formatEur(tx.amount)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
