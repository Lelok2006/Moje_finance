import {
  Stethoscope, Heart, Cake, Pill, Receipt,
  ClipboardCheck, Plane, BookOpen, Tag,
} from "lucide-react";
import type { EventType, ReminderFrequency } from "@/types";

export const EVENT_TYPES: EventType[] = [
  "doctor",
  "anniversary",
  "birthday",
  "medication",
  "payment_due",
  "obligation",
  "holiday",
  "school",
  "other",
];

export const EVENT_LABEL: Record<EventType, string> = {
  doctor:      "Zdravnik",
  anniversary: "Obletnica",
  birthday:    "Rojstni dan",
  medication:  "Zdravila",
  payment_due: "Valuta plačila",
  obligation:  "Obveznost",
  holiday:     "Dopust",
  school:      "Šola",
  other:       "Ostalo",
};

export const EVENT_DOT: Record<EventType, string> = {
  doctor:      "bg-teal-500",
  anniversary: "bg-pink-500",
  birthday:    "bg-purple-500",
  medication:  "bg-emerald-500",
  payment_due: "bg-expense-500",
  obligation:  "bg-amber-500",
  holiday:     "bg-sky-500",
  school:      "bg-brand-500",
  other:       "bg-neutral-400",
};

export const EVENT_CELL_BG: Record<EventType, string> = {
  doctor:      "bg-teal-50 ring-1 ring-teal-200",
  anniversary: "bg-pink-50 ring-1 ring-pink-200",
  birthday:    "bg-purple-50 ring-1 ring-purple-200",
  medication:  "bg-emerald-50 ring-1 ring-emerald-200",
  payment_due: "bg-expense-50 ring-1 ring-expense-200",
  obligation:  "bg-warn-50 ring-1 ring-warn-500/30",
  holiday:     "bg-sky-50 ring-1 ring-sky-200",
  school:      "bg-brand-50 ring-1 ring-brand-200",
  other:       "bg-neutral-100",
};

export const EVENT_PILL: Record<EventType, string> = {
  doctor:      "bg-teal-50 text-teal-700",
  anniversary: "bg-pink-50 text-pink-700",
  birthday:    "pill-purple",
  medication:  "bg-emerald-50 text-emerald-700",
  payment_due: "pill-red",
  obligation:  "pill-amber",
  holiday:     "bg-sky-50 text-sky-700",
  school:      "pill-blue",
  other:       "pill-gray",
};

export const EVENT_ICON: Record<EventType, React.ReactNode> = {
  doctor:      <Stethoscope size={14} />,
  anniversary: <Heart size={14} />,
  birthday:    <Cake size={14} />,
  medication:  <Pill size={14} />,
  payment_due: <Receipt size={14} />,
  obligation:  <ClipboardCheck size={14} />,
  holiday:     <Plane size={14} />,
  school:      <BookOpen size={14} />,
  other:       <Tag size={14} />,
};

export const EVENT_PRIORITY: EventType[] = [
  "payment_due",
  "medication",
  "doctor",
  "obligation",
  "birthday",
  "anniversary",
  "school",
  "holiday",
  "other",
];

export const REMINDER_OPTIONS: { value: ReminderFrequency; label: string }[] = [
  { value: "none",    label: "Brez opomnika" },
  { value: "daily",   label: "Dnevno" },
  { value: "monthly", label: "Mesečno" },
  { value: "yearly",  label: "Letno" },
  { value: "custom",  label: "Niz / po meri" },
];
