import { CATEGORIES } from "./data";
import type { CategoryType, TransactionType } from "@/types";

// Formatiranje valute
export function formatEur(amount: number, showSign = false): string {
  const formatted = new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  if (showSign) return amount >= 0 ? `+${formatted}` : `−${formatted}`;
  return formatted;
}

// Formatiranje datuma
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("sl-SI", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

// Kratki datum
export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}. ${d.toLocaleString("sl-SI", { month: "short" })}`;
}

// Kategorija po kodi
export function getCategory(code: string) {
  return CATEGORIES.find((c) => c.code === code);
}

// Barva glede na tip kategorije
export function categoryColor(type: CategoryType | TransactionType): string {
  switch (type) {
    case "income":   return "bg-income-50 text-income-700";
    case "fixed":    return "bg-expense-50 text-expense-700";
    case "variable": return "bg-warn-50 text-warn-700";
    case "savings":  return "bg-brand-50 text-brand-600";
    case "expense":  return "bg-expense-50 text-expense-700";
    default:         return "bg-neutral-100 text-neutral-500";
  }
}

// Barva proračunske vrstice
export function budgetColor(pct: number): string {
  if (pct >= 90) return "bg-expense-500";
  if (pct >= 75) return "bg-warn-500";
  return "bg-income-500";
}

// Čez koliko dni
export function daysUntil(iso: string): number {
  const today = new Date();
  const target = new Date(iso);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Inicialke
export function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}
