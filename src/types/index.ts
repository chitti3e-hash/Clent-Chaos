export type Priority = "URGENT" | "HIGH" | "MEDIUM" | "LOW";

export type TaskStatus = 
  | "NEW_REQUEST"
  | "NEEDS_CLARIFICATION"
  | "READY_TO_ASSIGN"
  | "IN_PROGRESS"
  | "WAITING_ON_CLIENT"
  | "DONE";

export type ManagerBucket = 
  | "WAITING_FOR_US"
  | "WAITING_ON_CLIENT"
  | "UNASSIGNED"
  | "OVERDUE"
  | "ALL";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
  department: string;
  max_capacity?: number;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  tier: "Enterprise" | "Tier 1" | "High Growth" | "Standard";
  industry: string;
}

export interface SubAction {
  id: string;
  taskId?: string;
  title: string;
  isCompleted: boolean;
  order: number;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  action: string;
  actorName: string;
  timestamp: string;
  details?: string;
  type: "received" | "ai_analyzed" | "created" | "assigned" | "started" | "clarification" | "waiting_client" | "reminder" | "completed" | "update";
}

export type AuditLogEntry = TaskActivity;

export interface Task {
  id: string;
  title: string;
  description?: string;
  rawInput: string;
  sourceType: "whatsapp" | "email" | "voice_note" | "direct";
  category: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  confidenceScore: number;
  isBlocked: boolean;
  blockerReason?: string;
  waitingReason?: string;
  clarificationNotes?: string;
  ownerId?: string | null;
  owner?: TeamMember | null;
  customerId?: string;
  customer?: Customer;
  subActions: SubAction[];
  activities: TaskActivity[];
  auditLogs?: AuditLogEntry[];
  warnings?: string[];
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  timeSavedMinutes: number;
}

export interface Ambiguity {
  field: string;
  message: string;
  needsConfirmation: boolean;
}

export interface ExtractionResult {
  task: string;
  title?: string;
  description: string;
  customerName?: string;
  suggestedOwnerName?: string;
  deadline?: string;
  dueDate?: string;
  priority: Priority;
  category: string;
  statusRecommendation: TaskStatus;
  dependencies: string[];
  isBlocked: boolean;
  blockerReason?: string;
  waitingReason?: string;
  clarificationNotes?: string;
  nextActions: string[];
  subActions?: string[];
  source: "whatsapp" | "email" | "voice_note" | "direct";
  confidence: number;
  ambiguities: Ambiguity[];
  warnings: string[];
}

export interface NotificationItem {
  id: string;
  taskId?: string;
  taskTitle?: string;
  type: "overdue" | "due_soon" | "waiting" | "blocked" | "overload";
  title: string;
  message: string;
  severity: "critical" | "warning" | "info";
  isRead: boolean;
  createdAt: string;
}

export interface UserWorkload {
  user: TeamMember;
  activeCount: number;
  dueTodayCount: number;
  overdueCount: number;
  completedCount: number;
  totalCount: number;
  isOverloaded: boolean;
  tasks: Task[];
}

export interface ImpactData {
  tasksProcessed: number;
  tasksAutomated: number;
  followUpsAutomated: number;
  completionRate: number;
  overdueRate: number;
  avgTaskCreationSeconds: number;
  totalHoursSaved: number;
  hoursSaved?: number;
  totalTasksProcessed?: number;
  completedTasks?: number;
  droppedTaskRate?: number;
  avgTurnaroundHours?: number;
  slaComplianceRate?: number;
  activeBlockersCount?: number;
  dueSoonCount?: number;
  settings: {
    tasks_per_day: number;
    manual_mins_per_task: number;
    auto_mins_per_task: number;
    working_days_per_month: number;
  };
  calculated: {
    timeSavedDayHours: number;
    timeSavedMonthHours: number;
    timeSavedYearHours: number;
  };
}

export type ImpactMetrics = ImpactData;

export interface DemoScenario {
  id: string;
  title: string;
  tagline: string;
  rawText: string;
  sourceType: "whatsapp" | "email" | "voice_note";
  sender: string;
  expectedClient: string;
  expectedOwner?: string;
  expectedStatus: TaskStatus;
  expectedBlocker?: string;
}
