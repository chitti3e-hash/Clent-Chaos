"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { 
  Task, 
  TeamMember, 
  Customer, 
  ImpactMetrics, 
  SubAction, 
  AuditLogEntry, 
  TaskStatus, 
  ManagerBucket, 
  Priority 
} from "../types";
import { TEAM_MEMBERS, CUSTOMERS, INITIAL_TASKS, INITIAL_METRICS } from "../data/seedData";
import confetti from "canvas-confetti";

interface BucketCounts {
  waitingForUs: number;
  waitingOnClient: number;
  unassigned: number;
  overdue: number;
  all: number;
}

interface LalaFlowContextType {
  tasks: Task[];
  teamMembers: TeamMember[];
  customers: Customer[];
  metrics: ImpactMetrics;
  activePersona: TeamMember;
  setActivePersona: (member: TeamMember) => void;
  // 4 Core Manager Buckets
  activeManagerBucket: ManagerBucket;
  setActiveManagerBucket: (bucket: ManagerBucket) => void;
  bucketCounts: BucketCounts;
  // View switch: Radar (Attention Focus) vs Kanban (6-Stage Pipeline)
  activeViewMode: "radar" | "kanban";
  setActiveViewMode: (mode: "radar" | "kanban") => void;
  // Legacy filter compatibility
  activeFilter: "ALL" | "MY_WORK" | "BLOCKED" | "DUE_SOON";
  setActiveFilter: (filter: "ALL" | "MY_WORK" | "BLOCKED" | "DUE_SOON") => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  // Actions
  createTask: (params: {
    title: string;
    description?: string;
    rawInput: string;
    sourceType: "whatsapp" | "email" | "voice_note" | "direct";
    status?: TaskStatus;
    priority: Priority;
    dueDate: string;
    ownerId?: string | null;
    customerId?: string;
    isBlocked?: boolean;
    blockerReason?: string;
    waitingReason?: string;
    clarificationNotes?: string;
    subActions: string[];
    confidenceScore?: number;
    warnings?: string[];
  }) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  transitionStatus: (taskId: string, newStatus: TaskStatus, note?: string) => void;
  assignOwner: (taskId: string, ownerId: string | null) => void;
  toggleSubAction: (taskId: string, subActionId: string) => void;
  resolveBlocker: (taskId: string) => void;
  setTaskBlocked: (taskId: string, reason: string) => void;
  completeTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  resetToDemoSeed: () => void;
  triggerConfetti: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  provider: "heuristic" | "gemini" | "openai";
  setProvider: (p: "heuristic" | "gemini" | "openai") => void;
  refreshFromBackend: () => Promise<void>;
}

const LalaFlowContext = createContext<LalaFlowContextType | undefined>(undefined);

const STORAGE_KEY_TASKS = "lalaflow_tasks_v2";
const STORAGE_KEY_API_KEY = "lalaflow_api_key_v1";
const STORAGE_KEY_PROVIDER = "lalaflow_provider_v1";

export const LalaFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [activePersona, setActivePersona] = useState<TeamMember>(TEAM_MEMBERS[0]); // Priya (Ops Head)
  const [activeManagerBucket, setActiveManagerBucket] = useState<ManagerBucket>("WAITING_FOR_US");
  const [activeViewMode, setActiveViewMode] = useState<"radar" | "kanban">("radar");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "MY_WORK" | "BLOCKED" | "DUE_SOON">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [apiKey, setApiKeyState] = useState<string>("");
  const [provider, setProviderState] = useState<"heuristic" | "gemini" | "openai">("heuristic");
  const [isClient, setIsClient] = useState(false);

  // Sync with SQLite backend if reachable
  const refreshFromBackend = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tasks) && data.tasks.length > 0) {
          const mapped: Task[] = data.tasks.map((t: any) => {
            const owner = TEAM_MEMBERS.find((m) => m.id === t.owner_id) || (t.owner_id ? {
              id: t.owner_id,
              name: t.owner_name || "Assigned Lead",
              email: t.owner_email || "lead@lalatech.com",
              role: t.owner_role || "Specialist",
              department: "Operations",
              avatar: t.owner_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            } : null);

            const customer = CUSTOMERS.find((c) => c.id === t.customer_id) || (t.customer_name ? {
              id: t.customer_id || "cust-gen",
              name: t.customer_name,
              company: t.customer_name,
              tier: (t.customer_tier as any) || "Standard",
              industry: "Commercial",
            } : undefined);

            const subActions: SubAction[] = (t.sub_actions || []).map((s: any) => ({
              id: s.id,
              title: s.title,
              isCompleted: Boolean(s.is_completed),
              order: s.order_index,
            }));

            const activities = (t.activities || []).map((a: any) => ({
              id: a.id,
              taskId: t.id,
              action: a.action,
              actorName: a.actor_name,
              timestamp: a.timestamp,
              details: a.details,
              type: a.type,
            }));

            return {
              id: t.id,
              title: t.title,
              description: t.description,
              rawInput: t.raw_input,
              sourceType: t.source_type,
              category: t.category,
              status: t.status as TaskStatus,
              priority: t.priority as Priority,
              dueDate: t.due_date,
              confidenceScore: t.confidence_score,
              isBlocked: Boolean(t.is_blocked),
              blockerReason: t.blocker_reason,
              waitingReason: t.waiting_reason,
              clarificationNotes: t.clarification_notes,
              ownerId: t.owner_id,
              owner,
              customerId: t.customer_id,
              customer,
              subActions,
              activities,
              auditLogs: activities,
              createdAt: t.created_at,
              completedAt: t.completed_at,
              timeSavedMinutes: t.time_saved_minutes || 20,
            };
          });

          setTasks(mapped);
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(mapped));
          }
        }
      }
    } catch (e) {
      console.warn("Backend fetch failed, using local store:", e);
    }
  }, []);

  // Initial Load from LocalStorage or Backend
  useEffect(() => {
    setIsClient(true);
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEY_TASKS);
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
      const savedKey = localStorage.getItem(STORAGE_KEY_API_KEY);
      if (savedKey) setApiKeyState(savedKey);
      const savedProv = localStorage.getItem(STORAGE_KEY_PROVIDER);
      if (savedProv === "gemini" || savedProv === "openai" || savedProv === "heuristic") {
        setProviderState(savedProv);
      }
    } catch (e) {
      console.warn("Failed to read from localStorage", e);
    }

    // Attempt backend sync
    refreshFromBackend();
  }, [refreshFromBackend]);

  // Sync to LocalStorage
  useEffect(() => {
    if (!isClient) return;
    try {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.warn("Failed to persist tasks", e);
    }
  }, [tasks, isClient]);

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_API_KEY, key);
    }
  };

  const setProvider = (p: "heuristic" | "gemini" | "openai") => {
    setProviderState(p);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_PROVIDER, p);
    }
  };

  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#10b981", "#3b82f6", "#f59e0b"],
      });
    } catch {
      // non-critical
    }
  }, []);

  // Manager Bucket Counts (Live Calculated)
  const bucketCounts = useMemo<BucketCounts>(() => {
    const now = Date.now();
    let waitingForUs = 0;
    let waitingOnClient = 0;
    let unassigned = 0;
    let overdue = 0;

    for (const t of tasks) {
      // 1. Waiting for Us
      if (t.status === "IN_PROGRESS" || t.status === "READY_TO_ASSIGN" || t.status === "NEW_REQUEST") {
        waitingForUs++;
      }

      // 2. Waiting for the Client
      if (t.status === "WAITING_ON_CLIENT" || t.status === "NEEDS_CLARIFICATION") {
        waitingOnClient++;
      }

      // 3. Unassigned
      if (!t.ownerId || t.status === "NEW_REQUEST" || t.status === "READY_TO_ASSIGN") {
        unassigned++;
      }

      // 4. Overdue (Explicit Rule: WAITING_ON_CLIENT and NEEDS_CLARIFICATION are strictly excluded!)
      if (
        t.status !== "DONE" &&
        t.status !== "WAITING_ON_CLIENT" &&
        t.status !== "NEEDS_CLARIFICATION" &&
        t.dueDate &&
        new Date(t.dueDate).getTime() < now
      ) {
        overdue++;
      }
    }

    return {
      waitingForUs,
      waitingOnClient,
      unassigned,
      overdue,
      all: tasks.length,
    };
  }, [tasks]);

  // Live Calculated Metrics
  const metrics = useMemo<ImpactMetrics>(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "DONE").length;
    const now = Date.now();
    const overdue = tasks.filter(
      (t) =>
        t.status !== "DONE" &&
        t.status !== "WAITING_ON_CLIENT" &&
        t.status !== "NEEDS_CLARIFICATION" &&
        t.dueDate &&
        new Date(t.dueDate).getTime() < now
    ).length;

    const totalMinutesSaved = tasks.reduce((sum, t) => sum + (t.timeSavedMinutes || 20), 0) + completed * 25;
    const hoursSaved = Math.round((INITIAL_METRICS.totalHoursSaved + totalMinutesSaved / 60) * 10) / 10;

    return {
      tasksProcessed: INITIAL_METRICS.tasksProcessed + total,
      tasksAutomated: Math.round((INITIAL_METRICS.tasksProcessed + total) * 0.88),
      followUpsAutomated: (INITIAL_METRICS.tasksProcessed + total) * 3,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 88,
      overdueRate: total > 0 ? Math.round((overdue / total) * 100) : 0,
      avgTaskCreationSeconds: 4.8,
      totalHoursSaved: hoursSaved,
      settings: INITIAL_METRICS.settings,
      calculated: INITIAL_METRICS.calculated,
    };
  }, [tasks]);

  // Create Task
  const createTask = useCallback(
    (params: {
      title: string;
      description?: string;
      rawInput: string;
      sourceType: "whatsapp" | "email" | "voice_note" | "direct";
      status?: TaskStatus;
      priority: Priority;
      dueDate: string;
      ownerId?: string | null;
      customerId?: string;
      isBlocked?: boolean;
      blockerReason?: string;
      waitingReason?: string;
      clarificationNotes?: string;
      subActions: string[];
      confidenceScore?: number;
      warnings?: string[];
    }): Task => {
      const id = "task-" + Date.now();
      const owner = params.ownerId ? TEAM_MEMBERS.find((m) => m.id === params.ownerId) || null : null;
      const customer = CUSTOMERS.find((c) => c.id === params.customerId);

      // Determine initial status based on client's refined workflow
      let initialStatus: TaskStatus = params.status || (params.ownerId ? "IN_PROGRESS" : "NEW_REQUEST");
      if (params.isBlocked && initialStatus === "NEW_REQUEST") {
        initialStatus = "IN_PROGRESS";
      }

      const subActions: SubAction[] = params.subActions.map((title, idx) => ({
        id: `${id}-sub-${idx + 1}`,
        title,
        isCompleted: false,
        order: idx + 1,
      }));

      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const activities: AuditLogEntry[] = [
        {
          id: `act-${Date.now()}-1`,
          taskId: id,
          action: `Received via ${params.sourceType.toUpperCase()}`,
          actorName: "System Intake",
          timestamp: timeStr,
          details: `Captured raw message • Confidence ${Math.round((params.confidenceScore ?? 0.95) * 100)}%`,
          type: "received",
        },
        {
          id: `act-${Date.now()}-2`,
          taskId: id,
          action: `Initialized as ${initialStatus.replace(/_/g, " ")}`,
          actorName: activePersona.name,
          timestamp: timeStr,
          details: owner ? `Assigned to ${owner.name}` : "Queued in Unassigned triage pool",
          type: "created",
        },
      ];

      if (params.waitingReason) {
        activities.push({
          id: `act-${Date.now()}-wait`,
          taskId: id,
          action: "Waiting on client",
          actorName: activePersona.name,
          timestamp: timeStr,
          details: params.waitingReason,
          type: "waiting_client",
        });
      }

      if (params.clarificationNotes) {
        activities.push({
          id: `act-${Date.now()}-clarify`,
          taskId: id,
          action: "Clarification requested",
          actorName: activePersona.name,
          timestamp: timeStr,
          details: params.clarificationNotes,
          type: "clarification",
        });
      }

      const newTask: Task = {
        id,
        title: params.title,
        description: params.description,
        rawInput: params.rawInput,
        sourceType: params.sourceType,
        category: "Operations",
        status: initialStatus,
        priority: params.priority,
        dueDate: params.dueDate,
        confidenceScore: params.confidenceScore ?? 0.95,
        isBlocked: Boolean(params.isBlocked),
        blockerReason: params.blockerReason,
        waitingReason: params.waitingReason,
        clarificationNotes: params.clarificationNotes,
        ownerId: params.ownerId || null,
        owner,
        customerId: params.customerId,
        customer,
        subActions,
        activities,
        auditLogs: activities,
        warnings: params.warnings,
        createdAt: new Date().toISOString(),
        timeSavedMinutes: 20,
      };

      setTasks((prev) => [newTask, ...prev]);

      // Async persist to SQLite API
      fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: params.title,
          description: params.description,
          rawInput: params.rawInput,
          sourceType: params.sourceType,
          status: initialStatus,
          priority: params.priority,
          dueDate: params.dueDate,
          ownerId: params.ownerId || null,
          customerId: params.customerId,
          isBlocked: params.isBlocked,
          blockerReason: params.blockerReason,
          waitingReason: params.waitingReason,
          clarificationNotes: params.clarificationNotes,
          subActions: params.subActions,
          confidenceScore: params.confidenceScore,
          actorName: activePersona.name,
        }),
      }).catch((e) => console.warn("Task API sync failed:", e));

      return newTask;
    },
    [activePersona]
  );

  // Update Task
  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;

        let owner = t.owner;
        if (updates.ownerId !== undefined) {
          owner = updates.ownerId ? TEAM_MEMBERS.find((m) => m.id === updates.ownerId) || null : null;
        }

        let customer = t.customer;
        if (updates.customerId !== undefined) {
          customer = CUSTOMERS.find((c) => c.id === updates.customerId);
        }

        const updated: Task = {
          ...t,
          ...updates,
          owner,
          customer,
          updatedAt: new Date().toISOString(),
        };
        return updated;
      })
    );

    // Sync to SQLite API
    fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...updates,
        actorName: activePersona.name,
      }),
    }).catch((e) => console.warn("Update API sync failed:", e));
  }, [activePersona]);

  // 1-Click Status Transition Stepper
  const transitionStatus = useCallback(
    (taskId: string, newStatus: TaskStatus, note?: string) => {
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      
      let actionLabel = `Moved to ${newStatus.replace(/_/g, " ")}`;
      let actionType: AuditLogEntry["type"] = "update";

      if (newStatus === "DONE") {
        actionLabel = "Workflow marked Done";
        actionType = "completed";
        triggerConfetti();
      } else if (newStatus === "WAITING_ON_CLIENT") {
        actionLabel = "Status: Waiting on Client";
        actionType = "waiting_client";
      } else if (newStatus === "NEEDS_CLARIFICATION") {
        actionLabel = "Status: Needs Clarification";
        actionType = "clarification";
      } else if (newStatus === "READY_TO_ASSIGN") {
        actionLabel = "Status: Ready to Assign";
        actionType = "created";
      } else if (newStatus === "IN_PROGRESS") {
        actionLabel = "Status: In Progress";
        actionType = "started";
      }

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;

          const newActivity: AuditLogEntry = {
            id: `act-${Date.now()}-${newStatus}`,
            taskId,
            action: actionLabel,
            actorName: activePersona.name,
            timestamp: timeStr,
            details: note || (newStatus === "WAITING_ON_CLIENT" ? "Awaiting client input — internal SLA paused" : undefined),
            type: actionType,
          };

          const isCompleting = newStatus === "DONE";

          return {
            ...t,
            status: newStatus,
            waitingReason: newStatus === "WAITING_ON_CLIENT" ? note || t.waitingReason : t.waitingReason,
            clarificationNotes: newStatus === "NEEDS_CLARIFICATION" ? note || t.clarificationNotes : t.clarificationNotes,
            completedAt: isCompleting ? new Date().toISOString() : undefined,
            subActions: isCompleting
              ? t.subActions.map((s) => ({ ...s, isCompleted: true }))
              : t.subActions,
            activities: [...(t.activities || []), newActivity],
            auditLogs: [...(t.auditLogs || []), newActivity],
          };
        })
      );

      // Backend sync
      fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          waiting_reason: newStatus === "WAITING_ON_CLIENT" ? note : undefined,
          clarification_notes: newStatus === "NEEDS_CLARIFICATION" ? note : undefined,
          actorName: activePersona.name,
        }),
      }).catch((e) => console.warn("Transition API sync failed:", e));
    },
    [activePersona, triggerConfetti]
  );

  // 1-Click Owner Assignment
  const assignOwner = useCallback(
    (taskId: string, ownerId: string | null) => {
      const targetMember = ownerId ? TEAM_MEMBERS.find((m) => m.id === ownerId) || null : null;
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;

          const newActivity: AuditLogEntry = {
            id: `act-${Date.now()}-assign`,
            taskId,
            action: targetMember ? `Assigned to ${targetMember.name}` : "Moved to Unassigned triage queue",
            actorName: activePersona.name,
            timestamp: timeStr,
            type: "assigned",
          };

          // If task was READY_TO_ASSIGN and owner is assigned, promote to IN_PROGRESS
          const nextStatus = t.status === "READY_TO_ASSIGN" && targetMember ? "IN_PROGRESS" : t.status;

          return {
            ...t,
            ownerId,
            owner: targetMember,
            status: nextStatus,
            activities: [...(t.activities || []), newActivity],
            auditLogs: [...(t.auditLogs || []), newActivity],
          };
        })
      );

      fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: ownerId,
          actorName: activePersona.name,
        }),
      }).catch((e) => console.warn("Assign API sync failed:", e));
    },
    [activePersona]
  );

  // Toggle SubAction Milestone
  const toggleSubAction = useCallback(
    (taskId: string, subActionId: string) => {
      let markAsDone = false;

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;

          const updatedSubs = t.subActions.map((s) =>
            s.id === subActionId ? { ...s, isCompleted: !s.isCompleted } : s
          );

          const allDone = updatedSubs.length > 0 && updatedSubs.every((s) => s.isCompleted);
          if (allDone && t.status !== "DONE") {
            markAsDone = true;
          }

          const targetSub = t.subActions.find((s) => s.id === subActionId);
          const toggledState = !targetSub?.isCompleted;
          const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

          const newActivity: AuditLogEntry = {
            id: `act-${Date.now()}-milestone`,
            taskId,
            action: toggledState ? `Milestone checked: "${targetSub?.title}"` : `Milestone reopened: "${targetSub?.title}"`,
            actorName: activePersona.name,
            timestamp: timeStr,
            type: toggledState ? "started" : "update",
          };

          return {
            ...t,
            subActions: updatedSubs,
            status: allDone ? "DONE" : t.status === "DONE" ? "IN_PROGRESS" : t.status,
            completedAt: allDone ? new Date().toISOString() : undefined,
            activities: [...(t.activities || []), newActivity],
            auditLogs: [...(t.auditLogs || []), newActivity],
          };
        })
      );

      if (markAsDone) {
        triggerConfetti();
      }

      fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_subaction",
          subActionId,
          actorName: activePersona.name,
        }),
      }).catch((e) => console.warn("Toggle API sync failed:", e));
    },
    [activePersona, triggerConfetti]
  );

  // Blocker Handlers
  const resolveBlocker = useCallback((taskId: string) => {
    updateTask(taskId, { isBlocked: false, blockerReason: undefined });
  }, [updateTask]);

  const setTaskBlocked = useCallback((taskId: string, reason: string) => {
    updateTask(taskId, { isBlocked: true, blockerReason: reason });
  }, [updateTask]);

  const completeTask = useCallback((taskId: string) => {
    transitionStatus(taskId, "DONE");
  }, [transitionStatus]);

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTaskId === taskId) setSelectedTaskId(null);

    fetch(`/api/tasks/${taskId}`, { method: "DELETE" }).catch((e) =>
      console.warn("Delete API sync failed:", e)
    );
  }, [selectedTaskId]);

  // Reset to Baseline Demo Seed
  const resetToDemoSeed = useCallback(async () => {
    try {
      await fetch("/api/reset", { method: "POST" });
      await refreshFromBackend();
    } catch {
      setTasks(INITIAL_TASKS);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(INITIAL_TASKS));
      }
    }
  }, [refreshFromBackend]);

  return (
    <LalaFlowContext.Provider
      value={{
        tasks,
        teamMembers: TEAM_MEMBERS,
        customers: CUSTOMERS,
        metrics,
        activePersona,
        setActivePersona,
        activeManagerBucket,
        setActiveManagerBucket,
        bucketCounts,
        activeViewMode,
        setActiveViewMode,
        activeFilter,
        setActiveFilter,
        searchQuery,
        setSearchQuery,
        selectedTaskId,
        setSelectedTaskId,
        createTask,
        updateTask,
        transitionStatus,
        assignOwner,
        toggleSubAction,
        resolveBlocker,
        setTaskBlocked,
        completeTask,
        deleteTask,
        resetToDemoSeed,
        triggerConfetti,
        apiKey,
        setApiKey,
        provider,
        setProvider,
        refreshFromBackend,
      }}
    >
      {children}
    </LalaFlowContext.Provider>
  );
};

export const useLalaFlow = () => {
  const context = useContext(LalaFlowContext);
  if (!context) {
    throw new Error("useLalaFlow must be used within a LalaFlowProvider");
  }
  return context;
};
