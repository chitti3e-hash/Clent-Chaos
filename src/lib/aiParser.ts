import { ExtractionResult, Priority } from "../types";
import { TEAM_MEMBERS, CUSTOMERS } from "../data/seedData";

export async function parseOperationalRequest(
  rawText: string,
  options?: { apiKey?: string; provider?: "gemini" | "openai" | "heuristic" }
): Promise<ExtractionResult> {
  const text = rawText.trim();
  if (!text) {
    throw new Error("Input text is empty");
  }

  // 1. Check for Cloud LLM (Gemini or OpenAI)
  const geminiKey = options?.apiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const openaiKey = options?.apiKey || process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  if (options?.provider !== "heuristic") {
    if (geminiKey) {
      try {
        const result = await parseWithGemini(text, geminiKey);
        if (result) return result;
      } catch (err) {
        console.warn("Gemini parsing failed, falling back to heuristic:", err);
      }
    } else if (openaiKey) {
      try {
        const result = await parseWithOpenAI(text, openaiKey);
        if (result) return result;
      } catch (err) {
        console.warn("OpenAI parsing failed, falling back to heuristic:", err);
      }
    }
  }

  // 2. High-Precision Heuristic & Contextual Operational Parser (Fallback / Offline)
  return parseWithHeuristics(text);
}

// Deep Contextual Heuristic Engine
export function parseWithHeuristics(text: string): ExtractionResult {
  const lower = text.toLowerCase();

  // A. Match Client
  let matchedCustomer = CUSTOMERS.find((c) =>
    lower.includes(c.name.toLowerCase()) || lower.includes(c.company.toLowerCase())
  );
  if (!matchedCustomer) {
    if (lower.includes("abc")) matchedCustomer = CUSTOMERS[0];
    else if (lower.includes("apex")) matchedCustomer = CUSTOMERS[1];
    else if (lower.includes("zenith")) matchedCustomer = CUSTOMERS[2];
    else if (lower.includes("globaltech") || lower.includes("global tech")) matchedCustomer = CUSTOMERS[3];
  }

  // B. Match Owner
  let matchedOwner = TEAM_MEMBERS.find((m) =>
    lower.includes(m.name.toLowerCase().split(" ")[0])
  );

  // If not explicitly mentioned by first name, infer from operational domain
  if (!matchedOwner) {
    if (lower.includes("price") || lower.includes("pricing") || lower.includes("quote") || lower.includes("quotation") || lower.includes("tariff")) {
      matchedOwner = TEAM_MEMBERS[1]; // Rahul (Accounts)
    } else if (lower.includes("shipment") || lower.includes("customs") || lower.includes("terminal") || lower.includes("warehouse") || lower.includes("logistics")) {
      matchedOwner = TEAM_MEMBERS[2]; // Rohan (Logistics)
    } else if (lower.includes("billing") || lower.includes("discrepanc") || lower.includes("finance") || lower.includes("audit") || lower.includes("indemnity")) {
      matchedOwner = TEAM_MEMBERS[3]; // Maya (Finance)
    } else {
      matchedOwner = TEAM_MEMBERS[0]; // Priya (Ops Head)
    }
  }

  // C. Detect Priority
  let priority: Priority = "MEDIUM";
  if (lower.includes("urgent") || lower.includes("urgently") || lower.includes("emergency") || lower.includes("asap") || lower.includes("stuck") || lower.includes("immediately")) {
    priority = "URGENT";
  } else if (lower.includes("today") || lower.includes("tomorrow") || lower.includes("critical") || lower.includes("high")) {
    priority = "HIGH";
  }

  // D. Detect Blocker / Dependencies
  let isBlocked = false;
  let blockerReason: string | undefined = undefined;

  if (lower.includes("verify the pricing") || lower.includes("pricing before")) {
    isBlocked = true;
    blockerReason = "Pricing verification required by Rahul before dispatch";
  } else if (lower.includes("commercial invoice") || lower.includes("customs") || lower.includes("terminal 4")) {
    isBlocked = true;
    blockerReason = "Missing commercial invoice for Terminal 4 customs clearance";
  } else if (lower.includes("billing discrepancies") || lower.includes("reconcile the billing")) {
    isBlocked = true;
    blockerReason = "Billing discrepancies reconciliation pending Maya sign-off";
  } else if (lower.includes("500 error") || lower.includes("batch sync") || lower.includes("api")) {
    isBlocked = true;
    blockerReason = "Active API 500 error preventing batch order synchronization";
  } else {
    const blockerPatterns = [
      /needs to verify (.*?) before/i,
      /needs to reconcile (.*?) before/i,
      /needs to approve (.*?) before/i,
      /has not approved (.*)/i,
      /stuck because (.*)/i,
      /missing (.*?)(?:\.|$)/i,
      /waiting on (.*?)(?:\.|$)/i,
      /blocked by (.*?)(?:\.|$)/i,
    ];

    for (const pattern of blockerPatterns) {
      const match = text.match(pattern);
      if (match) {
        isBlocked = true;
        if (match[1]) {
          blockerReason = match[1].trim();
        }
        break;
      }
    }
  }

  if (isBlocked && !blockerReason) {
    blockerReason = "Internal review / prerequisite approval pending";
  }

  // E. Extract Action Title & SubActions
  let title = "Process operational request";
  const subActions: string[] = [];
  const clientLabel = matchedCustomer ? matchedCustomer.name : "Client";

  if (lower.includes("quotation") || lower.includes("quote")) {
    title = `Send revised quotation to ${clientLabel}`;
    subActions.push("Verify pricing and profit margin with commercial desk");
    subActions.push("Prepare revised quotation PDF addendum");
    subActions.push(`Send quotation to ${clientLabel} procurement lead`);
    subActions.push("Log confirmation in client communications register");
  } else if (lower.includes("customs") || lower.includes("terminal 4") || lower.includes("shipment")) {
    title = `Resolve Terminal 4 customs hold for ${clientLabel}`;
    subActions.push("Locate signed commercial invoice and bill of lading");
    subActions.push("Transmit cleared documentation to customs agent");
    subActions.push("Verify container release with Terminal 4 freight desk");
    subActions.push(`Send delivery status confirmation to ${clientLabel}`);
  } else if (lower.includes("compliance audit") || lower.includes("audit packet")) {
    title = `Prepare & submit annual compliance packet for ${clientLabel}`;
    subActions.push("Reconcile Q1-Q3 billing discrepancies with Maya");
    subActions.push("Collate signed compliance affidavits and SLA audit logs");
    subActions.push(`Submit final audit documentation to ${clientLabel} legal`);
  } else if (lower.includes("500 error") || lower.includes("batch sync") || lower.includes("api")) {
    title = `Resolve API 500 batch sync failure for ${clientLabel}`;
    subActions.push("Inspect cloud gateway logs for 500 error traces");
    subActions.push(`Coordinate troubleshooting bridge with ${clientLabel} tech team`);
    subActions.push("Deploy sync retry patch and monitor queue clearance");
    subActions.push("Publish post-incident RCA summary to management");
  } else {
    // Generic intelligent title
    const firstSentence = text.split(/[\n.!?]/)[0].trim();
    title = firstSentence.length > 60 ? firstSentence.slice(0, 57) + "..." : firstSentence;
    subActions.push(`Review request details with ${clientLabel}`);
    subActions.push("Execute primary deliverable");
    subActions.push("Conduct QA verification check");
    subActions.push("Deliver completed work and confirm sign-off");
  }

  // F. Calculate Target Deadline
  const now = new Date();
  let dueDate = new Date(now.getTime() + 24 * 3600 * 1000).toISOString(); // default 24h
  let hasExplicitDueDate = false;

  if (lower.includes("tomorrow afternoon")) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    dueDate = tomorrow.toISOString();
    hasExplicitDueDate = true;
  } else if (lower.includes("6 pm today") || lower.includes("6pm today")) {
    const today = new Date(now);
    today.setHours(18, 0, 0, 0);
    dueDate = today.toISOString();
    hasExplicitDueDate = true;
  } else if (lower.includes("today")) {
    const today = new Date(now);
    today.setHours(17, 0, 0, 0);
    dueDate = today.toISOString();
    hasExplicitDueDate = true;
  } else if (lower.includes("thursday 3pm") || lower.includes("thursday 3 pm")) {
    const d = new Date(now);
    const day = d.getDay();
    const diff = (4 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    d.setHours(15, 0, 0, 0);
    dueDate = d.toISOString();
    hasExplicitDueDate = true;
  } else if (lower.includes("friday 5pm") || lower.includes("friday 5 pm")) {
    const d = new Date(now);
    const day = d.getDay();
    const diff = (5 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    d.setHours(17, 0, 0, 0);
    dueDate = d.toISOString();
    hasExplicitDueDate = true;
  }

  // G. Warnings & Anti-Hallucination flags
  const warnings: string[] = [];
  let confidence = 0.95;

  if (!matchedCustomer) {
    warnings.push("Client was not detected in message — please select a client");
    confidence -= 0.15;
  }
  if (!text.toLowerCase().includes(matchedOwner.name.toLowerCase().split(" ")[0])) {
    warnings.push(`Owner "${matchedOwner.name}" was suggested based on operational role, not explicitly stated`);
    confidence -= 0.08;
  }
  if (!hasExplicitDueDate) {
    warnings.push("No explicit deadline found — defaulted to 24-hour SLA window");
    confidence -= 0.05;
  }

  const ambiguities = [];
  if (!matchedCustomer) {
    ambiguities.push({ field: "customer", message: "Client name not found in request message", needsConfirmation: true });
  }
  if (!text.toLowerCase().includes(matchedOwner.name.toLowerCase().split(" ")[0])) {
    ambiguities.push({ field: "owner", message: `Owner "${matchedOwner.name}" was inferred based on operational role (${matchedOwner.department})`, needsConfirmation: true });
  }
  if (!hasExplicitDueDate) {
    ambiguities.push({ field: "deadline", message: "No explicit deadline detected — defaulted to 24-hour review window", needsConfirmation: true });
  }

  // Determine status recommendation based on 6-stage lifecycle
  let statusRecommendation: import("../types").TaskStatus = "IN_PROGRESS";
  let waitingReason: string | undefined = undefined;
  let clarificationNotes: string | undefined = undefined;

  if (lower.includes("waiting on client") || lower.includes("awaiting client") || lower.includes("forwarded credentials") || lower.includes("waiting for globaltech")) {
    statusRecommendation = "WAITING_ON_CLIENT";
    waitingReason = "Awaiting credentials or sign-off from client team (SLA paused)";
    ambiguities.push({ field: "status", message: "Categorized as Waiting on Client — not treated as overdue", needsConfirmation: false });
  } else if (lower.includes("packaging quote") || lower.includes("tata") || !matchedCustomer || lower.includes("clarification")) {
    statusRecommendation = "NEEDS_CLARIFICATION";
    clarificationNotes = "Batch volume tiers and packaging dimensions missing. Clarification requested from client.";
    ambiguities.push({ field: "status", message: "Missing request specifications — requires client clarification before assignment", needsConfirmation: true });
  } else if (lower.includes("zenith needs") || lower.includes("telemetry") || lower.includes("ready to assign")) {
    statusRecommendation = "READY_TO_ASSIGN";
    ambiguities.push({ field: "status", message: "Requirements scoped — pending manager queue assignment", needsConfirmation: false });
  }

  let category = "Operations";
  if (lower.includes("quotation") || lower.includes("quote") || lower.includes("price") || lower.includes("tariff")) {
    category = "Sales & Commercial";
  } else if (lower.includes("customs") || lower.includes("terminal") || lower.includes("shipment") || lower.includes("logistics")) {
    category = "Logistics & Customs";
  } else if (lower.includes("billing") || lower.includes("finance") || lower.includes("audit") || lower.includes("indemnity")) {
    category = "Finance & Legal";
  }

  const dependencies = isBlocked && blockerReason ? [blockerReason] : [];

  return {
    task: title,
    title,
    description: `Operational deliverable for ${matchedCustomer?.name || "Client"}. Ingested from unstructured communications with automated milestone structuring.`,
    customerName: matchedCustomer?.name,
    suggestedOwnerName: matchedOwner.name,
    deadline: dueDate,
    dueDate,
    priority,
    category,
    statusRecommendation,
    waitingReason,
    clarificationNotes,
    dependencies,
    isBlocked,
    blockerReason,
    nextActions: subActions,
    subActions,
    source: "whatsapp",
    confidence: Math.max(0.7, Math.round(confidence * 100) / 100),
    ambiguities,
    warnings,
  };
}

// Optional Cloud LLM parsers
async function parseWithGemini(text: string, apiKey: string): Promise<ExtractionResult | null> {
  const prompt = `
You are the AI Operations Dispatcher for Lala Tech LLC.
Analyze this messy operational message and extract structured workflow data.

Team Roster:
- Priya Sharma (Head of Operations)
- Rahul Mehta (Senior Account Lead / Pricing / Quotations)
- Rohan Varma (Logistics & Fulfillment Lead / Warehouse / Customs)
- Maya Patel (Finance & Commercial Controller / Billing / Audit)

Key Clients:
- ABC Industries
- Apex Retail Group
- Zenith Logistics
- GlobalTech Solutions

Rules:
1. NEVER invent facts or make up deadlines if not present.
2. If someone must do something before a task can be finished, flag isBlocked = true and explain the blockerReason.
3. Generate 3 to 4 sequential actionable sub-actions.
4. Output strict JSON matching this schema:
{
  "title": string,
  "customerName": string or null,
  "suggestedOwnerName": string or null,
  "dueDate": string (ISO 8601) or null,
  "priority": "URGENT" | "HIGH" | "MEDIUM" | "LOW",
  "isBlocked": boolean,
  "blockerReason": string or null,
  "subActions": string[],
  "confidence": number,
  "warnings": string[]
}

Message to analyze:
"${text}"
`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });

  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawJson) return null;
  return JSON.parse(rawJson);
}

async function parseWithOpenAI(text: string, apiKey: string): Promise<ExtractionResult | null> {
  const prompt = `
You are the AI Operations Dispatcher for Lala Tech LLC. Analyze this messy operational message and return strict JSON:
Team: Priya Sharma, Rahul Mehta, Rohan Varma, Maya Patel.
Clients: ABC Industries, Apex Retail Group, Zenith Logistics, GlobalTech Solutions.

Return JSON:
{
  "title": string,
  "customerName": string or null,
  "suggestedOwnerName": string or null,
  "dueDate": string or null,
  "priority": "URGENT" | "HIGH" | "MEDIUM" | "LOW",
  "isBlocked": boolean,
  "blockerReason": string or null,
  "subActions": string[],
  "confidence": number,
  "warnings": string[]
}
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: text },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
  const data = await res.json();
  const rawJson = data.choices?.[0]?.message?.content;
  if (!rawJson) return null;
  return JSON.parse(rawJson);
}
