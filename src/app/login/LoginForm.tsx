"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Home, Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) setError(decodeURIComponent(err));
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "register") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) setError(error.message);
      else setSent(true);

    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("Napačen e-naslov ali geslo.");
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase as any)
          .from("user_profiles")
          .select("household_id")
          .maybeSingle();
        router.push(profile ? "/" : "/setup");
        router.refresh();
      }
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-income-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📬</span>
          </div>
          <h2 className="text-base font-semibold text-neutral-900 mb-2">Preveri svojo pošto</h2>
          <p className="text-sm text-neutral-500 mb-1">Poslali smo potrditveni e-mail na</p>
          <p className="text-sm font-medium text-neutral-800 mb-4">{email}</p>
          <p className="text-xs text-neutral-400">
            Klikni na povezavo v emailu in dostop bo odprt. Email morda prispe z zamudo 1–2 min.
          </p>
          <button
            onClick={() => { setSent(false); setMode("login"); }}
            className="btn-ghost text-xs mt-6 mx-auto"
          >
            Nazaj na vpis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-sm">
            <Home size={20} className="text-white" />
          </div>
          <div>
            <div className="text-lg font-semibold text-neutral-900">Moje finance</div>
            <div className="text-[11px] text-neutral-400 -mt-0.5">Gospodinjski ERP</div>
          </div>
        </div>

        <div className="bg-white border border-neutral-100 rounded-2xl shadow-sm p-6">
          <div className="mb-4 rounded-lg border border-brand-100 bg-brand-50/60 px-3 py-3">
            <div className="text-xs font-semibold text-brand-700 mb-1">Kako testirati</div>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Če še nimaš dostopa, izberi <strong>Registracija</strong>, vnesi svoj e-naslov in geslo,
              potrdi e-mail, nato nastavi svoje gospodinjstvo. Če račun že obstaja, uporabi <strong>Vpis</strong>.
            </p>
          </div>

          <div className="flex gap-1 p-1 bg-neutral-50 rounded-xl mb-6">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className={`flex-1 text-sm py-1.5 rounded-lg font-medium transition-all ${
                  mode === m
                    ? "bg-white text-neutral-800 shadow-sm"
                    : "text-neutral-400 hover:text-neutral-600"
                }`}
              >
                {m === "login" ? "Vpis" : "Registracija"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-neutral-500 mb-1.5">E-naslov</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ime@primer.si"
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-500 mb-1.5">Geslo</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="najmanj 8 znakov"
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-expense-700 bg-expense-50 border border-expense-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 disabled:opacity-50"
            >
              {loading ? "…" : mode === "login" ? "Vpiši se" : "Ustvari račun"}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-neutral-300 mt-6">
          Moje finance · Podatki shranjeni varno v Supabase
        </p>
      </div>
    </div>
  );
}
