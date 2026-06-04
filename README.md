# Moje finance

Gospodinjski ERP — upravljanje družinskih financ, članov in dokumentov.

## Zagon projekta

### 1. Zahteve
- Node.js 18+ (prenos: https://nodejs.org)
- VS Code (že imaš)

### 2. Namestitev
```bash
cd moje-finance
npm install
```

### 3. Razvoj (lokalno)
```bash
npm run dev
```
Odpri brskalnik na: http://localhost:3000

### 4. Gradnja za produkcijo
```bash
npm run build
npm start
```

## Struktura projekta

```
src/
├── app/
│   ├── layout.tsx       ← Root HTML, metapodatki
│   ├── page.tsx         ← Glavna stran (shell aplikacije)
│   └── globals.css      ← Globalni stili + Tailwind
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx  ← Navigacija (desktop + mobile drawer)
│   └── modules/
│       ├── Dashboard.tsx    ← Nadzorna plošča
│       ├── Finance.tsx      ← Transakcije
│       ├── Documents.tsx    ← Dokumenti + OCR
│       ├── Members.tsx      ← Člani gospodinjstva
│       ├── Calculators.tsx  ← Kalkulatorji (+ integracija Finančni majster)
│       └── Settings.tsx     ← Šifranti + nastavitve
├── lib/
│   ├── data.ts          ← Mock podatki (začasni, zamenjaj s Supabase)
│   └── utils.ts         ← Pomožne funkcije (formatiranje, barve)
└── types/
    └── index.ts         ← TypeScript tipi za celoten projekt
```

## Naslednji koraki

### Faza 1 (zdaj) — Frontend ✅
- [x] Vse strani in navigacija
- [x] Odzivnost (desktop + mobil)
- [x] Mock podatki

### Faza 2 — Backend (Supabase)
- [ ] Ustvari projekt na supabase.com
- [ ] SQL tabele (members, transactions, categories, documents, events)
- [ ] Row Level Security (vsaka družina vidi samo svoje podatke)
- [ ] Zamenjaj `src/lib/data.ts` s Supabase klicem

### Faza 3 — Integracija Finančni majster
- [ ] Poveži GitHub repozitorij kalkulatorjev
- [ ] Uvozi komponente v `src/components/modules/Calculators.tsx`

### Faza 4 — OCR
- [ ] AWS Textract za branje računov
- [ ] API endpoint v Next.js `/api/ocr`

### Faza 5 — Deploy (Vercel)
```bash
npm install -g vercel
vercel
```

## GitHub

Repozitorij spada pod račun `gh-lelok` (Lelok2006).

```bash
git init
git remote add origin git@gh-lelok:Lelok2006/moje-finance.git
git add .
git commit -m "feat: initial frontend shell"
git push -u origin main
```
