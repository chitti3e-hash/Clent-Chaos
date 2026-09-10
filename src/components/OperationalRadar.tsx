"use client";

import React, { useMemo, useState } from "react";
import { useLalaFlow } from "../context/LalaFlowContext";
import { Task, TaskStatus } from "../types";
import { TaskCard } from "./TaskCard";
import { 
  CheckCircle2, 
  Search, 
  UserCheck, 
  Layers,
  PauseCircle,
  HelpCircle,
  Inbox,
  ListChecks,
  AlertTriangle,
  Kanban,
  LayoutGrid
} from "lucide-react";

interface OperationalRadarProps {
  onOpenTask: (task: Task) => void;
}

export const OperationalRadar: React.FC<OperationalRadarProps> = ({ onOpenTask }) => {
  const { 
    tasks, 
    activePersona, 
    activeManagerBucket, 
    setActiveManagerBucket,
    bucketCounts,
    activeViewMode,
    setActiveViewMode,
    searchQuery, 
    setSearchQuery 
  } = useLalaFlow();

  const [personaFilter, setPersonaFilter] = useState<string | null>(null);

  const now = Date.now();

  // Filter tasks based on Search, Manager Bucket, and Persona
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchCustomer = task.customer?.name.toLowerCase().includes(q) || false;
        const matchOwner = task.owner?.name.toLowerCase().includes(q) || false;
        const matchRaw = task.rawInput.toLowerCase().includes(q);
        const matchNotes = (task.clarificationNotes || "").toLowerCase().includes(q) || (task.waitingReason || "").toLowerCase().includes(q);
        if (!matchTitle && !matchCustomer && !matchOwner && !matchRaw && !matchNotes) return false;
      }

      // 2. Persona Focus Filter
      if (personaFilter) {
        if (personaFilter === "ME") {
          if (task.owner?.id !== activePersona.id) return false;
        } else if (task.owner?.id !== personaFilter) {
          return false;
        }
      }

      // 3. Manager Bucket Filter
      if (activeManagerBucket === "WAITING_FOR_US") {
        return task.status === "IN_PROGRESS" || task.status === "READY_TO_ASSIGN" || task.status === "NEW_REQUEST";
      }
      if (activeManagerBucket === "WAITING_ON_CLIENT") {
        return task.status === "WAITING_ON_CLIENT" || task.status === "NEEDS_CLARIFICATION";
      }
      if (activeManagerBucket === "UNASSIGNED") {
        return !task.ownerId || task.status === "NEW_REQUEST" || task.status === "READY_TO_ASSIGN";
      }
      if (activeManagerBucket === "OVERDUE") {
        // Explicit rule: WAITING_ON_CLIENT and NEEDS_CLARIFICATION are strictly excluded from Overdue!
        if (task.status === "DONE" || task.status === "WAITING_ON_CLIENT" || task.status === "NEEDS_CLARIFICATION") {
          return false;
        }
        if (!task.dueDate) return false;
        return new Date(task.dueDate).getTime() < now;
      }

      // "ALL"
      return true;
    });
  }, [tasks, searchQuery, personaFilter, activePersona, activeManagerBucket, now]);

  // Kanban Pipeline Columns (for the 6-stage lifecycle)
  const pipelineStages: Array<{ status: TaskStatus; label: string; icon: any; color: string; desc: string }> = [
    { status: "NEW_REQUEST", label: "New Request", icon: Inbox, color: "text-blue-400 border-blue-500/30 bg-blue-500/10", desc: "Triage & intake" },
    { status: "NEEDS_CLARIFICATION", label: "Needs Clarification", icon: HelpCircle, color: "text-amber-300 border-amber-500/30 bg-amber-500/10", desc: "Waiting on client" },
    { status: "READY_TO_ASSIGN", label: "Ready to Assign", icon: ListChecks, color: "text-indigo-300 border-indigo-500/30 bg-indigo-500/10", desc: "Scoped for dispatch" },
    { status: "IN_PROGRESS", label: "In Progress", icon: CheckCircle2, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", desc: "Active internal work" },
    { status: "WAITING_ON_CLIENT", label: "Waiting on Client", icon: PauseCircle, color: "text-purple-300 border-purple-500/30 bg-purple-500/10", desc: "SLA paused" },
    { status: "DONE", label: "Done", icon: CheckCircle2, color: "text-zinc-400 border-zinc-700/50 bg-zinc-800/40", desc: "Verified & completed" },
  ];

  return (
    <div className="space-y-4">
      
      {/* Primary Manager Views Navigation Bar */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-3 shadow-xl backdrop-blur-md space-y-3">
        
        {/* Row 1: The 4 Core Manager Buckets */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            
            {/* 1. Waiting for Us */}
            <button
              onClick={() => setActiveManagerBucket("WAITING_FOR_US")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                activeManagerBucket === "WAITING_FOR_US"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 ring-1 ring-blue-400"
                  : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <CheckCircle2 className="h-4 w-4 text-blue-300" />
              <span>Waiting for us</span>
              <span className={`rounded-full px-2 py-0.2 text-[10px] font-extrabold ${
                activeManagerBucket === "WAITING_FOR_US" ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-300"
              }`}>
                {bucketCounts.waitingForUs}
              </span>
            </button>

            {/* 2. Waiting for the Client */}
            <button
              onClick={() => setActiveManagerBucket("WAITING_ON_CLIENT")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                activeManagerBucket === "WAITING_ON_CLIENT"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25 ring-1 ring-purple-400"
                  : "bg-zinc-900 text-zinc-400 hover:text-purple-300 hover:bg-zinc-800"
              }`}
            >
              <PauseCircle className="h-4 w-4 text-purple-300" />
              <span>Waiting for the client</span>
              <span className={`rounded-full px-2 py-0.2 text-[10px] font-extrabold ${
                activeManagerBucket === "WAITING_ON_CLIENT" ? "bg-white/20 text-white" : "bg-purple-950 text-purple-300 border border-purple-800"
              }`}>
                {bucketCounts.waitingOnClient}
              </span>
            </button>

            {/* 3. Unassigned */}
            <button
              onClick={() => setActiveManagerBucket("UNASSIGNED")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                activeManagerBucket === "UNASSIGNED"
                  ? "bg-amber-600 text-white shadow-lg shadow-amber-600/25 ring-1 ring-amber-400"
                  : "bg-zinc-900 text-zinc-400 hover:text-amber-300 hover:bg-zinc-800"
              }`}
            >
              <Inbox className="h-4 w-4 text-amber-300" />
              <span>Unassigned</span>
              <span className={`rounded-full px-2 py-0.2 text-[10px] font-extrabold ${
                activeManagerBucket === "UNASSIGNED" ? "bg-white/20 text-white" : "bg-amber-950 text-amber-300 border border-amber-800"
              }`}>
                {bucketCounts.unassigned}
              </span>
            </button>

            {/* 4. Overdue */}
            <button
              onClick={() => setActiveManagerBucket("OVERDUE")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                activeManagerBucket === "OVERDUE"
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/25 ring-1 ring-red-400 animate-pulse"
                  : "bg-zinc-900 text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
              }`}
            >
              <AlertTriangle className={`h-4 w-4 ${bucketCounts.overdue > 0 ? "text-red-400" : "text-zinc-500"}`} />
              <span>Overdue</span>
              <span className={`rounded-full px-2 py-0.2 text-[10px] font-extrabold ${
                activeManagerBucket === "OVERDUE" ? "bg-white/20 text-white" : "bg-red-950 text-red-300 border border-red-800"
              }`}>
                {bucketCounts.overdue}
              </span>
            </button>

            {/* All */}
            <button
              onClick={() => setActiveManagerBucket("ALL")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                activeManagerBucket === "ALL"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>All ({bucketCounts.all})</span>
            </button>
          </div>

          {/* View Mode Switcher: Attention Radar vs 6-Stage Kanban */}
          <div className="flex items-center gap-1 rounded-xl bg-zinc-900 p-1 border border-zinc-800 shrink-0">
            <button
              onClick={() => setActiveViewMode("radar")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                activeViewMode === "radar"
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Attention Radar View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Attention View</span>
            </button>
            <button
              onClick={() => setActiveViewMode("kanban")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                activeViewMode === "kanban"
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="6-Stage Lifecycle Pipeline Board"
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Pipeline (6 Stages)</span>
            </button>
          </div>
        </div>

        {/* Row 2: Search & Owner Filter Sub-bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-900">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-zinc-500 mr-1">Filter Owner:</span>
            <button
              onClick={() => setPersonaFilter(null)}
              className={`rounded-lg px-2 py-0.5 text-[11px] font-medium transition-colors ${
                personaFilter === null ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Everyone
            </button>
            <button
              onClick={() => setPersonaFilter("ME")}
              className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium transition-colors ${
                personaFilter === "ME" ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <UserCheck className="h-3 w-3" />
              <span>My Focus ({activePersona.name.split(" ")[0]})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, client, notes..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
            <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-500" />
          </div>
        </div>
      </div>

      {/* Informative Bucket Banner Explaining the Operational Rule */}
      {activeManagerBucket === "WAITING_ON_CLIENT" && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 flex items-start gap-2.5 text-xs text-purple-200">
          <PauseCircle className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-purple-300">Manager Rule Applied: </span>
            <span>These requests are paused awaiting client-provided information, specifications, or approvals. Internal SLA clocks are stopped. <strong>They are never marked overdue or counted as employee delay.</strong></span>
          </div>
        </div>
      )}

      {activeManagerBucket === "OVERDUE" && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 flex items-start gap-2.5 text-xs text-red-200">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-red-300">Operational Failure Attention: </span>
            <span>True internal SLA breaches where work is in our court and target completion passed. <strong>Items in &quot;Waiting on Client&quot; are strictly excluded.</strong></span>
          </div>
        </div>
      )}

      {activeManagerBucket === "UNASSIGNED" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2.5 text-xs text-amber-200">
          <Inbox className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300">Triage Queue: </span>
            <span>Unassigned requests needing manager assignment to an account or logistics lead. Use the 1-click assign button on each card to dispatch work.</span>
          </div>
        </div>
      )}

      {/* VIEW MODE 1: Attention Radar View (Selected Bucket Display) */}
      {activeViewMode === "radar" && (
        <div className="space-y-4">
          {filteredTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} onOpenDrawer={onOpenTask} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-800/80 bg-zinc-950/40 p-12 text-center text-zinc-500">
              <CheckCircle2 className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
              <h4 className="text-sm font-semibold text-zinc-300">
                {activeManagerBucket === "OVERDUE" ? "Zero Overdue Deliverables" : "No requests in this bucket"}
              </h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                {activeManagerBucket === "OVERDUE" 
                  ? "All internal commitments are on schedule or safely in client court."
                  : "Try clearing search filters or paste a new message in the Hopper above."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: 6-Stage Pipeline Board (Kanban Columns) */}
      {activeViewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto pb-4">
          {pipelineStages.map((stage) => {
            const stageTasks = filteredTasks.filter((t) => t.status === stage.status);
            const StageIcon = stage.icon;

            return (
              <div 
                key={stage.status}
                className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3 min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${stage.color}`}>
                      <StageIcon className="h-3 w-3" />
                    </span>
                    <h4 className="text-xs font-bold text-zinc-200 leading-tight">
                      {stage.label}
                    </h4>
                  </div>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.2 text-[10px] font-bold text-zinc-300">
                    {stageTasks.length}
                  </span>
                </div>

                <p className="text-[10px] text-zinc-500 mb-2.5">{stage.desc}</p>

                {/* Task Cards in Column */}
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {stageTasks.length > 0 ? (
                    stageTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onOpenDrawer={onOpenTask} />
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-zinc-800/80 p-4 text-center text-[11px] text-zinc-600">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
