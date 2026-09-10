import { DatabaseSync } from "node:sqlite";
import * as path from "node:path";
import * as fs from "node:fs";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "lalaflow.db");

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    dbInstance.exec("PRAGMA foreign_keys = ON;");
    initSchema(dbInstance);
    seedIfEmpty(dbInstance);
  }
  return dbInstance;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      department TEXT NOT NULL,
      avatar TEXT NOT NULL,
      max_capacity INTEGER DEFAULT 5
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      tier TEXT NOT NULL,
      industry TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      raw_input TEXT NOT NULL,
      source_type TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Operations',
      status TEXT NOT NULL, -- 'TODO', 'IN_PROGRESS', 'WAITING', 'BLOCKED', 'COMPLETED'
      priority TEXT NOT NULL, -- 'URGENT', 'HIGH', 'MEDIUM', 'LOW'
      due_date TEXT,
      confidence_score REAL DEFAULT 0.95,
      is_blocked INTEGER DEFAULT 0,
      blocker_reason TEXT,
      waiting_reason TEXT,
      clarification_notes TEXT,
      owner_id TEXT,
      customer_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      time_saved_minutes INTEGER DEFAULT 20,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sub_actions (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      title TEXT NOT NULL,
      is_completed INTEGER DEFAULT 0,
      order_index INTEGER DEFAULT 0,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS task_activity (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      action TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      details TEXT,
      type TEXT NOT NULL DEFAULT 'update',
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      task_id TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS impact_settings (
      id TEXT PRIMARY KEY,
      tasks_per_day INTEGER DEFAULT 35,
      manual_mins_per_task REAL DEFAULT 24.0,
      auto_mins_per_task REAL DEFAULT 4.0,
      working_days_per_month INTEGER DEFAULT 22
    );
  `);
}

export function seedIfEmpty(db: DatabaseSync) {
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (userCount && userCount.count > 0) return;
  resetDatabase(db);
}

export function resetDatabase(db?: DatabaseSync) {
  const activeDb = db || getDb();
  activeDb.exec("DELETE FROM notifications;");
  activeDb.exec("DELETE FROM task_activity;");
  activeDb.exec("DELETE FROM sub_actions;");
  activeDb.exec("DELETE FROM tasks;");
  activeDb.exec("DELETE FROM customers;");
  activeDb.exec("DELETE FROM users;");
  activeDb.exec("DELETE FROM impact_settings;");

  // 1. Users
  const insertUser = activeDb.prepare(`
    INSERT INTO users (id, name, email, role, department, avatar, max_capacity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run("user-rahul", "Rahul Mehta", "rahul@lalatech.com", "Senior Account Lead", "Client Accounts", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", 5);
  insertUser.run("user-priya", "Priya Sharma", "priya@lalatech.com", "Operations Director", "Operations", "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80", 6);
  insertUser.run("user-arjun", "Arjun Patel", "arjun@lalatech.com", "Logistics & Fulfillment Lead", "Logistics", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", 5);
  insertUser.run("user-maya", "Maya Sen", "maya@lalatech.com", "Finance & Commercial Controller", "Finance", "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80", 4);

  // 2. Customers
  const insertCustomer = activeDb.prepare(`
    INSERT INTO customers (id, name, company, tier, industry)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertCustomer.run("cust-abc", "ABC Industries", "ABC Industries Ltd.", "Enterprise", "Precision Manufacturing");
  insertCustomer.run("cust-apex", "Apex Retail", "Apex Retail Omni Inc.", "Tier 1", "E-commerce & Distribution");
  insertCustomer.run("cust-zenith", "Zenith Logistics", "Zenith Cold-Chain Global", "High Growth", "Cold Chain Freight");
  insertCustomer.run("cust-global", "GlobalTech Systems", "GlobalTech Corp.", "Enterprise", "Cloud & Infrastructure");
  insertCustomer.run("cust-tata", "Tata Consumer", "Tata Consumer Products", "Enterprise", "FMCG & Food");

  // 3. Tasks
  const insertTask = activeDb.prepare(`
    INSERT INTO tasks (
      id, title, description, raw_input, source_type, category,
      status, priority, due_date, confidence_score, is_blocked,
      blocker_reason, waiting_reason, clarification_notes, owner_id, customer_id,
      created_at, updated_at, completed_at, time_saved_minutes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = Date.now();

  // Task 1: Overdue Task (Waiting for us)
  insertTask.run(
    "task-overdue-1",
    "Clear Terminal 4 customs hold for Apex Retail",
    "Container stalled at port inspection desk. Arjun needs to transmit signed bill of lading to release freight.",
    "Apex Retail called urgently. Their shipment at Terminal 4 is stuck because customs paperwork is missing the commercial invoice. Arjun, get this resolved ASAP.",
    "whatsapp",
    "Logistics & Customs",
    "IN_PROGRESS",
    "URGENT",
    new Date(now - 3 * 3600 * 1000).toISOString(),
    0.96,
    1,
    "Missing stamped bill of lading copy from operations archive",
    null,
    null,
    "user-arjun",
    "cust-apex",
    new Date(now - 18 * 3600 * 1000).toISOString(),
    new Date(now - 2 * 3600 * 1000).toISOString(),
    null,
    25
  );

  // Task 2: Waiting on Client (NOT OVERDUE! Waiting for client information)
  insertTask.run(
    "task-waiting-client-1",
    "GlobalTech API Webhook Production Gateway Sync",
    "Awaiting client IT security officer to provide signed TLS certificate and webhook secret.",
    "Deploy the v2 webhook connector for GlobalTech API schema. We forwarded credentials to their IT admin yesterday.",
    "email",
    "Technical Integration",
    "WAITING_ON_CLIENT",
    "HIGH",
    new Date(now - 6 * 3600 * 1000).toISOString(),
    0.92,
    0,
    null,
    "Waiting for GlobalTech IT Admin to issue signed TLS certificate (Waiting for 18 hours)",
    null,
    "user-rahul",
    "cust-global",
    new Date(now - 20 * 3600 * 1000).toISOString(),
    new Date(now - 4 * 3600 * 1000).toISOString(),
    null,
    18
  );

  // Task 3: Needs Clarification (Unassigned / Waiting on client clarification)
  insertTask.run(
    "task-clarify-1",
    "Tata Consumer Custom Packaging SLA Quotation",
    "Client WhatsApp asked for pricing but omitted batch quantities and carton dimensions.",
    "Hey Lala team, can you send us a revised packaging quote for our new tea product line by this week? Thanks, Tata Procurement.",
    "whatsapp",
    "Sales & Commercial",
    "NEEDS_CLARIFICATION",
    "MEDIUM",
    new Date(now + 36 * 3600 * 1000).toISOString(),
    0.78,
    0,
    null,
    "Waiting for Tata Procurement to confirm expected monthly volume and box dimensions",
    "Sent WhatsApp reply asking for volume tiers (50k vs 100k units) before drafting numbers.",
    null,
    "cust-tata",
    new Date(now - 8 * 3600 * 1000).toISOString(),
    new Date(now - 1 * 3600 * 1000).toISOString(),
    null,
    15
  );

  // Task 4: Ready to Assign (Unassigned, scoped work ready for manager dispatch)
  insertTask.run(
    "task-ready-1",
    "Zenith Cold-Chain Q3 Telemetry Log Export",
    "Client requested verified IoT temperature transit logs for regulatory audit. Fully scoped.",
    "Zenith needs the verified temperature compliance logs for lot 409 transit containers by 6 PM today.",
    "email",
    "Compliance & QA",
    "READY_TO_ASSIGN",
    "HIGH",
    new Date(now + 5 * 3600 * 1000).toISOString(),
    0.95,
    0,
    null,
    null,
    null,
    null,
    "cust-zenith",
    new Date(now - 3 * 3600 * 1000).toISOString(),
    new Date(now - 1 * 3600 * 1000).toISOString(),
    null,
    20
  );

  // Task 5: Hero Task (Rahul, Waiting for us)
  insertTask.run(
    "task-hero-1",
    "Send revised quotation to ABC Industries",
    "Commercial price revision per updated volume commitments. Rahul must verify margin before sending.",
    "Please send the revised quotation to ABC Industries by tomorrow afternoon. Rahul needs to verify the pricing before it goes out.",
    "whatsapp",
    "Sales & Commercial",
    "IN_PROGRESS",
    "HIGH",
    new Date(now + 2 * 3600 * 1000).toISOString(),
    0.98,
    1,
    "Pricing verification required by Rahul before quotation dispatch",
    null,
    null,
    "user-rahul",
    "cust-abc",
    new Date(now - 4 * 3600 * 1000).toISOString(),
    new Date(now - 30 * 60 * 1000).toISOString(),
    null,
    22
  );

  // Task 6: In Progress (Rahul, Waiting for us)
  insertTask.run(
    "task-today-2",
    "Apex Retail Milestone 2 Warehouse Dispatch",
    "Validate barcode webhook synchronization across regional warehouses.",
    "Apex Retail Milestone 2 goes live today. Rahul, confirm the warehouse dispatch test batch.",
    "email",
    "Fulfillment",
    "IN_PROGRESS",
    "HIGH",
    new Date(now + 4 * 3600 * 1000).toISOString(),
    0.95,
    0,
    null,
    null,
    null,
    "user-rahul",
    "cust-apex",
    new Date(now - 8 * 3600 * 1000).toISOString(),
    new Date(now - 2 * 3600 * 1000).toISOString(),
    null,
    15
  );

  // Task 7: Done
  insertTask.run(
    "task-completed-1",
    "ABC Industries Emergency Tariff Revision Notice",
    "Calculated updated diesel freight index and issued signed addendum.",
    "Send the emergency tariff adjustment to ABC Industries before month-end.",
    "whatsapp",
    "Operations",
    "DONE",
    "HIGH",
    new Date(now - 4 * 3600 * 1000).toISOString(),
    0.97,
    0,
    null,
    null,
    null,
    "user-rahul",
    "cust-abc",
    new Date(now - 36 * 3600 * 1000).toISOString(),
    new Date(now - 1 * 3600 * 1000).toISOString(),
    new Date(now - 1 * 3600 * 1000).toISOString(),
    30
  );

  // Task 8: Done
  insertTask.run(
    "task-completed-2",
    "Zenith Logistics Q2 Demurrage Reconciliation",
    "Settled cross-dock storage penalties with carrier management.",
    "Reconcile Zenith Q2 demurrage adjustments before close of books.",
    "email",
    "Finance & Legal",
    "DONE",
    "MEDIUM",
    new Date(now - 24 * 3600 * 1000).toISOString(),
    0.94,
    0,
    null,
    null,
    null,
    "user-priya",
    "cust-zenith",
    new Date(now - 48 * 3600 * 1000).toISOString(),
    new Date(now - 6 * 3600 * 1000).toISOString(),
    new Date(now - 6 * 3600 * 1000).toISOString(),
    25
  );

  // 4. SubActions
  const insertSubAction = activeDb.prepare(`
    INSERT INTO sub_actions (id, task_id, title, is_completed, order_index)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertSubAction.run("sub-1-1", "task-overdue-1", "Locate signed commercial invoice and bill of lading", 1, 1);
  insertSubAction.run("sub-1-2", "task-overdue-1", "Submit digital clearance packet to Terminal 4 customs officer", 0, 2);
  insertSubAction.run("sub-1-3", "task-overdue-1", "Issue customs release voucher to Apex logistics team", 0, 3);

  insertSubAction.run("sub-2-1", "task-blocked-1", "Review clause 4.2 demurrage penalty with Maya", 0, 1);
  insertSubAction.run("sub-2-2", "task-blocked-1", "Update Schedule B compensation table", 1, 2);
  insertSubAction.run("sub-2-3", "task-blocked-1", "Generate countersigned PDF addendum for client legal", 0, 3);

  insertSubAction.run("sub-4-1", "task-hero-1", "Verify updated pricing and margins with commercial desk", 1, 1);
  insertSubAction.run("sub-4-2", "task-hero-1", "Draft revised quotation PDF with Schedule A pricing", 0, 2);
  insertSubAction.run("sub-4-3", "task-hero-1", "Transmit signed quotation to ABC procurement lead", 0, 3);
  insertSubAction.run("sub-4-4", "task-hero-1", "Log delivery confirmation in client register", 0, 4);

  insertSubAction.run("sub-5-1", "task-today-2", "Verify webhook endpoint health on regional ports", 1, 1);
  insertSubAction.run("sub-5-2", "task-today-2", "Execute 50 synthetic order dispatches in staging", 0, 2);
  insertSubAction.run("sub-5-3", "task-today-2", "Authorize live warehouse routing", 0, 3);

  insertSubAction.run("sub-7-1", "task-completed-1", "Calculate adjusted freight surcharge table", 1, 1);
  insertSubAction.run("sub-7-2", "task-completed-1", "Generate signed PDF tariff revision addendum", 1, 2);
  insertSubAction.run("sub-7-3", "task-completed-1", "Deliver to ABC procurement with read confirmation", 1, 3);

  // 5. Activity Timeline
  const insertActivity = activeDb.prepare(`
    INSERT INTO task_activity (id, task_id, action, actor_name, timestamp, details, type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertActivity.run("act-4-1", "task-hero-1", "Request received via WhatsApp", "Lala (Founder/CEO)", "10:15 AM", "Messy text message pasted into Hopper", "received");
  insertActivity.run("act-4-2", "task-hero-1", "AI analyzed operational intent", "LalaFlow Engine", "10:15 AM", "Extracted owner Rahul, client ABC Industries, high priority", "ai_analyzed");
  insertActivity.run("act-4-3", "task-hero-1", "Workflow created & structured", "Priya Sharma", "10:16 AM", "Verified details and approved dispatch", "created");
  insertActivity.run("act-4-4", "task-hero-1", "Assigned to Rahul Mehta", "System Dispatcher", "10:16 AM", "Rahul notified of SLA requirement", "assigned");
  insertActivity.run("act-4-5", "task-hero-1", "Milestone 1 started & verified", "Rahul Mehta", "11:30 AM", "Pricing verified against commercial desk limits", "started");
  insertActivity.run("act-4-6", "task-hero-1", "Automated attention alert triggered", "Attention Center", "01:00 PM", "Deadline maturing in under 2 hours", "reminder");

  insertActivity.run("act-7-1", "task-completed-1", "Request received via WhatsApp", "Client Procurement", "Yesterday 03:00 PM", "Raw quote adjustment request", "received");
  insertActivity.run("act-7-2", "task-completed-1", "AI analyzed & verified", "LalaFlow Engine", "Yesterday 03:01 PM", "Structured into accountable work", "ai_analyzed");
  insertActivity.run("act-7-3", "task-completed-1", "Workflow created", "Rahul Mehta", "Yesterday 03:02 PM", "Created with 3 milestone steps", "created");
  insertActivity.run("act-7-4", "task-completed-1", "Assigned to Rahul Mehta", "Priya Sharma", "Yesterday 03:02 PM", "Direct operational ownership", "assigned");
  insertActivity.run("act-7-5", "task-completed-1", "Execution completed", "Rahul Mehta", "Today 02:45 PM", "All 3 milestones signed and delivered", "completed");

  // 6. Notifications
  const insertNotification = activeDb.prepare(`
    INSERT INTO notifications (id, task_id, type, title, message, severity, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertNotification.run(
    "notif-1",
    "task-hero-1",
    "due_soon",
    "Quotation is due in 2 hours",
    "ABC Industries revised quotation deadline is today at 2:00 PM. Verification pending.",
    "warning",
    0,
    new Date(now - 30 * 60 * 1000).toISOString()
  );

  insertNotification.run(
    "notif-2",
    "task-overdue-1",
    "overdue",
    "Supplier customs invoice is overdue",
    "Terminal 4 customs clearance for Apex Retail is 3 hours past target SLA window.",
    "critical",
    0,
    new Date(now - 2 * 3600 * 1000).toISOString()
  );

  insertNotification.run(
    "notif-3",
    "task-waiting-1",
    "waiting",
    "Client approval has been waiting for 18 hours",
    "GlobalTech webhook deployment is blocked awaiting TLS certificate confirmation.",
    "warning",
    0,
    new Date(now - 6 * 3600 * 1000).toISOString()
  );

  insertNotification.run(
    "notif-4",
    null,
    "overload",
    "Rahul has 3 deadlines today",
    "Rahul Mehta currently has 4 active workflows and 3 due today, exceeding standard threshold.",
    "info",
    0,
    new Date(now - 1 * 3600 * 1000).toISOString()
  );

  // 7. Impact Settings
  activeDb.prepare(`
    INSERT INTO impact_settings (id, tasks_per_day, manual_mins_per_task, auto_mins_per_task, working_days_per_month)
    VALUES (?, ?, ?, ?, ?)
  `).run("default", 35, 24.0, 4.0, 22);
}

// Typed Database Accessors
import { TaskStatus, Priority } from "@/types";

export interface DbTask {
  id: string;
  title: string;
  description: string | null;
  raw_input: string;
  source_type: string;
  category: string;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null;
  confidence_score: number;
  is_blocked: number;
  blocker_reason: string | null;
  waiting_reason: string | null;
  clarification_notes: string | null;
  owner_id: string | null;
  customer_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  time_saved_minutes: number;
  // Joined fields
  owner_name?: string;
  owner_email?: string;
  owner_avatar?: string;
  owner_role?: string;
  customer_name?: string;
  customer_tier?: string;
  sub_actions?: Array<{ id: string; title: string; is_completed: number; order_index: number }>;
  activities?: Array<{ id: string; action: string; actor_name: string; timestamp: string; details: string | null; type: string }>;
}

export function getAllTasks(filter?: { status?: string; bucket?: string; ownerId?: string; search?: string }): DbTask[] {
  const db = getDb();
  let rows = db.prepare(`
    SELECT 
      t.*,
      u.name as owner_name, u.email as owner_email, u.avatar as owner_avatar, u.role as owner_role,
      c.name as customer_name, c.tier as customer_tier
    FROM tasks t
    LEFT JOIN users u ON t.owner_id = u.id
    LEFT JOIN customers c ON t.customer_id = c.id
    ORDER BY 
      CASE t.priority 
        WHEN 'URGENT' THEN 1 
        WHEN 'HIGH' THEN 2 
        WHEN 'MEDIUM' THEN 3 
        ELSE 4 
      END ASC,
      t.due_date ASC
  `).all() as unknown as DbTask[];

  // Attach subactions and activities
  for (const task of rows) {
    task.sub_actions = db.prepare("SELECT * FROM sub_actions WHERE task_id = ? ORDER BY order_index ASC").all(task.id) as any;
    task.activities = db.prepare("SELECT * FROM task_activity WHERE task_id = ? ORDER BY rowid ASC").all(task.id) as any;
  }

  const now = Date.now();

  if (filter?.bucket) {
    if (filter.bucket === "WAITING_FOR_US") {
      rows = rows.filter((t) => t.status === "IN_PROGRESS" || t.status === "READY_TO_ASSIGN" || t.status === "NEW_REQUEST");
    } else if (filter.bucket === "WAITING_ON_CLIENT") {
      rows = rows.filter((t) => t.status === "WAITING_ON_CLIENT" || t.status === "NEEDS_CLARIFICATION");
    } else if (filter.bucket === "UNASSIGNED") {
      rows = rows.filter((t) => !t.owner_id || t.status === "NEW_REQUEST" || t.status === "READY_TO_ASSIGN");
    } else if (filter.bucket === "OVERDUE") {
      // Explicit rule: WAITING_ON_CLIENT or NEEDS_CLARIFICATION is NOT treated as overdue!
      rows = rows.filter((t) => {
        if (t.status === "DONE" || t.status === "COMPLETED" as any || t.status === "WAITING_ON_CLIENT" || t.status === "NEEDS_CLARIFICATION") return false;
        if (!t.due_date) return false;
        return new Date(t.due_date).getTime() < now;
      });
    }
  }

  if (filter?.status) {
    rows = rows.filter((t) => t.status === filter.status);
  }

  if (filter?.ownerId) {
    rows = rows.filter((t) => t.owner_id === filter.ownerId);
  }

  if (filter?.search) {
    const q = filter.search.toLowerCase();
    rows = rows.filter((t) => 
      t.title.toLowerCase().includes(q) || 
      (t.customer_name && t.customer_name.toLowerCase().includes(q)) ||
      (t.owner_name && t.owner_name.toLowerCase().includes(q)) ||
      t.raw_input.toLowerCase().includes(q)
    );
  }

  return rows;
}

export function getTaskById(id: string): DbTask | null {
  const db = getDb();
  const task = db.prepare(`
    SELECT 
      t.*,
      u.name as owner_name, u.email as owner_email, u.avatar as owner_avatar, u.role as owner_role,
      c.name as customer_name, c.tier as customer_tier
    FROM tasks t
    LEFT JOIN users u ON t.owner_id = u.id
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE t.id = ?
  `).get(id) as unknown as DbTask | undefined;

  if (!task) return null;

  task.sub_actions = db.prepare("SELECT * FROM sub_actions WHERE task_id = ? ORDER BY order_index ASC").all(task.id) as any;
  task.activities = db.prepare("SELECT * FROM task_activity WHERE task_id = ? ORDER BY rowid ASC").all(task.id) as any;
  return task;
}

export function createTask(params: {
  title: string;
  description?: string;
  rawInput: string;
  sourceType?: string;
  category?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string;
  ownerId?: string | null;
  customerId?: string;
  isBlocked?: boolean;
  blockerReason?: string;
  waitingReason?: string;
  clarificationNotes?: string;
  subActions?: string[];
  confidenceScore?: number;
  actorName?: string;
}): DbTask {
  const db = getDb();
  const id = "task-" + Date.now();
  const nowIso = new Date().toISOString();
  
  // Determine initial status based on client's refined workflow
  let status: TaskStatus = params.status || (params.ownerId ? "IN_PROGRESS" : "NEW_REQUEST");
  if (params.isBlocked && status === "NEW_REQUEST") {
    status = "IN_PROGRESS";
  }

  db.prepare(`
    INSERT INTO tasks (
      id, title, description, raw_input, source_type, category,
      status, priority, due_date, confidence_score, is_blocked,
      blocker_reason, waiting_reason, clarification_notes, owner_id, customer_id, 
      created_at, updated_at, time_saved_minutes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    params.title,
    params.description || null,
    params.rawInput,
    params.sourceType || "whatsapp",
    params.category || "Operations",
    status,
    params.priority || "HIGH",
    params.dueDate || null,
    params.confidenceScore ?? 0.95,
    params.isBlocked ? 1 : 0,
    params.isBlocked ? params.blockerReason || "Prerequisite verification required" : null,
    params.waitingReason || null,
    params.clarificationNotes || null,
    params.ownerId || null,
    params.customerId || null,
    nowIso,
    nowIso,
    20
  );

  // Subactions
  if (params.subActions && params.subActions.length > 0) {
    const insertSub = db.prepare("INSERT INTO sub_actions (id, task_id, title, is_completed, order_index) VALUES (?, ?, ?, 0, ?)");
    params.subActions.forEach((sub, idx) => {
      insertSub.run(`${id}-sub-${idx + 1}`, id, sub, idx + 1);
    });
  }

  // Activity Timeline
  const insertAct = db.prepare("INSERT INTO task_activity (id, task_id, action, actor_name, timestamp, details, type) VALUES (?, ?, ?, ?, ?, ?, ?)");
  const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  insertAct.run(`act-${id}-1`, id, "Request received", "System Intake", timeStr, `Captured from ${params.sourceType || "WhatsApp"}`, "received");
  insertAct.run(`act-${id}-2`, id, "AI analyzed operational intent", "LalaFlow Engine", timeStr, `Confidence: ${Math.round((params.confidenceScore ?? 0.95) * 100)}%`, "ai_analyzed");
  insertAct.run(`act-${id}-3`, id, `Workflow initialized as ${status.replace("_", " ")}`, params.actorName || "Operator", timeStr, "Structured into accountable work", "created");
  
  if (params.ownerId) {
    insertAct.run(`act-${id}-4`, id, "Assigned to owner", params.actorName || "System", timeStr, `Ownership assigned to ${params.ownerId}`, "assigned");
  }

  if (params.isBlocked) {
    insertAct.run(`act-${id}-5`, id, "Blocker flagged", "Attention Engine", timeStr, params.blockerReason || "Prerequisite pending", "reminder");
  }

  if (status === "NEEDS_CLARIFICATION" && params.clarificationNotes) {
    insertAct.run(`act-${id}-6`, id, "Clarification requested", params.actorName || "Operator", timeStr, params.clarificationNotes, "clarification");
  } else if (status === "WAITING_ON_CLIENT" && params.waitingReason) {
    insertAct.run(`act-${id}-6`, id, "Waiting on client", params.actorName || "Operator", timeStr, params.waitingReason, "waiting_client");
  }

  return getTaskById(id)!;
}

export function updateTask(id: string, rawUpdates: any, actorName = "User"): DbTask | null {
  const db = getDb();
  const existing = getTaskById(id);
  if (!existing) return null;

  const updates: Record<string, any> = {
    ...rawUpdates,
    owner_id: rawUpdates.owner_id !== undefined ? rawUpdates.owner_id : rawUpdates.ownerId,
    customer_id: rawUpdates.customer_id !== undefined ? rawUpdates.customer_id : rawUpdates.customerId,
    due_date: rawUpdates.due_date !== undefined ? rawUpdates.due_date : rawUpdates.dueDate,
    is_blocked: rawUpdates.is_blocked !== undefined 
      ? (rawUpdates.is_blocked ? 1 : 0) 
      : rawUpdates.isBlocked !== undefined 
      ? (rawUpdates.isBlocked ? 1 : 0) 
      : undefined,
    blocker_reason: rawUpdates.blocker_reason !== undefined ? rawUpdates.blocker_reason : rawUpdates.blockerReason,
    waiting_reason: rawUpdates.waiting_reason !== undefined ? rawUpdates.waiting_reason : rawUpdates.waitingReason,
    clarification_notes: rawUpdates.clarification_notes !== undefined ? rawUpdates.clarification_notes : rawUpdates.clarificationNotes,
  };

  const nowIso = new Date().toISOString();
  const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) { fields.push("title = ?"); values.push(updates.title); }
  if (updates.description !== undefined) { fields.push("description = ?"); values.push(updates.description); }
  if (updates.category !== undefined) { fields.push("category = ?"); values.push(updates.category); }
  if (updates.priority !== undefined) { fields.push("priority = ?"); values.push(updates.priority); }
  if (updates.due_date !== undefined) { fields.push("due_date = ?"); values.push(updates.due_date); }
  if (updates.customer_id !== undefined) { fields.push("customer_id = ?"); values.push(updates.customer_id); }
  if (updates.owner_id !== undefined) { 
    fields.push("owner_id = ?"); 
    values.push(updates.owner_id);
    db.prepare("INSERT INTO task_activity (id, task_id, action, actor_name, timestamp, details, type) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      `act-${Date.now()}-assign`, id, updates.owner_id ? "Assigned owner" : "Unassigned owner", actorName, timeStr, updates.owner_id ? `Assigned to: ${updates.owner_id}` : "Moved to unassigned pool", "assigned"
    );
  }
  if (updates.status !== undefined) {
    fields.push("status = ?");
    values.push(updates.status);
    if (updates.status === "DONE" || updates.status === "COMPLETED" as any) {
      fields.push("completed_at = ?");
      values.push(nowIso);
      db.prepare("INSERT INTO task_activity (id, task_id, action, actor_name, timestamp, details, type) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
        `act-${Date.now()}-done`, id, "Workflow marked Done", actorName, timeStr, "All milestones verified and deliverable completed", "completed"
      );
    } else if (updates.status === "WAITING_ON_CLIENT") {
      db.prepare("INSERT INTO task_activity (id, task_id, action, actor_name, timestamp, details, type) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
        `act-${Date.now()}-wait`, id, "Status changed: Waiting on Client", actorName, timeStr, updates.waiting_reason || "Awaiting client response/credentials. SLA paused.", "waiting_client"
      );
    } else if (updates.status === "NEEDS_CLARIFICATION") {
      db.prepare("INSERT INTO task_activity (id, task_id, action, actor_name, timestamp, details, type) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
        `act-${Date.now()}-clarify`, id, "Status changed: Needs Clarification", actorName, timeStr, updates.clarification_notes || "Awaiting clarification from client before scoping.", "clarification"
      );
    } else if (updates.status === "READY_TO_ASSIGN") {
      db.prepare("INSERT INTO task_activity (id, task_id, action, actor_name, timestamp, details, type) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
        `act-${Date.now()}-ready`, id, "Status changed: Ready to Assign", actorName, timeStr, "Requirements clear. Ready for manager queue assignment.", "created"
      );
    } else if (updates.status === "IN_PROGRESS" && existing.status !== "IN_PROGRESS") {
      db.prepare("INSERT INTO task_activity (id, task_id, action, actor_name, timestamp, details, type) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
        `act-${Date.now()}-start`, id, "Status changed: In Progress", actorName, timeStr, "Active internal execution underway.", "started"
      );
    }
  }
  if (updates.is_blocked !== undefined) { fields.push("is_blocked = ?"); values.push(updates.is_blocked); }
  if (updates.blocker_reason !== undefined) { fields.push("blocker_reason = ?"); values.push(updates.blocker_reason); }
  if (updates.waiting_reason !== undefined) { fields.push("waiting_reason = ?"); values.push(updates.waiting_reason); }
  if (updates.clarification_notes !== undefined) { fields.push("clarification_notes = ?"); values.push(updates.clarification_notes); }

  fields.push("updated_at = ?");
  values.push(nowIso);
  values.push(id);

  if (fields.length > 1) {
    db.prepare(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  }

  return getTaskById(id);
}

export function toggleSubAction(subId: string, actorName = "User"): boolean {
  const db = getDb();
  const sub = db.prepare("SELECT * FROM sub_actions WHERE id = ?").get(subId) as any;
  if (!sub) return false;

  const newStatus = sub.is_completed ? 0 : 1;
  db.prepare("UPDATE sub_actions SET is_completed = ? WHERE id = ?").run(newStatus, subId);

  // Check if all are complete
  const allSubs = db.prepare("SELECT * FROM sub_actions WHERE task_id = ?").all(sub.task_id) as any[];
  const allCompleted = allSubs.every((s) => s.is_completed === 1);
  if (allCompleted) {
    updateTask(sub.task_id, { status: "DONE" }, actorName);
  } else {
    // Log milestone activity
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    db.prepare("INSERT INTO task_activity (id, task_id, action, actor_name, timestamp, details, type) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      `act-${Date.now()}`, sub.task_id, newStatus ? `Milestone verified: "${sub.title}"` : `Milestone reopened: "${sub.title}"`, actorName, timeStr, null, "started"
    );
  }

  return true;
}

export function deleteTask(id: string): boolean {
  const db = getDb();
  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  return true;
}

export function getAllNotifications() {
  const db = getDb();
  return db.prepare(`
    SELECT n.*, t.title as task_title
    FROM notifications n
    LEFT JOIN tasks t ON n.task_id = t.id
    ORDER BY n.is_read ASC, 
      CASE n.severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END ASC,
      n.created_at DESC
  `).all();
}

export function markNotificationRead(id: string) {
  const db = getDb();
  db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(id);
}

export function getTeamWorkload() {
  const db = getDb();
  const users = db.prepare("SELECT * FROM users").all() as any[];
  const tasks = getAllTasks();

  const now = Date.now();
  return users.map((user) => {
    const userTasks = tasks.filter((t) => t.owner_id === user.id);
    const activeTasks = userTasks.filter((t) => t.status !== "DONE" && (t.status as any) !== "COMPLETED");
    const dueTodayTasks = activeTasks.filter((t) => {
      if (!t.due_date) return false;
      const due = new Date(t.due_date).getTime();
      return due - now > -12 * 3600 * 1000 && due - now < 24 * 3600 * 1000;
    });
    // Overdue tasks strictly exclude WAITING_ON_CLIENT and NEEDS_CLARIFICATION!
    const overdueTasks = activeTasks.filter((t) => {
      if (t.status === "WAITING_ON_CLIENT" || t.status === "NEEDS_CLARIFICATION") return false;
      if (!t.due_date) return false;
      return new Date(t.due_date).getTime() < now;
    });

    const isOverloaded = activeTasks.length >= (user.max_capacity || 5) || dueTodayTasks.length >= 3;

    return {
      user,
      activeCount: activeTasks.length,
      dueTodayCount: dueTodayTasks.length,
      overdueCount: overdueTasks.length,
      completedCount: userTasks.length - activeTasks.length,
      totalCount: userTasks.length,
      isOverloaded,
      tasks: activeTasks,
    };
  });
}

export function getImpactMetrics() {
  const db = getDb();
  const tasks = db.prepare("SELECT * FROM tasks").all() as any[];
  const settings = db.prepare("SELECT * FROM impact_settings WHERE id = 'default'").get() as any || {
    tasks_per_day: 35,
    manual_mins_per_task: 24.0,
    auto_mins_per_task: 4.0,
    working_days_per_month: 22,
  };

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "DONE" || (t.status as any) === "COMPLETED").length;
  const now = Date.now();
  // Overdue strictly ignores WAITING_ON_CLIENT and NEEDS_CLARIFICATION!
  const overdue = tasks.filter((t) => 
    t.status !== "DONE" && 
    (t.status as any) !== "COMPLETED" && 
    t.status !== "WAITING_ON_CLIENT" && 
    t.status !== "NEEDS_CLARIFICATION" && 
    t.due_date && 
    new Date(t.due_date).getTime() < now
  ).length;

  const minsSavedPerTask = Math.max(1, settings.manual_mins_per_task - settings.auto_mins_per_task);
  const timeSavedDayHours = Math.round(((settings.tasks_per_day * minsSavedPerTask) / 60) * 10) / 10;
  const timeSavedMonthHours = Math.round((timeSavedDayHours * settings.working_days_per_month) * 10) / 10;
  const timeSavedYearHours = Math.round((timeSavedMonthHours * 12) * 10) / 10;

  return {
    tasksProcessed: total + 142,
    tasksAutomated: Math.round((total + 142) * 0.88),
    followUpsAutomated: (total + 142) * 3,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 88,
    overdueRate: total > 0 ? Math.round((overdue / total) * 100) : 0,
    avgTaskCreationSeconds: 4.8,
    totalHoursSaved: 54.2 + (completed * 0.5),
    settings,
    calculated: {
      timeSavedDayHours,
      timeSavedMonthHours,
      timeSavedYearHours,
    },
  };
}

export function updateImpactSettings(settings: {
  tasks_per_day: number;
  manual_mins_per_task: number;
  auto_mins_per_task: number;
  working_days_per_month: number;
}) {
  const db = getDb();
  db.prepare(`
    UPDATE impact_settings 
    SET tasks_per_day = ?, manual_mins_per_task = ?, auto_mins_per_task = ?, working_days_per_month = ?
    WHERE id = 'default'
  `).run(
    settings.tasks_per_day,
    settings.manual_mins_per_task,
    settings.auto_mins_per_task,
    settings.working_days_per_month
  );
}

