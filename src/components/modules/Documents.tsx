"use client";

import { useRef, useState, useEffect } from "react";
import {
  Upload, FileText, FileCheck, FileWarning, Check, X,
  Clock, Loader2, ChevronRight,
} from "lucide-react";
import { DOCUMENTS, CATEGORIES } from "@/lib/data";
import { formatDate, getCategory } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import AppSelect from "@/components/ui/AppSelect";
import type { Document } from "@/types";
import clsx from "clsx";

// ── Konstante ─────────────────────────────────────────────────

const DOC_TYPE_LABEL: Record<string, string> = {
  invoice: "Račun", contract: "Pogodba", policy: "Polica",
  payslip: "Plačilna lista", tax: "Davčni dok.", other: "Ostalo",
};
const DOC_TYPES = [
  { value: "invoice",  label: "Račun" },
  { value: "contract", label: "Pogodba" },
  { value: "policy",   label: "Polica" },
  { value: "payslip",  label: "Plačilna lista" },
  { value: "tax",      label: "Davčni dokument" },
  { value: "other",    label: "Ostalo" },
];
const STATUS_PILL: Record<string, string> = {
  pending_ocr:     "pill pill-amber",
  pending_confirm: "pill pill-amber",
  booked:          "pill pill-green",
  archived:        "pill pill-blue",
};
const STATUS_LABEL: Record<string, string> = {
  pending_ocr:     "OCR...",
  pending_confirm: "Čaka potrditev",
  booked:          "Vknjiženo",
  archived:        "Arhiv",
};

// ── Razširjen tip z OCR besedilom ─────────────────────────────

type DocWithOcr = Document & { ocrRawText?: string };

// ── Modalno okno ──────────────────────────────────────────────

function DocumentModal({
  doc,
  isOcr,
  onClose,
  onConfirm,
  onReject,
  onSave,
}: {
  doc: DocWithOcr;
  isOcr: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  onSave: (id: string, updates: Partial<DocWithOcr>) => void;
}) {
  const [amount, setAmount]     = useState(doc.ocrAmount?.toString() ?? "");
  const [date, setDate]         = useState(doc.documentDate ?? "");
  const [category, setCategory] = useState(doc.ocrSuggestedCategory ?? "");
  const [type, setType]         = useState(doc.type);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Baseline — posodablja se po vsakem shranjevanju za pravilen isDirty
  const [base, setBase] = useState({ amount: doc.ocrAmount?.toString() ?? "", date: doc.documentDate ?? "", category: doc.ocrSuggestedCategory ?? "", type: doc.type });

  // Pridobi podpisani URL za predogled datoteke
  useEffect(() => {
    if (!doc.filePath) return;
    const supabase = createClient();
    supabase.storage.from("documents")
      .createSignedUrl(doc.filePath, 600)
      .then(({ data }) => { if (data) setPreviewUrl(data.signedUrl); });
  }, [doc.filePath]);

  const isPending = doc.status === "pending_confirm";
  const isDirty = amount !== base.amount || date !== base.date || category !== base.category || type !== base.type;

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const updates: Partial<DocWithOcr> = {
      ocrAmount:            amount ? parseFloat(amount) : undefined,
      documentDate:         date || undefined,
      ocrSuggestedCategory: category || undefined,
      type:                 type as Document["type"],
    };
    await onSave(doc.id, updates);
    setBase({ amount, date, category, type }); // posodobi baseline → isDirty = false
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-neutral-100">
          <div className="flex-1 min-w-0 pr-3">
            <div className="text-sm font-semibold text-neutral-900 truncate">{doc.name}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={clsx("pill text-[10px]", STATUS_PILL[doc.status])}>
                {STATUS_LABEL[doc.status]}
              </span>
              <span className="text-[10px] text-neutral-400">{DOC_TYPE_LABEL[doc.type]}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 transition-colors flex-shrink-0">
            <X size={16} className="text-neutral-500" />
          </button>
        </div>

        {/* Vsebina — levo: forma, desno: slika */}
        <div className="flex-1 overflow-hidden flex flex-col sm:flex-row min-h-0">

          {/* Levo: polja */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-neutral-500 mb-1">Znesek (€)</label>
                <input type="number" step="0.01" min="0" value={amount}
                  onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="input" />
              </div>
              <div>
                <label className="block text-[10px] text-neutral-500 mb-1">Datum dokumenta</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-neutral-500 mb-1">Vrsta dokumenta</label>
              <AppSelect
                value={type}
                placeholder="Izberi vrsto"
                options={DOC_TYPES}
                onChange={(nextType) => setType(nextType as Document["type"])}
              />
            </div>

            <div>
              <label className="block text-[10px] text-neutral-500 mb-1">Kategorija</label>
              <AppSelect
                value={category}
                placeholder="— brez kategorije —"
                options={[{ value: "", label: "— brez kategorije —" }]}
                groups={CATEGORIES.filter((c) => !c.parentCode).map((parent) => ({
                  label: parent.name,
                  options: CATEGORIES.filter((c) => c.parentCode === parent.code).map((c) => ({
                    value: c.code,
                    label: c.name,
                  })),
                }))}
                onChange={setCategory}
              />
            </div>

            {doc.ocrRawText && (
              <div>
                <div className="text-[10px] text-neutral-500 mb-1">Prebrano besedilo</div>
                <div className="bg-neutral-50 border border-neutral-100 rounded-lg p-3 text-[11px] text-neutral-600 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {doc.ocrRawText}
                </div>
              </div>
            )}
          </div>

          {/* Desno: predogled */}
          {doc.filePath && (
            <div className="sm:w-60 border-t sm:border-t-0 sm:border-l border-neutral-100 bg-neutral-50/60 flex flex-col">
              <div className="text-[10px] text-neutral-400 px-3 pt-3 pb-1 font-medium">Predogled</div>
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                {previewUrl ? (
                  doc.filePath.match(/\.pdf$/i) ? (
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                      className="btn-secondary text-xs justify-center">
                      Odpri PDF
                    </a>
                  ) : (
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="block">
                      <img src={previewUrl} alt={doc.name}
                        className="w-full rounded-lg border border-neutral-200 shadow-sm object-contain" />
                    </a>
                  )
                ) : (
                  <div className="flex items-center justify-center h-24">
                    <Loader2 size={16} className="animate-spin text-neutral-300" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Gumbi */}
        <div className="px-5 py-4 border-t border-neutral-100 space-y-2">
          {/* Sporočilo o uspešnem shranjevanju */}
          {saved && !isDirty && (
            <p className="text-xs text-income-700 bg-income-50 border border-income-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <Check size={12} />Spremembe so shranjene.
            </p>
          )}
          <div className="flex gap-2">
            {isPending ? (
              <>
                <button
                  onClick={() => { handleSave().then(() => onReject(doc.id)); }}
                  className="btn-secondary flex-1 justify-center py-2.5"
                >
                  <X size={14} />Zavrni
                </button>
                <button
                  onClick={() => { handleSave().then(() => onConfirm(doc.id)); }}
                  className="btn-primary flex-1 justify-center py-2.5"
                >
                  <Check size={14} />Potrdi
                </button>
              </>
            ) : (
              <>
                {/* Zapri — postane moder ko je shranjeno */}
                <button
                  onClick={onClose}
                  className={clsx(
                    "flex-1 justify-center py-2.5",
                    saved && !isDirty ? "btn-primary" : "btn-secondary"
                  )}
                >
                  Zapri
                </button>
                {isDirty && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary flex-1 justify-center py-2.5 disabled:opacity-50"
                  >
                    {saving
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Check size={14} />}
                    Shrani
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Glavna komponenta ─────────────────────────────────────────

type UploadState = "idle" | "uploading" | "error";

export default function Documents() {
  const [ocrDocs, setOcrDocs]       = useState<DocWithOcr[]>([]);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging]  = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocWithOcr | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock dokumenti z razširjenim tipom
  const mockDocs: DocWithOcr[] = DOCUMENTS;

  async function handleFile(file: File) {
    setUploadState("uploading");
    setUploadError("");
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/ocr", { method: "POST", body: formData });
    const json = await res.json();
    if (!res.ok) {
      setUploadState("error");
      setUploadError(json.error ?? "Napaka pri OCR");
      return;
    }
    setUploadState("idle");
    setOcrDocs((prev) => [json.document, ...prev]);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function confirmDoc(docId: string) {
    const supabase = createClient();

    // Poišči dokument (OCR ali mock)
    const doc = [...ocrDocs, ...mockDocs].find((d) => d.id === docId);

    const { data: existingTx } = await supabase
      .from("transactions")
      .select("id")
      .eq("document_id", docId)
      .maybeSingle();

    if (existingTx) {
      await supabase
        .from("documents")
        .update({ status: "booked", linked_transaction_id: existingTx.id })
        .eq("id", docId);
      setOcrDocs((prev) => prev.map((d) => d.id === docId ? { ...d, status: "booked" as const, linkedTransactionId: existingTx.id } : d));
      setSelectedDoc(null);
      return;
    }

    // Posodobi status
    await supabase.from("documents").update({ status: "booked" }).eq("id", docId);

    // Samodejno ustvari transakcijo če ima OCR znesek
    if (doc?.ocrAmount) {
      const { data: householdId } = await supabase.rpc("get_household_id");
      if (householdId) {
        const { data: tx } = await supabase.from("transactions").insert({
          household_id:  householdId,
          date:          doc.documentDate ?? new Date().toISOString().slice(0, 10),
          description:   doc.name,
          amount:        doc.ocrAmount,
          type:          "expense",
          category_code: doc.ocrSuggestedCategory ?? "3900",
          document_id:   docId,
        }).select("id").single();

        if (tx) {
          await supabase
            .from("documents")
            .update({ linked_transaction_id: tx.id })
            .eq("id", docId);
        }
      }
    }

    setOcrDocs((prev) => prev.map((d) => d.id === docId ? { ...d, status: "booked" as const } : d));
    setSelectedDoc(null);
  }

  async function rejectDoc(docId: string) {
    const supabase = createClient();
    await supabase.from("documents").update({ status: "archived" }).eq("id", docId);
    setOcrDocs((prev) => prev.filter((d) => d.id !== docId));
    setSelectedDoc(null);
  }

  async function saveDoc(docId: string, updates: Partial<DocWithOcr>) {
    const isOcr = ocrDocs.some((d) => d.id === docId);
    if (isOcr) {
      const supabase = createClient();
      await supabase.from("documents").update({
        ocr_amount:              updates.ocrAmount ?? null,
        document_date:           updates.documentDate ?? null,
        ocr_suggested_category:  updates.ocrSuggestedCategory ?? null,
        type:                    updates.type,
      }).eq("id", docId);
      setOcrDocs((prev) => prev.map((d) => d.id === docId ? { ...d, ...updates } : d));
    }
    // Posodobi selectedDoc za takojšen prikaz
    setSelectedDoc((prev) => prev ? { ...prev, ...updates } : null);
  }

  const allOcrPending  = ocrDocs.filter((d) => d.status === "pending_confirm");
  const allOcrRest     = ocrDocs.filter((d) => d.status !== "pending_confirm");
  const mockPending    = mockDocs.filter((d) => d.status === "pending_confirm");
  const mockRest       = mockDocs.filter((d) => d.status !== "pending_confirm");

  const pending = [...allOcrPending, ...mockPending];
  const rest    = [...allOcrRest, ...mockRest];

  function openDoc(doc: DocWithOcr) { setSelectedDoc(doc); }
  function isOcrDoc(id: string)     { return ocrDocs.some((d) => d.id === id); }

  return (
    <div className="p-4 md:p-6 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Dokumenti</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Arhiv računov, pogodb in listin</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadState === "uploading"}
        >
          {uploadState === "uploading"
            ? <><Loader2 size={14} className="animate-spin" />Berem...</>
            : <><Upload size={14} />Naloži</>
          }
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Upload zona */}
      <div
        className={clsx(
          "border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer group",
          isDragging          ? "border-brand-400 bg-brand-50/60" :
          uploadState === "uploading" ? "border-brand-300 bg-brand-50/20 cursor-not-allowed" :
          "border-neutral-200 hover:border-brand-400 hover:bg-brand-50/30"
        )}
        onClick={() => uploadState !== "uploading" && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        {uploadState === "uploading" ? (
          <>
            <Loader2 size={24} className="mx-auto mb-2 text-brand-500 animate-spin" />
            <p className="text-sm text-brand-600 font-medium">Berem dokument...</p>
            <p className="text-xs text-neutral-400 mt-1">Počakaj trenutek</p>
          </>
        ) : (
          <>
            <Upload size={24} className="mx-auto mb-2 text-neutral-300 group-hover:text-brand-500 transition-colors" />
            <p className="text-sm text-neutral-500">Povleci dokument sem ali klikni za nalaganje</p>
            <p className="text-xs text-neutral-400 mt-1">PDF, JPG, PNG · OCR samodejno prebere vsebino</p>
          </>
        )}
      </div>

      {uploadState === "error" && (
        <div className="bg-expense-50 border border-expense-200 rounded-lg px-3 py-2 flex items-center justify-between">
          <p className="text-xs text-expense-700">{uploadError}</p>
          <button onClick={() => setUploadState("idle")}><X size={14} className="text-expense-500" /></button>
        </div>
      )}

      {/* Čaka potrditev */}
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
              <div
                key={doc.id}
                className="bg-white rounded-lg border border-neutral-100 p-3 mb-2 last:mb-0 cursor-pointer hover:border-neutral-200 transition-colors"
                onClick={() => openDoc(doc)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-neutral-800 truncate">{doc.name}</div>
                    <div className="flex flex-wrap gap-x-3 mt-0.5">
                      {doc.ocrAmount != null && (
                        <span className="text-[10px] text-neutral-500">
                          <strong className="text-neutral-800">{doc.ocrAmount} €</strong>
                        </span>
                      )}
                      {doc.documentDate && (
                        <span className="text-[10px] text-neutral-400">{formatDate(doc.documentDate)}</span>
                      )}
                      {cat && (
                        <span className="text-[10px] text-neutral-400">{cat.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); confirmDoc(doc.id); }}
                      className="flex items-center gap-1 text-xs bg-income-500 text-white px-2.5 py-1.5 rounded-lg hover:bg-income-700 transition-colors"
                    >
                      <Check size={12} />Potrdi
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); rejectDoc(doc.id); }}
                      className="flex items-center gap-1 text-xs btn-secondary py-1.5"
                    >
                      <X size={12} />Zavrni
                    </button>
                    <ChevronRight size={14} className="text-neutral-300" />
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
        {rest.length === 0 ? (
          <p className="text-xs text-neutral-400 py-4 text-center">Ni dokumentov</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {rest.map((doc) => (
              <div
                key={doc.id}
                onClick={() => openDoc(doc)}
                className={clsx(
                  "flex items-center gap-3 p-3 rounded-lg border border-neutral-100",
                  "hover:border-neutral-200 cursor-pointer transition-colors",
                  doc.expiryDate && daysUntilDoc(doc) < 60 ? "border-warn-500/40 bg-warn-50/20" : ""
                )}
              >
                <div className={clsx("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", docIconBg(doc.type))}>
                  {docIcon(doc.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-neutral-800 truncate">{doc.name}</div>
                  <div className="text-[10px] text-neutral-400">
                    {DOC_TYPE_LABEL[doc.type]}
                    {doc.ocrAmount != null ? ` · ${doc.ocrAmount} €` : ""}
                    {doc.documentDate ? ` · ${formatDate(doc.documentDate)}` : ""}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={clsx("pill text-[10px]", STATUS_PILL[doc.status])}>
                    {STATUS_LABEL[doc.status]}
                  </span>
                  {doc.expiryDate && daysUntilDoc(doc) < 60 && (
                    <span className="text-[10px] text-warn-700 font-medium">Rok: {formatDate(doc.expiryDate)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedDoc && (
        <DocumentModal
          doc={selectedDoc}
          isOcr={isOcrDoc(selectedDoc.id)}
          onClose={() => setSelectedDoc(null)}
          onConfirm={confirmDoc}
          onReject={rejectDoc}
          onSave={saveDoc}
        />
      )}
    </div>
  );
}

// ── Pomožne funkcije ──────────────────────────────────────────

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
    case "invoice":  return <FileText size={16} />;
    case "contract": return <FileCheck size={16} />;
    case "policy":   return <FileWarning size={16} />;
    default:         return <FileText size={16} />;
  }
}
