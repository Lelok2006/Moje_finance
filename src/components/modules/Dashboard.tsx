"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TrendingUp, TrendingDown, PiggyBank, PieChart, AlertTriangle, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { CATEGORIES } from "@/lib/data";
import { formatEur, formatDateShort, budgetColor, daysUntil, getCategory } from "@/lib/utils";
import { EVENT_LABEL, EVENT_PILL } from "@/lib/eventTypes";
import { createClient } from "@/lib/supabase/client";
import type { BudgetItem, CalendarEvent, EventType, ReminderFrequency, Transaction } from "@/types";
import clsx from "clsx";

type MonthlyPoint = { month: string; income: number | null; expense: number | null };

function currentMonthPrefix() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
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

function mapBudget(row: Record<string, unknown>): BudgetItem {
  return {
    categoryCode: String(row.category_code),
    monthlyLimit: Number(row.monthly_limit),
    currentSpend: 0,
  };
}

function categoryCodesForBudget(categoryCode: string) {
  const children = CATEGORIES.filter((category) => category.parentCode === categoryCode).map((category) => category.code);
  return new Set([categoryCode, ...children]);
}

function buildMonthlyData(transactions: Transaction[]): MonthlyPoint[] {
  const year = new Date().getFullYear();
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    const monthly = transactions.filter((tx) => tx.date.startsWith(prefix));
    const income = monthly.filter((tx) => tx.type === "income").reduce((sum, tx) => sum + tx.amount, 0);
    const expense = monthly.filter((tx) => tx.type === "expense").reduce((sum, tx) => sum + tx.amount, 0);
    return {
      month: new Date(year, index, 1).toLocaleString("sl-SI", { month: "short" }),
      income: income || null,
      expense: expense || null,
    };
  });
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [budget, setBudget] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const [{ data: txRows, error: txError }, { data: eventRows, error: eventError }, { data: budgetRows, error: budgetError }] = await Promise.all([
      supabase.from("transactions").select("*").order("date", { ascending: false }),
      supabase.from("events").select("*").order("date", { ascending: true }),
      supabase.from("budget_items").select("*"),
    ]);

    if (txError || eventError || budgetError) {
      setError(txError?.message ?? eventError?.message ?? budgetError?.message ?? "Napaka pri nalaganju nadzorne plošče.");
      setLoading(false);
      return;
    }

    setTransactions((txRows ?? []).map((row) => mapTransaction(row)));
    setEvents((eventRows ?? []).map((row) => mapEvent(row)));
    setBudget((budgetRows ?? []).map((row) => mapBudget(row)));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const monthPrefix = currentMonthPrefix();
  const thisMonth = transactions.filter((tx) => tx.date.startsWith(monthPrefix));
  const income  = thisMonth.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = thisMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const savings = income - expense;
  const budgetPct = Math.round((expense / (income || 1)) * 100);

  const recent = [...thisMonth].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const upcoming = [...events]
    .filter((event) => daysUntil(event.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);
  const budgetWithSpend = useMemo(() => budget.map((item) => {
    const codes = categoryCodesForBudget(item.categoryCode);
    const currentSpend = thisMonth
      .filter((tx) => tx.type === "expense" && codes.has(tx.categoryCode))
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { ...item, currentSpend };
  }), [budget, thisMonth]);
  const monthlyData = useMemo(() => buildMonthlyData(transactions), [transactions]);
  const overBudget = budgetWithSpend.find((b) => b.monthlyLimit > 0 && b.currentSpend / b.monthlyLimit > 0.9);

  return (
    <div className="p-4 md:p-6 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Nadzorna plošča</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Pregled podatkov tvojega gospodinjstva</p>
        </div>
        <button className="btn-secondary text-xs hidden sm:flex">
          Poročilo
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-expense-200 bg-expense-50 px-3 py-2 text-xs text-expense-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Loader2 size={14} className="animate-spin" />Nalagam analitiko...
        </div>
      )}

      {/* Alert */}
      {overBudget && (
        <div className="alert-warn">
          <AlertTriangle size={14} className="flex-shrink-0" />
          <span>
            Ena od kategorij je na{" "}
            {Math.round((overBudget.currentSpend / overBudget.monthlyLimit) * 100)} % proračuna.
          </span>
        </div>
      )}

      {/* KPI kartice */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="kpi-card">
          <div className="kpi-label"><TrendingUp size={12} className="text-income-700" />Prihodki</div>
          <div className="kpi-value text-income-700">{formatEur(income)}</div>
          <div className="kpi-delta">iz vnosov</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label"><TrendingDown size={12} className="text-expense-700" />Odhodki</div>
          <div className="kpi-value text-expense-700">{formatEur(expense)}</div>
          <div className="kpi-delta">iz vnosov</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label"><PiggyBank size={12} className="text-brand-600" />Prihranki</div>
          <div className={clsx("kpi-value", savings >= 0 ? "text-brand-600" : "text-expense-700")}>{formatEur(savings, true)}</div>
          <div className="kpi-delta">saldo obdobja</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label"><PieChart size={12} className="text-warn-700" />Proračun</div>
          <div className="kpi-value text-warn-700">{budgetPct} %</div>
          <div className="kpi-delta">porabljeno</div>
        </div>
      </div>

      {/* Grafikon + proračun */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Mesečni grafikon */}
        <div className="card">
          <div className="card-title">Prihodki in odhodki — 2026</div>
          {monthlyData.some((point) => point.income || point.expense) ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={monthlyData} barGap={2} barCategoryGap="30%">
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: "#888780" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(v: number) => formatEur(v)}
                    contentStyle={{
                      fontSize: 12,
                      border: "1px solid #D3D1C7",
                      borderRadius: 8,
                      boxShadow: "none",
                    }}
                  />
                  <Bar dataKey="income" name="Prihodki" radius={[3, 3, 0, 0]}>
                    {monthlyData.map((d, i) => (
                      <Cell key={i} fill={d.income === null ? "#B4B2A9" : "#1D9E75"} />
                    ))}
                  </Bar>
                  <Bar dataKey="expense" name="Odhodki" radius={[3, 3, 0, 0]}>
                    {monthlyData.map((d, i) => (
                      <Cell key={i} fill={d.expense === null ? "#D3D1C7" : "#D85A30"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-1">
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <div className="w-2.5 h-2.5 rounded-sm bg-income-500" />Prihodki
                </div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <div className="w-2.5 h-2.5 rounded-sm bg-expense-500" />Odhodki
                </div>
              </div>
            </>
          ) : (
            <div className="h-[140px] flex items-center justify-center text-xs text-neutral-400">
              Ni se podatkov za graf.
            </div>
          )}
        </div>

        {/* Proračun */}
        <div className="card">
          <div className="card-title">Proračun po kategorijah</div>
          <div className="space-y-3">
            {budgetWithSpend.length === 0 && (
              <p className="text-xs text-neutral-400 py-4">Ni se nastavljenega proračuna.</p>
            )}
            {budgetWithSpend.map((b) => {
              const cat = CATEGORIES.find((c) => c.code === b.categoryCode);
              const pct = Math.min(100, Math.round((b.currentSpend / b.monthlyLimit) * 100));
              return (
                <div key={b.categoryCode}>
                  <div className="flex justify-between text-xs text-neutral-600 mb-1">
                    <span>{cat?.name ?? b.categoryCode}</span>
                    <span className="text-neutral-400">
                      {formatEur(b.currentSpend)} / {formatEur(b.monthlyLimit)}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={clsx("progress-fill", budgetColor(pct))}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transakcije + dogodki */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Zadnje transakcije */}
        <div className="card">
          <div className="card-title">
            Zadnje transakcije
            <button className="btn-ghost text-xs">Vse →</button>
          </div>
          <div>
            {recent.length === 0 && (
              <p className="text-xs text-neutral-400 py-4">Ni se transakcij.</p>
            )}
            {recent.map((tx) => {
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
                    <div className="text-[10px] text-neutral-400">{formatDateShort(tx.date)}</div>
                  </div>
                  <span className={clsx("pill text-[10px] hidden sm:inline-flex",
                    cat?.type === "income" ? "pill-green" : cat?.type === "fixed" ? "pill-red" : "pill-amber"
                  )}>
                    {cat?.code}
                  </span>
                  <div className={clsx("text-xs font-semibold ml-2 whitespace-nowrap",
                    tx.type === "income" ? "text-income-700" : "text-expense-700"
                  )}>
                    {tx.type === "income" ? "+" : "−"}{formatEur(tx.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Prihajajoci dogodki */}
        <div className="card">
          <div className="card-title">Prihajajoci dogodki</div>
          <div className="space-y-1">
            {upcoming.length === 0 && (
              <p className="text-xs text-neutral-400 py-4">Ni prihodnjih dogodkov.</p>
            )}
            {upcoming.map((ev) => {
              const d = new Date(ev.date);
              const days = daysUntil(ev.date);
              return (
                <div key={ev.id} className="flex items-center gap-3 py-2 border-b border-neutral-100 last:border-0">
                  <div className="w-10 text-center flex-shrink-0">
                    <div className="text-base font-semibold text-neutral-900 leading-none">{d.getDate()}</div>
                    <div className="text-[9px] text-neutral-400 uppercase">
                      {d.toLocaleString("sl-SI", { month: "short" })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-neutral-800 truncate">{ev.title}</div>
                    <div className="text-[10px] text-neutral-400">
                      {days > 0 ? `čez ${days} dni` : "danes"}
                      {ev.notes ? ` · ${ev.notes}` : ""}
                    </div>
                  </div>
                  <span className={clsx("pill text-[10px]", EVENT_PILL[ev.type])}>
                    {EVENT_LABEL[ev.type]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
