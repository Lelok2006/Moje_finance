// ── Šifranti (kategorie) ──────────────────────────────────────
export type CategoryType = "income" | "fixed" | "variable" | "savings";

export interface Category {
  code: string;       // npr. "2020"
  name: string;       // npr. "Elektrika"
  type: CategoryType;
  parentCode?: string; // npr. "2000"
  icon?: string;
}

// ── Člani gospodinjstva ───────────────────────────────────────
export type MemberType = "adult" | "child" | "pet";

export interface Member {
  id: string;
  name: string;
  initials: string;
  type: MemberType;
  birthDate?: string; // ISO date
  color: string;      // tailwind bg class
  isAdmin?: boolean;
}

// ── Transakcija ───────────────────────────────────────────────
export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  date: string;         // ISO date
  description: string;
  amount: number;       // vedno pozitivno
  type: TransactionType;
  categoryCode: string;
  memberId?: string;    // null = skupno
  documentId?: string;
  notes?: string;
}

// ── Dokument ──────────────────────────────────────────────────
export type DocumentStatus = "pending_ocr" | "pending_confirm" | "booked" | "archived";

export interface Document {
  id: string;
  name: string;
  uploadedAt: string;
  documentDate?: string;
  type: "invoice" | "contract" | "policy" | "payslip" | "tax" | "other";
  status: DocumentStatus;
  ocrAmount?: number;
  ocrSuggestedCategory?: string;
  ocrRawText?: string;
  filePath?: string;
  linkedTransactionId?: string;
  expiryDate?: string;
}

// ── Proračun ──────────────────────────────────────────────────
export interface BudgetItem {
  categoryCode: string;
  monthlyLimit: number;
  currentSpend: number;
}

// ── Dogodek / opomnik ─────────────────────────────────────────
export type EventType =
  | "doctor"
  | "anniversary"
  | "birthday"
  | "medication"
  | "payment_due"
  | "obligation"
  | "holiday"
  | "school"
  | "other";

export type ReminderFrequency = "none" | "daily" | "monthly" | "yearly" | "custom";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;       // ISO date
  type: EventType;
  memberId?: string;
  personName?: string;
  description?: string;
  notes?: string;
  reminderEnabled?: boolean;
  reminderFrequency?: ReminderFrequency;
  reminderPattern?: string;
  source?: "manual" | "document" | "finance" | "medication";
}

// ── Navigacijski element ──────────────────────────────────────
export type ModuleId =
  | "dashboard"
  | "finance"
  | "documents"
  | "members"
  | "calculators"
  | "calendar"
  | "events"
  | "settings";
