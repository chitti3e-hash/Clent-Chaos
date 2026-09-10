"use client";

import React, { useState } from "react";
import { LalaFlowProvider, useLalaFlow } from "../context/LalaFlowContext";
import { Header } from "../components/Header";
import { IntakeHopper } from "../components/IntakeHopper";
import { OperationalRadar } from "../components/OperationalRadar";
import { TaskDetailDrawer } from "../components/TaskDetailDrawer";
import { ImpactDashboard } from "../components/ImpactDashboard";
import { Task } from "../types";
import { 
  Zap, 
  BarChart3 
} from "lucide-react";

function MainDashboard() {
  const { tasks, selectedTaskId, setSelectedTaskId } = useLalaFlow();
  const [activeTab, setActiveTab] = useState<"radar" | "impact">("radar");
  const [hopperPrompt, setHopperPrompt] = useState<string>("");
  const [hopperKey, setHopperKey] = useState<number>(0);

  // When a demo scenario is picked from the Header
  const handleSelectScenario = (scenarioText: string) => {
    setHopperPrompt(scenarioText);
    setHopperKey((prev) => prev + 1);
    setActiveTab("radar");
    // Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 pb-16">
      
      {/* Top Header */}
      <Header onSelectScenario={handleSelectScenario} />

      {/* Subnav & View Switcher */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("radar")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "radar"
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Operational Radar & Hopper</span>
            </button>

            <button
              onClick={() => setActiveTab("impact")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "impact"
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Executive Impact & Velocity</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-zinc-500">
            <span>Client: <strong className="text-zinc-300">Lala Tech LLC</strong></span>
            <span>•</span>
            <span>Intake-to-Accountability Chasm Solved</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {activeTab === "radar" ? (
          <>
            {/* Hero Intake Section */}
            <section>
              <IntakeHopper
                key={hopperKey}
                initialPrompt={hopperPrompt}
                onTaskDispatched={() => {
                  setHopperPrompt("");
                }}
              />
            </section>

            {/* Operational Attention Radar */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Operational Attention Radar</span>
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
                      Live Pulse
                    </span>
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Prioritized by operational state: Blockers & impending SLAs surface to the top
                  </p>
                </div>
              </div>

              <OperationalRadar
                onOpenTask={(task: Task) => setSelectedTaskId(task.id)}
              />
            </section>
          </>
        ) : (
          <section>
            <ImpactDashboard />
          </section>
        )}

      </main>

      {/* Task Detail Slide-Over Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        onClose={() => setSelectedTaskId(null)}
      />

    </div>
  );
}

export default function Home() {
  return (
    <LalaFlowProvider>
      <MainDashboard />
    </LalaFlowProvider>
  );
}
