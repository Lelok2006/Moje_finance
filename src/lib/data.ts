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

// ── ČLANI — demo podatki (bodo zamenjani s Supabase) ─────────
export const MEMBERS: Member[] = [
  {
    id: "member1",
    name: "Maja N.",
    initials: "MN",
    type: "adult",
    birthDate: "1987-06-15",
    color: "bg-brand-50 text-brand-600",
    isAdmin: true,
  },
  {
    id: "member2",
    name: "Andrej N.",
    initials: "AN",
    type: "adult",
    birthDate: "1985-09-22",
    color: "bg-income-50 text-income-700",
  },
  {
    id: "member3",
    name: "Eva N.",
    initials: "EN",
    type: "child",
    birthDate: "2014-05-10",
    color: "bg-warn-50 text-warn-700",
  },
];

// ── TRANSAKCIJE (junij 2026) — demo podatki ──────────────────
export const TRANSACTIONS: Transaction[] = [
  { id: "t1",  date: "2026-06-01", description: "Plača — Maja",          amount: 2100, type: "income",  categoryCode: "1010", memberId: "member1" },
  { id: "t2",  date: "2026-06-01", description: "Najemnina",             amount: 650,  type: "expense", categoryCode: "2010" },
  { id: "t3",  date: "2026-06-02", description: "Mercator — tedenski",   amount: 87,   type: "expense", categoryCode: "3010" },
  { id: "t4",  date: "2026-06-03", description: "Elektrika",             amount: 95,   type: "expense", categoryCode: "2020", documentId: "d1" },
  { id: "t5",  date: "2026-06-04", description: "Honorar — projekt",     amount: 800,  type: "income",  categoryCode: "1030", memberId: "member1" },
  { id: "t6",  date: "2026-06-05", description: "Zavarovanje",           amount: 62,   type: "expense", categoryCode: "2060" },
  { id: "t7",  date: "2026-06-07", description: "Šolske potrebščine",    amount: 45,   type: "expense", categoryCode: "3700", memberId: "member3" },
  { id: "t8",  date: "2026-06-08", description: "Gorivo",                amount: 78,   type: "expense", categoryCode: "2110" },
  { id: "t9",  date: "2026-06-10", description: "Komunala",              amount: 42,   type: "expense", categoryCode: "2040", documentId: "d2" },
  { id: "t10", date: "2026-06-12", description: "Zdravnik",              amount: 25,   type: "expense", categoryCode: "3110", memberId: "member3" },
];

// ── PRORAČUN ──────────────────────────────────────────────────
export const BUDGET: BudgetItem[] = [
  { categoryCode: "2000", monthlyLimit: 700,  currentSpend: 650 },
  { categoryCode: "3000", monthlyLimit: 400,  currentSpend: 310 },
  { categoryCode: "3700", monthlyLimit: 250,  currentSpend: 210 },
  { categoryCode: "2100", monthlyLimit: 200,  currentSpend: 120 },
  { categoryCode: "3100", monthlyLimit: 150,  currentSpend: 45  },
  { categoryCode: "3400", monthlyLimit: 100,  currentSpend: 80  },
  { categoryCode: "3900", monthlyLimit: 100,  currentSpend: 0   },
];

// ── DOKUMENTI — demo podatki ──────────────────────────────────
export const DOCUMENTS: Document[] = [
  { id: "d1", name: "Elektrika — junij",      uploadedAt: "2026-06-03", documentDate: "2026-06-03", type: "invoice",  status: "booked",          ocrAmount: 95,  ocrSuggestedCategory: "2020", linkedTransactionId: "t4" },
  { id: "d2", name: "Komunala",               uploadedAt: "2026-06-01", documentDate: "2026-06-01", type: "invoice",  status: "booked",          ocrAmount: 42,  ocrSuggestedCategory: "2040", linkedTransactionId: "t9" },
  { id: "d3", name: "Zavarovanje — polica",   uploadedAt: "2026-01-15", documentDate: "2026-01-15", type: "policy",   status: "archived",        expiryDate: "2026-08-01" },
  { id: "d4", name: "Najemna pogodba 2026",   uploadedAt: "2026-01-01", documentDate: "2026-01-01", type: "contract", status: "archived" },
  { id: "d5", name: "Plačilna lista jun",     uploadedAt: "2026-06-01", documentDate: "2026-06-01", type: "payslip",  status: "booked" },
  { id: "d6", name: "Napoved dohodnine 2025", uploadedAt: "2026-04-01", type: "tax",     status: "archived" },
  { id: "d7", name: "Nov račun — čaka",       uploadedAt: "2026-06-11", type: "invoice", status: "pending_confirm", ocrAmount: 112, ocrSuggestedCategory: "2030" },
];

// ── DOGODKI ───────────────────────────────────────────────────
export const EVENTS: CalendarEvent[] = [
  { id: "e1", title: "Počitnice",                  date: "2026-07-15", type: "holiday",  notes: "18 dni" },
  { id: "e2", title: "Zavarovanje — rok obnove",   date: "2026-08-01", type: "deadline", notes: "Avtomobilska polica" },
  { id: "e3", title: "Šola — začetek leta",         date: "2026-09-01", type: "school",   memberId: "member3" },
  { id: "e4", title: "Rojstni dan — Eva",           date: "2027-05-10", type: "birthday", memberId: "member3" },
];

// ── GRAFIKON DATA (mesečni) ────────────────────────────────────
export const MONTHLY_DATA = [
  { month: "Jan", income: 2900, expense: 2200 },
  { month: "Feb", income: 3100, expense: 2350 },
  { month: "Mar", income: 2950, expense: 2100 },
  { month: "Apr", income: 3200, expense: 2280 },
  { month: "Maj", income: 3000, expense: 2250 },
  { month: "Jun", income: 3240, expense: 2180 },
  { month: "Jul", income: null, expense: null },
  { month: "Avg", income: null, expense: null },
];
