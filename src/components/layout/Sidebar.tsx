"use client";

import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard, ReceiptText, Files, Users,
  Calculator, Settings, Home, Menu, X, CalendarDays, BellRing,
  ChevronDown, Check, KeyRound, LogOut, UserCircle, Moon, Sun,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ModuleId } from "@/types";
import clsx from "clsx";

const NAV_ITEMS: {
  id: ModuleId;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  group: string;
}[] = [
  { id: "dashboard",   label: "Danes",            icon: <LayoutDashboard size={16} />, group: "Pregled" },
  { id: "calendar",    label: "Koledar",          icon: <CalendarDays size={16} />,    group: "Pregled" },
  { id: "events",      label: "Obveznosti",       icon: <BellRing size={16} />,        group: "Pregled" },
  { id: "documents",   label: "Dokumenti",        icon: <Files size={16} />,           group: "Moduli" },
  { id: "members",     label: "Člani",            icon: <Users size={16} />,           group: "Moduli" },
  { id: "finance",     label: "Stroški",          icon: <ReceiptText size={16} />,     group: "Moduli" },
  { id: "calculators", label: "Kalkulatorji",     icon: <Calculator size={16} />,      group: "Moduli" },
  { id: "settings",    label: "Nastavitve",       icon: <Settings size={16} />,        group: "Sistem" },
];

const GROUPS = Array.from(new Set(NAV_ITEMS.map((i) => i.group)));

interface SidebarProps {
  active: ModuleId;
  onChange: (id: ModuleId) => void;
}

interface NavContentProps {
  active: ModuleId;
  onNavigate: (id: ModuleId) => void;
}

function NavContent({ active, onNavigate }: NavContentProps) {
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("lifedesk-theme", next ? "dark" : "light"); } catch (_) {}
  }

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
    });
  }, []);

  useEffect(() => {
    if (!profileOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen]);

  async function changePassword() {
    if (newPassword.length < 8) {
      setProfileError("Geslo mora imeti vsaj 8 znakov.");
      return;
    }

    setSavingPassword(true);
    setProfileError("");
    setProfileMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) {
      setProfileError(error.message);
      return;
    }

    setNewPassword("");
    setProfileMessage("Geslo je posodobljeno.");
  }

  async function signOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Logo */}
      <div className="px-4 py-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <button
            className="flex items-center gap-2.5 text-left"
            onClick={() => onNavigate("dashboard")}
            aria-label="Nazaj na domov"
          >
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Home size={16} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">LifeDesk</div>
              <div className="text-[10px] text-neutral-400">Domača administracija</div>
            </div>
          </button>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"
            title={dark ? "Svetli način" : "Temni način"}
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
        <button
          className="mt-2 text-[10px] text-brand-600 hover:text-brand-700 font-medium"
          onClick={() => onNavigate("dashboard")}
        >
          Domov / danes
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {GROUPS.map((group) => (
          <div key={group} className="mb-1">
            <div className="text-[10px] text-neutral-400 uppercase tracking-wider px-2 py-1.5">
              {group}
            </div>
            {NAV_ITEMS.filter((i) => i.group === group).map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={clsx("nav-btn", active === item.id && "active")}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="bg-expense-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* User */}
      <div ref={profileRef} className="relative border-t border-neutral-100 dark:border-neutral-800">
        {profileOpen && (
          <div className="absolute left-3 right-3 bottom-full mb-2 rounded-xl border border-neutral-100 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg p-3 z-20">
            <div className="flex items-start gap-2.5 pb-3 border-b border-neutral-100 dark:border-neutral-700">
              <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 flex-shrink-0">
                <UserCircle size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Profil uporabnika</div>
                <div className="text-[10px] text-neutral-400 truncate">{email || "Prijavljen uporabnik"}</div>
              </div>
            </div>

            <button
              className="btn-ghost text-xs w-full justify-start mt-3"
              onClick={() => { onNavigate("settings"); setProfileOpen(false); }}
            >
              <Settings size={13} />Nastavitve
            </button>

            <div className="mt-3 space-y-2">
              <label className="block text-[10px] text-neutral-500">Novo geslo</label>
              <input
                type="password"
                className="input h-9 text-xs"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="najmanj 8 znakov"
              />
              <button
                className="btn-secondary text-xs w-full justify-center"
                onClick={changePassword}
                disabled={savingPassword}
              >
                {savingPassword ? "Shranjujem..." : <><KeyRound size={13} />Spremeni geslo</>}
              </button>
            </div>

            {profileMessage && (
              <p className="mt-2 rounded-lg border border-income-200 bg-income-50 px-2 py-1.5 text-[10px] text-income-700 flex items-center gap-1.5">
                <Check size={11} />{profileMessage}
              </p>
            )}
            {profileError && (
              <p className="mt-2 rounded-lg border border-expense-200 bg-expense-50 px-2 py-1.5 text-[10px] text-expense-700">
                {profileError}
              </p>
            )}

            <button
              className="btn-secondary text-xs w-full justify-center text-expense-700 hover:bg-expense-50 mt-3"
              onClick={signOut}
              disabled={signingOut}
            >
              <LogOut size={13} />{signingOut ? "Odjavljam..." : "Odjava"}
            </button>
          </div>
        )}

        <button
          className="w-full px-3 py-3 flex items-center gap-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left"
          onClick={() => { setProfileOpen((open) => !open); setProfileError(""); setProfileMessage(""); }}
        >
          <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-xs font-semibold text-brand-600 flex-shrink-0">
            {(email || "MF").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate">{email || "LifeDesk"}</div>
            <div className="text-[10px] text-neutral-400">Profil in odjava</div>
          </div>
          <ChevronDown size={14} className={clsx("text-neutral-300 transition-transform", profileOpen && "rotate-180")} />
        </button>
      </div>
    </>
  );
}

export default function Sidebar({ active, onChange }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleNav(id: ModuleId) {
    onChange(id);
    setMobileOpen(false);
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[220px] flex-shrink-0 bg-white dark:bg-neutral-900 border-r border-neutral-100 dark:border-neutral-800 h-screen sticky top-0">
        <NavContent active={active} onNavigate={onChange} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between px-4 h-14">
        <button className="flex items-center gap-2" onClick={() => handleNav("dashboard")}>
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <Home size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-neutral-900">LifeDesk</span>
        </button>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-neutral-100"
          aria-label="Odpri meni"
        >
          <Menu size={20} className="text-neutral-600" />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={clsx(
          "md:hidden fixed top-0 left-0 bottom-0 z-50 w-[260px] bg-white dark:bg-neutral-900 flex flex-col",
          "transform transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-neutral-100 dark:border-neutral-800">
          <button className="flex items-center gap-2" onClick={() => handleNav("dashboard")}>
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <Home size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-neutral-900">LifeDesk</span>
          </button>
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <X size={18} className="text-neutral-500" />
          </button>
        </div>
        <NavContent active={active} onNavigate={handleNav} />
      </aside>
    </>
  );
}
