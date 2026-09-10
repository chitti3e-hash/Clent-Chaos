"use client";

import React, { useState, useEffect } from "react";
import { useLalaFlow } from "../context/LalaFlowContext";
import { ExtractionResult, Priority, TaskStatus } from "../types";
import { parseWithHeuristics } from "../lib/aiParser";
import { 
  Sparkles, 
  User, 
  Building2, 
  ListChecks, 
  ShieldAlert, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  ArrowRight,
  MessageSquare, 
  Mic, 
  FileText, 
  AlertTriangle, 
  Check,
  HelpCircle,
  Clock,
  PauseCircle,
  Inbox
} from "lucide-react";

interface IntakeHopperProps {
  initialPrompt?: string;
  sourceTypeDefault?: "whatsapp" | "email" | "voice_note" | "direct";
  onTaskDispatched?: () => void;
}

export const IntakeHopper: React.FC<IntakeHopperProps> = ({
  initialPrompt = "",
  sourceTypeDefault = "whatsapp",
  onTaskDispatched,
}) => {
  const { 
    createTask, 
    teamMembers, 
    customers, 
    apiKey, 
    provider
  } = useLalaFlow();

  const [inputMode, setInputMode] = useState<"whatsapp" | "email" | "voice_note">(
    sourceTypeDefault === "voice_note" ? "voice_note" : "whatsapp"
  );
  const [inputText, setInputText] = useState(initialPrompt);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);

  // Editable Review Form State
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewCustomerId, setReviewCustomerId] = useState("");
  const [reviewOwnerId, setReviewOwnerId] = useState("");
  const [reviewStatus, setReviewStatus] = useState<TaskStatus>("IN_PROGRESS");
  const [reviewPriority, setReviewPriority] = useState<Priority>("HIGH");
  const [reviewDueDate, setReviewDueDate] = useState("");
  const [reviewIsBlocked, setReviewIsBlocked] = useState(false);
  const [reviewBlockerReason, setReviewBlockerReason] = useState("");
  const [reviewWaitingReason, setReviewWaitingReason] = useState("");
  const [reviewClarificationNotes, setReviewClarificationNotes] = useState("");
  const [reviewSubActions, setReviewSubActions] = useState<string[]>([]);
  const [newSubActionText, setNewSubActionText] = useState("");
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);

  useEffect(() => {
    if (initialPrompt) {
      setInputText(initialPrompt);
      setExtraction(null);
    }
  }, [initialPrompt]);

  const handleSimulateVoice = () => {
    setInputMode("voice_note");
    setIsVoicePlaying(true);
    setInputText("");
    
    const sample = "Apex Retail called urgently. Their shipment at Terminal 4 is stuck because customs paperwork is missing the commercial invoice. Arjun, get this resolved before 6 PM today.";
    let index = 0;
    const interval = setInterval(() => {
      index += 4;
      if (index >= sample.length) {
        setInputText(sample);
        setIsVoicePlaying(false);
        clearInterval(interval);
      } else {
        setInputText(sample.slice(0, index));
      }
    }, 45);
  };

  const applyExtractionData = (data: ExtractionResult) => {
    setExtraction(data);
    setReviewTitle(data.task || data.title || "Process operational deliverable");
    
    const matchedCust = customers.find(
      (c) => c.name.toLowerCase() === data.customerName?.toLowerCase()
    );
    setReviewCustomerId(matchedCust ? matchedCust.id : customers[0]?.id || "");

    const matchedOwner = teamMembers.find(
      (m) => m.name.toLowerCase().includes((data.suggestedOwnerName || "").toLowerCase().split(" ")[0])
    );
    
    // Status recommendation
    const recommendedStatus = data.statusRecommendation || (matchedOwner ? "IN_PROGRESS" : "NEW_REQUEST");
    setReviewStatus(recommendedStatus);

    // If status is needs clarification or ready to assign, allow unassigned owner
    if (recommendedStatus === "NEEDS_CLARIFICATION" || recommendedStatus === "READY_TO_ASSIGN") {
      setReviewOwnerId(matchedOwner ? matchedOwner.id : "");
    } else {
      setReviewOwnerId(matchedOwner ? matchedOwner.id : teamMembers[1]?.id || "");
    }

    setReviewPriority(data.priority || "HIGH");
    setReviewDueDate(data.dueDate || new Date(Date.now() + 24 * 3600 * 1000).toISOString());
    setReviewIsBlocked(data.isBlocked);
    setReviewBlockerReason(data.blockerReason || "");
    setReviewWaitingReason(data.waitingReason || "");
    setReviewClarificationNotes(data.clarificationNotes || "");
    setReviewSubActions(data.subActions && data.subActions.length > 0 ? data.subActions : [
      "Verify request specifications",
      "Execute core deliverable",
      "Confirm completion with client"
    ]);
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/intake/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          apiKey,
          provider,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          applyExtractionData(json.data);
          return;
        }
      }
      // Resilient Fallback to offline heuristic
      const fallbackData = parseWithHeuristics(inputText);
      applyExtractionData(fallbackData);
    } catch (err) {
      console.warn("API extraction error, using local heuristic:", err);
      const fallbackData = parseWithHeuristics(inputText);
      applyExtractionData(fallbackData);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddSubAction = () => {
    if (!newSubActionText.trim()) return;
    setReviewSubActions([...reviewSubActions, newSubActionText.trim()]);
    setNewSubActionText("");
  };

  const handleRemoveSubAction = (index: number) => {
    setReviewSubActions(reviewSubActions.filter((_, i) => i !== index));
  };

  const handleCommitWorkflow = () => {
    if (!reviewTitle.trim()) return;

    createTask({
      title: reviewTitle,
      rawInput: inputText,
      sourceType: inputMode,
      status: reviewStatus,
      priority: reviewPriority,
      dueDate: reviewDueDate,
      ownerId: reviewOwnerId.trim() ? reviewOwnerId : null,
      customerId: reviewCustomerId,
      isBlocked: reviewIsBlocked,
      blockerReason: reviewIsBlocked ? reviewBlockerReason : undefined,
      waitingReason: reviewStatus === "WAITING_ON_CLIENT" ? reviewWaitingReason : undefined,
      clarificationNotes: reviewStatus === "NEEDS_CLARIFICATION" ? reviewClarificationNotes : undefined,
      subActions: reviewSubActions,
      confidenceScore: extraction?.confidence ?? 0.95,
      warnings: extraction?.warnings,
    });

    setExtraction(null);
    setInputText("");
    if (onTaskDispatched) onTaskDispatched();
  };

  // Check ambiguity flags for "Needs confirmation" badges
  const isCustomerAmbiguous = extraction?.ambiguities?.some((a) => a.field === "customer" && a.needsConfirmation);
  const isOwnerAmbiguous = extraction?.ambiguities?.some((a) => a.field === "owner" && a.needsConfirmation);
  const isDeadlineAmbiguous = extraction?.ambiguities?.some((a) => a.field === "deadline" && a.needsConfirmation);
  const isStatusAmbiguous = extraction?.ambiguities?.some((a) => a.field === "status" && a.needsConfirmation);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-5 shadow-2xl backdrop-blur-sm">
      
      {/* Top Bar: Channel Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Smart Intake Hopper</h2>
            <p className="text-[11px] text-zinc-400">Turn chaotic communication into clear, accountable workflows</p>
          </div>
        </div>

        {/* Channel Mode Toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-zinc-950 p-1 border border-zinc-800">
          <button
            type="button"
            onClick={() => setInputMode("whatsapp")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              inputMode === "whatsapp" 
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={() => setInputMode("email")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              inputMode === "email" 
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Email</span>
          </button>
          <button
            type="button"
            onClick={handleSimulateVoice}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              inputMode === "voice_note" 
                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30 animate-pulse" 
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Mic className="h-3.5 w-3.5" />
            <span>Voice Memo {isVoicePlaying ? "(Transcribing...)" : ""}</span>
          </button>
        </div>
      </div>

      {/* Unstructured Input Area */}
      <div className="mt-4">
        <div className="relative rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 focus-within:border-indigo-500 transition-all">
          
          {inputMode === "whatsapp" && (
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-zinc-900 text-[11px] text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>WhatsApp Inbound Stream (Lala Tech Operations)</span>
            </div>
          )}

          {inputMode === "voice_note" && (
            <div className="flex items-center gap-3 mb-2 p-2 rounded-lg bg-purple-950/40 border border-purple-800/40">
              <div className="flex items-center gap-1">
                <span className="h-4 w-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="h-6 w-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="h-3 w-1 bg-purple-400 rounded-full animate-bounce" />
                <span className="h-7 w-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
              </div>
              <span className="text-xs font-medium text-purple-300">
                {isVoicePlaying ? "Listening & transcribing incoming voice message..." : "Audio transcribed to text"}
              </span>
            </div>
          )}

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={3}
            placeholder="Paste a WhatsApp message, email, or operational request..."
            className="w-full resize-none bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />

          {/* Action Row inside Textarea */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-900">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 flex-wrap">
              <span>Quick load:</span>
              <button
                type="button"
                onClick={() => setInputText("Please send the revised quotation to ABC Industries by tomorrow afternoon. Rahul needs to verify the pricing before it goes out.")}
                className="rounded-md bg-zinc-900 px-2 py-0.5 text-zinc-400 hover:text-indigo-300 hover:bg-zinc-800 transition-colors"
              >
                Quote for ABC
              </button>
              <button
                type="button"
                onClick={() => setInputText("Hey Lala team, can you send us a revised packaging quote for our new tea product line by this week? Thanks, Tata Procurement.")}
                className="rounded-md bg-zinc-900 px-2 py-0.5 text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 transition-colors"
              >
                Tata Packaging (Needs Clarification)
              </button>
              <button
                type="button"
                onClick={() => setInputText("Deploy the v2 webhook connector for GlobalTech API schema. We forwarded credentials to their IT admin yesterday.")}
                className="rounded-md bg-zinc-900 px-2 py-0.5 text-zinc-400 hover:text-purple-300 hover:bg-zinc-800 transition-colors"
              >
                GlobalTech (Waiting on Client)
              </button>
            </div>

            <button
              type="button"
              disabled={!inputText.trim() || isAnalyzing}
              onClick={handleAnalyze}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-lg transition-all ${
                !inputText.trim() || isAnalyzing
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 shadow-indigo-500/25 active:scale-95"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin text-indigo-300" />
                  <span>AI Parsing Request...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-indigo-200" />
                  <span>Turn into workflow</span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-75" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Review & Verification Card */}
      {extraction && (
        <div className="mt-5 rounded-2xl border-2 border-indigo-500/40 bg-zinc-950 p-5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
          
          {/* Card Header & Confidence Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <Check className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-sm font-bold text-white">Review & Scope Before Dispatch</h3>
              <span className="text-[10px] text-zinc-500">(Not every request goes straight to employee task list)</span>
            </div>

            {/* Anti-hallucination Confidence Chip */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Confidence: {Math.round(extraction.confidence * 100)}%
              </span>
            </div>
          </div>

          {/* Ambiguity Verification Banners */}
          {extraction.ambiguities && extraction.ambiguities.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {extraction.ambiguities.map((a, i) => (
                <div key={i} className={`rounded-xl border p-2.5 flex items-center justify-between text-xs ${
                  a.needsConfirmation ? "border-amber-500/30 bg-amber-500/10 text-amber-200" : "border-indigo-500/30 bg-indigo-500/10 text-indigo-200"
                }`}>
                  <div className="flex items-center gap-2">
                    {a.needsConfirmation ? (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                    ) : (
                      <HelpCircle className="h-4 w-4 shrink-0 text-indigo-400" />
                    )}
                    <span>{a.message}</span>
                  </div>
                  {a.needsConfirmation && (
                    <span className="shrink-0 rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                      Needs confirmation
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Workflow Stage Selector (The 6-Stage Lifecycle) */}
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>Initial Workflow Stage</span>
                {isStatusAmbiguous && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-300">
                    Needs confirmation
                  </span>
                )}
              </label>
              <span className="text-[10px] text-zinc-500">Choose proper operational holding bucket</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setReviewStatus("NEW_REQUEST")}
                className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all ${
                  reviewStatus === "NEW_REQUEST"
                    ? "border-blue-500 bg-blue-500/20 text-blue-300 shadow-sm"
                    : "border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Inbox className="h-3.5 w-3.5" />
                  <span>New Request</span>
                </div>
                <div className="text-[9px] text-zinc-500 font-normal">Intake triage</div>
              </button>

              <button
                type="button"
                onClick={() => setReviewStatus("NEEDS_CLARIFICATION")}
                className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all ${
                  reviewStatus === "NEEDS_CLARIFICATION"
                    ? "border-amber-500 bg-amber-500/20 text-amber-300 shadow-sm"
                    : "border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-amber-300"
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Needs Clarification</span>
                </div>
                <div className="text-[9px] text-amber-500/80 font-normal">Waiting on client</div>
              </button>

              <button
                type="button"
                onClick={() => setReviewStatus("READY_TO_ASSIGN")}
                className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all ${
                  reviewStatus === "READY_TO_ASSIGN"
                    ? "border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-sm"
                    : "border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <ListChecks className="h-3.5 w-3.5" />
                  <span>Ready to Assign</span>
                </div>
                <div className="text-[9px] text-zinc-500 font-normal">Fully scoped</div>
              </button>

              <button
                type="button"
                onClick={() => setReviewStatus("IN_PROGRESS")}
                className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all ${
                  reviewStatus === "IN_PROGRESS"
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-sm"
                    : "border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>In Progress</span>
                </div>
                <div className="text-[9px] text-emerald-500/80 font-normal">Active execution</div>
              </button>

              <button
                type="button"
                onClick={() => setReviewStatus("WAITING_ON_CLIENT")}
                className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all ${
                  reviewStatus === "WAITING_ON_CLIENT"
                    ? "border-purple-500 bg-purple-500/20 text-purple-300 shadow-sm"
                    : "border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-purple-300"
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <PauseCircle className="h-3.5 w-3.5" />
                  <span>Waiting on Client</span>
                </div>
                <div className="text-[9px] text-purple-400 font-normal">SLA paused</div>
              </button>
            </div>

            {/* Dynamic Stage Context Prompt */}
            {reviewStatus === "NEEDS_CLARIFICATION" && (
              <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-200">
                <label className="block font-semibold mb-1">
                  What details are required from the client before assigning?
                </label>
                <input
                  type="text"
                  value={reviewClarificationNotes}
                  onChange={(e) => setReviewClarificationNotes(e.target.value)}
                  placeholder="e.g. Sent WhatsApp asking for expected volume tiers and carton specs..."
                  className="w-full rounded-lg border border-amber-500/40 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
                />
                <p className="text-[10px] text-amber-400/80 mt-1">
                  ℹ️ This item will appear in <strong>&quot;Waiting for the client&quot;</strong> and will <strong>NOT</strong> be marked overdue.
                </p>
              </div>
            )}

            {reviewStatus === "WAITING_ON_CLIENT" && (
              <div className="mt-3 rounded-lg border border-purple-500/30 bg-purple-500/10 p-2.5 text-xs text-purple-200">
                <label className="block font-semibold mb-1">
                  What deliverable or approval is Lala Tech waiting for?
                </label>
                <input
                  type="text"
                  value={reviewWaitingReason}
                  onChange={(e) => setReviewWaitingReason(e.target.value)}
                  placeholder="e.g. Awaiting client IT to sign TLS certificate and issue API secret..."
                  className="w-full rounded-lg border border-purple-500/40 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
                />
                <p className="text-[10px] text-purple-400/80 mt-1">
                  ℹ️ Internal SLA is paused. Appears under <strong>&quot;Waiting for the client&quot;</strong> and never counted as stale/overdue.
                </p>
              </div>
            )}
          </div>

          {/* Form Fields Grid */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Title (Full Width) */}
            <div className="md:col-span-12">
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Action / Task Title
              </label>
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-sm font-semibold text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Customer Selector */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Client / Account
                </label>
                {isCustomerAmbiguous && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-300">
                    Needs confirmation
                  </span>
                )}
              </div>
              <div className="relative">
                <select
                  value={reviewCustomerId}
                  onChange={(e) => setReviewCustomerId(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.tier})
                    </option>
                  ))}
                </select>
                <Building2 className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-zinc-500" />
              </div>
            </div>

            {/* Owner Selector */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Responsible Owner
                </label>
                {isOwnerAmbiguous && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-300">
                    Needs confirmation
                  </span>
                )}
              </div>
              <div className="relative">
                <select
                  value={reviewOwnerId}
                  onChange={(e) => setReviewOwnerId(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">— Unassigned (Triage in Queue) —</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.role}
                    </option>
                  ))}
                </select>
                <User className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-zinc-500" />
              </div>
            </div>

            {/* Priority Selector */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Priority
                </label>
              </div>
              <select
                value={reviewPriority}
                onChange={(e) => setReviewPriority(e.target.value as Priority)}
                className="w-full appearance-none rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="URGENT">🚨 URGENT (Immediate Action)</option>
                <option value="HIGH">⚡ HIGH (Client SLA)</option>
                <option value="MEDIUM">🔹 MEDIUM (Standard)</option>
                <option value="LOW">◽ LOW (Backlog)</option>
              </select>
            </div>

            {/* Target Deadline */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Target Deadline
                </label>
                {isDeadlineAmbiguous && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-300">
                    Needs confirmation
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={reviewDueDate ? new Date(new Date(reviewDueDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      setReviewDueDate(new Date(e.target.value).toISOString());
                    }
                  }}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
                />
                <Clock className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-zinc-500" />
              </div>
            </div>

            {/* Dependency / Blocker Flag Banner */}
            <div className="md:col-span-12 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className={`h-4 w-4 ${reviewIsBlocked ? "text-amber-400" : "text-zinc-500"}`} />
                  <span className="text-xs font-semibold text-zinc-200">
                    Internal Dependency / Prerequisite Blocker
                  </span>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={reviewIsBlocked}
                    onChange={(e) => setReviewIsBlocked(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-5 w-9 rounded-full bg-zinc-800 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  <span className="ml-2 text-xs text-zinc-400">
                    {reviewIsBlocked ? "Blocked" : "Clear"}
                  </span>
                </label>
              </div>

              {reviewIsBlocked && (
                <div className="mt-2.5">
                  <input
                    type="text"
                    value={reviewBlockerReason}
                    onChange={(e) => setReviewBlockerReason(e.target.value)}
                    placeholder="Specify prerequisite before work can be released (e.g. Rahul pricing verification)..."
                    className="w-full rounded-lg border border-amber-500/30 bg-zinc-950 px-3 py-1.5 text-xs text-amber-200 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Subactions Checklist */}
            <div className="md:col-span-12">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ListChecks className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Sequential Action Checklist ({reviewSubActions.length} milestones)</span>
                </label>
              </div>

              <div className="space-y-1.5">
                {reviewSubActions.map((sub, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-3 py-1.5 text-xs">
                    <span className="text-[10px] font-bold text-zinc-500">{idx + 1}.</span>
                    <input
                      type="text"
                      value={sub}
                      onChange={(e) => {
                        const updated = [...reviewSubActions];
                        updated[idx] = e.target.value;
                        setReviewSubActions(updated);
                      }}
                      className="flex-1 bg-transparent text-xs text-zinc-200 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSubAction(idx)}
                      className="text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {/* Add Step Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newSubActionText}
                    onChange={(e) => setNewSubActionText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSubAction();
                      }
                    }}
                    placeholder="Add milestone step..."
                    className="flex-1 rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubAction}
                    className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-4">
            <button
              type="button"
              onClick={() => setExtraction(null)}
              className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              Discard Draft
            </button>

            <button
              type="button"
              onClick={handleCommitWorkflow}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition-all"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Turn into workflow</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
