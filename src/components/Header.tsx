"use client";

import React, { useState } from "react";
import { useLalaFlow } from "../context/LalaFlowContext";
import { DEMO_SCENARIOS } from "../data/seedData";
import { 
  Zap, 
  RotateCcw, 
  ShieldAlert, 
  Clock, 
  ChevronDown, 
  Sparkles, 
  Settings, 
  CheckCircle2, 
  Key,
  Award
} from "lucide-react";

interface HeaderProps {
  onSelectScenario: (scenarioText: string, scenarioId?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSelectScenario }) => {
  const { 
    activePersona, 
    setActivePersona, 
    teamMembers, 
    metrics, 
    bucketCounts,
    resetToDemoSeed,
    provider,
    setProvider,
    apiKey,
    setApiKey
  } = useLalaFlow();

  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = () => {
    resetToDemoSeed();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 2000);
  };

  const handleSaveSettings = () => {
    setApiKey(tempApiKey);
    setShowSettingsModal(false);
  };

  const hoursSaved = metrics.totalHoursSaved || metrics.hoursSaved || 58.4;
  const compliance = metrics.completionRate || metrics.slaComplianceRate || 96.4;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-zinc-950">
              <Zap className="h-5 w-5 text-indigo-400 fill-indigo-400/20" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">LalaFlow</span>
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/20">
                Lala Tech LLC
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Turn operational chaos into coordinated action
            </p>
          </div>
        </div>

        {/* Operational Attention & Impact Ticker */}
        <div className="hidden lg:flex items-center gap-4 rounded-full border border-zinc-800/70 bg-zinc-900/60 px-4 py-1.5 text-xs text-zinc-300">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-zinc-400">Zero Drops:</span>
            <span className="font-semibold text-emerald-400">100% Tracked</span>
          </div>
          <div className="h-3 w-px bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-zinc-400">Time Saved:</span>
            <span className="font-semibold text-white">{hoursSaved} hrs</span>
          </div>
          <div className="h-3 w-px bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Waiting Client:</span>
            <span className="font-semibold text-purple-400">{bucketCounts.waitingOnClient} Paused</span>
          </div>
          <div className="h-3 w-px bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-zinc-400">SLA:</span>
            <span className="font-semibold text-emerald-400">{compliance}%</span>
          </div>
          <div className="h-3 w-px bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <ShieldAlert className={`h-3.5 w-3.5 ${bucketCounts.overdue > 0 ? "text-red-400 animate-pulse" : "text-zinc-500"}`} />
            <span className="text-zinc-400">Overdue:</span>
            <span className={`font-semibold ${bucketCounts.overdue > 0 ? "text-red-400" : "text-emerald-400"}`}>
              {bucketCounts.overdue > 0 ? `${bucketCounts.overdue} Action` : "0 (Clear)"}
            </span>
          </div>
        </div>

        {/* Action Controls & Persona Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick Demo Scenarios Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowScenarioMenu(!showScenarioMenu)}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 transition-all shadow-sm"
              title="Select a pre-loaded real world scenario"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden md:inline">Demo Scenarios</span>
              <span className="md:hidden">Demos</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </button>

            {showScenarioMenu && (
              <div 
                className="absolute right-0 mt-2 w-80 rounded-xl border border-zinc-800 bg-zinc-900 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onMouseLeave={() => setShowScenarioMenu(false)}
              >
                <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800/80 mb-1">
                  1-Click Pitch Scenarios
                </div>
                {DEMO_SCENARIOS.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectScenario(s.rawText, s.id);
                      setShowScenarioMenu(false);
                    }}
                    className="w-full text-left rounded-lg p-2 hover:bg-zinc-800/80 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200 group-hover:text-indigo-400">
                        {idx === 0 ? "🌟 " : ""}{s.title}
                      </span>
                      <span className="text-[10px] text-zinc-500">{s.sourceType}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{s.rawText}</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-500">
                      <span>Client: {s.expectedClient}</span>
                      <span>•</span>
                      <span>Owner: {s.expectedOwner}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active Persona Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/90 px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePersona.avatar}
                alt={activePersona.name}
                className="h-5 w-5 rounded-full object-cover ring-1 ring-zinc-700"
              />
              <div className="text-left hidden sm:block">
                <p className="text-[11px] font-medium leading-none text-zinc-200">{activePersona.name}</p>
                <p className="text-[9px] text-zinc-500 leading-none mt-0.5">{activePersona.role.split(" ")[0]}</p>
              </div>
              <ChevronDown className="h-3 w-3 text-zinc-400" />
            </button>

            {showPersonaMenu && (
              <div 
                className="absolute right-0 mt-2 w-64 rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onMouseLeave={() => setShowPersonaMenu(false)}
              >
                <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800/80 mb-1">
                  Switch Role / Perspective
                </div>
                {teamMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      setActivePersona(member);
                      setShowPersonaMenu(false);
                    }}
                    className={`w-full flex items-center gap-2.5 rounded-lg p-2 text-left transition-colors ${
                      activePersona.id === member.id ? "bg-indigo-600/15 text-indigo-300" : "hover:bg-zinc-800/80 text-zinc-300"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="h-7 w-7 rounded-full object-cover ring-1 ring-zinc-700"
                    />
                    <div>
                      <p className="text-xs font-medium text-white">{member.name}</p>
                      <p className="text-[10px] text-zinc-400">{member.role}</p>
                    </div>
                    {activePersona.id === member.id && (
                      <CheckCircle2 className="ml-auto h-4 w-4 text-indigo-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Settings Popover */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Configure AI Model & Keys"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* 1-Click Reset to Clean Demo */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Reset board to initial Lala Tech baseline demo state"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${resetSuccess ? "animate-spin text-emerald-400" : ""}`} />
            <span className="hidden sm:inline">{resetSuccess ? "Reset!" : "Reset Demo"}</span>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">AI Orchestrator Configuration</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">Intelligent Parsing Engine</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setProvider("heuristic")}
                    className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                      provider === "heuristic"
                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div className="font-semibold">Local Heuristic</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">0ms • Offline safe</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider("gemini")}
                    className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                      provider === "gemini"
                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div className="font-semibold">Gemini 2.5</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">Google DeepMind</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider("openai")}
                    className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                      provider === "openai"
                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div className="font-semibold">GPT-4o Mini</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">OpenAI API</div>
                  </button>
                </div>
              </div>

              {provider !== "heuristic" && (
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">
                    API Key for {provider === "gemini" ? "Gemini" : "OpenAI"}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      placeholder={provider === "gemini" ? "AIzaSy..." : "sk-..."}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
                    />
                    <Key className="absolute right-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    If blank, LalaFlow seamlessly uses the deterministic high-accuracy contextual parser so your pitch never hangs.
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                <p className="text-[11px] text-emerald-300">
                  ✓ <strong>Hackathon Resilience Guarantee:</strong> Even without internet or API keys, LalaFlow extracts clients, owners, blockers, and checklist milestones deterministically.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="rounded-lg border border-zinc-800 bg-zinc-800/80 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
