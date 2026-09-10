"use client";

import React, { useState } from "react";
import { Task, TaskStatus } from "../types";
import { useLalaFlow } from "../context/LalaFlowContext";
import { 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  ListChecks, 
  Plus, 
  Trash2, 
  History, 
  MessageSquare, 
  FileText, 
  Mic, 
  Sparkles,
  Check,
  PauseCircle,
  HelpCircle,
  Inbox
} from "lucide-react";

interface TaskDetailDrawerProps {
  task: Task | null;
  onClose: () => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({ task, onClose }) => {
  const { 
    updateTask, 
    transitionStatus,
    assignOwner,
    toggleSubAction, 
    resolveBlocker, 
    setTaskBlocked, 
    completeTask, 
    deleteTask,
    teamMembers, 
    customers 
  } = useLalaFlow();

  const [newSubText, setNewSubText] = useState("");
  const [isEditingBlocker, setIsEditingBlocker] = useState(false);
  const [blockerText, setBlockerText] = useState("");
  const [isEditingWaiting, setIsEditingWaiting] = useState(false);
  const [waitingText, setWaitingText] = useState("");
  const [isEditingClarification, setIsEditingClarification] = useState(false);
  const [clarificationText, setClarificationText] = useState("");

  if (!task) return null;

  const completedCount = task.subActions.filter((s) => s.isCompleted).length;
  const totalCount = task.subActions.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddMilestone = () => {
    if (!newSubText.trim()) return;
    const newSub = {
      id: `sub-${Date.now()}`,
      title: newSubText.trim(),
      isCompleted: false,
      order: totalCount + 1,
    };
    updateTask(task.id, {
      subActions: [...task.subActions, newSub],
    });
    setNewSubText("");
  };

  const handleRemoveMilestone = (subId: string) => {
    updateTask(task.id, {
      subActions: task.subActions.filter((s) => s.id !== subId),
    });
  };

  const handleSaveBlocker = () => {
    if (blockerText.trim()) {
      setTaskBlocked(task.id, blockerText.trim());
    } else {
      resolveBlocker(task.id);
    }
    setIsEditingBlocker(false);
  };

  const handleSaveWaitingReason = () => {
    updateTask(task.id, { waitingReason: waitingText.trim() });
    setIsEditingWaiting(false);
  };

  const handleSaveClarification = () => {
    updateTask(task.id, { clarificationNotes: clarificationText.trim() });
    setIsEditingClarification(false);
  };

  const ChannelIcon = {
    whatsapp: MessageSquare,
    email: FileText,
    voice_note: Mic,
    direct: Sparkles,
  }[task.sourceType || "direct"] || MessageSquare;

  // 6-stage lifecycle steps
  const stages: Array<{ id: TaskStatus; label: string; icon: any; short: string }> = [
    { id: "NEW_REQUEST", label: "New Request", icon: Inbox, short: "New" },
    { id: "NEEDS_CLARIFICATION", label: "Needs Clarification", icon: HelpCircle, short: "Clarify" },
    { id: "READY_TO_ASSIGN", label: "Ready to Assign", icon: ListChecks, short: "Ready" },
    { id: "IN_PROGRESS", label: "In Progress", icon: CheckCircle2, short: "In Progress" },
    { id: "WAITING_ON_CLIENT", label: "Waiting on Client", icon: PauseCircle, short: "Wait Client" },
    { id: "DONE", label: "Done", icon: CheckCircle2, short: "Done" },
  ];

  const currentStageIndex = stages.findIndex((s) => s.id === task.status);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-xl border-l border-zinc-800 bg-zinc-950 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
          
          {/* Main Body */}
          <div className="space-y-4">
            
            {/* Top Bar with Close Button */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  task.priority === "URGENT" ? "bg-red-500/10 text-red-400 border-red-500/30" :
                  task.priority === "HIGH" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                  "bg-blue-500/10 text-blue-400 border-blue-500/30"
                }`}>
                  {task.priority}
                </span>

                <span className="text-xs text-zinc-400">
                  ID: <span className="text-zinc-200 font-mono">{task.id.slice(0, 14)}</span>
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 6-Stage Lifecycle Stepper (Interactive 1-Click State Advancement) */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                <span>Workflow Stage Lifecycle</span>
                <span className="text-[10px] text-indigo-400 font-normal">Click stage to change</span>
              </div>

              <div className="grid grid-cols-6 gap-1">
                {stages.map((stage, idx) => {
                  const isActive = task.status === stage.id;
                  const isPast = currentStageIndex > idx;
                  const StageIcon = stage.icon;

                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => transitionStatus(task.id, stage.id)}
                      className={`flex flex-col items-center justify-center p-1.5 rounded-xl border text-center transition-all ${
                        isActive
                          ? "border-indigo-500 bg-indigo-600/25 text-white shadow-md ring-1 ring-indigo-400"
                          : isPast
                          ? "border-zinc-800 bg-zinc-950/80 text-zinc-300 hover:border-zinc-700"
                          : "border-zinc-800/60 bg-zinc-950/40 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                      }`}
                      title={`Switch status to ${stage.label}`}
                    >
                      <StageIcon className={`h-3.5 w-3.5 mb-1 ${isActive ? "text-indigo-300" : isPast ? "text-emerald-400" : "text-zinc-500"}`} />
                      <span className="text-[10px] font-bold leading-tight line-clamp-1">{stage.short}</span>
                    </button>
                  );
                })}
              </div>

              {/* Status Operational Context Note */}
              {task.status === "WAITING_ON_CLIENT" && (
                <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-2 text-xs text-purple-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <PauseCircle className="h-4 w-4 text-purple-400 shrink-0" />
                    <span><strong>Waiting on Client:</strong> Internal SLA clock is paused. Not treated as overdue.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setWaitingText(task.waitingReason || "");
                      setIsEditingWaiting(true);
                    }}
                    className="text-[10px] text-purple-300 underline shrink-0 ml-2"
                  >
                    Edit Reason
                  </button>
                </div>
              )}

              {task.status === "NEEDS_CLARIFICATION" && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-amber-400 shrink-0" />
                    <span><strong>Needs Clarification:</strong> Pending client answers before work is assigned.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setClarificationText(task.clarificationNotes || "");
                      setIsEditingClarification(true);
                    }}
                    className="text-[10px] text-amber-300 underline shrink-0 ml-2"
                  >
                    Edit Notes
                  </button>
                </div>
              )}
            </div>

            {/* Editable Waiting Reason Form */}
            {isEditingWaiting && (
              <div className="rounded-xl border border-purple-500/40 bg-zinc-900 p-3 space-y-2 text-xs">
                <label className="block font-semibold text-purple-300">
                  What are we waiting for from the client?
                </label>
                <input
                  type="text"
                  value={waitingText}
                  onChange={(e) => setWaitingText(e.target.value)}
                  placeholder="e.g. Awaiting client IT to provide signed TLS cert..."
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingWaiting(false)}
                    className="px-2 py-1 text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveWaitingReason}
                    className="rounded-lg bg-purple-600 px-3 py-1 font-semibold text-white hover:bg-purple-500"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Editable Clarification Notes Form */}
            {isEditingClarification && (
              <div className="rounded-xl border border-amber-500/40 bg-zinc-900 p-3 space-y-2 text-xs">
                <label className="block font-semibold text-amber-300">
                  What clarification questions have been sent to the client?
                </label>
                <input
                  type="text"
                  value={clarificationText}
                  onChange={(e) => setClarificationText(e.target.value)}
                  placeholder="e.g. Sent WhatsApp asking for packaging dimensions and volume tiers..."
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingClarification(false)}
                    className="px-2 py-1 text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveClarification}
                    className="rounded-lg bg-amber-600 px-3 py-1 font-semibold text-white hover:bg-amber-500"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Raw Communication Context Box */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3.5">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
                <span className="flex items-center gap-1.5 font-medium text-indigo-400">
                  <ChannelIcon className="h-3.5 w-3.5" />
                  <span>Captured from {task.sourceType.toUpperCase()} Stream</span>
                </span>
                <span>Original Request Text</span>
              </div>
              <p className="text-xs italic text-zinc-300 bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800/60 leading-relaxed">
                &ldquo;{task.rawInput}&rdquo;
              </p>
            </div>

            {/* Task Title & Details */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Deliverable / Task Name
              </label>
              <input
                type="text"
                value={task.title}
                onChange={(e) => updateTask(task.id, { title: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm font-bold text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Meta Grid: Owner & Client */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Single Responsible Owner
                </label>
                <select
                  value={task.ownerId || ""}
                  onChange={(e) => assignOwner(task.id, e.target.value ? e.target.value : null)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">— Unassigned (Triage in Queue) —</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role.split(" ")[0]})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Client Account
                </label>
                <select
                  value={task.customerId || ""}
                  onChange={(e) => updateTask(task.id, { customerId: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Internal Blocker / Dependency Section */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  <span>Internal Prerequisite / Blocker</span>
                </div>

                {task.isBlocked ? (
                  <button
                    type="button"
                    onClick={() => resolveBlocker(task.id)}
                    className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-sm"
                  >
                    Resolve Blocker
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setBlockerText("");
                      setIsEditingBlocker(true);
                    }}
                    className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
                  >
                    Flag New Blocker
                  </button>
                )}
              </div>

              {task.isBlocked && (
                <div className="text-xs text-amber-200/90 bg-zinc-950/70 p-2.5 rounded-lg border border-amber-500/20">
                  <p className="font-semibold text-amber-300">Active Blocker:</p>
                  <p className="mt-0.5">{task.blockerReason || "Internal verification required"}</p>
                </div>
              )}

              {isEditingBlocker && (
                <div className="pt-2 space-y-2 border-t border-amber-500/20">
                  <input
                    type="text"
                    value={blockerText}
                    onChange={(e) => setBlockerText(e.target.value)}
                    placeholder="Enter blocker description (e.g. Rahul pricing verification)..."
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingBlocker(false)}
                      className="rounded-md px-2 py-1 text-xs text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveBlocker}
                      className="rounded-md bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-500"
                    >
                      Save Blocker
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Subactions Checklist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ListChecks className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Execution Milestones ({completedCount}/{totalCount})</span>
                </label>
                <span className="text-xs font-bold text-zinc-300">{progressPercent}%</span>
              </div>

              <div className="space-y-1.5">
                {task.subActions.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => toggleSubAction(task.id, sub.id)}
                    className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5 text-xs text-zinc-200 hover:border-zinc-700 cursor-pointer transition-colors"
                  >
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      sub.isCompleted 
                        ? "bg-emerald-500 border-emerald-500 text-black" 
                        : "border-zinc-700 bg-zinc-950"
                    }`}>
                      {sub.isCompleted && <Check className="h-3 w-3 stroke-[3]" />}
                    </span>
                    <span className={`flex-1 ${sub.isCompleted ? "line-through text-zinc-500" : "text-zinc-200"}`}>
                      {sub.title}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveMilestone(sub.id);
                      }}
                      className="text-zinc-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* Add Milestone Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newSubText}
                    onChange={(e) => setNewSubText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddMilestone();
                      }
                    }}
                    placeholder="Add milestone step..."
                    className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddMilestone}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Accountability Audit Trail */}
            <div className="pt-2 border-t border-zinc-900">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <History className="h-3.5 w-3.5 text-zinc-500" />
                <span>Accountability Audit Trail ({task.activities?.length || 0} events)</span>
              </label>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {(task.activities || task.auditLogs || []).map((log) => (
                  <div key={log.id} className="rounded-lg bg-zinc-900/40 border border-zinc-900 p-2 text-[11px]">
                    <div className="flex items-center justify-between text-zinc-400 font-medium">
                      <span className="text-zinc-200">{log.action}</span>
                      <span className="text-[10px] text-zinc-500">{log.timestamp}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      Actor: <span className="text-zinc-400">{log.actorName}</span>
                      {log.details && <span> • {log.details}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 flex items-center justify-between border-t border-zinc-800/80 pt-4">
            <button
              type="button"
              onClick={() => {
                deleteTask(task.id);
                onClose();
              }}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                Close
              </button>

              {task.status !== "DONE" && (
                <button
                  type="button"
                  onClick={() => {
                    completeTask(task.id);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:from-emerald-500 hover:to-teal-500"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Verify & Complete</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
