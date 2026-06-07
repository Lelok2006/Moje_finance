"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, CalendarCheck, Clock3, FileWarning, Loader2,
  PieChart, ReceiptText, TrendingDown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { CATEGORIES } from "@/lib/data";
import { formatEur, formatDateShort, budgetColor, daysUntil, getCategory } from "@/lib/utils";
import { EVENT_LABEL, EVENT_PILL } from "@/lib/eventTypes";
import { createClient } from "@/lib/supabase/client";
import type { BudgetItem, CalendarEvent, Document, EventType, PaymentStatus, ReminderFrequency, Transaction } from "@/types";
import clsx from "clsx";

type MonthlyPoint = { month: string; income: number | null; expense: number | null };
type CategorySpend = { categoryCode: string; name: string; amount: number };
type Obligation = {
  id: string;
  title: string;
  date: string;
  source: "event" | "document_due" | "document_expiry";
  type?: EventType;
  detail?: string;
  amount?: number;
};

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

function mapDocument(row: Record<string, unknown>): Document {
  return {
    id: String(row.id),
    name: String(row.name),
    uploadedAt: String(row.uploaded_at ?? ""),
    documentDate: row.document_date ? String(row.document_date) : undefined,
    type: row.type as Document["type"],
    status: row.status as Document["status"],
    paymentStatus: (row.payment_status as PaymentStatus | null) ?? "unknown",
    ocrAmount: row.ocr_amount != null ? Number(row.ocr_amount) : undefined,
    filePath: row.file_path ? String(row.file_path) : undefined,
    linkedTransactionId: row.linked_transaction_id ? String(row.linked_transaction_id) : undefined,
    expiryDate: row.expiry_date ? String(row.expiry_date) : undefined,
    dueDate: row.due_date ? String(row.due_date) : undefined,
    paidAt: row.paid_at ? String(row.paid_at) : undefined,
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

function buildCategorySpend(transactions: Transaction[]): CategorySpend[] {
  const grouped = new Map<string, CategorySpend>();
  transactions
    .filter((tx) => tx.type === "expense")
    .forEach((tx) => {
      const category = getCategory(tx.categoryCode);
      const parent = category?.parentCode ? getCategory(category.parentCode) : category;
      const categoryCode = parent?.code ?? category?.code ?? tx.categoryCode;
      const name = parent?.name ?? category?.name ?? tx.categoryCode;
      const current = grouped.get(categoryCode);
      grouped.set(categoryCode, {
        categoryCode,
        name,
        amount: (current?.amount ?? 0) + tx.amount,
      });
    });

  return Array.from(grouped.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);
}

function buildObligations(events: CalendarEvent[], documents: Document[]): Obligation[] {
  const eventItems: Obligation[] = events.map((event) => ({
    id: `event-${event.id}`,
    title: event.title,
    date: event.date,
    source: "event",
    type: event.type,
    detail: event.personName ?? event.notes,
  }));

  const documentItems = documents.flatMap((doc) => {
    const items: Obligation[] = [];
    const inactive = doc.status === "archived" || doc.paymentStatus === "paid" || doc.paymentStatus === "canceled";

    if (doc.dueDate && !inactive) {
      items.push({
        id: `document-due-${doc.id}`,
        title: doc.name,
        date: doc.dueDate,
        source: "document_due",
        detail: "Rok plačila",
        amount: doc.ocrAmount,
      });
    }

    if (doc.expiryDate && doc.status !== "archived") {
      items.push({
        id: `document-expiry-${doc.id}`,
        title: doc.name,
        date: doc.expiryDate,
        source: "document_expiry",
        detail: "Rok obnove / potek",
      });
    }

    return items;
  });

  return [...eventItems, ...documentItems].sort((a, b) => a.date.localeCompare(b.date));
}

function obligationLabel(item: Obligation) {
  if (item.source === "document_due") return "Plačilo";
  if (item.source === "document_expiry") return "Obnova";
  return item.type ? EVENT_LABEL[item.type] : "Dogodek";
}

function obligationPill(item: Obligation) {
  if (item.source === "document_due") return "pill-amber";
  if (item.source === "document_expiry") return "pill-blue";
  return item.type ? EVENT_PILL[item.type] : "pill-gray";
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [budget, setBudget] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const [
      { data: txRows, error: txError },
      { data: eventRows, error: eventError },
      { data: budgetRows, error: budgetError },
      { data: docRows, error: docError },
    ] = await Promise.all([
      supabase.from("transactions").select("*").order("date", { ascending: false }),
      supabase.from("events").select("*").order("date", { ascending: true }),
      supabase.from("budget_items").select("*"),
      supabase
        .from("documents")
        .select("id,name,uploaded_at,document_date,type,status,file_path,ocr_amount,linked_transaction_id,expiry_date,due_date,payment_status,paid_at")
        .or("expiry_date.not.is.null,due_date.not.is.null"),
    ]);

    if (txError || eventError || budgetError || docError) {
      setError(txError?.message ?? eventError?.message ?? budgetError?.message ?? docError?.message ?? "Napaka pri nalaganju nadzorne plošče.");
      setLoading(false);
      return;
    }

    setTransactions((txRows ?? []).map((row) => mapTransaction(row)));
    setEvents((eventRows ?? []).map((row) => mapEvent(row)));
    setBudget((budgetRows ?? []).map((row) => mapBudget(row)));
    setDocuments((docRows ?? []).map((row) => mapDocument(row)));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const monthPrefix = currentMonthPrefix();
  const thisMonth = transactions.filter((tx) => tx.date.startsWith(monthPrefix));
  const income  = thisMonth.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = thisMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const recent = [...thisMonth].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const obligations = useMemo(() => buildObligations(events, documents), [events, documents]);
  const openObligations = obligations.filter((item) => daysUntil(item.date) >= 0);
  const upcoming = openObligations.slice(0, 5);
  const todayCount = obligations.filter((item) => daysUntil(item.date) === 0).length;
  const weekCount = obligations.filter((item) => {
    const days = daysUntil(item.date);
    return days >= 0 && days <= 7;
  }).length;
  const overdueCount = obligations.filter((item) => daysUntil(item.date) < 0).length;
  const soonExpiryCount = obligations.filter((item) => {
    const days = daysUntil(item.date);
    return item.source === "document_expiry" && days >= 0 && days <= 45;
  }).length;
  const budgetWithSpend = useMemo(() => budget.map((item) => {
    const codes = categoryCodesForBudget(item.categoryCode);
    const currentSpend = thisMonth
      .filter((tx) => tx.type === "expense" && codes.has(tx.categoryCode))
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { ...item, currentSpend };
  }), [budget, thisMonth]);
  const monthlyData = useMemo(() => buildMonthlyData(transactions), [transactions]);
  const categorySpend = useMemo(() => buildCategorySpend(thisMonth), [thisMonth]);
  const maxCategorySpend = Math.max(...categorySpend.map((item) => item.amount), 1);
  const totalBudgetLimit = budgetWithSpend.reduce((sum, item) => sum + item.monthlyLimit, 0);
  const totalBudgetSpend = budgetWithSpend.reduce((sum, item) => sum + item.currentSpend, 0);
  const budgetPct = totalBudgetLimit > 0
    ? Math.round((totalBudgetSpend / totalBudgetLimit) * 100)
    : Math.round((expense / (income || 1)) * 100);
  const overBudget = budgetWithSpend.find((b) => b.monthlyLimit > 0 && b.currentSpend / b.monthlyLimit > 0.9);

  return (
    <div className="p-4 md:p-6 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Danes</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Roki, dokumenti, opomniki in stroški tvojega gospodinjstva</p>
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
          <Loader2 size={14} className="animate-spin" />Nalagam pregled...
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
          <div className="kpi-label"><CalendarCheck size={12} className="text-brand-600" />Danes</div>
          <div className="kpi-value text-brand-600">{todayCount}</div>
          <div className="kpi-delta">rokov in opomnikov</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label"><Clock3 size={12} className="text-warn-700" />Ta teden</div>
          <div className="kpi-value text-warn-700">{weekCount}</div>
          <div className="kpi-delta">do 7 dni</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label"><AlertTriangle size={12} className="text-expense-700" />Zamujeno</div>
          <div className="kpi-value text-expense-700">{overdueCount}</div>
          <div className="kpi-delta">pretekli roki</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label"><FileWarning size={12} className="text-brand-600" />Kmalu poteče</div>
          <div className="kpi-value text-brand-600">{soonExpiryCount}</div>
          <div className="kpi-delta">dokumenti do 45 dni</div>
        </div>
      </div>

      {/* Obveznosti + stroški */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-title">Kaj moraš urediti</div>
          <div className="space-y-1">
            {upcoming.length === 0 && (
              <p className="text-xs text-neutral-400 py-4">Ni odprtih rokov ali opomnikov.</p>
            )}
            {upcoming.map((item) => {
              const days = daysUntil(item.date);
              return (
                <div key={item.id} className="flex items-center gap-3 py-2 border-b border-neutral-100 last:border-0">
                  <div className="w-10 text-center flex-shrink-0">
                    <div className="text-base font-semibold text-neutral-900 leading-none">
                      {new Date(item.date).getDate()}
                    </div>
                    <div className="text-[9px] text-neutral-400 uppercase">
                      {new Date(item.date).toLocaleString("sl-SI", { month: "short" })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-neutral-800 truncate">{item.title}</div>
                    <div className="text-[10px] text-neutral-400">
                      {days === 0 ? "danes" : `čez ${days} dni`}
                      {item.detail ? ` · ${item.detail}` : ""}
                      {item.amount ? ` · ${formatEur(item.amount)}` : ""}
                    </div>
                  </div>
                  <span className={clsx("pill text-[10px]", obligationPill(item))}>
                    {obligationLabel(item)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Stroški kot kontekst</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-neutral-100 p-3">
              <div className="kpi-label"><ReceiptText size={12} className="text-expense-700" />Stroški meseca</div>
              <div className="text-xl font-semibold text-expense-700">{formatEur(expense)}</div>
            </div>
            <div className="rounded-lg border border-neutral-100 p-3">
              <div className="kpi-label"><PieChart size={12} className="text-warn-700" />Proračun</div>
              <div className="text-xl font-semibold text-warn-700">{budgetPct} %</div>
              <div className="text-[10px] text-neutral-400">{totalBudgetLimit > 0 ? "porabljenega limita" : "glede na prihodke"}</div>
            </div>
          </div>
          <p className="text-xs text-neutral-400 mt-3">
            Finančni vnosi so tukaj zato, da vidiš, koliko te stanejo dom, avto, zdravje, otroci ali hišni ljubljenčki.
          </p>
        </div>
      </div>

      {/* Grafikon + proračun */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Mesečni grafikon */}
        <div className="card">
          <div className="card-title">Prihodki in stroški — 2026</div>
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
                  <Bar dataKey="expense" name="Stroški" radius={[3, 3, 0, 0]}>
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
                  <div className="w-2.5 h-2.5 rounded-sm bg-expense-500" />Stroški
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
          <div className="card-title">{budgetWithSpend.length > 0 ? "Proračun po kategorijah" : "Poraba po kategorijah"}</div>
          <div className="space-y-3">
            {budgetWithSpend.length === 0 && categorySpend.length === 0 && (
              <p className="text-xs text-neutral-400 py-4">Ni se odhodkov za prikaz.</p>
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
            {budgetWithSpend.length === 0 && categorySpend.map((item) => {
              const pct = Math.round((item.amount / maxCategorySpend) * 100);
              return (
                <div key={item.categoryCode}>
                  <div className="flex justify-between text-xs text-neutral-600 mb-1">
                    <span>{item.name}</span>
                    <span className="text-neutral-400">{formatEur(item.amount)}</span>
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
            {budgetWithSpend.length === 0 && categorySpend.length > 0 && (
              <p className="text-[10px] text-neutral-400 pt-1">
                Proračunske meje še niso nastavljene, zato je prikazana dejanska mesečna poraba po kategorijah.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Transakcije */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-title">
            Zadnji stroški in prihodki
            <button className="btn-ghost text-xs">Vse →</button>
          </div>
          <div>
            {recent.length === 0 && (
              <p className="text-xs text-neutral-400 py-4">Ni se vnosov stroškov ali prihodkov.</p>
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

        <div className="card">
          <div className="card-title">Zamujeni roki</div>
          <div className="space-y-1">
            {obligations.filter((item) => daysUntil(item.date) < 0).length === 0 && (
              <p className="text-xs text-neutral-400 py-4">Ni zamujenih rokov.</p>
            )}
            {obligations.filter((item) => daysUntil(item.date) < 0).slice(0, 5).map((item) => {
              const d = new Date(item.date);
              const days = Math.abs(daysUntil(item.date));
              return (
                <div key={item.id} className="flex items-center gap-3 py-2 border-b border-neutral-100 last:border-0">
                  <div className="w-10 text-center flex-shrink-0">
                    <div className="text-base font-semibold text-neutral-900 leading-none">{d.getDate()}</div>
                    <div className="text-[9px] text-neutral-400 uppercase">
                      {d.toLocaleString("sl-SI", { month: "short" })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-neutral-800 truncate">{item.title}</div>
                    <div className="text-[10px] text-neutral-400">
                      zamuja {days} dni
                      {item.detail ? ` · ${item.detail}` : ""}
                    </div>
                  </div>
                  <span className={clsx("pill text-[10px]", obligationPill(item))}>
                    {obligationLabel(item)}
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
