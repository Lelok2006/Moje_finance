"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Sidebar from "@/components/layout/Sidebar";
import type { ModuleId } from "@/types";

const Dashboard   = dynamic(() => import("@/components/modules/Dashboard"));
const Finance     = dynamic(() => import("@/components/modules/Finance"));
const Documents   = dynamic(() => import("@/components/modules/Documents"));
const Members     = dynamic(() => import("@/components/modules/Members"));
const Calculators = dynamic(() => import("@/components/modules/Calculators"));
const Calendar    = dynamic(() => import("@/components/modules/Calendar"));
const Events      = dynamic(() => import("@/components/modules/Events"));
const Settings    = dynamic(() => import("@/components/modules/Settings"));

const MODULES: Record<ModuleId, React.ReactNode> = {
  dashboard:   <Dashboard />,
  finance:     <Finance />,
  documents:   <Documents />,
  members:     <Members />,
  calculators: <Calculators />,
  calendar:    <Calendar />,
  events:      <Events />,
  settings:    <Settings />,
};

export default function Home() {
  const [active, setActive] = useState<ModuleId>("dashboard");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar active={active} onChange={setActive} />
      {/* Mobile top-bar spacer */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-14">
        {MODULES[active]}
      </main>
    </div>
  );
}
