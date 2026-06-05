"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Home, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("Napačen e-naslov ali geslo.");
      } else {
        router.push("/");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setInfo("Potrditveni e-mail je bil poslan. Po potrditvi se vpiši.");
      }
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
            <div className="text-[11px] text-neutral-400 -mt-0.5">Gospodinjski ERP</div>
          </div>
        </div>

        {/* Kartica */}
        <div className="bg-white border border-neutral-100 rounded-2xl shadow-sm p-6">

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-neutral-50 rounded-xl mb-6">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setInfo(null); }}
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
            {info && (
              <p className="text-xs text-income-700 bg-income-50 border border-income-200 rounded-lg px-3 py-2">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-sm disabled:opacity-50"
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
