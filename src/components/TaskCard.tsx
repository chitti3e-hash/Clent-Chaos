"use client";

import React, { useState } from "react";
import { Task, TaskStatus } from "../types";
import { useLalaFlow } from "../context/LalaFlowContext";
import { 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  Building2, 
  ListChecks, 
  Check, 
  MessageSquare, 
  FileText, 
  Mic, 
  Sparkles,
  HelpCircle,
  PauseCircle,
  Inbox,
  UserPlus,
  ArrowRight,
  ChevronDown
} from "lucide-react";

interface TaskCardProps {
  task: Task;
  onOpenDrawer: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onOpenDrawer }) => {
  const { 
    toggleSubAction, 
    resolveBlocker, 
    completeTask, 
    transitionStatus,
    assignOwner,
    teamMembers,
    activePersona 
  } = useLalaFlow();

  const [showAssignMenu, setShowAssignMenu] = useState(false);

  const completedSubCount = task.subActions.filter((s) => s.isCompleted).length;
  const totalSubCount = task.subActions.length;
  const progressPercent = totalSubCount > 0 ? Math.round((completedSubCount / totalSubCount) * 100) : 0;

  // Relative due date calculation
  // EXPLICIT RULE: WAITING_ON_CLIENT or NEEDS_CLARIFICATION is NOT treated as overdue!
  const getDueLabel = () => {
    if (task.status === "WAITING_ON_CLIENT") {
      return { text: "Waiting on Client • SLA Paused", isOverdue: false, isPaused: true };
    }
    if (task.status === "NEEDS_CLARIFICATION") {
      return { text: "Clarification Pending • SLA Paused", isOverdue: false, isPaused: true };
    }
    if (task.status === "DONE") {
      return { text: "Completed", isOverdue: false, isDone: true };
    }

    try {
      const due = new Date(task.dueDate).getTime();
      const diff = due - Date.now();
      const hours = Math.round(diff / (3600 * 1000));

      if (hours < 0) {
        return { text: `Overdue by ${Math.abs(hours)}h`, isOverdue: true };
      }
      if (hours === 0) return { text: "Due in minutes", isOverdue: false };
      if (hours <= 24) return { text: `Due in ${hours}h`, isOverdue: false };
      const days = Math.round(hours / 24);
      return { text: `Due in ${days}d`, isOverdue: false };
    } catch {
      return { text: "Due soon", isOverdue: false };
    }
  };

  const dueInfo = getDueLabel();

  // Status configuration styling
  const statusConfig: Record<TaskStatus, { label: string; bg: string; text: string; border: string; icon: any }> = {
    NEW_REQUEST: {
      label: "New Request",
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      border: "border-blue-500/30",
      icon: Inbox,
    },
    NEEDS_CLARIFICATION: {
      label: "Needs Clarification",
      bg: "bg-amber-500/15",
      text: "text-amber-300",
      border: "border-amber-500/40",
      icon: HelpCircle,
    },
    READY_TO_ASSIGN: {
      label: "Ready to Assign",
      bg: "bg-indigo-500/15",
      text: "text-indigo-300",
      border: "border-indigo-500/40",
      icon: ListChecks,
    },
    IN_PROGRESS: {
      label: "In Progress",
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      icon: CheckCircle2,
    },
    WAITING_ON_CLIENT: {
      label: "Waiting on Client",
      bg: "bg-purple-500/15",
      text: "text-purple-300",
      border: "border-purple-500/40",
      icon: PauseCircle,
    },
    DONE: {
      label: "Done",
      bg: "bg-zinc-800/60",
      text: "text-zinc-400",
      border: "border-zinc-700/60",
      icon: CheckCircle2,
    },
  };

  const currentStatus = statusConfig[task.status] || statusConfig.NEW_REQUEST;
  const StatusIcon = currentStatus.icon;

  // Priority styling
  const priorityBadge = {
    URGENT: "bg-red-500/10 text-red-400 border-red-500/30",
    HIGH: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    MEDIUM: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    LOW: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  }[task.priority];

  // Channel icon
  const ChannelIcon = {
    whatsapp: MessageSquare,
    email: FileText,
    voice_note: Mic,
    direct: Sparkles,
  }[task.sourceType || "direct"] || MessageSquare;

  return (
    <div 
      onClick={() => onOpenDrawer(task)}
      className={`group relative rounded-xl border p-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-indigo-500/10 ${
        dueInfo.isOverdue
          ? "border-red-500/50 bg-zinc-950 hover:border-red-500/80 ring-1 ring-red-500/20"
          : task.status === "WAITING_ON_CLIENT"
          ? "border-purple-500/30 bg-zinc-950/90 hover:border-purple-500/60"
          : task.status === "NEEDS_CLARIFICATION"
          ? "border-amber-500/30 bg-zinc-950/90 hover:border-amber-500/60"
          : task.status === "DONE"
          ? "border-zinc-800/60 bg-zinc-950/60 opacity-80 hover:opacity-100"
          : "border-zinc-800/80 bg-zinc-950 hover:border-zinc-700"
      }`}
    >
      {/* Top Meta Row */}
      <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Status Badge */}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}>
            <StatusIcon className="h-3 w-3" />
            <span>{currentStatus.label}</span>
          </span>

          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold border ${priorityBadge}`}>
            {task.priority}
          </span>

          {task.customer && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
              <Building2 className="h-3 w-3 text-zinc-400" />
              {task.customer.name}
            </span>
          )}
        </div>

        {/* SLA / Deadline Indicator */}
        <div className="flex items-center gap-1.5 text-zinc-400">
          <ChannelIcon className="h-3 w-3 text-zinc-500" />
          <div className={`flex items-center gap-1 text-[10px] font-medium ${
            dueInfo.isOverdue 
              ? "text-red-400 font-bold animate-pulse" 
              : dueInfo.isPaused 
              ? "text-purple-400 font-medium" 
              : "text-zinc-400"
          }`}>
            <Clock className="h-3 w-3" />
            <span>{dueInfo.text}</span>
          </div>
        </div>
      </div>

      {/* Task Title */}
      <h4 className={`text-xs sm:text-sm font-semibold tracking-tight text-white group-hover:text-indigo-300 transition-colors ${
        task.status === "DONE" ? "line-through text-zinc-400" : ""
      }`}>
        {task.title}
      </h4>

      {/* Waiting on Client Callout */}
      {task.status === "WAITING_ON_CLIENT" && task.waitingReason && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="mt-2.5 rounded-lg border border-purple-500/30 bg-purple-500/10 p-2 text-xs text-purple-200"
        >
          <div className="flex items-start gap-1.5">
            <PauseCircle className="h-3.5 w-3.5 shrink-0 text-purple-400 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-purple-300">Waiting for Client: </span>
              <span className="text-[11px] text-purple-200/90">{task.waitingReason}</span>
            </div>
          </div>
        </div>
      )}

      {/* Needs Clarification Callout */}
      {task.status === "NEEDS_CLARIFICATION" && task.clarificationNotes && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="mt-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-200"
        >
          <div className="flex items-start gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-amber-300">Client Clarification: </span>
              <span className="text-[11px] text-amber-200/90">{task.clarificationNotes}</span>
            </div>
          </div>
        </div>
      )}

      {/* Internal Blocker Alert Banner */}
      {task.isBlocked && task.blockerReason && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="mt-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-300"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-200">Prerequisite Blocked: </span>
                <span className="text-[11px] text-amber-300/90">{task.blockerReason}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => resolveBlocker(task.id)}
              className="shrink-0 rounded bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-200 border border-amber-500/30"
            >
              Resolve
            </button>
          </div>
        </div>
      )}

      {/* Sub-actions Progress Bar */}
      {totalSubCount > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span className="flex items-center gap-1">
              <ListChecks className="h-3 w-3 text-indigo-400" />
              <span>Milestones ({completedSubCount}/{totalSubCount})</span>
            </span>
            <span className="font-semibold text-zinc-300">{progressPercent}%</span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div 
              className={`h-full transition-all duration-300 rounded-full ${
                progressPercent === 100 
                  ? "bg-emerald-500" 
                  : task.isBlocked 
                  ? "bg-amber-500" 
                  : "bg-indigo-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* First 2 milestones */}
          <div className="pt-1 space-y-1">
            {task.subActions.slice(0, 2).map((sub) => (
              <div 
                key={sub.id} 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSubAction(task.id, sub.id);
                }}
                className="flex items-center gap-2 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors group/item"
              >
                <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors ${
                  sub.isCompleted 
                    ? "bg-emerald-500 border-emerald-500 text-black" 
                    : "border-zinc-700 bg-zinc-900 group-hover/item:border-zinc-500"
                }`}>
                  {sub.isCompleted && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                </span>
                <span className={`truncate ${sub.isCompleted ? "line-through text-zinc-500" : ""}`}>
                  {sub.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer: Owner, 1-Click Assignment & 1-Click Stage Transitions */}
      <div className="mt-3.5 flex items-center justify-between border-t border-zinc-900 pt-3 gap-2 flex-wrap">
        
        {/* Owner Avatar or 1-Click Assign */}
        <div className="relative">
          {task.owner ? (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={task.owner.avatar}
                alt={task.owner.name}
                className="h-5 w-5 rounded-full object-cover ring-1 ring-zinc-700"
              />
              <span className="text-xs font-medium text-zinc-300">
                {task.owner.name.split(" ")[0]}
              </span>
              {task.owner.id === activePersona.id && (
                <span className="rounded bg-indigo-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-indigo-300">
                  You
                </span>
              )}
            </div>
          ) : (
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setShowAssignMenu(!showAssignMenu)}
                className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors"
              >
                <UserPlus className="h-3 w-3" />
                <span>Unassigned • Assign Owner</span>
                <ChevronDown className="h-2.5 w-2.5 opacity-70" />
              </button>

              {showAssignMenu && (
                <div 
                  className="absolute left-0 bottom-full mb-1 w-48 rounded-xl border border-zinc-800 bg-zinc-900 p-1 shadow-2xl z-30 animate-in fade-in duration-150"
                  onMouseLeave={() => setShowAssignMenu(false)}
                >
                  <div className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
                    Dispatch to Lead
                  </div>
                  {teamMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        assignOwner(task.id, member.id);
                        setShowAssignMenu(false);
                      }}
                      className="w-full flex items-center gap-2 rounded-lg p-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={member.avatar} alt={member.name} className="h-4 w-4 rounded-full object-cover" />
                      <span>{member.name.split(" ")[0]}</span>
                      <span className="text-[9px] text-zinc-500 ml-auto">{member.role.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 1-Click Logical Stage Progression Button */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {task.status === "NEW_REQUEST" && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => transitionStatus(task.id, "NEEDS_CLARIFICATION", "Requires client clarification before scoping")}
                className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-300 hover:bg-amber-500/20"
                title="Client needs clarification first"
              >
                <HelpCircle className="h-2.5 w-2.5" />
                <span>Clarify</span>
              </button>
              <button
                type="button"
                onClick={() => transitionStatus(task.id, "READY_TO_ASSIGN")}
                className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] font-medium text-zinc-300 hover:text-white hover:bg-zinc-800"
                title="Scope verified — Promote to Ready to Assign"
              >
                <span>Ready</span>
                <ArrowRight className="h-2.5 w-2.5" />
              </button>
            </div>
          )}

          {task.status === "NEEDS_CLARIFICATION" && (
            <button
              type="button"
              onClick={() => transitionStatus(task.id, "READY_TO_ASSIGN", "Client provided clarification")}
              className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-300 hover:bg-amber-500/20"
              title="Client responded — Move to Ready to Assign"
            >
              <Check className="h-3 w-3" />
              <span>Clarified ➔ Assign</span>
            </button>
          )}

          {task.status === "READY_TO_ASSIGN" && (
            <button
              type="button"
              onClick={() => {
                if (!task.ownerId) {
                  assignOwner(task.id, teamMembers[1].id); // Assign to Rahul
                } else {
                  transitionStatus(task.id, "IN_PROGRESS");
                }
              }}
              className="flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2 py-1 text-[10px] font-semibold text-indigo-300 hover:bg-indigo-500/20"
              title="Assign & Start"
            >
              <ArrowRight className="h-3 w-3" />
              <span>Start Execution</span>
            </button>
          )}

          {task.status === "WAITING_ON_CLIENT" && (
            <button
              type="button"
              onClick={() => transitionStatus(task.id, "IN_PROGRESS", "Client provided required deliverable")}
              className="flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2 py-1 text-[10px] font-semibold text-purple-300 hover:bg-purple-500/20"
              title="Client response received — Resume internal execution"
            >
              <ArrowRight className="h-3 w-3" />
              <span>Client Responded ➔ Resume</span>
            </button>
          )}

          {task.status === "IN_PROGRESS" && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => transitionStatus(task.id, "WAITING_ON_CLIENT", "Waiting on client approval/specs")}
                className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] font-medium text-zinc-400 hover:text-purple-300 hover:border-purple-500/30"
                title="Pause internal work and wait on client"
              >
                <PauseCircle className="h-3 w-3" />
                <span>Wait Client</span>
              </button>

              <button
                type="button"
                onClick={() => completeTask(task.id)}
                className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/20"
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>Done</span>
              </button>
            </div>
          )}

          {task.status === "DONE" && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              <span>Completed</span>
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
