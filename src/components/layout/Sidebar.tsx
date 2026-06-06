"use client";

import { useState } from "react";
import {
  LayoutDashboard, Euro, Files, Users,
  Calculator, Settings, Home, Menu, X, CalendarDays, BellRing,
} from "lucide-react";
import type { ModuleId } from "@/types";
import clsx from "clsx";

const NAV_ITEMS: {
  id: ModuleId;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  group: string;
}[] = [
  { id: "dashboard",   label: "Nadzorna plošča", icon: <LayoutDashboard size={16} />, group: "Pregled" },
  { id: "finance",     label: "Finance",          icon: <Euro size={16} />,            group: "Moduli" },
  { id: "documents",   label: "Dokumenti",        icon: <Files size={16} />,           group: "Moduli" },
  { id: "members",     label: "Člani",            icon: <Users size={16} />,           group: "Moduli" },
  { id: "calculators", label: "Kalkulatorji",     icon: <Calculator size={16} />,      group: "Moduli" },
  { id: "calendar",    label: "Koledar",          icon: <CalendarDays size={16} />,    group: "Moduli" },
  { id: "events",      label: "Dogodki",          icon: <BellRing size={16} />,        group: "Moduli" },
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
  return (
    <>
      {/* Logo */}
      <div className="px-4 py-4 border-b border-neutral-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Home size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-neutral-900">Moje finance</div>
            <div className="text-[10px] text-neutral-400">Gospodinjski ERP</div>
          </div>
        </div>
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
      <div className="px-3 py-3 border-t border-neutral-100 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-xs font-semibold text-brand-600 flex-shrink-0">
          MF
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-neutral-800 truncate">Moje finance</div>
          <div className="text-[10px] text-neutral-400">Prijavljen uporabnik</div>
        </div>
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
      <aside className="hidden md:flex flex-col w-[220px] flex-shrink-0 bg-white border-r border-neutral-100 h-screen sticky top-0">
        <NavContent active={active} onNavigate={onChange} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-neutral-100 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <Home size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-neutral-900">Moje finance</span>
        </div>
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
          "md:hidden fixed top-0 left-0 bottom-0 z-50 w-[260px] bg-white flex flex-col",
          "transform transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <Home size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-neutral-900">Moje finance</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100">
            <X size={18} className="text-neutral-500" />
          </button>
        </div>
        <NavContent active={active} onNavigate={handleNav} />
      </aside>
    </>
  );
}
