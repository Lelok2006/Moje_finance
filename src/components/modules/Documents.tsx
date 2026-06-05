"use client";

import { useState } from "react";
import { Upload, FileText, FileCheck, FileWarning, Check, X, Clock } from "lucide-react";
import { DOCUMENTS } from "@/lib/data";
import { formatDate, getCategory } from "@/lib/utils";
import type { Document } from "@/types";
import clsx from "clsx";

const DOC_TYPE_LABEL: Record<string, string> = {
  invoice: "Račun", contract: "Pogodba", policy: "Polica",
  payslip: "Plačilna lista", tax: "Davčni dok.", other: "Ostalo",
};
const STATUS_PILL: Record<string, string> = {
  pending_ocr: "pill pill-amber",
  pending_confirm: "pill pill-amber",
  booked: "pill pill-green",
  archived: "pill pill-blue",
};
const STATUS_LABEL: Record<string, string> = {
  pending_ocr: "OCR...", pending_confirm: "Čaka potrditev",
  booked: "Vknjiženo", archived: "Arhiv",
};

export default function Documents() {
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());

  const pending = DOCUMENTS.filter(
    (d) => d.status === "pending_confirm" && !confirmed.has(d.id)
  );
  const rest = DOCUMENTS.filter(
    (d) => d.status !== "pending_confirm" || confirmed.has(d.id)
  );

  return (
    <div className="p-4 md:p-6 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Dokumenti</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Arhiv računov, pogodb in listin</p>
        </div>
        <button className="btn-primary"><Upload size={14} />Naloži</button>
      </div>

      {/* Upload cona */}
      <div className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center hover:border-brand-400 hover:bg-brand-50/30 transition-all cursor-pointer group">
        <Upload size={24} className="mx-auto mb-2 text-neutral-300 group-hover:text-brand-500 transition-colors" />
        <p className="text-sm text-neutral-500">Povleci dokument sem ali klikni za nalaganje</p>
        <p className="text-xs text-neutral-400 mt-1">
          PDF, JPG, PNG · OCR samodejno prebere vsebino in predlaga kategorijo
        </p>
      </div>

      {/* OCR potrditev */}
      {pending.length > 0 && (
        <div className="card border-warn-500/30 bg-warn-50/20">
          <div className="card-title">
            <span className="flex items-center gap-2">
              <Clock size={14} className="text-warn-700" />
              Čaka potrditev ({pending.length})
            </span>
          </div>
          {pending.map((doc) => {
            const cat = doc.ocrSuggestedCategory ? getCategory(doc.ocrSuggestedCategory) : null;
            return (
              <div key={doc.id} className="bg-white rounded-lg border border-neutral-100 p-3 mb-2 last:mb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-xs font-medium text-neutral-800">{doc.name}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">OCR zaznan znesek: <strong>{doc.ocrAmount} €</strong></div>
                    {cat && (
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        Predlagana kategorija: <span className="sif-code">{cat.code}</span> {cat.name}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setConfirmed((s) => new Set(Array.from(s).concat(doc.id)))}
                      className="flex items-center gap-1 text-xs bg-income-500 text-white px-2.5 py-1.5 rounded-lg hover:bg-income-700 transition-colors"
                    >
                      <Check size={12} />Potrdi
                    </button>
                    <button className="flex items-center gap-1 text-xs btn-secondary py-1.5">
                      <X size={12} />Popravi
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vsi dokumenti */}
      <div className="card">
        <div className="card-title">Vsi dokumenti</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {rest.map((doc) => (
            <div
              key={doc.id}
              className={clsx(
                "flex items-center gap-3 p-3 rounded-lg border border-neutral-100",
                "hover:border-neutral-200 cursor-pointer transition-colors",
                doc.expiryDate && daysUntilDoc(doc) < 60 ? "border-warn-500/40 bg-warn-50/20" : ""
              )}
            >
              <div className={clsx(
                "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                docIconBg(doc.type)
              )}>
                {docIcon(doc.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-neutral-800 truncate">{doc.name}</div>
                <div className="text-[10px] text-neutral-400">
                  {DOC_TYPE_LABEL[doc.type]}
                  {doc.ocrAmount ? ` · ${doc.ocrAmount} €` : ""}
                  {doc.documentDate ? ` · ${formatDate(doc.documentDate)}` : ""}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={clsx("pill text-[10px]", STATUS_PILL[confirmed.has(doc.id) ? "booked" : doc.status])}>
                  {STATUS_LABEL[confirmed.has(doc.id) ? "booked" : doc.status]}
                </span>
                {doc.expiryDate && daysUntilDoc(doc) < 60 && (
                  <span className="text-[10px] text-warn-700 font-medium">
                    Rok: {formatDate(doc.expiryDate)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function daysUntilDoc(doc: Document) {
  if (!doc.expiryDate) return 999;
  return Math.ceil((new Date(doc.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function docIconBg(type: string) {
  const map: Record<string, string> = {
    invoice: "bg-brand-50 text-brand-600",
    contract: "bg-income-50 text-income-700",
    policy: "bg-warn-50 text-warn-700",
    payslip: "bg-expense-50 text-expense-700",
    tax: "bg-purple-50 text-purple-700",
    other: "bg-neutral-100 text-neutral-500",
  };
  return map[type] ?? map.other;
}

function docIcon(type: string) {
  switch (type) {
    case "invoice": return <FileText size={16} />;
    case "contract": return <FileCheck size={16} />;
    case "policy": return <FileWarning size={16} />;
    default: return <FileText size={16} />;
  }
}
