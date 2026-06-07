"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronRight, X } from "lucide-react";
import clsx from "clsx";

const CATS = [
  {
    id: "placa", num: "01", title: "Dohodki in plača",
    color: "#1B4F8A",
    calcs: [
      { id: "bruto-neto",   name: "Bruto ↔ Neto plača",          pop: true  },
      { id: "bonitetami",   name: "Plača z bonitetami",           pop: false },
      { id: "pogodbe",      name: "Redna vs. s.p.",               pop: false },
      { id: "odpravnina",   name: "Odpravnina",                   pop: true  },
      { id: "regres",       name: "Regres in solidarnostna pomoč",pop: false },
    ],
  },
  {
    id: "davki", num: "02", title: "Davki in dohodnina",
    color: "#2E6B46",
    calcs: [
      { id: "dohodnina",    name: "Dohodnina 2026",               pop: false },
      { id: "dohodnina-st", name: "Dohodnina za študente",        pop: false },
      { id: "kapital",      name: "Davek na kapitalski dobiček",  pop: false },
      { id: "najemnina-d",  name: "Davek od najemnine",           pop: false },
    ],
  },
  {
    id: "druzina", num: "03", title: "Družinski prejemki",
    color: "#7A3A8A",
    calcs: [
      { id: "otroški",       name: "Otroški dodatek",              pop: true  },
      { id: "porodniško",    name: "Starševsko nadomestilo",       pop: false },
      { id: "brezposelnost", name: "Nadomestilo za brezposelnost", pop: false },
      { id: "vrtec",         name: "Subvencija vrtca",             pop: false },
      { id: "bolniška",      name: "Bolniška nadomestila",         pop: false },
    ],
  },
  {
    id: "krediti", num: "04", title: "Krediti in posojila",
    color: "#8A4A1A",
    calcs: [
      { id: "amortizacija", name: "Amortizacijski načrt",          pop: true  },
      { id: "banke",        name: "Primerjava kreditov",           pop: false },
      { id: "predcasno",    name: "Predčasno odplačilo",           pop: false },
      { id: "leasing",      name: "Leasing vs. kredit",            pop: false },
    ],
  },
  {
    id: "nepremicnine", num: "05", title: "Nepremičnine",
    color: "#1A6A6A",
    calcs: [
      { id: "nakup",       name: "Stroški nakupa nepremičnine",    pop: true  },
      { id: "najkup",      name: "Najemnina vs. nakup",            pop: false },
      { id: "donosnost",   name: "Donosnost oddajanja",            pop: false },
      { id: "npb",         name: "Subvencija za 1. nepremičnino",  pop: false },
    ],
  },
  {
    id: "varcevanje", num: "06", title: "Varčevanje in pokojnina",
    color: "#5A3A8A",
    calcs: [
      { id: "proracun",    name: "Mesečni proračun",               pop: true  },
      { id: "investicije", name: "Investicijski kalkulator",       pop: false },
      { id: "inflacija",   name: "Kalkulator inflacije",           pop: false },
      { id: "pokojnina",   name: "Pokojninski kalkulator",         pop: false },
      { id: "fire",        name: "FIRE kalkulator",                pop: false },
    ],
  },
  {
    id: "sp", num: "07", title: "Podjetništvo in s.p.",
    color: "#6A3A1A",
    calcs: [
      { id: "sp-davcni",    name: "S.P. prispevki in davki",       pop: false },
      { id: "normiranec",   name: "Normiranec — kdaj se splača?",  pop: false },
      { id: "dividende",    name: "Dividende d.o.o.",              pop: false },
      { id: "sp-odpravnina",name: "Odpravnina (s.p./redna)",       pop: false },
    ],
  },
];

export default function Calculators() {
  const [activeCalc, setActiveCalc] = useState<string | null>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Ko iframe naloži, mu pošljemo ukaz za direktno navigacijo
  useEffect(() => {
    if (!activeCalc || !iframeReady) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: "NAVIGATE", calcId: activeCalc },
      window.location.origin
    );
  }, [activeCalc, iframeReady]);

  function openCalc(id: string) {
    setIframeReady(false);
    setActiveCalc(id);
  }

  function closeCalc() {
    setActiveCalc(null);
    setIframeReady(false);
  }

  // URL z hash za direktno navigacijo
  const iframeSrc = activeCalc
    ? `/kalkulatorji.html#${activeCalc}`
    : null;

  return (
    <div className="p-4 md:p-6 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Kalkulatorji</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Finančna orodja po slovenskem pravu
          </p>
        </div>
      </div>

      {/* Inline iframe prikaz kalkulatorja */}
      {activeCalc && (
        <div className="card p-0 overflow-hidden">
          {/* Glava z zapiranjem */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 bg-neutral-50">
            <div className="text-sm font-medium text-neutral-800">
              {CATS.flatMap((c) => c.calcs).find((c) => c.id === activeCalc)?.name}
            </div>
            <button
              onClick={closeCalc}
              className="p-1.5 rounded-lg hover:bg-neutral-200 transition-colors"
              aria-label="Zapri kalkulator"
            >
              <X size={16} className="text-neutral-500" />
            </button>
          </div>
          {/* Iframe */}
          {!iframeReady && (
            <div className="flex items-center justify-center h-24 text-xs text-neutral-400">
              Nalaganje...
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={iframeSrc ?? ""}
            className={clsx(
              "w-full border-0 transition-opacity duration-200",
              iframeReady ? "opacity-100" : "opacity-0 h-0"
            )}
            style={{ height: iframeReady ? "620px" : "0" }}
            title="LifeDesk kalkulator"
            onLoad={() => setIframeReady(true)}
          />
        </div>
      )}

      {/* Kategorije in kalkulatorji */}
      <div className="space-y-3">
        {CATS.map((cat) => (
          <div key={cat.id} className="card p-0 overflow-hidden">
            {/* Kategorija header */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100"
              style={{ borderLeft: `3px solid ${cat.color}` }}
            >
              <span
                className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded"
                style={{
                  background: cat.color + "18",
                  color: cat.color,
                }}
              >
                {cat.num}
              </span>
              <span className="text-sm font-medium text-neutral-800">{cat.title}</span>
              <span className="text-xs text-neutral-400 ml-auto">
                {cat.calcs.length} kalkulatorjev
              </span>
            </div>

            {/* Kalkulatorji v kategoriji */}
            <div className="divide-y divide-neutral-50">
              {cat.calcs.map((calc) => (
                <button
                  key={calc.id}
                  onClick={() =>
                    activeCalc === calc.id ? closeCalc() : openCalc(calc.id)
                  }
                  className={clsx(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                    activeCalc === calc.id
                      ? "bg-brand-50"
                      : "hover:bg-neutral-50"
                  )}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: cat.color }}
                  />
                  <span
                    className={clsx(
                      "text-xs flex-1",
                      activeCalc === calc.id
                        ? "text-brand-600 font-medium"
                        : "text-neutral-700"
                    )}
                  >
                    {calc.name}
                  </span>
                  {calc.pop && (
                    <span className="pill pill-amber text-[10px] hidden sm:inline-flex">
                      priljubljen
                    </span>
                  )}
                  <ChevronRight
                    size={14}
                    className={clsx(
                      "flex-shrink-0 transition-transform",
                      activeCalc === calc.id
                        ? "rotate-90 text-brand-500"
                        : "text-neutral-300"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-neutral-300 text-center pb-2">
        Informativni izračuni · Zakonske vrednosti 2026 · ZDR-1, ZDoh-2, ZPIZ-2
      </p>
    </div>
  );
}
