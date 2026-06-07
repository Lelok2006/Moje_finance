import {
  Stethoscope, Heart, Cake, Pill, Receipt,
  ClipboardCheck, Plane, BookOpen, Tag, Thermometer, CalendarDays,
} from "lucide-react";
import type { EventType, ReminderFrequency } from "@/types";

export const EVENT_TYPES: EventType[] = [
  "doctor",
  "anniversary",
  "birthday",
  "medication",
  "payment_due",
  "obligation",
  "vacation",
  "sick_leave",
  "school_holiday",
  "public_holiday",
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
  vacation:    "Dopust",
  sick_leave:  "Bolniška",
  school_holiday: "Šolske počitnice",
  public_holiday: "Dela prost dan",
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
  vacation:    "bg-sky-500",
  sick_leave:  "bg-rose-500",
  school_holiday: "bg-indigo-500",
  public_holiday: "bg-slate-500",
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
  vacation:    "bg-sky-50 ring-1 ring-sky-200",
  sick_leave:  "bg-rose-50 ring-1 ring-rose-200",
  school_holiday: "bg-indigo-50 ring-1 ring-indigo-200",
  public_holiday: "bg-slate-100 ring-1 ring-slate-200",
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
  vacation:    "bg-sky-50 text-sky-700",
  sick_leave:  "bg-rose-50 text-rose-700",
  school_holiday: "bg-indigo-50 text-indigo-700",
  public_holiday: "bg-slate-100 text-slate-700",
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
  vacation:    <Plane size={14} />,
  sick_leave:  <Thermometer size={14} />,
  school_holiday: <BookOpen size={14} />,
  public_holiday: <CalendarDays size={14} />,
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
  "school_holiday",
  "vacation",
  "sick_leave",
  "public_holiday",
  "other",
];

export const REMINDER_OPTIONS: { value: ReminderFrequency; label: string }[] = [
  { value: "none",    label: "Brez opomnika" },
  { value: "daily",   label: "Dnevno" },
  { value: "monthly", label: "Mesečno" },
  { value: "yearly",  label: "Letno" },
  { value: "custom",  label: "Niz / po meri" },
];
