"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, TrendingUp, TrendingDown,
  ChevronLeft, ChevronRight, X, Check, Loader2,
  FileText, Pencil, Trash2, Target,
} from "lucide-react";
import { CATEGORIES } from "@/lib/data";
import { budgetColor, formatEur, formatDate, getCategory } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import AppSelect from "@/components/ui/AppSelect";
import type { Transaction, Member, BudgetItem } from "@/types";
import clsx from "clsx";

type FinanceTransaction = Transaction & {
  document?: {
    id: string;
    name: string;
    filePath?: string;
  };
};

// ── Pomožne funkcije ──────────────────────────────────────────

function monthLabel(year: number, month: number) {
  return new Date(year, month - 1).toLocaleString("sl-SI", { month: "long", year: "numeric" });
}
function toIso(date: Date) {
  return date.toISOString().slice(0, 10);
}
function parseEuroInput(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return 0;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : NaN;
}
function categoryCodesForBudget(categoryCode: string) {
  const childCodes = CATEGORIES
    .filter((category) => category.parentCode === categoryCode)
    .map((category) => category.code);
  return [categoryCode, ...childCodes];
}

// ── Forma za novo transakcijo ─────────────────────────────────

function TransactionModal({
  members,
  transaction,
  onClose,
  onSaved,
  onDeleted,
}: {
  members: Member[];
  transaction?: FinanceTransaction;
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
}) {
  const today = toIso(new Date());
  const [txType, setTxType]       = useState<"expense" | "income">(transaction?.type ?? "expense");
  const [amount, setAmount]       = useState(transaction?.amount.toString() ?? "");
  const [description, setDesc]    = useState(transaction?.description ?? "");
  const [date, setDate]           = useState(transaction?.date ?? today);
  const [categoryCode, setCategory] = useState(transaction?.categoryCode ?? "");
  const [memberId, setMember]     = useState(transaction?.memberId ?? "");
  const [notes, setNotes]         = useState(transaction?.notes ?? "");
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [error, setError]         = useState("");
  const isEditing = Boolean(transaction);

  async function handleSubmit() {
    if (!amount || !description || !date || !categoryCode) {
      setError("Izpolni vsa obvezna polja.");
      return;
    }
    setSaving(true);
    setError("");
    const supabase = createClient();
    let err;

    if (transaction) {
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          date,
          description:   description.trim(),
          amount:        parseFloat(amount),
          type:          txType,
          category_code: categoryCode,
          member_id:     memberId || null,
          notes:         notes.trim() || null,
        })
        .eq("id", transaction.id);
      err = updateError;
    } else {
      const { data: householdId } = await supabase.rpc("get_household_id");
      const { error: insertError } = await supabase.from("transactions").insert({
        household_id:  householdId,
        date,
        description:   description.trim(),
        amount:        parseFloat(amount),
        type:          txType,
        category_code: categoryCode,
        member_id:     memberId || null,
        notes:         notes.trim() || null,
      });
      err = insertError;
    }

    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  async function handleDelete() {
    if (!transaction) return;
    const confirmed = window.confirm("Izbrišem ta finančni zapis?");
    if (!confirmed) return;

    setDeleting(true);
    setError("");
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transaction.id);

    if (deleteError) {
      setDeleting(false);
      setError(deleteError.message);
      return;
    }

    if (transaction.documentId) {
      await supabase
        .from("documents")
        .update({ status: "pending_confirm", linked_transaction_id: null })
        .eq("id", transaction.documentId);
    }

    setDeleting(false);
    onDeleted?.();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-neutral-100">
          <div className="text-sm font-semibold text-neutral-900">
            {isEditing ? "Uredi transakcijo" : "Nova transakcija"}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100">
            <X size={16} className="text-neutral-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Tip */}
          <div className="flex gap-1 p-1 bg-neutral-50 rounded-lg">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTxType(t); setCategory(""); }}
                className={clsx(
                  "flex-1 text-xs py-2 rounded-md font-medium transition-all",
                  txType === t
                    ? t === "income"
                      ? "bg-income-500 text-white shadow-sm"
                      : "bg-expense-500 text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                )}
              >
                {t === "income" ? "↓ Prihodek" : "↑ Odhodek"}
              </button>
            ))}
          </div>

          {/* Znesek + datum */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-neutral-500 mb-1">Znesek (€) *</label>
              <input
                type="number" step="0.01" min="0.01"
                value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00" className="input"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-500 mb-1">Datum *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
            </div>
          </div>

          {/* Opis */}
          <div>
            <label className="block text-[10px] text-neutral-500 mb-1">Opis *</label>
            <input
              type="text" value={description} onChange={(e) => setDesc(e.target.value)}
              placeholder={txType === "income" ? "npr. Plača — junij" : "npr. Mercator"}
              className="input"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          {/* Kategorija */}
          <div>
            <label className="block text-[10px] text-neutral-500 mb-1">Kategorija *</label>
            <AppSelect
              value={categoryCode}
              placeholder="— izberi —"
              options={[{ value: "", label: "— izberi —" }]}
              groups={CATEGORIES.filter((c) => !c.parentCode && (
                txType === "income" ? c.type === "income" : c.type === "fixed" || c.type === "variable"
              )).map((parent) => ({
                label: parent.name,
                options: CATEGORIES.filter((c) => c.parentCode === parent.code).map((c) => ({
                  value: c.code,
                  label: c.name,
                })),
              }))}
              onChange={setCategory}
            />
          </div>

          {/* Član */}
          {members.length > 0 && (
            <div>
              <label className="block text-[10px] text-neutral-500 mb-1">Član (neobvezno)</label>
              <AppSelect
                value={memberId}
                placeholder="Skupno"
                options={[
                  { value: "", label: "Skupno" },
                  ...members.map((m) => ({ value: m.id, label: m.name })),
                ]}
                onChange={setMember}
              />
            </div>
          )}

          {/* Opomba */}
          <div>
            <label className="block text-[10px] text-neutral-500 mb-1">Opomba (neobvezno)</label>
            <input
              type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Dodaten opis..." className="input"
            />
          </div>

          {error && (
            <p className="text-xs text-expense-700 bg-expense-50 border border-expense-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Gumbi */}
        <div className="px-5 py-4 border-t border-neutral-100 flex gap-2">
          {isEditing && (
            <button
              onClick={handleDelete}
              disabled={deleting || saving}
              className="btn-secondary flex-shrink-0 text-expense-700 hover:bg-expense-50"
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Izbriši
            </button>
          )}
          <button onClick={onClose} className="btn-secondary flex-shrink-0">Prekliči</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary flex-1 justify-center py-2.5 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {isEditing ? "Shrani spremembe" : "Shrani"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Glavna komponenta ─────────────────────────────────────────

export default function Finance() {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [filter, setFilter] = useState<"vse" | "prihodki" | "odhodki">("vse");
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [members, setMembers]           = useState<Member[]>([]);
  const [budgetItems, setBudgetItems]   = useState<BudgetItem[]>([]);
  const [budgetDrafts, setBudgetDrafts] = useState<Record<string, string>>({});
  const [budgetSavingCode, setBudgetSavingCode] = useState<string | null>(null);
  const [budgetError, setBudgetError]   = useState("");
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [editingTx, setEditingTx]       = useState<FinanceTransaction | null>(null);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to   = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

    const [{ data: txs }, { data: mems }, { data: budgets }] = await Promise.all([
      supabase
        .from("transactions")
        .select("*, documents:document_id(id,name,file_path)")
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: false }),
      supabase.from("members").select("*").order("name"),
      supabase.from("budget_items").select("*").order("category_code"),
    ]);

    if (txs) {
      setTransactions(txs.map((t) => ({
        id:           t.id,
        date:         t.date,
        description:  t.description,
        amount:       Number(t.amount),
        type:         t.type as "income" | "expense",
        categoryCode: t.category_code ?? "",
        memberId:     t.member_id ?? undefined,
        documentId:   t.document_id ?? undefined,
        notes:        t.notes ?? undefined,
        document:     t.documents ? {
          id:       t.documents.id,
          name:     t.documents.name,
          filePath: t.documents.file_path ?? undefined,
        } : undefined,
      })));
    }
    if (mems) {
      setMembers(mems.map((m) => ({
        id:       m.id,
        name:     m.name,
        initials: m.initials,
        type:     m.type as Member["type"],
        color:    m.color ?? "bg-neutral-100 text-neutral-500",
        isAdmin:  m.is_admin ?? false,
      })));
    }
    if (budgets) {
      const mapped = budgets.map((item) => ({
        categoryCode: item.category_code,
        monthlyLimit: Number(item.monthly_limit),
        currentSpend: 0,
      }));
      setBudgetItems(mapped);
      setBudgetDrafts(Object.fromEntries(mapped.map((item) => [
        item.categoryCode,
        item.monthlyLimit.toString(),
      ])));
    }
    setLoading(false);
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    const now = new Date();
    if (year === now.getFullYear() && month === now.getMonth() + 1) return;
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  const income  = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const budgetCategories = CATEGORIES.filter((category) =>
    !category.parentCode && (category.type === "fixed" || category.type === "variable" || category.type === "savings")
  );
  const budgetWithSpend = budgetCategories.map((category) => {
    const codes = categoryCodesForBudget(category.code);
    const currentSpend = transactions
      .filter((transaction) => transaction.type === "expense" && codes.includes(transaction.categoryCode))
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const saved = budgetItems.find((item) => item.categoryCode === category.code);

    return {
      category,
      currentSpend,
      monthlyLimit: saved?.monthlyLimit ?? 0,
      draft: budgetDrafts[category.code] ?? "",
    };
  });

  const memberName = (id?: string) => members.find((m) => m.id === id)?.name ?? "Skupno";

  const filtered = transactions.filter((t) =>
    filter === "vse" ||
    (filter === "prihodki" ? t.type === "income" : t.type === "expense")
  );

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;

  async function openDocument(tx: FinanceTransaction) {
    if (!tx.document?.filePath) return;
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(tx.document.filePath, 600);

    if (error || !data?.signedUrl) return;
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function saveBudgetLimit(categoryCode: string) {
    const amount = parseEuroInput(budgetDrafts[categoryCode] ?? "");

    if (Number.isNaN(amount) || amount < 0) {
      setBudgetError("Vnesi veljaven znesek limita.");
      return;
    }

    setBudgetSavingCode(categoryCode);
    setBudgetError("");
    const existing = budgetItems.find((item) => item.categoryCode === categoryCode);

    if (amount <= 0) {
      if (existing) {
        const { error } = await supabase
          .from("budget_items")
          .delete()
          .eq("category_code", categoryCode);

        if (error) {
          setBudgetSavingCode(null);
          setBudgetError(error.message);
          return;
        }
      }

      setBudgetItems((items) => items.filter((item) => item.categoryCode !== categoryCode));
      setBudgetDrafts((drafts) => ({ ...drafts, [categoryCode]: "" }));
      setBudgetSavingCode(null);
      return;
    }

    if (existing) {
      const { error } = await supabase
        .from("budget_items")
        .update({ monthly_limit: amount })
        .eq("category_code", categoryCode);

      if (error) {
        setBudgetSavingCode(null);
        setBudgetError(error.message);
        return;
      }
    } else {
      const { data: householdId, error: householdError } = await supabase.rpc("get_household_id");
      if (householdError || !householdId) {
        setBudgetSavingCode(null);
        setBudgetError(householdError?.message ?? "Gospodinjstva ni bilo mogoče prebrati.");
        return;
      }

      const { error } = await supabase.from("budget_items").insert({
        household_id: householdId,
        category_code: categoryCode,
        monthly_limit: amount,
      });

      if (error) {
        setBudgetSavingCode(null);
        setBudgetError(error.message);
        return;
      }
    }

    setBudgetItems((items) => {
      const next = items.filter((item) => item.categoryCode !== categoryCode);
      next.push({ categoryCode, monthlyLimit: amount, currentSpend: 0 });
      return next.sort((a, b) => a.categoryCode.localeCompare(b.categoryCode));
    });
    setBudgetDrafts((drafts) => ({ ...drafts, [categoryCode]: amount.toString() }));
    setBudgetSavingCode(null);
  }

  return (
    <div className="p-4 md:p-6 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Stroški</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Stroški, prihodki in limiti po življenjskih kategorijah</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={14} />Novi vnos
        </button>
      </div>

      {/* Izbira meseca */}
      <div className="flex items-center gap-3">
        <button onClick={prevMonth} className="btn-secondary px-2 py-1.5">
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm font-medium text-neutral-700 capitalize min-w-[140px] text-center">
          {monthLabel(year, month)}
        </span>
        <button onClick={nextMonth} disabled={isCurrentMonth} className="btn-secondary px-2 py-1.5 disabled:opacity-30">
          <ChevronRight size={14} />
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-3">
        <div className="kpi-card">
          <div className="kpi-label"><TrendingUp size={12} className="text-income-700" />Prihodki</div>
          <div className="kpi-value text-income-700 text-xl">{formatEur(income)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label"><TrendingDown size={12} className="text-expense-700" />Stroški</div>
          <div className="kpi-value text-expense-700 text-xl">{formatEur(expense)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Bilanca</div>
          <div className={clsx("kpi-value text-xl", balance >= 0 ? "text-income-700" : "text-expense-700")}>
            {formatEur(balance, true)}
          </div>
        </div>
      </div>

      {/* Proračun */}
      <div className="card">
        <div className="card-title">
          <span className="flex items-center gap-2"><Target size={15} />Mesečni limiti po kategorijah</span>
          <span className="text-[11px] font-normal text-neutral-400">mesečni limit</span>
        </div>

        {budgetError && (
          <p className="mb-3 text-xs text-expense-700 bg-expense-50 border border-expense-200 rounded-lg px-3 py-2">
            {budgetError}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {budgetWithSpend.map((item) => {
            const pct = item.monthlyLimit > 0
              ? Math.min(100, Math.round((item.currentSpend / item.monthlyLimit) * 100))
              : 0;
            const isSaving = budgetSavingCode === item.category.code;

            return (
              <div key={item.category.code} className="border border-neutral-100 rounded-lg p-3 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="sif-code">{item.category.code}</span>
                      <span className="text-sm font-medium text-neutral-800">{item.category.name}</span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">
                      Porabljeno ta mesec: {formatEur(item.currentSpend)}
                    </p>
                  </div>
                  <span className={clsx(
                    "pill flex-shrink-0",
                    item.monthlyLimit > 0 ? "pill-blue" : "pill-gray"
                  )}>
                    {item.monthlyLimit > 0 ? formatEur(item.monthlyLimit) : "Ni limita"}
                  </span>
                </div>

                <div className="progress-bar">
                  <div
                    className={clsx("progress-fill", budgetColor(pct))}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    className="input h-9"
                    placeholder="npr. 350"
                    value={item.draft}
                    onChange={(event) => setBudgetDrafts((drafts) => ({
                      ...drafts,
                      [item.category.code]: event.target.value,
                    }))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") saveBudgetLimit(item.category.code);
                    }}
                  />
                  <button
                    className="btn-secondary h-9"
                    disabled={isSaving}
                    onClick={() => saveBudgetLimit(item.category.code)}
                    title="Shrani limit"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Shrani
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-neutral-400 mt-3">
          Če pustiš znesek prazen ali vneseš 0, se limit za kategorijo odstrani.
        </p>
      </div>

      {/* Tabela */}
      <div className="card">
        <div className="card-title">
          <span>Transakcije — {monthLabel(year, month)}</span>
          <div className="flex gap-1 p-1 bg-neutral-50 rounded-lg">
            {(["vse", "prihodki", "odhodki"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  "text-xs px-2.5 py-1 rounded-md transition-all",
                  filter === f
                    ? "bg-white text-neutral-800 font-medium shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-neutral-400 text-sm">
            <Loader2 size={16} className="animate-spin" />Nalagam...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-neutral-400">Ni transakcij za ta mesec.</p>
            <button className="btn-primary mt-3 mx-auto" onClick={() => setShowForm(true)}>
              <Plus size={14} />Dodaj transakcijo
            </button>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="text-left text-xs text-neutral-400 font-medium pb-2 w-8" />
                    <th className="text-left text-xs text-neutral-400 font-medium pb-2">Opis</th>
                    <th className="text-left text-xs text-neutral-400 font-medium pb-2">Datum</th>
                    <th className="text-left text-xs text-neutral-400 font-medium pb-2">Kategorija</th>
                    <th className="text-left text-xs text-neutral-400 font-medium pb-2">Član</th>
                    <th className="text-right text-xs text-neutral-400 font-medium pb-2">Znesek</th>
                    <th className="text-right text-xs text-neutral-400 font-medium pb-2">Akcije</th>
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
                          {tx.notes && <div className="text-[10px] text-neutral-400 truncate max-w-[160px]">{tx.notes}</div>}
                        </td>
                        <td className="py-2.5 pr-3 text-xs text-neutral-500 whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className="sif-code mr-1">{cat?.code}</span>
                          <span className="text-xs text-neutral-500 hidden lg:inline">{cat?.name}</span>
                        </td>
                        <td className="py-2.5 pr-3 text-xs text-neutral-500">
                          {memberName(tx.memberId)}
                        </td>
                        <td className="py-2.5 text-right">
                          <span className={clsx(
                            "text-xs font-semibold whitespace-nowrap",
                            tx.type === "income" ? "text-income-700" : "text-expense-700"
                          )}>
                            {tx.type === "income" ? "+" : "−"}{formatEur(tx.amount)}
                          </span>
                        </td>
                        <td className="py-2.5 pl-3">
                          <div className="flex items-center justify-end gap-1">
                            {tx.document?.filePath && (
                              <button
                                onClick={() => openDocument(tx)}
                                className="btn-secondary p-2"
                                title="Odpri račun"
                              >
                                <FileText size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => setEditingTx(tx)}
                              className="btn-secondary p-2"
                              title="Popravi račun"
                            >
                              <Pencil size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
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
                    <div className="flex items-center gap-1.5">
                      {tx.document?.filePath && (
                        <button
                          onClick={() => openDocument(tx)}
                          className="btn-secondary p-2"
                          title="Odpri račun"
                        >
                          <FileText size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => setEditingTx(tx)}
                        className="btn-secondary p-2"
                        title="Popravi račun"
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal forma */}
      {showForm && (
        <TransactionModal
          members={members}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchData(); }}
        />
      )}
      {editingTx && (
        <TransactionModal
          members={members}
          transaction={editingTx}
          onClose={() => setEditingTx(null)}
          onSaved={() => { setEditingTx(null); fetchData(); }}
          onDeleted={() => { setEditingTx(null); fetchData(); }}
        />
      )}
    </div>
  );
}
