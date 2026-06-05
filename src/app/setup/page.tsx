"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [householdName, setHouseholdName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setError(null);
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Ni prijavljenega uporabnika.");

      // 1. Ustvari gospodinjstvo
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;

      const { data: household, error: hErr } = await db
        .from("households")
        .insert({ name: householdName.trim(), currency: "EUR", country: "Slovenija", tax_scale: "SLO 2026" })
        .select()
        .single();
      if (hErr) throw hErr;

      const { error: pErr } = await db
        .from("user_profiles")
        .insert({ id: user.id, household_id: household.id });
      if (pErr) throw pErr;

      const initials = memberName.trim().split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
      const { error: mErr } = await db
        .from("members")
        .insert({
          household_id: household.id,
          name: memberName.trim(),
          initials,
          type: "adult",
          color: "bg-brand-50 text-brand-600",
          is_admin: true,
        });
      if (mErr) throw mErr;

      router.push("/");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Napaka pri ustvarjanju gospodinjstva.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-sm">
            <Home size={20} className="text-white" />
          </div>
          <div>
            <div className="text-lg font-semibold text-neutral-900">Moje finance</div>
            <div className="text-[11px] text-neutral-400 -mt-0.5">Nastavitev gospodinjstva</div>
          </div>
        </div>

        <div className="bg-white border border-neutral-100 rounded-2xl shadow-sm p-6 space-y-5">

          {/* Koraki */}
          <div className="flex items-center gap-2 mb-2">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  step >= s ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-400"
                }`}>
                  {s}
                </div>
                {s < 2 && <div className={`h-px w-8 ${step > s ? "bg-brand-300" : "bg-neutral-100"}`} />}
              </div>
            ))}
            <span className="text-xs text-neutral-400 ml-1">
              {step === 1 ? "Ime gospodinjstva" : "Vaše ime"}
            </span>
          </div>

          {step === 1 ? (
            <>
              <div>
                <label className="block text-xs text-neutral-500 mb-1.5">Ime gospodinjstva</label>
                <input
                  autoFocus
                  type="text"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  placeholder="npr. Novak, Naša hiša…"
                  className="input"
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  Prikazano bo v aplikaciji. Lahko spremenite pozneje.
                </p>
              </div>
              <button
                disabled={householdName.trim().length < 2}
                onClick={() => setStep(2)}
                className="btn-primary w-full justify-center py-2.5 disabled:opacity-40"
              >
                Naprej
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs text-neutral-500 mb-1.5">Vaše ime</label>
                <input
                  autoFocus
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="npr. Ana Novak"
                  className="input"
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  Člane gospodinjstva dodajate pozneje v razdelku Člani.
                </p>
              </div>
              {error && (
                <p className="text-xs text-expense-700 bg-expense-50 border border-expense-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="btn-secondary flex-shrink-0">
                  Nazaj
                </button>
                <button
                  disabled={memberName.trim().length < 2 || loading}
                  onClick={handleCreate}
                  className="btn-primary flex-1 justify-center py-2.5 disabled:opacity-40"
                >
                  {loading ? "…" : "Začni"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
