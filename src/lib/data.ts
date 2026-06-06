import type {
  Category,
  Member,
  Transaction,
  Document,
  BudgetItem,
  CalendarEvent,
} from "@/types";

// ── ŠIFRANTI ─────────────────────────────────────────────────
export const CATEGORIES: Category[] = [
  // Prihodki
  { code: "1000", name: "Prihodki",            type: "income" },
  { code: "1010", name: "Redna plača",          type: "income", parentCode: "1000", icon: "briefcase" },
  { code: "1020", name: "Božičnica / regres",   type: "income", parentCode: "1000", icon: "gift" },
  { code: "1030", name: "Honorar / pogodbeno",  type: "income", parentCode: "1000", icon: "file-text" },
  { code: "1040", name: "Najemnina (prejeta)",  type: "income", parentCode: "1000", icon: "home" },
  { code: "1050", name: "Socialni transferji",  type: "income", parentCode: "1000", icon: "heart" },
  { code: "1060", name: "Drugo",                type: "income", parentCode: "1000" },
  // Stalni odhodki
  { code: "2000", name: "Stanovanje",           type: "fixed" },
  { code: "2010", name: "Najemnina / hipoteka", type: "fixed", parentCode: "2000", icon: "home" },
  { code: "2020", name: "Elektrika",            type: "fixed", parentCode: "2000", icon: "zap" },
  { code: "2030", name: "Ogrevanje",            type: "fixed", parentCode: "2000", icon: "flame" },
  { code: "2040", name: "Voda",                 type: "fixed", parentCode: "2000", icon: "droplets" },
  { code: "2050", name: "Internet / telefon",   type: "fixed", parentCode: "2000", icon: "wifi" },
  { code: "2060", name: "Zavarovanje",          type: "fixed", parentCode: "2000", icon: "shield" },
  { code: "2100", name: "Transport",            type: "fixed" },
  { code: "2110", name: "Gorivo",               type: "fixed", parentCode: "2100", icon: "fuel" },
  { code: "2120", name: "Javni prevoz",         type: "fixed", parentCode: "2100", icon: "bus" },
  { code: "2130", name: "Leasing / obrok avta", type: "fixed", parentCode: "2100", icon: "car" },
  // Variabilni odhodki
  { code: "3000", name: "Prehrana",             type: "variable" },
  { code: "3010", name: "Trgovina",             type: "variable", parentCode: "3000", icon: "shopping-cart" },
  { code: "3020", name: "Restavracije",         type: "variable", parentCode: "3000", icon: "utensils" },
  { code: "3100", name: "Zdravje",              type: "variable" },
  { code: "3110", name: "Zdravnik / zobozdravnik", type: "variable", parentCode: "3100", icon: "stethoscope" },
  { code: "3120", name: "Lekarna",              type: "variable", parentCode: "3100", icon: "pill" },
  { code: "3200", name: "Izobraževanje",        type: "variable" },
  { code: "3300", name: "Obleka in obutev",     type: "variable" },
  { code: "3400", name: "Zabava / prosti čas",  type: "variable" },
  { code: "3410", name: "Naročnine",            type: "variable", parentCode: "3400", icon: "tv" },
  { code: "3500", name: "Potovanja",            type: "variable" },
  { code: "3600", name: "Dom (popravila)",      type: "variable" },
  { code: "3700", name: "Otroci",               type: "variable", icon: "baby" },
  { code: "3800", name: "Hišni ljubljenčki",    type: "variable" },
  { code: "3900", name: "Ostalo",               type: "variable" },
  // Prihranki
  { code: "4000", name: "Prihranki",            type: "savings" },
  { code: "4010", name: "Hranilna vloga",        type: "savings", parentCode: "4000" },
  { code: "4020", name: "Naložbeni sklad",       type: "savings", parentCode: "4000" },
  { code: "4030", name: "Pokojninsko (3. steber)", type: "savings", parentCode: "4000" },
];

// ── PRAZNA STANJA ─────────────────────────────────────────────
// Demo podatki so odstranjeni, da novi uporabniki in testerji vidijo samo svoje podatke iz Supabase.
export const MEMBERS: Member[] = [];
export const TRANSACTIONS: Transaction[] = [];
export const BUDGET: BudgetItem[] = [];
export const DOCUMENTS: Document[] = [];
export const EVENTS: CalendarEvent[] = [];
export const MONTHLY_DATA: { month: string; income: number | null; expense: number | null }[] = [];
