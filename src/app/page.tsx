"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Dashboard from "@/components/modules/Dashboard";
import Finance from "@/components/modules/Finance";
import Documents from "@/components/modules/Documents";
import Members from "@/components/modules/Members";
import Calculators from "@/components/modules/Calculators";
import Settings from "@/components/modules/Settings";
import type { ModuleId } from "@/types";

const MODULES: Record<ModuleId, React.ReactNode> = {
  dashboard:   <Dashboard />,
  finance:     <Finance />,
  documents:   <Documents />,
  members:     <Members />,
  calculators: <Calculators />,
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
