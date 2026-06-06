import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

const CATEGORIES = `
Prihodki: 1010=Redna plača, 1020=Božičnica/regres, 1030=Honorar, 1040=Najemnina (prejeta), 1050=Socialni transferji, 1060=Drugo
Fiksni: 2010=Najemnina/hipoteka, 2020=Elektrika, 2030=Ogrevanje, 2040=Voda, 2050=Internet/telefon, 2060=Zavarovanje, 2110=Gorivo, 2120=Javni prevoz, 2130=Leasing avta
Spremenljivi: 3010=Trgovina, 3020=Restavracije, 3110=Zdravnik, 3120=Lekarna, 3200=Izobraževanje, 3300=Obleka/obutev, 3400=Zabava, 3500=Potovanja, 3600=Dom popravila, 3700=Otroci, 3800=Hišni ljubljenčki, 3900=Ostalo
Prihranki: 4010=Hranilna vloga, 4020=Naložbeni sklad, 4030=Pokojninsko
`.trim();

type OcrResult = {
  amount: number | null;
  date: string | null;
  doc_type: "invoice" | "contract" | "policy" | "payslip" | "tax" | "other";
  description: string;
  category_code: string | null;
  payment_status: "unknown" | "pending" | "paid" | "canceled";
  due_date: string | null;
  paid_at: string | null;
  raw_text: string;
};

export async function POST(req: NextRequest) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Gospodinjstvo ni najdeno" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Napaka pri branju datoteke" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Datoteka manjka" }, { status: 400 });
  }

  const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Nepodprt format. Dovoljeno: PDF, JPG, PNG" },
      { status: 400 }
    );
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Datoteka je prevelika (max 10 MB)" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY ni nastavljen. OCR trenutno ni na voljo." },
      { status: 503 }
    );
  }

  const fileBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(fileBuffer);
  const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

  const { data: duplicate, error: duplicateError } = await supabase
    .from("documents")
    .select("id,name,uploaded_at,status")
    .eq("household_id", profile.household_id)
    .eq("file_hash", fileHash)
    .maybeSingle();

  if (duplicateError) {
    console.error("Duplicate check error:", duplicateError);
    return NextResponse.json({ error: "Napaka pri preverjanju podvojenega dokumenta" }, { status: 500 });
  }

  if (duplicate) {
    return NextResponse.json(
      {
        error: `Ta dokument je že naložen: ${duplicate.name}.`,
        duplicate,
      },
      { status: 409 }
    );
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${profile.household_id}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, fileBuffer, { contentType: file.type });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return NextResponse.json({ error: "Napaka pri nalaganju datoteke" }, { status: 500 });
  }

  // Claude Vision OCR
  const base64 = buffer.toString("base64");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fileBlock: any = file.type.startsWith("image/")
    ? {
        type: "image",
        source: {
          type: "base64",
          media_type: file.type,
          data: base64,
        },
      }
    : {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: base64,
        },
      };

  let ocr: OcrResult = {
    amount: null,
    date: null,
    doc_type: "other",
    description: file.name,
    category_code: null,
    payment_status: "unknown",
    due_date: null,
    paid_at: null,
    raw_text: "",
  };

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const aiResponse = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            fileBlock,
            {
              type: "text",
              text: `Preberi ta dokument in vrni SAMO veljavni JSON brez markdown, brez razlage.

Kategorije (koda=ime):
${CATEGORIES}

Vrni JSON z naslednjimi polji:
{
  "amount": skupni znesek v EUR kot število, ali null,
  "date": datum dokumenta "YYYY-MM-DD" ali null,
  "doc_type": "invoice"|"contract"|"policy"|"payslip"|"tax"|"other",
  "description": kratek opis max 60 znakov (npr. "Mercator - živila", "A1 - internet"),
  "category_code": koda najustreznejše kategorije ali null,
  "payment_status": "paid" če je razvidno da je že plačano/online plačano, "pending" če čaka plačilo, "canceled" če je stornirano, sicer "unknown",
  "due_date": datum zapadlosti/valute "YYYY-MM-DD" ali null,
  "paid_at": datum plačila "YYYY-MM-DD" ali null,
  "raw_text": ključno besedilo dokumenta max 300 znakov
}`,
            },
          ],
        },
      ],
    });

    const textBlock = aiResponse.content.find((b) => b.type === "text");
    if (textBlock && textBlock.type === "text") {
      const rawText = textBlock.text.trim();
      // Strip markdown code block if present
      const jsonStr = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      ocr = JSON.parse(jsonStr);
    }
  } catch (err) {
    console.error("OCR error:", err);
    // Continue with defaults — document is already saved to storage
  }

  const DOC_TYPES = ["invoice", "contract", "policy", "payslip", "tax", "other"] as const;
  const docType = DOC_TYPES.includes(ocr.doc_type as (typeof DOC_TYPES)[number])
    ? ocr.doc_type
    : "other";
  const PAYMENT_STATUSES = ["unknown", "pending", "paid", "canceled"] as const;
  const paymentStatus = PAYMENT_STATUSES.includes(ocr.payment_status as (typeof PAYMENT_STATUSES)[number])
    ? ocr.payment_status
    : "unknown";

  const { data: doc, error: dbError } = await supabase
    .from("documents")
    .insert({
      household_id: profile.household_id,
      name: file.name,
      type: docType,
      status: "pending_confirm",
      file_path: filePath,
      file_hash: fileHash,
      file_size: file.size,
      mime_type: file.type,
      payment_status: paymentStatus,
      due_date: ocr.due_date ?? null,
      paid_at: ocr.paid_at ?? null,
      ocr_amount: ocr.amount ?? null,
      ocr_suggested_category: ocr.category_code ?? null,
      ocr_raw_text: ocr.raw_text ?? null,
      document_date: ocr.date ?? null,
    })
    .select()
    .single();

  if (dbError) {
    console.error("DB insert error:", dbError);
    return NextResponse.json({ error: "Napaka pri shranjevanju" }, { status: 500 });
  }

  return NextResponse.json({
    document: {
      id: doc.id,
      name: doc.name,
      type: doc.type,
      status: doc.status,
      uploadedAt: doc.uploaded_at,
      documentDate: doc.document_date,
      ocrAmount: doc.ocr_amount,
      ocrSuggestedCategory: doc.ocr_suggested_category,
      ocrRawText: doc.ocr_raw_text,
      filePath: doc.file_path,
      paymentStatus: doc.payment_status,
      dueDate: doc.due_date,
      paidAt: doc.paid_at,
    },
  });
}
