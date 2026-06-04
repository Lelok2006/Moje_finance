"use client";

import { UserPlus, Cake, Plane, Clock, BookOpen } from "lucide-react";
import { MEMBERS, TRANSACTIONS, EVENTS } from "@/lib/data";
import { formatEur, formatDate, daysUntil } from "@/lib/utils";
import clsx from "clsx";

const EVENT_ICON: Record<string, React.ReactNode> = {
  birthday: <Cake size={14} />,
  holiday:  <Plane size={14} />,
  deadline: <Clock size={14} />,
  school:   <BookOpen size={14} />,
};
const EVENT_PILL: Record<string, string> = {
  birthday: "pill pill-purple",
  holiday:  "pill pill-amber",
  deadline: "pill pill-red",
  school:   "pill pill-amber",
};
const EVENT_LABEL: Record<string, string> = {
  birthday: "Rojstni dan", holiday: "Dopust",
  deadline: "Rok", school: "Šola",
};

const MEMBER_COLORS: Record<string, { card: string; avatar: string }> = {
  mojca: { card: "border-brand-100",  avatar: "bg-brand-50 text-brand-600" },
  luka:  { card: "border-income-50",  avatar: "bg-income-50 text-income-700" },
  nina:  { card: "border-warn-50",    avatar: "bg-warn-50 text-warn-700" },
};

export default function Members() {
  return (
    <div className="p-4 md:p-6 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Člani gospodinjstva</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Domači HR — profili, statistike in dogodki</p>
        </div>
        <button className="btn-primary"><UserPlus size={14} />Dodaj člana</button>
      </div>

      {/* Kartice članov */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {MEMBERS.map((m) => {
          const colors = MEMBER_COLORS[m.id] ?? { card: "border-neutral-100", avatar: "bg-neutral-100 text-neutral-600" };
          const memberIncome  = TRANSACTIONS.filter((t) => t.memberId === m.id && t.type === "income").reduce((s, t) => s + t.amount, 0);
          const memberExpense = TRANSACTIONS.filter((t) => t.memberId === m.id && t.type === "expense").reduce((s, t) => s + t.amount, 0);
          const age = m.birthDate
            ? Math.floor((Date.now() - new Date(m.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
            : null;

          return (
            <div key={m.id} className={clsx("card border text-center", colors.card)}>
              <div className={clsx("w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold mx-auto mb-3", colors.avatar)}>
                {m.initials}
              </div>
              <div className="text-sm font-semibold text-neutral-900">{m.name}</div>
              <div className="text-xs text-neutral-400 mt-0.5 mb-3">
                {m.type === "adult" ? "Odrasli" : m.type === "child" ? "Otrok" : "Hišni ljubljenček"}
                {age ? ` · ${age} let` : ""}
              </div>
              <div className="flex gap-1 justify-center flex-wrap mb-3">
                {m.isAdmin && <span className="pill pill-blue">Skrbnik</span>}
                <span className={clsx("pill", m.type === "adult" ? "pill-green" : m.type === "child" ? "pill-amber" : "pill-purple")}>
                  {m.type === "adult" ? "Odrasli" : m.type === "child" ? "Otrok" : "Žival"}
                </span>
              </div>
              <div className="flex justify-center gap-6 pt-3 border-t border-neutral-100">
                <div className="text-center">
                  <div className="text-sm font-semibold text-income-700">{formatEur(memberIncome)}</div>
                  <div className="text-[10px] text-neutral-400">Prihodki</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-expense-700">{formatEur(memberExpense)}</div>
                  <div className="text-[10px] text-neutral-400">Odhodki</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dogodki */}
      <div className="card">
        <div className="card-title">Dogodki in opomniki</div>
        <div>
          {[...EVENTS].sort((a, b) => a.date.localeCompare(b.date)).map((ev) => {
            const d = new Date(ev.date);
            const days = daysUntil(ev.date);
            const member = MEMBERS.find((m) => m.id === ev.memberId);
            return (
              <div key={ev.id} className="flex items-center gap-3 py-2.5 border-b border-neutral-100 last:border-0">
                <div className="w-11 text-center flex-shrink-0">
                  <div className="text-base font-semibold text-neutral-900 leading-none">{d.getDate()}</div>
                  <div className="text-[10px] text-neutral-400 uppercase">
                    {d.toLocaleString("sl-SI", { month: "short" })}
                  </div>
                </div>
                <div className={clsx("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-neutral-500",
                  ev.type === "deadline" ? "bg-expense-50 text-expense-700" :
                  ev.type === "birthday" ? "bg-purple-50 text-purple-700" :
                  "bg-warn-50 text-warn-700"
                )}>
                  {EVENT_ICON[ev.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-neutral-800">{ev.title}</div>
                  <div className="text-[10px] text-neutral-400">
                    {days > 0 ? `čez ${days} dni` : days === 0 ? "danes" : `pred ${Math.abs(days)} dnevi`}
                    {ev.notes ? ` · ${ev.notes}` : ""}
                    {member ? ` · ${member.name}` : ""}
                  </div>
                </div>
                <span className={clsx("pill text-[10px] flex-shrink-0", EVENT_PILL[ev.type])}>
                  {EVENT_LABEL[ev.type]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
