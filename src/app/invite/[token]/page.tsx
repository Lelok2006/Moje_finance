"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { Home, CheckCircle, XCircle } from "lucide-react";

type InviteState = "loading" | "valid" | "invalid" | "expired" | "used" | "joining" | "done";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [state, setState] = useState<InviteState>("loading");
  const [householdName, setHouseholdName] = useState("");
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  useEffect(() => {
    async function load() {
      // Preveri prijavo
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user ?? null);

      // Preveri veljavnost povabila
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const { data: invite, error } = await db
        .from("household_invites")
        .select("*, households(name)")
        .eq("token", token)
        .maybeSingle();

      if (error || !invite) { setState("invalid"); return; }
      if (invite.used_at)  { setState("used");    return; }
      if (new Date(invite.expires_at) < new Date()) { setState("expired"); return; }

      setHouseholdName(invite.households?.name ?? "");
      setState("valid");
    }
    load();
  }, [token]);

  async function acceptInvite() {
    if (!user) {
      // Shrani token in preusmeri na login → po vpisu bo invite sprejet
      router.push(`/login?invite=${token}`);
      return;
    }

    setState("joining");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Pridobi household_id iz invite
    const { data: invite } = await db
      .from("household_invites")
      .select("household_id")
      .eq("token", token)
      .single();

    if (!invite) { setState("invalid"); return; }

    // Poveži userja z gospodinjstvom
    await db.from("user_profiles").upsert({
      id: user.id,
      household_id: invite.household_id,
    });

    // Označi povabilo kot uporabljeno
    await db.from("household_invites").update({
      used_by: user.id,
      used_at: new Date().toISOString(),
    }).eq("token", token);

    setState("done");
    setTimeout(() => { router.push("/"); router.refresh(); }, 1500);
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">

        <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center mx-auto mb-6">
          <Home size={22} className="text-white" />
        </div>

        {state === "loading" && (
          <p className="text-sm text-neutral-400">Preverjam povabilo…</p>
        )}

        {state === "valid" && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-neutral-900 mb-1">Povabilo v gospodinjstvo</h2>
            <p className="text-sm text-neutral-500 mb-1">Pridružuješ se gospodinjstvu</p>
            <p className="text-lg font-semibold text-brand-600 mb-5">{householdName}</p>
            {!user && (
              <p className="text-xs text-neutral-400 mb-4">
                Za sprejem povabila se moraš najprej vpisati ali ustvariti račun.
              </p>
            )}
            <button onClick={acceptInvite} className="btn-primary w-full justify-center py-2.5">
              {user ? "Sprejmi povabilo" : "Vpiši se in sprejmi"}
            </button>
          </div>
        )}

        {state === "joining" && (
          <p className="text-sm text-neutral-400">Pridružujem te gospodinjstvu…</p>
        )}

        {state === "done" && (
          <div className="space-y-2">
            <CheckCircle size={40} className="text-income-500 mx-auto" />
            <p className="text-sm font-medium text-neutral-800">Uspešno si se pridružila!</p>
            <p className="text-xs text-neutral-400">Preusmerjam…</p>
          </div>
        )}

        {(state === "invalid" || state === "expired" || state === "used") && (
          <div className="space-y-2">
            <XCircle size={40} className="text-expense-500 mx-auto" />
            <p className="text-sm font-medium text-neutral-800">
              {state === "used"    ? "Povabilo je že bilo uporabljeno." :
               state === "expired" ? "Povabilo je poteklo." :
               "Povabilo ni veljavno."}
            </p>
            <p className="text-xs text-neutral-400">Prosi za novo povabilo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
